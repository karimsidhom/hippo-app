// Hippo Clinic — Safety check orchestrator.
//
// Runs three checks before finalize:
//   1. Critical findings — symptom/finding pairs that should trigger an
//      action but didn't make it into the plan (e.g. "haematuria" but no
//      cysto/imaging in plan; "PSA 25" but no urgent referral).
//   2. Drug interactions — meds extracted from the plan are run through
//      RxNorm. High-severity pairs surface as a critical alert.
//   3. Allergy cross-check — meds vs. patient.allergies (text contains
//      check, kept simple deliberately because allergy text is free-form).
//
// Output is a single typed list the UI renders as a banner panel above
// the finalize button. Severity tones the banner.
//
// Hard rule: the safety check NEVER blocks finalization. The clinician
// must always be able to override. We log the outcome to the AI audit
// trail so an audit reviewer can see "we warned, clinician overrode".

import crypto from "node:crypto";
import { chatJson, ClinicLlmError } from "@/lib/clinic/llm";
import { CORE_RULES } from "@/lib/clinic/prompts";
import { approximateRxcui, getInteractionsForRxcuis } from "./rxnorm";

export interface SafetyAlert {
  id: string;
  severity: "critical" | "warning";
  category: "missing-action" | "drug-interaction" | "allergy" | "uncertainty";
  title: string;
  detail: string;
  /** Optional pointer back to the section that triggered the alert. */
  section?: "p1" | "p2" | "p3" | "p4";
}

interface RunInput {
  paragraphs: { p1: string; p2: string; p3: string; p4: string };
  patientAllergies?: string | null;
}

const CRITICAL_FINDING_SYSTEM = `${CORE_RULES}

SAFETY-CHECK TASK
You read a draft outpatient clinical note and identify CRITICAL FINDINGS
that lack a corresponding action in the plan. Examples:
  - haematuria mentioned but no cystoscopy / urine cytology / CT-U in plan
  - new lump / mass mentioned but no imaging or biopsy
  - chest pain or syncope mentioned but no ECG / troponin
  - suspected cancer mentioned but no urgent referral
  - PSA above 10 + no biopsy or urgent referral
  - suicidal / homicidal ideation + no safety plan or admission
  - pregnancy + a teratogenic medication
  - acute red eye / vision change + no ophthalmology referral
  - severe pain mentioned but no analgesic plan
  - new neurological deficit + no urgent imaging

Skip routine items. Only flag CRITICAL OMISSIONS.

Also extract a normalized list of every prescribed / continued / stopped
medication from the plan section, with dose if present. We will run those
through a drug-interaction database afterwards.

Return STRICT JSON:
{
  "alerts": [
    { "severity": "critical"|"warning",
      "title": string,           // < 70 chars, plain English
      "detail": string,          // 1 sentence explaining what's missing or risky
      "section": "p1"|"p2"|"p3"|"p4" }
  ],
  "medications": [
    { "name": string,            // canonical drug name only (e.g. "tamsulosin")
      "dose": string?,           // optional, "0.4mg daily"
      "intent": "started"|"continued"|"stopped"|"unknown" }
  ]
}
No prose, no markdown.
`.trim();

interface ExtractedMed { name: string; dose?: string; intent?: string }
interface ExtractionResult { alerts?: SafetyAlert[]; medications?: ExtractedMed[] }

export async function runSafetyCheck(input: RunInput): Promise<{ alerts: SafetyAlert[]; promptHash: string }> {
  const noteText = [
    `[p1] ${input.paragraphs.p1}`,
    `[p2] ${input.paragraphs.p2}`,
    `[p3] ${input.paragraphs.p3}`,
    `[p4] ${input.paragraphs.p4}`,
  ].join("\n\n");

  if (!noteText.trim()) {
    return { alerts: [], promptHash: "" };
  }

  const promptHash = crypto.createHash("sha256").update(noteText).digest("hex").slice(0, 16);

  // ── Step 1: LLM-extracted critical findings + medication list ──────────
  let extracted: ExtractionResult = { alerts: [], medications: [] };
  try {
    const r = await chatJson<ExtractionResult>({
      system: CRITICAL_FINDING_SYSTEM,
      user: noteText,
      temperature: 0.05,
      maxTokens: 900,
    });
    extracted = r.json ?? {};
  } catch (err) {
    if (err instanceof ClinicLlmError) {
      // Soft-fail: allergies + missing-action checks still useful, but if
      // the LLM call fails outright there's no med list to interaction-check.
      // Surface a single warning so the clinician sees the system tried.
      return {
        alerts: [{
          id: hashId("safety-llm-fail"),
          severity: "warning",
          category: "uncertainty",
          title: "Safety check unavailable",
          detail: "The AI safety pre-check could not run. Review the note manually before finalizing.",
        }],
        promptHash,
      };
    }
    throw err;
  }

  const out: SafetyAlert[] = [];

  // Carry through the LLM's critical-finding alerts.
  for (const a of extracted.alerts ?? []) {
    if (!a.title) continue;
    out.push({
      id: hashId(`finding:${a.title}`),
      severity: a.severity === "critical" ? "critical" : "warning",
      category: "missing-action",
      title: a.title,
      detail: a.detail ?? "",
      section: a.section,
    });
  }

  const meds = (extracted.medications ?? []).filter((m) => m?.name).map((m) => m.name.trim());

  // ── Step 2: Allergy cross-check (free-text fuzzy) ──────────────────────
  // Audit finding H2: the previous version used a pure word-boundary
  // regex which missed common cases:
  //   - plural in allergy text ("penicillins") vs singular med ("penicillin")
  //   - class names ("beta-lactam") vs members ("amoxicillin")
  //   - brand-vs-generic ("ciprofloxacin" vs "Cipro")
  //
  // Strategy now is a layered match:
  //   1. Exact word-boundary match (cheapest)
  //   2. Stem match — the first 6+ characters of the med, if present in
  //      the allergy text, also flags
  //   3. Class lookup — for known antibiotic classes, if the allergy
  //      mentions the class and the med belongs to it, flag
  //
  // We tag the alert with which check fired so the clinician can judge
  // whether to override.
  if (input.patientAllergies && meds.length > 0) {
    const allergyLower = input.patientAllergies.toLowerCase();
    for (const med of meds) {
      const medLower = med.toLowerCase().trim();
      if (medLower.length < 4) continue; // skip obvious noise

      const reasons: string[] = [];
      // 1. Exact word-boundary
      if (new RegExp(`\\b${escapeRe(medLower)}s?\\b`, "i").test(allergyLower)) {
        reasons.push("exact match");
      }
      // 2. Stem match — first 6 chars (handles penicillin / penicillins
      //    / penicillin-G as different surface forms of the same root).
      else if (medLower.length >= 6) {
        const stem = medLower.slice(0, 6);
        if (allergyLower.includes(stem)) reasons.push(`stem match "${stem}"`);
      }
      // 3. Class membership — known suffix → class lookups.
      const classHit = matchDrugClass(medLower, allergyLower);
      if (classHit) reasons.push(`class: ${classHit}`);

      if (reasons.length > 0) {
        out.push({
          id: hashId(`allergy:${medLower}:${reasons.join(",")}`),
          severity: "critical",
          category: "allergy",
          title: `Possible allergy conflict: ${med}`,
          detail: `${med} (${reasons.join("; ")}) overlaps with a documented allergy: "${input.patientAllergies.slice(0, 200)}". Verify before prescribing.`,
        });
      }
    }
  }

  // ── Step 3: Drug-interaction check via RxNorm ──────────────────────────
  if (meds.length >= 2) {
    const rxcuis: string[] = [];
    const nameByRxcui: Record<string, string> = {};
    for (const med of meds.slice(0, 8)) { // cap to keep call latency bounded
      const m = await approximateRxcui(med);
      if (m?.rxcui) {
        rxcuis.push(m.rxcui);
        nameByRxcui[m.rxcui] = med;
      }
    }
    if (rxcuis.length >= 2) {
      const interactions = await getInteractionsForRxcuis(rxcuis);
      for (const ix of interactions) {
        const sev = (ix.severity ?? "").toLowerCase();
        if (!sev || sev === "n/a") continue;
        const isCritical = sev === "high" || sev === "contraindicated";
        out.push({
          id: hashId(`ix:${ix.pair.join("+")}`),
          severity: isCritical ? "critical" : "warning",
          category: "drug-interaction",
          title: `Drug interaction: ${ix.pair[0]} + ${ix.pair[1]}`,
          detail: ix.description.slice(0, 400) + (ix.source ? ` (source: ${ix.source})` : ""),
        });
      }
    }
  }

  return { alerts: out, promptHash };
}

function hashId(s: string): string {
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
}
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Drug-class lookups for the allergy cross-check. Conservative — only
// the highest-impact classes a clinician would actually annotate as a
// blanket allergy. The list is the suffix/marker that lives in the med
// name → the class name and the alternate names a patient might write
// in their allergy text.
const DRUG_CLASS_MAP: Array<{ medMatch: RegExp; class: string; allergyMarkers: RegExp }> = [
  // Penicillins / beta-lactams
  { medMatch: /(penicillin|amoxicillin|ampicillin|cloxacillin|piperacillin|ticarcillin|nafcillin|cefaclor|cefadroxil|cefazolin|cephalexin|cefuroxime|ceftriaxone|cefepime|cefixime|cefdinir|imipenem|meropenem|ertapenem)/i,
    class: "beta-lactam / penicillin family",
    allergyMarkers: /\b(penicillin|pcn|beta[-\s]?lactam|cephalosporin|amoxicillin)s?\b/i },
  // Sulfonamides
  { medMatch: /(sulfa|sulfameth|sulfasal|trimethoprim[-\s]?sulfa)/i,
    class: "sulfonamides",
    allergyMarkers: /\b(sulfa|sulfonamide|tmp[-\s]?smx|septra|bactrim)s?\b/i },
  // Fluoroquinolones
  { medMatch: /(floxacin)$/i,
    class: "fluoroquinolones",
    allergyMarkers: /\b(fluoroquinolone|cipro|levaquin|moxifloxacin|ciprofloxacin)s?\b/i },
  // Macrolides
  { medMatch: /(thromycin|azithromycin|clarithromycin|erythromycin)/i,
    class: "macrolides",
    allergyMarkers: /\b(macrolide|azithromycin|clarithromycin|erythromycin|zithromax|biaxin)s?\b/i },
  // NSAIDs
  { medMatch: /(ibuprofen|naproxen|diclofenac|celecoxib|ketorolac|indomethacin|meloxicam)/i,
    class: "NSAIDs",
    allergyMarkers: /\b(nsaid|ibuprofen|advil|motrin|aspirin|asa|celebrex|naproxen|aleve)s?\b/i },
  // Statins
  { medMatch: /(statin)$/i,
    class: "statins",
    allergyMarkers: /\b(statin)s?\b/i },
];

function matchDrugClass(medLower: string, allergyLower: string): string | null {
  for (const entry of DRUG_CLASS_MAP) {
    if (entry.medMatch.test(medLower) && entry.allergyMarkers.test(allergyLower)) {
      return entry.class;
    }
  }
  return null;
}
