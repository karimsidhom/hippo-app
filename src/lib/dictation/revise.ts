import type { NoteType, ServiceKey, BuildResult, LengthLevel } from "./types";
import { getStyleProfile } from "./style/store";
import { applyStyleProfile } from "./style/apply";
import { learnFromCorrection } from "./style/learn";
import { getPlaybook } from "./services/playbooks";
import { callClaude, LlmUnavailableError, DICTATION_MODEL } from "./llm";

// ---------------------------------------------------------------------------
// Revision engine — operative notes only.
//
// Takes a rough operative dictation and returns a polished version.
//
//   1. Build a prompt pinned to the user's StyleProfile (preferred /
//      avoided phrases, brevity) and the target service's Playbook
//      (required fields, red flags, phrasing pearls).
//   2. Call Claude Opus 4.6 at temperature 0.2.
//   3. Run the model output through applyStyleProfile() for a final
//      local pass in case anything slipped through.
//
// Fallback: if ANTHROPIC_API_KEY is missing or the API errors, the raw
// input is returned with just the deterministic style pass applied, and
// engine: "deterministic-fallback" is set so the caller can show a banner.
// ---------------------------------------------------------------------------

export interface ReviseInput {
  rough: string;
  service: ServiceKey;
  length?: LengthLevel;
}

export interface ReviseResult extends BuildResult {
  noteType: NoteType;
  service: ServiceKey;
  length: LengthLevel;
  /** Which engine produced the text: LLM or the deterministic fallback. */
  engine: "claude-opus-4-6" | "deterministic-fallback";
}

function buildSystemPrompt(service: ServiceKey, length: LengthLevel): string {
  const profile = getStyleProfile();
  const playbook = getPlaybook(service);

  const brevity =
    length === "handover"
      ? "Produce a one-screen summary: terse bullets, no narrative, suitable for verbal sign-out."
      : length === "concise"
        ? "Produce a concise operative note — keep essentials only, strip redundancy, no filler."
        : "Produce a full-length formal operative note suitable for the medical record.";

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
    : `Service playbook: none — use general surgical operative note conventions.`;

  return `You are a senior surgical resident polishing a rough operative dictation into a formal operative note.

Hard rules:
- Do NOT invent clinical facts. If a field is missing, leave a bracketed placeholder like [specific finding] or [value].
- Preserve every specific number, name, time, and dose exactly as written in the rough input.
- Write in the voice of a senior resident — concise, specific, organized, practical. No AI filler, no hedging, no "as an AI", no "I hope this helps".
- Use standard medical abbreviations and formal section headers (Preoperative Diagnosis, Postoperative Diagnosis, Procedure, Indications, Description of Procedure, Findings, Specimens, EBL, Complications, Disposition).
- NEVER reproduce copyrighted text or fabricate citations.

${brevity}

${playbookBlock}

${stylePrefs}

Return ONLY the polished operative note text. Do not include commentary, preface, or a trailing explanation.`;
}

function buildUserPrompt(rough: string, service: ServiceKey, length: LengthLevel): string {
  return `Target service: ${service}
Target length: ${length}

Rough operative dictation to polish:

${rough}`;
}

/**
 * Revise a rough operative dictation into a polished version using
 * Claude Opus 4.6, pinned to the user's StyleProfile and the target
 * service's Playbook.
 *
 * Server-side only — requires ANTHROPIC_API_KEY. If the API is unavailable,
 * falls back to applying the StyleProfile to the raw input and returns
 * engine: "deterministic-fallback" so the caller can display a warning.
 */
export async function reviseDictation(input: ReviseInput): Promise<ReviseResult> {
  const length: LengthLevel = input.length ?? "full";
  const service = input.service;
  const profile = getStyleProfile();

  try {
    const result = await callClaude({
      system: buildSystemPrompt(service, length),
      user: buildUserPrompt(input.rough, service, length),
      temperature: 0.2,
      maxTokens: length === "handover" ? 1024 : length === "concise" ? 2048 : 4096,
    });

    // Final local pass: enforce profile-level brevity / banned phrases /
    // header casing in case the model let any slip through.
    const polished = applyStyleProfile(result.text, profile);

    return {
      noteType: "operative",
      service,
      length,
      text: polished,
      missing: [],
      warnings: [],
      engine: "claude-opus-4-6",
    };
  } catch (err) {
    if (!(err instanceof LlmUnavailableError)) throw err;
    // Fallback: apply the style profile to the raw input.
    const polished = applyStyleProfile(input.rough, profile);
    return {
      noteType: "operative",
      service,
      length,
      text: polished,
      missing: [],
      warnings: [
        `LLM unavailable (${err.message}); returned style-adjusted raw input.`,
      ],
      engine: "deterministic-fallback",
    };
  }
}

// ---------- correction workflow --------------------------------------------

export interface ApplyCorrectionInput {
  draft: string;
  corrected: string;
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
    noteType: "operative",
    service: input.service,
  });
}

// Re-export so consumers can import everything from @/lib/dictation/revise.
export { DICTATION_MODEL };
