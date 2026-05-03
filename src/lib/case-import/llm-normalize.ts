// ---------------------------------------------------------------------------
// LLM-facilitated case-log normaliser
//
// Two passes, both falling back to the deterministic substring/keyword
// matchers in mapping.ts on any failure (network, JSON parse, missing key).
//
//   1. inferColumnMapping(headers, sampleRows) — maps a user's spreadsheet
//      column names onto Hippo's CaseLog fields. The LLM is dramatically
//      better than substring matching at handling things like:
//        - "Op (CPT short)"  → procedureName
//        - "Resident role / autonomy"  → autonomyLevel
//        - "Service Site"  → institutionSite
//        - "PGY level" (a noisy column we should NOT map)  → unmapped
//
//   2. extractRowsBatch(rows, mapping, headers) — coerces 25 rows at a
//      time into Hippo's typed schema, including reading messy free-text
//      autonomy/approach/complication columns and emitting the correct
//      Prisma enum values.
//
// Every function returns a typed result with a `usedLlm` flag so the
// caller can fall through to the deterministic path silently if Groq /
// OpenAI is unavailable, the user's deployment hasn't set the key, or
// the LLM output couldn't be parsed.
// ---------------------------------------------------------------------------

import { chatJson, ClinicLlmError } from "@/lib/clinic/llm";
import {
  autoMapColumns,
  coerceApproach,
  coerceAutonomy,
  coerceDate,
  coerceMinutes,
  coerceAgeBin,
  coerceComplication,
  coerceOutcome,
  type HippoField,
} from "./mapping";

// ─── Hippo schema (Prisma enum values) ──────────────────────────────────
// These MUST match prisma/schema.prisma exactly — the LLM is told about
// them and we re-validate any value it returns against this list.
const ENUMS = {
  autonomyLevel: ["OBSERVER", "ASSISTANT", "SUPERVISOR_PRESENT", "INDEPENDENT", "TEACHING"] as const,
  surgicalApproach: ["OPEN", "LAPAROSCOPIC", "ROBOTIC", "ENDOSCOPIC", "HYBRID", "PERCUTANEOUS", "OTHER"] as const,
  outcomeCategory: ["UNCOMPLICATED", "MINOR_COMPLICATION", "MAJOR_COMPLICATION", "REOPERATION", "DEATH", "UNKNOWN"] as const,
  complicationCategory: ["NONE", "BLEEDING", "INFECTION", "ORGAN_INJURY", "ANASTOMOTIC_LEAK", "DVT_PE", "ILEUS", "CONVERSION", "READMISSION", "OTHER"] as const,
  ageBin: ["UNDER_18", "AGE_18_30", "AGE_31_45", "AGE_46_60", "AGE_61_75", "OVER_75", "UNKNOWN"] as const,
};

type AutonomyLevel = (typeof ENUMS.autonomyLevel)[number];
type SurgicalApproach = (typeof ENUMS.surgicalApproach)[number];
type OutcomeCategory = (typeof ENUMS.outcomeCategory)[number];
type ComplicationCategory = (typeof ENUMS.complicationCategory)[number];
type AgeBin = (typeof ENUMS.ageBin)[number];

// ─── Types ──────────────────────────────────────────────────────────────

export interface LlmMappingResult {
  /** field -> source-column-header (only when matched). */
  mapping: Partial<Record<HippoField, string>>;
  /** Source columns the LLM did not assign to any Hippo field. */
  unmappedColumns: string[];
  /**
   * Per-field 0-1 confidence the LLM emitted. Used by the UI to decorate
   * mapping rows ("high / medium / low / inferred") and prompt the user
   * to confirm low-confidence ones before committing.
   */
  confidence: Partial<Record<HippoField, number>>;
  /** Optional one-line LLM rationale per field. UI shows on hover. */
  rationale: Partial<Record<HippoField, string>>;
  /** True when the LLM call succeeded; false when we fell back. */
  usedLlm: boolean;
  /** Surfaced for telemetry / debugging. */
  warnings: string[];
}

export interface NormalisedRow {
  caseDate: Date | null;
  procedureName: string | null;
  specialtyId: string | null;
  procedureCategory: string | null;
  role: string | null;
  autonomyLevel: AutonomyLevel;
  attendingLabel: string | null;
  institutionSite: string | null;
  surgicalApproach: SurgicalApproach;
  diagnosisCategory: string | null;
  outcomeCategory: OutcomeCategory;
  complicationCategory: ComplicationCategory;
  notes: string | null;
  operativeDurationMinutes: number | null;
  patientAgeBin: AgeBin;
  /** Fields the LLM was uncertain about — UI can flag them. */
  uncertain: HippoField[];
  /** Original-row warnings (e.g. "approach not specified — defaulting to OPEN"). */
  warnings: string[];
}

export interface LlmRowsResult {
  rows: NormalisedRow[];
  usedLlm: boolean;
  warnings: string[];
}

// ─── 1. Column-mapping pass ─────────────────────────────────────────────

const FIELDS_DOC = `
Hippo CaseLog fields (target schema):

  caseDate                  — date of the operation (YYYY-MM-DD)
  procedureName             — the operation performed, plain English
  specialtyId               — surgical specialty slug (e.g. "urology", "general-surgery")
  procedureCategory         — sub-category if present (e.g. "endourology")
  role                      — trainee's free-text role label as written
  autonomyLevel             — entrustment / supervision (one of: ${ENUMS.autonomyLevel.join(", ")})
  attendingLabel            — supervising attending or staff surgeon
  institutionSite           — hospital / OR site / centre
  surgicalApproach          — open / laparoscopic / robotic / endoscopic / etc.
  diagnosisCategory         — preop diagnosis or indication
  outcomeCategory           — case outcome bucket
  complicationCategory      — complication bucket
  notes                     — free-text narrative / findings / dictation
  operativeDurationMinutes  — operative time in minutes (integer)
  patientAgeBin             — age bucket
`.trim();

const MAPPING_SYSTEM_PROMPT = `
You are a careful data-mapping assistant for a surgical case-log importer.
You see a list of column headers and a few sample values from a user's
existing log (Excel / CSV). Map each header onto a Hippo CaseLog field,
or leave it unmapped. Rules:

1. Match on MEANING, not on string similarity. A column called "Service"
   might be the specialty, or might be a hospital department; use the
   sample values to disambiguate.
2. Each Hippo field maps to AT MOST ONE source column. Pick the best
   single source column per field — don't return multiple matches.
3. If multiple source columns describe the same Hippo field (e.g. two
   "approach" columns), pick the cleanest one and leave the others
   unmapped. The unmapped extras will be saved as metadata.
4. NEVER invent a Hippo field that isn't in the list below.
5. Output strict JSON only — no prose, no markdown.

${FIELDS_DOC}

Output JSON shape:
{
  "mapping": {
    "<HippoField>": {
      "sourceColumn": "<exact header string from the input>",
      "confidence": <0..1 number>,
      "rationale": "<short reason>"
    }
  },
  "unmapped": ["<header>", "..."]
}
`.trim();

interface LlmMappingPayload {
  mapping?: Record<string, { sourceColumn?: string; confidence?: number; rationale?: string }>;
  unmapped?: string[];
}

/**
 * Build the user-message body. We give the LLM up to 3 sample values per
 * column so it can disambiguate by content, not just by header text.
 */
function buildMappingUserMessage(headers: string[], sampleRows: Array<Record<string, unknown>>): string {
  const samples: Record<string, string[]> = {};
  for (const h of headers) {
    samples[h] = [];
  }
  for (const row of sampleRows.slice(0, 8)) {
    for (const h of headers) {
      const v = row[h];
      if (v === null || v === undefined || v === "") continue;
      const str = String(v).trim();
      if (!str) continue;
      if (samples[h].length >= 3) continue;
      // Truncate per-cell to keep the prompt small.
      samples[h].push(str.length > 120 ? str.slice(0, 120) + "…" : str);
    }
  }

  const lines: string[] = [
    "Spreadsheet columns and sample values:",
    "",
  ];
  for (const h of headers) {
    const s = samples[h];
    const sampleText = s.length > 0 ? s.map((v) => `"${v}"`).join(", ") : "(no sample values)";
    lines.push(`- "${h}":  ${sampleText}`);
  }
  lines.push("");
  lines.push("Return the JSON mapping per the system instructions.");
  return lines.join("\n");
}

/**
 * Validate and merge an LLM mapping into the deterministic mapping.
 * The LLM wins where confidence ≥ 0.5; deterministic fills any gaps.
 */
function mergeMappings(
  llm: LlmMappingPayload | null,
  fallback: ReturnType<typeof autoMapColumns>,
  headers: string[],
): LlmMappingResult {
  const baseline: Partial<Record<HippoField, string>> = { ...fallback.mapping };
  const confidence: Partial<Record<HippoField, number>> = {};
  const rationale: Partial<Record<HippoField, string>> = {};

  // Seed confidence for the deterministic baseline so the UI can show
  // "auto-matched" rows even when the LLM is unavailable.
  for (const f of Object.keys(baseline) as HippoField[]) {
    confidence[f] = 0.5;
    rationale[f] = "auto-matched by header pattern";
  }

  if (llm?.mapping && typeof llm.mapping === "object") {
    for (const [rawField, rec] of Object.entries(llm.mapping)) {
      const field = rawField as HippoField;
      if (!rec || typeof rec !== "object") continue;
      const sourceColumn = typeof rec.sourceColumn === "string" ? rec.sourceColumn : null;
      if (!sourceColumn) continue;
      // Only accept source columns we actually saw in the file.
      if (!headers.includes(sourceColumn)) continue;
      const conf = typeof rec.confidence === "number" ? Math.max(0, Math.min(1, rec.confidence)) : 0.7;
      // Resolve conflicts: if LLM and deterministic disagree, LLM wins
      // when it's confident; otherwise keep the deterministic match.
      const baseSource = baseline[field];
      if (baseSource && baseSource !== sourceColumn && conf < 0.6) continue;
      baseline[field] = sourceColumn;
      confidence[field] = conf;
      if (typeof rec.rationale === "string" && rec.rationale.trim()) {
        rationale[field] = rec.rationale.trim();
      }
    }
  }

  // Recompute unmapped columns: anything in headers not now used.
  const used = new Set(Object.values(baseline).filter(Boolean) as string[]);
  const unmappedColumns = headers.filter((h) => !used.has(h));

  return {
    mapping: baseline,
    unmappedColumns,
    confidence,
    rationale,
    usedLlm: !!llm,
    warnings: [],
  };
}

export async function inferColumnMapping(
  headers: string[],
  sampleRows: Array<Record<string, unknown>>,
): Promise<LlmMappingResult> {
  const fallback = autoMapColumns(headers);

  if (!hasLlmKey()) {
    return mergeMappings(null, fallback, headers);
  }

  try {
    const result = await chatJson<LlmMappingPayload>({
      system: MAPPING_SYSTEM_PROMPT,
      user: buildMappingUserMessage(headers, sampleRows),
      // Mapping is small + deterministic — keep temperature near zero.
      temperature: 0.0,
      maxTokens: 800,
      timeoutMs: 25_000,
    });
    return mergeMappings(result.json, fallback, headers);
  } catch (err) {
    const merged = mergeMappings(null, fallback, headers);
    merged.warnings.push(
      err instanceof ClinicLlmError
        ? `LLM mapping unavailable (${err.code}); used deterministic fallback.`
        : `LLM mapping failed; used deterministic fallback.`,
    );
    return merged;
  }
}

// ─── 2. Per-row coercion pass (batched) ────────────────────────────────

const ROW_BATCH_SIZE = 25;

const ROWS_SYSTEM_PROMPT = `
You are normalising rows from a surgeon's exported case-log spreadsheet
into Hippo's typed CaseLog schema. For each input row you receive a
JSON object with:
  - rowNumber: 1-indexed row number
  - mappedSourceColumns: which source column maps to which Hippo field
  - row: the raw cell values for that row, keyed by source column

Convert each row into a clean Hippo record with these fields and EXACT
enum values:

  caseDate                : "YYYY-MM-DD" or null if no parseable date
  procedureName           : string (the operation), or null
  specialtyId             : lowercase-hyphenated slug (e.g. "urology"), or null
  procedureCategory       : free-text sub-category, or null
  role                    : free-text trainee role label, or null
  autonomyLevel           : ${ENUMS.autonomyLevel.join(" | ")}
  attendingLabel          : free-text staff name, or null
  institutionSite         : free-text site, or null
  surgicalApproach        : ${ENUMS.surgicalApproach.join(" | ")}
  diagnosisCategory       : free-text indication, or null
  outcomeCategory         : ${ENUMS.outcomeCategory.join(" | ")}
  complicationCategory    : ${ENUMS.complicationCategory.join(" | ")}
  notes                   : free-text findings / narrative, or null
  operativeDurationMinutes: integer minutes, or null
  patientAgeBin           : ${ENUMS.ageBin.join(" | ")}
  uncertain               : array of Hippo field names you were unsure about
  warnings                : optional array of short notes (e.g. "no approach given")

Hard rules:
- Use the EXACT enum strings above. Do not invent new values.
- Default autonomyLevel = "SUPERVISOR_PRESENT" only when the row truly
  doesn't say. Read free-text role columns: "I primarily performed",
  "Resident as primary", "(3) Active hands-on" → INDEPENDENT or
  SUPERVISOR_PRESENT depending on language.
- Default surgicalApproach = "OPEN" only when nothing implies otherwise.
- Default complicationCategory = "NONE" when the cell says "none / nil /
  no complication" or is blank. Map "DVT" → "DVT_PE", "wound infection"
  → "INFECTION", "iatrogenic injury" → "ORGAN_INJURY".
- Map outcome words: "uneventful" → "UNCOMPLICATED", "took back to OR" →
  "REOPERATION", "minor complication" → "MINOR_COMPLICATION",
  "ICU / major" → "MAJOR_COMPLICATION", "demised / mortality" → "DEATH".
- Age numbers convert to bins by year: <18 → UNDER_18, 18-30 → AGE_18_30,
  31-45 → AGE_31_45, 46-60 → AGE_46_60, 61-75 → AGE_61_75, >75 → OVER_75.
- Duration: "1h 23m" / "01:23" / "83" all → 83.
- Output STRICT JSON only.

Output shape:
{
  "rows": [
    { "rowNumber": <int>, ...all the fields above... }
  ]
}
`.trim();

interface LlmRowsPayloadRow {
  rowNumber?: number;
  caseDate?: string | null;
  procedureName?: string | null;
  specialtyId?: string | null;
  procedureCategory?: string | null;
  role?: string | null;
  autonomyLevel?: string | null;
  attendingLabel?: string | null;
  institutionSite?: string | null;
  surgicalApproach?: string | null;
  diagnosisCategory?: string | null;
  outcomeCategory?: string | null;
  complicationCategory?: string | null;
  notes?: string | null;
  operativeDurationMinutes?: number | null;
  patientAgeBin?: string | null;
  uncertain?: string[];
  warnings?: string[];
}

interface LlmRowsPayload {
  rows?: LlmRowsPayloadRow[];
}

function buildRowsUserMessage(
  rows: Array<{ rowNumber: number; row: Record<string, unknown> }>,
  mapping: Partial<Record<HippoField, string>>,
): string {
  // Strip noisy keys (very long values, internal IDs) to keep the prompt
  // tight. The LLM still gets the full row text but capped at 1 KB / cell.
  const trimmedRows = rows.map(({ rowNumber, row }) => {
    const trimmed: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v === null || v === undefined || v === "") continue;
      const str = typeof v === "string" ? v : String(v);
      trimmed[k] = str.length > 1000 ? str.slice(0, 1000) + "…" : str;
    }
    return { rowNumber, row: trimmed };
  });
  return JSON.stringify(
    {
      mappedSourceColumns: mapping,
      rows: trimmedRows,
    },
    null,
    2,
  );
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value !== "string") return fallback;
  const upper = value.trim().toUpperCase();
  return (allowed as readonly string[]).includes(upper) ? (upper as T) : fallback;
}

function deterministicCoerceOne(
  rowNumber: number,
  raw: Record<string, unknown>,
  mapping: Partial<Record<HippoField, string>>,
): NormalisedRow {
  const get = (field: HippoField): unknown => {
    const sourceCol = mapping[field];
    if (!sourceCol) return undefined;
    return raw[sourceCol];
  };
  const warnings: string[] = [];
  const date = coerceDate(get("caseDate"));
  if (!date) warnings.push(`Row ${rowNumber}: no parseable case date.`);
  const procedureRaw = get("procedureName");
  const procedureName =
    typeof procedureRaw === "string" && procedureRaw.trim().length > 0
      ? procedureRaw.trim()
      : null;
  if (!procedureName) warnings.push(`Row ${rowNumber}: missing procedure name.`);

  const role = (() => {
    const r = get("role");
    return typeof r === "string" && r.trim() ? r.trim() : null;
  })();

  return {
    caseDate: date,
    procedureName,
    specialtyId:
      typeof get("specialtyId") === "string"
        ? (get("specialtyId") as string).trim().toLowerCase().replace(/\s+/g, "-")
        : null,
    procedureCategory:
      typeof get("procedureCategory") === "string"
        ? (get("procedureCategory") as string).trim()
        : null,
    role,
    autonomyLevel: pickEnum(coerceAutonomy(get("autonomyLevel")), ENUMS.autonomyLevel, "SUPERVISOR_PRESENT"),
    attendingLabel:
      typeof get("attendingLabel") === "string"
        ? (get("attendingLabel") as string).trim()
        : null,
    institutionSite:
      typeof get("institutionSite") === "string"
        ? (get("institutionSite") as string).trim()
        : null,
    surgicalApproach: pickEnum(coerceApproach(get("surgicalApproach")), ENUMS.surgicalApproach, "OPEN"),
    diagnosisCategory:
      typeof get("diagnosisCategory") === "string"
        ? (get("diagnosisCategory") as string).trim()
        : null,
    outcomeCategory: pickEnum(coerceOutcome(get("outcomeCategory")), ENUMS.outcomeCategory, "UNCOMPLICATED"),
    complicationCategory: pickEnum(
      coerceComplication(get("complicationCategory")),
      ENUMS.complicationCategory,
      "NONE",
    ),
    notes: typeof get("notes") === "string" ? (get("notes") as string).trim() : null,
    operativeDurationMinutes: coerceMinutes(get("operativeDurationMinutes")),
    patientAgeBin: pickEnum(coerceAgeBin(get("patientAgeBin")), ENUMS.ageBin, "UNKNOWN"),
    uncertain: [],
    warnings,
  };
}

/**
 * Normalise a batch of rows into Hippo records using the LLM, with a
 * deterministic per-row fallback if the LLM fails partway. Always
 * returns one entry per input row.
 */
export async function extractRowsBatch(
  rows: Array<Record<string, unknown>>,
  mapping: Partial<Record<HippoField, string>>,
): Promise<LlmRowsResult> {
  const results: NormalisedRow[] = new Array(rows.length);
  const warnings: string[] = [];
  let usedLlm = false;

  if (!hasLlmKey()) {
    for (let i = 0; i < rows.length; i++) {
      results[i] = deterministicCoerceOne(i + 1, rows[i], mapping);
    }
    return { rows: results, usedLlm: false, warnings };
  }

  for (let start = 0; start < rows.length; start += ROW_BATCH_SIZE) {
    const slice = rows.slice(start, start + ROW_BATCH_SIZE).map((r, j) => ({
      rowNumber: start + j + 1,
      row: r,
    }));

    let llmRows: LlmRowsPayloadRow[] | null = null;
    try {
      const result = await chatJson<LlmRowsPayload>({
        system: ROWS_SYSTEM_PROMPT,
        user: buildRowsUserMessage(slice, mapping),
        temperature: 0.0,
        maxTokens: 4000,
        timeoutMs: 60_000,
      });
      if (Array.isArray(result.json?.rows)) {
        llmRows = result.json.rows;
        usedLlm = true;
      }
    } catch (err) {
      warnings.push(
        err instanceof ClinicLlmError
          ? `LLM batch ${start + 1}-${start + slice.length} unavailable (${err.code}); used deterministic fallback.`
          : `LLM batch ${start + 1}-${start + slice.length} failed; used deterministic fallback.`,
      );
    }

    // Match LLM output by rowNumber so we don't crash on missing entries.
    const byNumber = new Map<number, LlmRowsPayloadRow>();
    if (llmRows) {
      for (const r of llmRows) {
        if (typeof r.rowNumber === "number") byNumber.set(r.rowNumber, r);
      }
    }

    for (const item of slice) {
      const llm = byNumber.get(item.rowNumber);
      const deterministic = deterministicCoerceOne(item.rowNumber, item.row, mapping);
      results[item.rowNumber - 1] = llm ? mergeRow(deterministic, llm, item.rowNumber) : deterministic;
    }
  }

  return { rows: results, usedLlm, warnings };
}

function mergeRow(det: NormalisedRow, llm: LlmRowsPayloadRow, rowNumber: number): NormalisedRow {
  // Prefer LLM values where present and valid; fall back to the
  // deterministic value otherwise. We always re-validate enums.
  const date = llm.caseDate
    ? (() => {
        const d = new Date(llm.caseDate as string);
        return isNaN(d.getTime()) ? det.caseDate : d;
      })()
    : det.caseDate;

  const merged: NormalisedRow = {
    caseDate: date,
    procedureName: trimNonEmpty(llm.procedureName) ?? det.procedureName,
    specialtyId: (() => {
      const v = trimNonEmpty(llm.specialtyId);
      if (v) return v.toLowerCase().replace(/\s+/g, "-");
      return det.specialtyId;
    })(),
    procedureCategory: trimNonEmpty(llm.procedureCategory) ?? det.procedureCategory,
    role: trimNonEmpty(llm.role) ?? det.role,
    autonomyLevel: pickEnum(llm.autonomyLevel, ENUMS.autonomyLevel, det.autonomyLevel),
    attendingLabel: trimNonEmpty(llm.attendingLabel) ?? det.attendingLabel,
    institutionSite: trimNonEmpty(llm.institutionSite) ?? det.institutionSite,
    surgicalApproach: pickEnum(llm.surgicalApproach, ENUMS.surgicalApproach, det.surgicalApproach),
    diagnosisCategory: trimNonEmpty(llm.diagnosisCategory) ?? det.diagnosisCategory,
    outcomeCategory: pickEnum(llm.outcomeCategory, ENUMS.outcomeCategory, det.outcomeCategory),
    complicationCategory: pickEnum(llm.complicationCategory, ENUMS.complicationCategory, det.complicationCategory),
    notes: trimNonEmpty(llm.notes) ?? det.notes,
    operativeDurationMinutes:
      typeof llm.operativeDurationMinutes === "number" && !isNaN(llm.operativeDurationMinutes)
        ? Math.round(llm.operativeDurationMinutes)
        : det.operativeDurationMinutes,
    patientAgeBin: pickEnum(llm.patientAgeBin, ENUMS.ageBin, det.patientAgeBin),
    uncertain: Array.isArray(llm.uncertain)
      ? (llm.uncertain.filter((s) => typeof s === "string") as HippoField[])
      : [],
    warnings: [
      ...det.warnings,
      ...((llm.warnings ?? []).filter((s) => typeof s === "string").map((s) => `Row ${rowNumber}: ${s}`)),
    ],
  };
  return merged;
}

function trimNonEmpty(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function hasLlmKey(): boolean {
  return !!(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
}
