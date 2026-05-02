import type { CaseLog, SurgicalApproach } from "@/lib/types";
import type { LengthLevel, ServiceKey } from "../types";
import type { TopMatter } from "./types";
import { formatDate, article } from "../shared/format";
import {
  APPROACH_LABELS,
  AUTONOMY_LABELS,
  AGE_BIN_LABELS,
  OUTCOME_LABELS,
  COMPLICATION_LABELS,
} from "../shared/labels";
import { generalSurgeryBody, generalSurgeryFindings, generalSurgeryTopMatter } from "./generalSurgery";
import { vascularBody, vascularFindings, vascularTopMatter } from "./vascular";
import { obgynBody, obgynFindings, obgynTopMatter } from "./obgyn";
import { urologyBody, urologyFindings, urologyTopMatter } from "./urology";
import { plasticsBody, plasticsFindings, plasticsTopMatter } from "./plastics";
import { orthopedicsBody, orthopedicsFindings, orthopedicsTopMatter } from "./orthopedics";
import { neurosurgeryBody, neurosurgeryFindings, neurosurgeryTopMatter } from "./neurosurgery";
import { entBody, entFindings, entTopMatter } from "./ent";
import { pediatricSurgeryBody, pediatricSurgeryFindings, pediatricSurgeryTopMatter } from "./pediatricSurgery";
import { cardiothoracicBody, cardiothoracicFindings, cardiothoracicTopMatter } from "./cardiothoracic";
import { genericProcedureBody, genericFindings, genericTopMatter } from "./generic";
import { getStyleProfile } from "../style/store";
import { applyStyleProfile } from "../style/apply";
import {
  resolveBillingKeys,
  buildDictationBillingSection,
  buildBillingSupportSection,
} from "../billing";
import type { DictationContext } from "../billing";
import {
  DEFAULT_DICTATION_PREFERENCES,
  shouldRenderBilling,
} from "../preferences";
import type { DictationPreferences } from "../preferences";
import { buildTeachingPearlsBlock } from "../teaching-pearls";

// Re-export so `import { TopMatter } from "@/lib/dictation/operative"` keeps
// working for any consumer that was relying on it being here.
export type { TopMatter } from "./types";

// ---------------------------------------------------------------------------
// Build a procedure header line without duplicating approach words that are
// already implicit in the procedure name. For example:
//   LAPAROSCOPIC + "Laparoscopic cholecystectomy"
//     → "Laparoscopic cholecystectomy"  (not "Laparoscopic Laparoscopic ...")
//   ENDOSCOPIC  + "Ureteroscopy with laser lithotripsy"
//     → "Ureteroscopy with laser lithotripsy" (endoscopy is implicit)
//   OPEN        + "Right frontal craniotomy"
//     → "Right frontal craniotomy" (drop generic "Open" prefix when procedure
//       is already clearly an open operation)
// ---------------------------------------------------------------------------

/** Words in the procedure name that imply a given approach prefix is redundant. */
const IMPLICIT_APPROACH_TOKENS: Record<SurgicalApproach, RegExp[]> = {
  LAPAROSCOPIC: [/\blaparoscop/i],
  ROBOTIC: [/\brobot/i, /\brobotic-?assisted/i],
  ENDOSCOPIC: [
    /\bendoscop/i,
    /\bcystoscop/i,
    /\bureteroscop/i,
    /\bnephroscop/i,
    /\barthroscop/i,
    /\bhysteroscop/i,
    /\blaryngoscop/i,
    /\bbronchoscop/i,
    /\bcolonoscop/i,
    /\besophagoscop/i,
    /\bturbt\b/i,
    /\bturp\b/i,
    /\bfess\b/i,
  ],
  PERCUTANEOUS: [/\bpercutan/i],
  HYBRID: [],
  OTHER: [],
  // "Open" is such a generic qualifier that we also drop it when the procedure
  // is clearly an open operation (e.g., craniotomy, laparotomy, thoracotomy).
  OPEN: [
    /\bopen\b/i,
    /\bcraniotomy\b/i,
    /\blaparotomy\b/i,
    /\bthoracotomy\b/i,
    /\bsternotomy\b/i,
  ],
};

/**
 * Split a procedureName like "Cystoscopy and right ureteric stent insertion"
 * or "Scrotal exploration with bilateral orchiopexy" into individual
 * procedures so the operative note can render them as a numbered list under
 * "PROCEDURES PERFORMED" — the way attendings dictate multi-procedure cases.
 *
 * Splits on " with ", " and ", " + ", semicolons, and the literal "/".
 * Keeps the first capitalisation; trims whitespace; drops empty fragments.
 * Always returns at least one element (the original name) when nothing splits.
 */
function splitProcedures(name: string): string[] {
  if (!name) return [""];
  const parts = name
    .split(/\s+with\s+|\s+and\s+|\s*\+\s*|\s*;\s*|\s*\/\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 1) return [name.trim()];
  // Capitalise each fragment so "right ureteric stent insertion" → "Right
  // ureteric stent insertion" when it appears in a numbered list.
  return parts.map((p) =>
    p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p,
  );
}

function buildProcedureHeader(
  approach: SurgicalApproach,
  procedureName: string,
): string {
  const name = (procedureName || "").trim();
  if (!name) return `[procedure]`;
  const prefix = APPROACH_LABELS[approach];
  const implicit = IMPLICIT_APPROACH_TOKENS[approach] ?? [];
  if (implicit.some((re) => re.test(name))) {
    return name;
  }
  // Avoid an exact word-prefix duplicate ("Open Open hernia repair").
  const firstWord = name.split(/\s+/)[0]?.toLowerCase() ?? "";
  const prefixFirstWord = prefix.split(/\s+/)[0]?.toLowerCase() ?? "";
  if (firstWord && firstWord === prefixFirstWord) {
    return name;
  }
  return `${prefix} ${name}`;
}

// ---------------------------------------------------------------------------
// Router — pick the right specialty body for a CaseLog.
// ---------------------------------------------------------------------------

// Map of the canonical specialty slugs (Specialty.id in the DB) to our
// internal ServiceKey. CaseLog rows always carry a specialtyId, so this is
// the primary dispatch path. When specialtyId is missing we fall back to
// substring matching on specialtyName and then procedureName so the resolver
// still lands on the right builder for historical/seed cases.
const SPECIALTY_ID_TO_SERVICE: Record<string, ServiceKey> = {
  "general-surgery": "general-surgery",
  generalsurgery: "general-surgery",
  general: "general-surgery",
  vascular: "vascular",
  "vascular-surgery": "vascular",
  urology: "urology",
  urologic: "urology",
  "urologic-surgery": "urology",
  obgyn: "obgyn",
  "ob-gyn": "obgyn",
  "ob/gyn": "obgyn",
  obstetrics: "obgyn",
  gynecology: "obgyn",
  "obstetrics-gynecology": "obgyn",
  plastics: "plastics",
  "plastic-surgery": "plastics",
  orthopedics: "orthopedics",
  orthopaedics: "orthopedics",
  "orthopedic-surgery": "orthopedics",
  neurosurgery: "neurosurgery",
  "neurological-surgery": "neurosurgery",
  ent: "ent",
  otolaryngology: "ent",
  "head-and-neck": "ent",
  "pediatric-surgery": "pediatric-surgery",
  pediatric: "pediatric-surgery",
  peds: "pediatric-surgery",
  cardiothoracic: "cardiothoracic",
  "cardiothoracic-surgery": "cardiothoracic",
  cardiac: "cardiothoracic",
  thoracic: "cardiothoracic",
  "ct-surgery": "cardiothoracic",
};

function matchBySubstring(s: string): ServiceKey | null {
  if (!s) return null;
  const t = s.toLowerCase();
  if (t.includes("vascular")) return "vascular";
  if (
    t.includes("obgyn") ||
    t.includes("ob-gyn") ||
    t.includes("ob/gyn") ||
    t.includes("obstetric") ||
    t.includes("gynec")
  ) {
    return "obgyn";
  }
  if (t.includes("pediatric") || t.includes("peds")) return "pediatric-surgery";
  if (t.includes("cardio") || t.includes("thoracic") || t.includes("ct surg")) {
    return "cardiothoracic";
  }
  if (t.includes("general surgery")) return "general-surgery";
  if (t.includes("urology") || t.includes("urologic")) return "urology";
  if (t.includes("plastic")) return "plastics";
  if (t.includes("ortho")) return "orthopedics";
  if (t.includes("neuro")) return "neurosurgery";
  if (t.includes("otolaryng") || t.includes("head and neck") || /\bent\b/.test(t)) {
    return "ent";
  }
  return null;
}

/** Last-ditch signal: infer specialty from the procedure name itself. */
function matchByProcedure(name: string): ServiceKey | null {
  if (!name) return null;
  const p = name.toLowerCase();
  if (/\b(turbt|turp|ureteroscop|cystoscop|prostatectom|nephrectom|pcnl|urs|orchiectom|hydrocele|vasectom|circumcis)\b/.test(p)) {
    return "urology";
  }
  if (/\b(carotid|aneurysm|bypass graft|fem-pop|fem-fem|endarterectom|av fistula|dialysis access|evar|tevar)\b/.test(p)) {
    return "vascular";
  }
  if (/\b(cesarean|c-section|hysterectom|myomectom|d&c|dilation and curettage|salping|oophorectom|tubal)\b/.test(p)) {
    return "obgyn";
  }
  if (/\b(craniotom|laminectom|discectom|burr hole|evd|vp shunt|crani)\b/.test(p)) {
    return "neurosurgery";
  }
  if (/\b(arthroplasty|tka|tha|orif|fusion|acl|rotator cuff|arthroscop|fracture)\b/.test(p)) {
    return "orthopedics";
  }
  if (/\b(tonsillectom|adenoidectom|septoplast|fess|thyroidectom|parotidectom|neck dissection|tracheostom)\b/.test(p)) {
    return "ent";
  }
  if (/\b(breast reduction|augmentation|flap|abdominoplast|panniculectom|cleft lip|cleft palate|mohs|carpal tunnel|trigger finger)\b/.test(p)) {
    return "plastics";
  }
  if (/\b(cabg|avr|mvr|vats|lobectom|pneumonectom|pericardial window|mediastinoscop)\b/.test(p)) {
    return "cardiothoracic";
  }
  if (/\b(pyloromyotom|orchidopex|umbilical hernia|ladd|intussuscept|peg tube)\b/.test(p)) {
    return "pediatric-surgery";
  }
  if (/\b(cholecystectom|appendectom|hernia repair|hemicolectom|colectom|whipple|hepatectom|splenectom|gastrectom|bariatric|sleeve gastrectom|roux-en-y)\b/.test(p)) {
    return "general-surgery";
  }
  return null;
}

export function resolveServiceFromCase(c: CaseLog): ServiceKey {
  // 1) Primary: canonical specialtyId from the DB.
  const id = (c.specialtyId || "").toLowerCase().trim();
  if (id && SPECIALTY_ID_TO_SERVICE[id]) {
    return SPECIALTY_ID_TO_SERVICE[id];
  }
  // 2) Substring scan over specialtyId (in case the id was a human label).
  const idMatch = matchBySubstring(id);
  if (idMatch) return idMatch;
  // 3) Human-readable specialtyName if present.
  const nameMatch = matchBySubstring(c.specialtyName || "");
  if (nameMatch) return nameMatch;
  // 4) Last resort: infer from the procedure name.
  const procMatch = matchByProcedure(c.procedureName || "");
  if (procMatch) return procMatch;
  return "unknown";
}

function bodyForCase(c: CaseLog, service: ServiceKey): string[] {
  switch (service) {
    case "general-surgery":
      return generalSurgeryBody(c);
    case "vascular":
      return vascularBody(c);
    case "obgyn":
      return obgynBody(c);
    case "urology":
      return urologyBody(c);
    case "plastics":
      return plasticsBody(c);
    case "orthopedics":
      return orthopedicsBody(c);
    case "neurosurgery":
      return neurosurgeryBody(c);
    case "ent":
      return entBody(c);
    case "pediatric-surgery":
      return pediatricSurgeryBody(c);
    case "cardiothoracic":
      return cardiothoracicBody(c);
    default:
      return genericProcedureBody(c);
  }
}

function findingsForCase(c: CaseLog, service: ServiceKey): string {
  switch (service) {
    case "general-surgery":
      return generalSurgeryFindings(c);
    case "vascular":
      return vascularFindings(c);
    case "obgyn":
      return obgynFindings(c);
    case "urology":
      return urologyFindings(c);
    case "plastics":
      return plasticsFindings(c);
    case "orthopedics":
      return orthopedicsFindings(c);
    case "neurosurgery":
      return neurosurgeryFindings(c);
    case "ent":
      return entFindings(c);
    case "pediatric-surgery":
      return pediatricSurgeryFindings(c);
    case "cardiothoracic":
      return cardiothoracicFindings(c);
    default:
      return genericFindings(c);
  }
}

function topMatterForCase(c: CaseLog, service: ServiceKey): TopMatter {
  switch (service) {
    case "general-surgery":
      return generalSurgeryTopMatter(c);
    case "vascular":
      return vascularTopMatter(c);
    case "obgyn":
      return obgynTopMatter(c);
    case "urology":
      return urologyTopMatter(c);
    case "plastics":
      return plasticsTopMatter(c);
    case "orthopedics":
      return orthopedicsTopMatter(c);
    case "neurosurgery":
      return neurosurgeryTopMatter(c);
    case "ent":
      return entTopMatter(c);
    case "pediatric-surgery":
      return pediatricSurgeryTopMatter(c);
    case "cardiothoracic":
      return cardiothoracicTopMatter(c);
    default:
      return genericTopMatter(c);
  }
}

// ---------------------------------------------------------------------------
// Role mapping — given a trainee role + autonomy level, decide who to list
// as the surgeon of record and who as assistant. The attending is usually
// the surgeon of record; the trainee is the assistant unless they operated
// independently.
// ---------------------------------------------------------------------------
function resolveSurgeonRoles(c: CaseLog): { surgeon: string; assistant: string } {
  const attending = c.attendingLabel?.trim() || "[Attending]";
  const traineeRole = c.role || "Trainee";
  const indep =
    c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING";

  // When the trainee operated independently, list them as surgeon of record.
  if (indep) {
    return { surgeon: traineeRole, assistant: attending };
  }
  // Otherwise attending is the surgeon, trainee is the assistant.
  return { surgeon: attending, assistant: traineeRole };
}

// ---------------------------------------------------------------------------
// Full operative report — same shape as the original generateDictation(),
// now routed through the service registry.
// ---------------------------------------------------------------------------

export function buildOperativeNote(
  c: CaseLog,
  opts: { length?: LengthLevel; preferences?: DictationPreferences } = {},
): string {
  const length = opts.length ?? "full";
  const preferences: DictationPreferences =
    opts.preferences ?? DEFAULT_DICTATION_PREFERENCES;
  const service = resolveServiceFromCase(c);
  const top = topMatterForCase(c, service);
  const { surgeon, assistant } = resolveSurgeonRoles(c);
  const lines: string[] = [];

  const procedurePerformed = buildProcedureHeader(c.surgicalApproach, c.procedureName);
  const preopDx = c.diagnosisCategory?.trim() || "[Preoperative diagnosis]";
  const postopDx = "Same.";
  const anesthesia = top.anesthesia || "General anesthesia.";
  const ebl = top.ebl || "Approximately ________ ml.";
  const drains = top.drains || "[Describe type and location of drains, or 'None'].";
  const specimens = top.specimens || "[Describe specimens sent to pathology, or 'None'].";
  const complications =
    c.complicationCategory === "NONE" && c.outcomeCategory === "UNCOMPLICATED"
      ? "None."
      : `${OUTCOME_LABELS[c.outcomeCategory]}. ${COMPLICATION_LABELS[c.complicationCategory]}.${
          c.conversionOccurred ? " Conversion to open approach was required." : ""
        }`;

  // ── Multi-procedure detection ──
  // When the user types e.g. "Scrotal exploration with bilateral orchiopexy"
  // or "Cystoscopy and right ureteric stent insertion", split on common
  // joiners and render as a numbered list under PROCEDURES PERFORMED, the
  // way an attending dictates a multi-procedure case (see example #3).
  const procedureList = splitProcedures(procedurePerformed);
  const isMulti = procedureList.length > 1;

  // ── Header block: DATE / SURGEON / ASSISTANT ──
  // Matches the order that attendings actually dictate at the top of a note
  // (examples #1 + #3). No "OPERATIVE REPORT" banner — no real dictation
  // includes one.
  lines.push(`DATE OF PROCEDURE: ${formatDate(c.caseDate)}.`);
  lines.push("");
  lines.push(`SURGEON: ${surgeon}`);
  lines.push("");
  lines.push(`ASSISTANT: ${assistant}`);
  lines.push("");

  // ── Diagnoses ──
  lines.push(`PREOPERATIVE DIAGNOSIS: ${preopDx}.`);
  lines.push("");
  lines.push(`POSTOPERATIVE DIAGNOSIS: ${postopDx === "Same." ? "Same as above." : postopDx}`);
  lines.push("");

  // ── Procedure(s) Performed ──
  if (isMulti) {
    lines.push("PROCEDURES PERFORMED:");
    for (let i = 0; i < procedureList.length; i++) {
      lines.push(`${i + 1}. ${procedureList[i]}.`);
    }
  } else {
    lines.push(`PROCEDURE PERFORMED: ${procedureList[0]}.`);
  }
  lines.push("");

  // ── Clinical Preamble ──
  // Patient-specific narrative. Kept short — the bracketed "add history"
  // prompt is the trainee's cue to dictate the case-specific story (no
  // PHIA-safe way for the engine to write that for them, and an
  // over-templated preamble feels worse than a clean prompt).
  const procArticle = article(c.procedureName);
  lines.push("CLINICAL PREAMBLE:");
  lines.push(
    `The patient is a [age]-year-old [male/female] (age group: ${AGE_BIN_LABELS[c.patientAgeBin]}) with ${
      c.diagnosisCategory?.trim() || "[clinical diagnosis]"
    }. [Add relevant history: past medical / surgical history, prior imaging, recent labs, presentation evolution that led to this OR.] The decision was made to proceed with ${procArticle} ${c.procedureName.toLowerCase()}. The risks, benefits, and alternatives of the procedure were discussed with the patient and informed consent was obtained.`,
  );
  lines.push("");

  // ── Findings ──
  lines.push("FINDINGS:");
  if (length === "handover") {
    lines.push(
      `${procedurePerformed}. Intraoperative findings consistent with preoperative diagnosis. See description below.`,
    );
  } else {
    lines.push(findingsForCase(c, service));
  }
  lines.push("");

  // ── Specimen ── (singular when the top-matter says "None" or a single
  // specimen string; pluralised when multiple specimens are listed)
  const specimensIsList = /;|\band\b/i.test(specimens) && !/none/i.test(specimens);
  lines.push(`${specimensIsList ? "SPECIMENS" : "SPECIMEN"}: ${specimens}`);
  lines.push("");

  // ── Estimated Blood Loss / Drains / Anesthesia / Complications ──
  lines.push(`ESTIMATED BLOOD LOSS: ${ebl}`);
  lines.push("");
  lines.push(`DRAINS: ${drains}`);
  lines.push("");
  lines.push(`ANESTHESIA: ${anesthesia}`);
  lines.push("");
  lines.push(`COMPLICATIONS: ${complications}`);
  lines.push("");

  // ── Operative Procedure ──
  // Real attendings dictate this as "OPERATIVE PROCEDURE" or just
  // "PROCEDURE" — never "DESCRIPTION OF PROCEDURE" (an EHR template
  // artifact). Use OPERATIVE PROCEDURE since example #3 does.
  lines.push("OPERATIVE PROCEDURE:");
  if (length === "handover") {
    lines.push(
      `Summary: ${procedurePerformed}. Surgeon: ${surgeon}. Assistant: ${assistant}. Autonomy: ${AUTONOMY_LABELS[c.autonomyLevel]}. EBL ${ebl.toLowerCase()} Drains ${drains.toLowerCase()} Specimen ${specimens.toLowerCase()} Complications: ${complications.toLowerCase()}`,
    );
  } else {
    const body = bodyForCase(c, service);
    for (const line of body) lines.push(line);
  }
  lines.push("");

  // ── Disposition ──
  const disposition =
    top.disposition ||
    "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. All instrument, sponge, and needle counts were reported as correct prior to closure. The patient was transferred to the recovery area in stable condition. Postoperative plan will be per standard service protocol.";
  lines.push("DISPOSITION:");
  lines.push(disposition);

  // ── Notes / reflection ──
  if (c.notes) {
    lines.push("");
    lines.push("--- OPERATIVE NOTES ---");
    lines.push(c.notes);
  }

  if (length === "full" && c.reflection) {
    lines.push("");
    lines.push("--- TRAINEE REFLECTION ---");
    lines.push(c.reflection);
  }

  // ── Teaching Pearls (gated on preferences) ──
  if (preferences.teachingPearlsEnabled) {
    const pearls = buildTeachingPearlsBlock(c);
    if (pearls) lines.push(pearls);
  }

  // ── Billing / Documentation Support (gated on preferences) ──
  // Only renders when:
  //   - the user has billing turned ON
  //   - they have selected a province/region
  //   - the region has a verified procedure library or matching global rules
  // Otherwise the dictation stays a clean operative note.
  if (shouldRenderBilling(preferences)) {
    const billingKeys = resolveBillingKeys(c.procedureName || "");
    const billingCtx: DictationContext = {
      procedureKey: billingKeys[0] ?? "",
      totalCaseMinutes: c.operativeDurationMinutes ?? undefined,
      laterality: undefined,
    };
    const supportSection = buildBillingSupportSection({
      region: preferences.billingRegion,
      procedureKeys: billingKeys,
      ctx: billingCtx,
    });
    if (supportSection) {
      lines.push(supportSection);
    } else if (preferences.billingRegion === "MB" && billingKeys.length > 0) {
      // Legacy fallback for Manitoba so the original verified output stays
      // identical for users who already relied on it.
      const legacy = buildDictationBillingSection(billingKeys, billingCtx);
      if (legacy) lines.push(legacy);
    }
  }

  lines.push("");
  lines.push("=".repeat(60));
  lines.push("END OF OPERATIVE REPORT");

  // Apply the learned style profile (if any) as the last step.
  const profile = getStyleProfile();
  return applyStyleProfile(lines.join("\n"), profile);
}

/**
 * Legacy entry point — preserved so existing consumers keep working.
 * Produces the full-length operative report. Pass preferences when the
 * caller has them (e.g., the case-log page hydrated them from the
 * /api/dictation/preferences endpoint) so the billing overlay respects
 * the user's province + on/off toggle.
 */
export function generateDictation(
  c: CaseLog,
  preferences?: DictationPreferences,
): string {
  return buildOperativeNote(c, { length: "full", preferences });
}
