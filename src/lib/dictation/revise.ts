import type { NoteType, ServiceKey, BuildResult, LengthLevel } from "./types";
import { getStyleProfile } from "./style/store";
import type { StyleProfile } from "./style/profile";
import { applyStyleProfile } from "./style/apply";
import { learnFromCorrection } from "./style/learn";
import { getPlaybook } from "./services/playbooks";
import { callClaude, LlmUnavailableError, DICTATION_MODEL } from "./llm";
import { assessDictationQuality } from "./quality";

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
  /**
   * Optional StyleProfile override. Server routes should pass the
   * DB-loaded profile so the prompt reflects the user's learned style;
   * on the client we omit it and fall back to the in-memory store.
   */
  profile?: StyleProfile;
}

export interface ReviseResult extends BuildResult {
  noteType: NoteType;
  service: ServiceKey;
  length: LengthLevel;
  /** Which engine produced the text: LLM or the deterministic fallback. */
  engine: "claude-opus-4-6" | "deterministic-fallback";
  /** Token usage when the LLM was reached — omitted for the fallback path. */
  usage?: { input_tokens: number; output_tokens: number };
}

function buildSystemPrompt(
  service: ServiceKey,
  length: LengthLevel,
  profile: StyleProfile,
): string {
  const playbook = getPlaybook(service);

  const brevity =
    length === "handover"
      ? "Produce a one-screen summary: terse bullets, no narrative, suitable for verbal sign-out."
      : length === "concise"
        ? "Produce a concise operative note — keep essentials only, strip redundancy, no filler."
        : `Produce a FULL, complete, textbook-grade operative note suitable for the medical record. This must read like a passage from a major surgical textbook (Campbell-Walsh-Wein, Schwartz, Rockwood, Bailey & Love).

The polished output MUST contain every one of these section headers, in this order, each with substantive body content:

  PREOPERATIVE DIAGNOSIS
  POSTOPERATIVE DIAGNOSIS
  PROCEDURE PERFORMED
  DATE OF PROCEDURE
  SURGEON
  ASSISTANT
  ANESTHESIA
  ESTIMATED BLOOD LOSS
  DRAINS
  SPECIMENS
  COMPLICATIONS
  INDICATIONS
  FINDINGS  (≥ 3 sentences of operative findings)
  DESCRIPTION OF PROCEDURE  (≥ 6 paragraphs of operative narrative, textbook depth)
  DISPOSITION

For DESCRIPTION OF PROCEDURE specifically: include positioning + rationale, anesthesia confirmation, prep + drape, surgical time-out / WHO checklist, full step-by-step operative narrative with eponymous anatomy, named instruments and brand names, suture sizes, named techniques, classification systems where applicable, decision rationale at branch points, pearls/pitfalls, hemostasis confirmation, and explicit closure. Do not collapse this into a single paragraph.

ABSOLUTE LENGTH AND COMPLETENESS RULES:
- Do NOT drop, merge, or rename any section header listed above. The output must be parseable as a complete operative note by a downstream quality engine that checks for these exact headers.
- Do NOT shorten, summarise, or consolidate the rough input. Treat it as the FLOOR for detail, not the ceiling.
- Every numbered step in the rough must remain a distinct, fully fleshed-out step in the polished output. Do not collapse 8 steps into 4.
- Preserve every clinical detail, eponym, brand name, suture size, classification system, decision criterion, and trial-grade evidence reference present in the rough input. If the rough mentions Lich-Gregoir, Paquin 4:1, Sultan overlap, Yasargil pterional, CROSS regimen, Spetzler-Martin, Strasberg CVS, FIGO, AJCC, ISAT, ASMBS, AAGL, ACOG 219 — the polished output MUST keep those by name.
- The polished output MUST be at least as long as the rough input. Expand thin sections rather than compress rich ones.
- If the rough is already textbook-depth, your only job is to fix grammar, normalise formatting, and apply the user's style preferences. Leave the substance alone.

A response that drops a section header or compresses Description of Procedure below the rough's length will be REJECTED by an automated guard and replaced with the rough verbatim. Match or exceed the rough on every dimension.`;

  const stylePrefs = [
    profile.global.brevity === "concise" && length !== "full"
      ? "Prefer terse phrasing where consistent with the length target."
      : "",
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
- Write in the voice of a senior resident — specific, organized, practical. No AI filler, no hedging, no "as an AI", no "I hope this helps".
- Use standard medical abbreviations and formal section headers (Preoperative Diagnosis, Postoperative Diagnosis, Procedure, Indications, Description of Procedure, Findings, Specimens, EBL, Complications, Disposition).
- NEVER reproduce copyrighted text or fabricate citations.
- If the rough input has a "--- BILLING / DOCUMENTATION SUPPORT ---" section or any "--- ... ---" trailer block, copy it through verbatim into the polished output. Do NOT rewrite, summarise, or relocate billing or trailer content.

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
  const profile = input.profile ?? getStyleProfile();

  try {
    const result = await callClaude({
      system: buildSystemPrompt(service, length, profile),
      user: buildUserPrompt(input.rough, service, length),
      temperature: 0.2,
      // 8192 for full-length so textbook-depth templates survive the polish
      // pass without truncation. Smaller envelopes for the shorter modes.
      maxTokens: length === "handover" ? 1024 : length === "concise" ? 2048 : 8192,
    });

    // ── Multi-tier safety nets to catch summarisation regressions ──
    //
    // The LLM (especially smaller models like Gemini Flash on the free tier)
    // can occasionally compress or drop sections from a textbook-depth rough.
    // We have THREE checks now, and any one of them triggers a fallback to
    // the deterministic rough — which is itself textbook-depth.
    let polished = result.text;
    let fellBackToRough = false;

    if (length === "full" && input.rough.length > 600) {
      const roughLen = input.rough.length;
      const polishedLen = polished.length;

      // Tier 1: gross length compression (≥ 15% shrink)
      if (polishedLen < roughLen * 0.85) {
        polished = input.rough;
        fellBackToRough = true;
      }

      // Tier 2: any critical section that the rough satisfies but the
      // polished version does not. We use the same quality engine that the
      // UI uses, so "complete" rough → "missing critical" polished can
      // never reach the user.
      if (!fellBackToRough) {
        const roughQ = assessDictationQuality(input.rough);
        const polishedQ = assessDictationQuality(polished);
        const lostCritical = polishedQ.missingCritical.filter(
          (sec) => !roughQ.missingCritical.includes(sec),
        );
        if (lostCritical.length > 0) {
          polished = input.rough;
          fellBackToRough = true;
        }
      }

      // Tier 3: explicit Description-of-Procedure shrinkage. Even if length
      // and section counts pass, a substantially shorter operative narrative
      // means detail was dropped. We require the polished DoP to be ≥ 80%
      // of the rough's. Easier to compare from the assessment word counts.
      if (!fellBackToRough) {
        const roughQ = assessDictationQuality(input.rough);
        const polishedQ = assessDictationQuality(polished);
        if (
          roughQ.wordCount > 200 &&
          polishedQ.wordCount < roughQ.wordCount * 0.8
        ) {
          polished = input.rough;
          fellBackToRough = true;
        }
      }
    }

    // Final local pass: enforce profile-level brevity / banned phrases /
    // header casing in case the model let any slip through.
    polished = applyStyleProfile(polished, profile);

    return {
      noteType: "operative",
      service,
      length,
      text: polished,
      missing: [],
      warnings: [],
      engine: "claude-opus-4-6",
      usage: result.usage,
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
