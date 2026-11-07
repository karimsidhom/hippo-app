// ---------------------------------------------------------------------------
// Import commit logic — applies a parsed import batch to the user's case log.
//
// Responsibilities:
//   - Coerce raw row values to typed CaseLog fields using the user-confirmed
//     column mapping.
//   - Detect possible duplicates against existing CaseLog rows.
//   - Apply the user's per-row decision (skip / import / merge).
//   - Pack unmapped columns into imported_metadata for retrieval.
//   - Persist the audit trail (CaseLogImportRow per row, status flags).
// ---------------------------------------------------------------------------

import type {
  Prisma,
  PrismaClient,
  SurgicalApproach,
  AutonomyLevel,
  AgeBin,
  OutcomeCategory,
  ComplicationCategory,
} from "@prisma/client";
import type { HippoField } from "./mapping";
import { extractRowsBatch, type NormalisedRow } from "./llm-normalize";

export type DuplicateDecision = "skip" | "import" | "merge";

export interface RowDecision {
  rowNumber: number;
  decision: DuplicateDecision;
  /** When decision === "merge", the existing CaseLog.id to merge into. */
  mergeTargetCaseId?: string;
}

export interface ImportContext {
  userId: string;
  batchId: string;
  mapping: Partial<Record<HippoField, string>>;
  /** When set, columns in this set are dropped before persistence. */
  redactColumns?: Set<string>;
  /** Map row -> decision (default = "import"). */
  rowDecisions?: Record<number, RowDecision>;
}

export interface ImportRowOutcome {
  rowNumber: number;
  status: "IMPORTED" | "SKIPPED" | "DUPLICATE" | "FAILED";
  caseId?: string;
  warnings: string[];
}

export interface ImportSummary {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  missingFieldCount: number;
  rowOutcomes: ImportRowOutcome[];
}

// ---------------------------------------------------------------------------
// Coerce a single row using the column mapping. Returns:
//   - mapped: the typed CaseLog input fields
//   - unmapped: source columns not used by the mapping (saved to metadata)
//   - warnings: any validation issues (missing required fields, etc.)
// ---------------------------------------------------------------------------

interface CoercedRow {
  mapped: {
    caseDate: Date;
    procedureName: string;
    specialtyId: string | null;
    procedureCategory: string | null;
    role: string;
    autonomyLevel: string;
    attendingLabel: string | null;
    institutionSite: string | null;
    surgicalApproach: string;
    diagnosisCategory: string | null;
    outcomeCategory: string;
    complicationCategory: string;
    notes: string | null;
    operativeDurationMinutes: number | null;
    patientAgeBin: string;
  };
  unmapped: Record<string, unknown>;
  warnings: string[];
  hasMissing: boolean;
}

// NOTE: the legacy `coerceRow` helper that lived here was removed when
// the LLM normaliser shipped. The deterministic per-cell coerce*
// functions in mapping.ts are still used — they're called inside
// llm-normalize.ts as the fallback path when the LLM is unavailable.
// All commit-time row coercion now flows through
// `mergeNormalisedIntoCoerced` below, which trusts the pre-normalised
// rows from `extractRowsBatch`.

/**
 * Bridge from llm-normalize's `NormalisedRow` (clean Hippo schema, correct
 * enum values) into the legacy `CoercedRow` shape that `commitImport`
 * downstream expects. Also packages unmapped columns into metadata + the
 * notes-tail block, mirroring the original `coerceRow` behaviour.
 */
function mergeNormalisedIntoCoerced(
  normalised: NormalisedRow,
  raw: Record<string, unknown>,
  mapping: Partial<Record<HippoField, string>>,
  redactColumns?: Set<string>,
): CoercedRow {
  const warnings = [...normalised.warnings];

  const usedCols = new Set(Object.values(mapping).filter(Boolean) as string[]);
  const unmapped: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (redactColumns?.has(k)) continue;
    if (usedCols.has(k)) continue;
    if (v === null || v === undefined || v === "") continue;
    unmapped[k] = v;
  }

  // Notes: prefer the LLM's normalised notes; append the unmapped extras
  // as a structured block so nothing is lost.
  let notes = normalised.notes;
  if (Object.keys(unmapped).length > 0) {
    const extras = Object.entries(unmapped)
      .map(([k, v]) => `- ${k}: ${String(v)}`)
      .join("\n");
    const block = `Imported extra fields:\n${extras}`;
    notes = notes ? `${notes}\n\n${block}` : block;
  }

  const hasMissing = !normalised.caseDate || !normalised.procedureName;

  return {
    mapped: {
      caseDate: normalised.caseDate ?? new Date(),
      procedureName: normalised.procedureName ?? "[Imported procedure name missing]",
      specialtyId: normalised.specialtyId,
      procedureCategory: normalised.procedureCategory,
      role: normalised.role && normalised.role.length > 0 ? normalised.role : "Trainee",
      autonomyLevel: normalised.autonomyLevel,
      attendingLabel: normalised.attendingLabel,
      institutionSite: normalised.institutionSite,
      surgicalApproach: normalised.surgicalApproach,
      diagnosisCategory: normalised.diagnosisCategory,
      outcomeCategory: normalised.outcomeCategory,
      complicationCategory: normalised.complicationCategory,
      notes,
      operativeDurationMinutes: normalised.operativeDurationMinutes,
      patientAgeBin: normalised.patientAgeBin,
    },
    unmapped,
    warnings,
    hasMissing,
  };
}

// ---------------------------------------------------------------------------
// Duplicate detection
//
// Considers a candidate a duplicate if the existing CaseLog matches on:
//   - case date (same day)
//   - procedure name (case-insensitive substring match)
//   - institutionSite (when both present)
//   - attendingLabel (when both present)
//
// Returns the first matching CaseLog id, or null.
// ---------------------------------------------------------------------------

export interface DuplicateMatchInput {
  userId: string;
  caseDate: Date;
  procedureName: string;
  institutionSite?: string | null;
  attendingLabel?: string | null;
}

export async function findPossibleDuplicate(
  db: PrismaClient,
  input: DuplicateMatchInput,
): Promise<{ id: string; procedureName: string; caseDate: Date } | null> {
  const dayStart = new Date(input.caseDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existing = await db.caseLog.findMany({
    where: {
      userId: input.userId,
      caseDate: { gte: dayStart, lt: dayEnd },
    },
    select: {
      id: true,
      procedureName: true,
      caseDate: true,
      institutionSite: true,
      attendingLabel: true,
    },
    take: 25,
  });

  const targetProc = input.procedureName.toLowerCase().trim();
  for (const c of existing) {
    const proc = (c.procedureName ?? "").toLowerCase().trim();
    if (!proc) continue;
    if (!proc.includes(targetProc) && !targetProc.includes(proc)) continue;
    // If we have institution / attending, require concordance when both sides
    // have a value. Empty values do not exclude.
    if (
      input.institutionSite &&
      c.institutionSite &&
      input.institutionSite.toLowerCase() !== c.institutionSite.toLowerCase()
    ) {
      continue;
    }
    if (
      input.attendingLabel &&
      c.attendingLabel &&
      input.attendingLabel.toLowerCase() !== c.attendingLabel.toLowerCase()
    ) {
      continue;
    }
    return { id: c.id, procedureName: c.procedureName, caseDate: c.caseDate };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Commit
// ---------------------------------------------------------------------------

export interface CommitInput {
  db: PrismaClient;
  userId: string;
  batchId: string;
  parsedRows: Array<Record<string, unknown>>;
  mapping: Partial<Record<HippoField, string>>;
  redactColumns?: Set<string>;
  rowDecisions?: Record<number, RowDecision>;
}

export async function commitImport(input: CommitInput): Promise<ImportSummary> {
  const { db, userId, batchId, parsedRows, mapping, redactColumns, rowDecisions } = input;

  // ─── Pre-pass: LLM-normalised rows ───────────────────────────────────
  // Run the LLM normaliser over the entire batch once, up front. This
  // gives us per-row clean Hippo records with correct enum values, even
  // when the user's source columns are messy free text. The function
  // falls back to deterministic coercion silently on any failure, so the
  // commit logic below can always trust `llmRows[i]` is populated.
  const llmRows = await extractRowsBatch(parsedRows, mapping);
  const normalised: NormalisedRow[] = llmRows.rows;

  let importedCount = 0;
  let skippedCount = 0;
  let duplicateCount = 0;
  let missingFieldCount = 0;
  const rowOutcomes: ImportRowOutcome[] = [];

  for (let i = 0; i < parsedRows.length; i++) {
    const rowNumber = i + 1;
    const raw = parsedRows[i];
    const decision = rowDecisions?.[rowNumber]?.decision ?? "import";

    if (decision === "skip") {
      skippedCount++;
      rowOutcomes.push({ rowNumber, status: "SKIPPED", warnings: [] });
      await db.caseLogImportRow.create({
        data: {
          batchId,
          userId,
          originalRowNumber: rowNumber,
          rawRowJson: raw as Prisma.InputJsonValue,
          status: "SKIPPED",
        },
      });
      continue;
    }

    let coerced: CoercedRow;
    try {
      coerced = mergeNormalisedIntoCoerced(
        normalised[i],
        raw,
        mapping,
        redactColumns,
      );
    } catch (err) {
      rowOutcomes.push({
        rowNumber,
        status: "FAILED",
        warnings: [err instanceof Error ? err.message : "coercion failed"],
      });
      await db.caseLogImportRow.create({
        data: {
          batchId,
          userId,
          originalRowNumber: rowNumber,
          rawRowJson: raw as Prisma.InputJsonValue,
          status: "FAILED",
          warnings: [err instanceof Error ? err.message : "coercion failed"],
        },
      });
      continue;
    }

    if (coerced.hasMissing) missingFieldCount++;

    const dup = await findPossibleDuplicate(db, {
      userId,
      caseDate: coerced.mapped.caseDate,
      procedureName: coerced.mapped.procedureName,
      institutionSite: coerced.mapped.institutionSite,
      attendingLabel: coerced.mapped.attendingLabel,
    });

    if (dup && decision === "import") {
      // Default behaviour for duplicates without explicit user decision is to
      // skip — callers must explicitly mark "import anyway" or "merge".
      duplicateCount++;
      rowOutcomes.push({
        rowNumber,
        status: "DUPLICATE",
        warnings: [
          `Possible duplicate of existing case "${dup.procedureName}" on ${dup.caseDate.toISOString().slice(0, 10)}.`,
        ],
      });
      await db.caseLogImportRow.create({
        data: {
          batchId,
          userId,
          originalRowNumber: rowNumber,
          rawRowJson: raw as Prisma.InputJsonValue,
          mappedFieldsJson: coerced.mapped as unknown as Prisma.InputJsonValue,
          unmappedFieldsJson: coerced.unmapped as Prisma.InputJsonValue,
          status: "DUPLICATE",
          warnings: [`Possible duplicate of CaseLog ${dup.id}.`],
        },
      });
      continue;
    }

    if (decision === "merge" && rowDecisions?.[rowNumber]?.mergeTargetCaseId) {
      // Merge: append the imported notes to the existing case rather than
      // creating a new row. We never overwrite scalar fields.
      const targetId = rowDecisions[rowNumber].mergeTargetCaseId!;
      const existing = await db.caseLog.findUnique({
        where: { id: targetId },
      });
      if (existing && existing.userId === userId) {
        const mergedNotes = [existing.notes, coerced.mapped.notes]
          .filter((s) => !!s)
          .join("\n\n--- merged from import ---\n\n");
        await db.caseLog.update({
          where: { id: targetId },
          data: {
            notes: mergedNotes || existing.notes,
            importedFromLog: true,
            importBatchId: batchId,
            originalRowNumber: rowNumber,
            importedMetadata: {
              ...(existing.importedMetadata as object | null),
              ...coerced.unmapped,
            } as Prisma.InputJsonValue,
          },
        });
        importedCount++;
        rowOutcomes.push({
          rowNumber,
          status: "IMPORTED",
          caseId: targetId,
          warnings: ["Merged into existing case."],
        });
        await db.caseLogImportRow.create({
          data: {
            batchId,
            userId,
            originalRowNumber: rowNumber,
            mappedCaseId: targetId,
            rawRowJson: raw as Prisma.InputJsonValue,
            mappedFieldsJson: coerced.mapped as unknown as Prisma.InputJsonValue,
            unmappedFieldsJson: coerced.unmapped as Prisma.InputJsonValue,
            status: "IMPORTED",
            warnings: ["Merged into existing case."],
          },
        });
        continue;
      }
    }

    // Default: create a fresh CaseLog row.
    try {
      const created = await db.caseLog.create({
        data: {
          userId,
          procedureName: coerced.mapped.procedureName,
          procedureCategory: coerced.mapped.procedureCategory ?? undefined,
          specialtyId: coerced.mapped.specialtyId ?? undefined,
          surgicalApproach: coerced.mapped.surgicalApproach as SurgicalApproach,
          role: coerced.mapped.role,
          autonomyLevel: coerced.mapped.autonomyLevel as AutonomyLevel,
          attendingLabel: coerced.mapped.attendingLabel ?? undefined,
          institutionSite: coerced.mapped.institutionSite ?? undefined,
          patientAgeBin: coerced.mapped.patientAgeBin as AgeBin,
          diagnosisCategory: coerced.mapped.diagnosisCategory ?? undefined,
          outcomeCategory: coerced.mapped.outcomeCategory as OutcomeCategory,
          complicationCategory: coerced.mapped.complicationCategory as ComplicationCategory,
          notes: coerced.mapped.notes ?? undefined,
          operativeDurationMinutes: coerced.mapped.operativeDurationMinutes ?? undefined,
          caseDate: coerced.mapped.caseDate,
          importedFromLog: true,
          importBatchId: batchId,
          originalRowNumber: rowNumber,
          importedMetadata: coerced.unmapped as Prisma.InputJsonValue,
          isPublic: false,
        },
      });
      importedCount++;
      rowOutcomes.push({
        rowNumber,
        status: "IMPORTED",
        caseId: created.id,
        warnings: coerced.warnings,
      });
      await db.caseLogImportRow.create({
        data: {
          batchId,
          userId,
          originalRowNumber: rowNumber,
          mappedCaseId: created.id,
          rawRowJson: raw as Prisma.InputJsonValue,
          mappedFieldsJson: coerced.mapped as unknown as Prisma.InputJsonValue,
          unmappedFieldsJson: coerced.unmapped as Prisma.InputJsonValue,
          status: "IMPORTED",
          warnings: coerced.warnings,
        },
      });
    } catch (err) {
      rowOutcomes.push({
        rowNumber,
        status: "FAILED",
        warnings: [err instanceof Error ? err.message : "create failed"],
      });
      await db.caseLogImportRow.create({
        data: {
          batchId,
          userId,
          originalRowNumber: rowNumber,
          rawRowJson: raw as Prisma.InputJsonValue,
          mappedFieldsJson: coerced.mapped as unknown as Prisma.InputJsonValue,
          status: "FAILED",
          warnings: [err instanceof Error ? err.message : "create failed"],
        },
      });
    }
  }

  await db.caseLogImportBatch.update({
    where: { id: batchId },
    data: {
      status: "COMMITTED",
      totalRows: parsedRows.length,
      importedCount,
      skippedCount,
      duplicateCount,
      missingFieldCount,
      columnMapping: mapping as Prisma.InputJsonValue,
    },
  });

  return {
    totalRows: parsedRows.length,
    importedCount,
    skippedCount,
    duplicateCount,
    missingFieldCount,
    rowOutcomes,
  };
}
