import type { NoteContext, NoteType, ServiceKey, BuildResult, LengthLevel } from "./types";
import { getStyleProfile } from "./style/store";
import { applyStyleProfile } from "./style/apply";
import { learnFromCorrection } from "./style/learn";
import { getPlaybook } from "./services/playbooks";
import { callClaude, LlmUnavailableError, DICTATION_MODEL } from "./llm";

// ---------------------------------------------------------------------------
// Revision engine
//
// Takes a rough free-text dictation and returns a polished, style-adjusted
// version. Primary path:
//
//   1. Build a prompt that pins the LLM to the user's StyleProfile, the
//      target service's Playbook (required fields, red flags, phrasing
//      pearls), and the requested note type + length.
//   2. Call Claude Opus 4.6 via the Anthropic Messages API.
//   3. Run the polished output through applyStyleProfile() for final
//      enforcement of brevity / banned phrases / header casing.
//
// If the API is unavailable (no key, network error, etc.) we fall back to a
// deterministic pipeline that classifies, extracts, and applies the style
// profile without rewriting the body.
//
// Corrections flow through learnFromCorrection, which updates the profile
// stored in localStorage so subsequent calls track the user's voice.
// ---------------------------------------------------------------------------

export interface ReviseInput {
  rough: string;
  /** Optional hints — used directly when the caller already knows them. */
  hints?: {
    noteType?: NoteType;
    service?: ServiceKey;
    length?: LengthLevel;
  };
}

export interface ReviseResult extends BuildResult {
  noteType: NoteType;
  service: ServiceKey;
  length: LengthLevel;
  context: NoteContext;
  /** Which engine produced the text: LLM or the deterministic fallback. */
  engine: "claude-opus-4-6" | "deterministic-fallback";
}

// ---------- deterministic classification (fallback only) -------------------

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
  plastics: [/flap/i, /skin graft/i, /plastic/i, /mammaplasty/i, /abdominoplasty/i],
  orthopedics: [/orif/i, /fracture/i, /arthroplasty/i, /orthopedic/i, /arthroscopy/i, /rotator cuff/i],
  neurosurgery: [/craniotomy/i, /laminectomy/i, /neurosurg/i, /ventricular drain/i, /burr hole/i],
  ent: [/tonsillectomy/i, /myringotomy/i, /ent\b/i, /otolaryng/i, /septoplasty/i, /tracheostomy/i],
  "pediatric-surgery": [/pediatric/i, /peds/i, /pyloric stenosis/i, /pyloromyotomy/i, /orchidopexy/i],
  cardiothoracic: [/cabg/i, /coronary bypass/i, /aortic valve/i, /vats/i, /lobectomy/i, /thoracotomy/i],
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

/** Extract labeled sections from a rough dictation (fallback path only). */
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

// ---------- prompt assembly -------------------------------------------------

function buildSystemPrompt(
  noteType: NoteType,
  service: ServiceKey,
  length: LengthLevel,
): string {
  const profile = getStyleProfile();
  const playbook = getPlaybook(service);

  const brevity =
    length === "handover"
      ? "Produce a one-screen handover: terse bullets, no narrative."
      : length === "concise"
        ? "Produce a concise note — keep essentials only, strip redundancy, no filler."
        : "Produce a full-length formal note suitable for the medical record.";

  const stylePrefs = [
    profile.global.brevity === "concise" ? "Prefer terse phrasing." : "",
    profile.global.preferredPhrases.length
      ? `Favor these phrases the user has approved: ${profile.global.preferredPhrases.slice(0, 15).join(" | ")}`
      : "",
    profile.global.avoidPhrases.length
      ? `NEVER use any of these phrases the user has explicitly rejected: ${profile.global.avoidPhrases.slice(0, 20).join(" | ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const playbookBlock = playbook
    ? `Service playbook — ${playbook.displayName}:
Required fields: ${playbook.required.join("; ")}
Red flags to never miss: ${playbook.redFlags.join("; ")}
Phrasing pearls: ${playbook.phrasingPearls.join(" ")}`
    : `Service playbook: none — use general surgical note conventions.`;

  return `You are a senior surgical resident polishing a rough clinical dictation into a formal ${noteType} note.

Hard rules:
- Do NOT invent clinical facts. If a field is missing, leave a bracketed placeholder like [specific finding] or [value].
- Preserve every specific number, name, time, and dose exactly as written in the rough input.
- Write in the voice of a senior resident — concise, specific, organized, practical. No AI filler, no hedging, no "as an AI", no "I hope this helps".
- Use standard medical abbreviations and formal section headers where appropriate.
- NEVER reproduce copyrighted text or fabricate citations.

${brevity}

${playbookBlock}

${stylePrefs}

Return ONLY the polished note text. Do not include commentary, preface, or a trailing explanation.`;
}

function buildUserPrompt(rough: string, hints?: ReviseInput["hints"]): string {
  const hintLines: string[] = [];
  if (hints?.noteType) hintLines.push(`Target note type: ${hints.noteType}`);
  if (hints?.service) hintLines.push(`Target service: ${hints.service}`);
  if (hints?.length) hintLines.push(`Target length: ${hints.length}`);
  const hintBlock = hintLines.length ? hintLines.join("\n") + "\n\n" : "";
  return `${hintBlock}Rough dictation to polish:

${rough}`;
}

// ---------- main entry ------------------------------------------------------

/**
 * Revise a rough dictation into a polished version using Claude Opus 4.6,
 * pinned to the user's StyleProfile and the target service's Playbook.
 *
 * Server-side only — requires ANTHROPIC_API_KEY. If the API is unavailable,
 * falls back to a deterministic pipeline that classifies and extracts the
 * input, then applies the StyleProfile without rewriting.
 */
export async function reviseDictation(input: ReviseInput): Promise<ReviseResult> {
  const noteType = input.hints?.noteType ?? classifyNoteType(input.rough);
  const service = input.hints?.service ?? classifyService(input.rough);
  const length: LengthLevel = input.hints?.length ?? "full";
  const context = extractContext(input.rough);
  context.service = service;

  const profile = getStyleProfile();

  try {
    const result = await callClaude({
      system: buildSystemPrompt(noteType, service, length),
      user: buildUserPrompt(input.rough, { noteType, service, length }),
      temperature: 0.2,
      maxTokens: length === "handover" ? 1024 : length === "concise" ? 2048 : 4096,
    });

    // Final local pass: enforce profile-level brevity / banned phrases /
    // header casing in case the model let any slip through.
    const polished = applyStyleProfile(result.text, profile);

    return {
      noteType,
      service,
      length,
      context,
      text: polished,
      missing: missingFields(context),
      warnings: [],
      engine: "claude-opus-4-6",
    };
  } catch (err) {
    if (!(err instanceof LlmUnavailableError)) throw err;
    // Fallback: apply the style profile to the raw input.
    const polished = applyStyleProfile(input.rough, profile);
    return {
      noteType,
      service,
      length,
      context,
      text: polished,
      missing: missingFields(context),
      warnings: [
        `LLM unavailable (${err.message}); returned style-adjusted raw input.`,
      ],
      engine: "deterministic-fallback",
    };
  }
}

function missingFields(ctx: NoteContext): string[] {
  const missing: string[] = [];
  if (!ctx.hpi) missing.push("HPI");
  if (!ctx.exam) missing.push("Examination");
  if (!ctx.assessment) missing.push("Assessment / Impression");
  if (!ctx.plan) missing.push("Plan");
  return missing;
}

// ---------- correction workflow --------------------------------------------

export interface ApplyCorrectionInput {
  draft: string;
  corrected: string;
  noteType: NoteType;
  service: ServiceKey;
}

/**
 * Take the user's corrected version of a draft and persist the learned
 * style deltas into the StyleProfile. Call this whenever the user edits a
 * generated note and saves it. Idempotent — safe to call repeatedly.
 */
export function applyUserCorrection(input: ApplyCorrectionInput): void {
  learnFromCorrection({
    draft: input.draft,
    corrected: input.corrected,
    noteType: input.noteType,
    service: input.service,
  });
}

// Re-exports so consumers can import everything from @/lib/dictation/revise.
export { DICTATION_MODEL };
