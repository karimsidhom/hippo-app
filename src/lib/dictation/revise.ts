import type { NoteContext, NoteType, ServiceKey, BuildResult } from "./types";
import { getStyleProfile } from "./style/store";
import { applyStyleProfile } from "./style/apply";

// ---------------------------------------------------------------------------
// Revision engine
//
// Takes a rough free-text dictation and returns a polished, style-adjusted
// version. For the first landing this is a deterministic pipeline:
//
//   1. classify(): infer note type + service from the rough text
//   2. extract(): pull identifiable structured fields (HPI, exam, A/P, etc.)
//   3. restructure(): assemble into the service's preferred section order
//   4. style(): apply the saved StyleProfile (strip avoid phrases, brevity)
//
// Subsequent iterations will swap classify/extract for a small LLM call while
// keeping the same public signature, so consumers don't need to change.
// ---------------------------------------------------------------------------

export interface ReviseInput {
  rough: string;
  /** Optional hints — used directly when the caller already knows them. */
  hints?: {
    noteType?: NoteType;
    service?: ServiceKey;
  };
}

export interface ReviseResult extends BuildResult {
  noteType: NoteType;
  service: ServiceKey;
  context: NoteContext;
}

// ---------- classification --------------------------------------------------

const NOTE_TYPE_CUES: Record<NoteType, RegExp[]> = {
  operative: [/description of procedure/i, /incision was made/i, /anastomo/i, /hemostasis/i],
  "bedside-procedure": [/bedside/i, /at the bedside/i, /central line/i, /chest tube/i, /paracentesis/i],
  consult: [/consult/i, /reason for consult/i, /called to see/i, /hpi/i],
  "follow-up": [/follow[- ]up/i, /post[- ]?op day/i, /pod\s*\d/i, /progress note/i],
  clinic: [/clinic visit/i, /seen in clinic/i, /follow up in clinic/i],
  discharge: [/discharge/i, /d\/c summary/i, /hospital course/i],
  handover: [/handover/i, /sign[- ]out/i, /to do overnight/i],
};

function classifyNoteType(text: string): NoteType {
  for (const [type, patterns] of Object.entries(NOTE_TYPE_CUES) as [NoteType, RegExp[]][]) {
    if (patterns.some((p) => p.test(text))) return type;
  }
  return "consult";
}

const SERVICE_CUES: Record<ServiceKey, RegExp[]> = {
  "general-surgery": [/appendic/i, /cholecyst/i, /hernia/i, /colectomy/i, /general surgery/i],
  vascular: [/aaa/i, /carotid/i, /fem[- ]pop/i, /evar/i, /bypass graft/i, /vascular/i],
  obgyn: [/cesarean/i, /c[- ]section/i, /hysterectomy/i, /obgyn/i, /ob\/gyn/i, /g\d+p\d+/i],
  urology: [/prostat/i, /cystoscopy/i, /turbt/i, /turp/i, /ureter/i, /nephrectomy/i, /urology/i],
  plastics: [/flap/i, /skin graft/i, /plastic/i],
  orthopedics: [/orif/i, /fracture/i, /arthroplasty/i, /orthopedic/i],
  neurosurgery: [/craniotomy/i, /laminectomy/i, /neurosurg/i],
  ent: [/tonsillectomy/i, /myringotomy/i, /ent\b/i, /otolaryng/i],
  "pediatric-surgery": [/pediatric/i, /peds/i, /pyloric stenosis/i],
  "icu-trauma": [/trauma/i, /icu/i, /gcs/i],
  emergency: [/emergency/i, /\bed\b/i, /emergency department/i],
  ward: [/ward/i, /inpatient/i],
  unknown: [],
};

function classifyService(text: string): ServiceKey {
  for (const [svc, patterns] of Object.entries(SERVICE_CUES) as [ServiceKey, RegExp[]][]) {
    if (svc === "unknown") continue;
    if (patterns.some((p) => p.test(text))) return svc;
  }
  return "unknown";
}

// ---------- extraction ------------------------------------------------------

/** Extract labeled sections from a rough dictation. */
function extractContext(text: string): NoteContext {
  const ctx: NoteContext = { service: "unknown", raw: text };
  const sections: Record<string, RegExp> = {
    hpi: /(?:hpi|history of present illness)[:\s]+([\s\S]*?)(?=\n[A-Z][A-Za-z ]+:|\n\n|$)/i,
    pmh: /(?:pmh|past medical history)[:\s]+([\s\S]*?)(?=\n[A-Z][A-Za-z ]+:|\n\n|$)/i,
    meds: /(?:medications?)[:\s]+([\s\S]*?)(?=\n[A-Z][A-Za-z ]+:|\n\n|$)/i,
    allergies: /(?:allerg(?:y|ies))[:\s]+([\s\S]*?)(?=\n[A-Z][A-Za-z ]+:|\n\n|$)/i,
    exam: /(?:exam(?:ination)?|physical)[:\s]+([\s\S]*?)(?=\n[A-Z][A-Za-z ]+:|\n\n|$)/i,
    investigations: /(?:labs?|imaging|investigations?)[:\s]+([\s\S]*?)(?=\n[A-Z][A-Za-z ]+:|\n\n|$)/i,
    assessment: /(?:assessment|impression|a\/p)[:\s]+([\s\S]*?)(?=\n[A-Z][A-Za-z ]+:|\n\n|$)/i,
    plan: /(?:plan|p:|recommendation)[:\s]+([\s\S]*?)(?=\n[A-Z][A-Za-z ]+:|\n\n|$)/i,
    disposition: /(?:disposition|dispo)[:\s]+([\s\S]*?)(?=\n[A-Z][A-Za-z ]+:|\n\n|$)/i,
  };
  for (const [k, re] of Object.entries(sections)) {
    const m = text.match(re);
    if (m && m[1]) (ctx as unknown as Record<string, unknown>)[k] = m[1].trim();
  }
  return ctx;
}

// ---------- main entry ------------------------------------------------------

/**
 * Revise a rough dictation into a polished version using the user's style
 * profile. Classifies note type + service, extracts fields, and applies the
 * profile's brevity / phrase preferences. Returns the polished text plus
 * metadata about what was detected and anything the caller needs to fill in.
 */
export function reviseDictation(input: ReviseInput): ReviseResult {
  const noteType = input.hints?.noteType ?? classifyNoteType(input.rough);
  const service = input.hints?.service ?? classifyService(input.rough);
  const context = extractContext(input.rough);
  context.service = service;

  const profile = getStyleProfile();
  const polished = applyStyleProfile(input.rough, profile);

  const missing: string[] = [];
  if (!context.hpi) missing.push("HPI");
  if (!context.exam) missing.push("Examination");
  if (!context.assessment) missing.push("Assessment / Impression");
  if (!context.plan) missing.push("Plan");

  return {
    noteType,
    service,
    context,
    text: polished,
    missing,
    warnings: [],
  };
}
