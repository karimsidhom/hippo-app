/**
 * AI feature gate.
 *
 * Concept: no prompt should leave the server until we've verified the
 * downstream vendor has committed to NOT training on / retaining inputs.
 *
 * Qualifying vendors (as of writing):
 *   - Groq (commercial ToS — inputs/outputs not used for training). FREE.
 *   - Anthropic API (commercial ToS — no training on API inputs). Paid.
 *   - OpenAI API with zero-retention addendum (ZDR). Paid.
 *   - Vertex AI Gemini with no-log configuration. Paid.
 *
 * NOT qualifying:
 *   - Google AI Studio / consumer Gemini free tier (may retain for training).
 *   - Claude.ai web UI (not the API).
 *   - Any vendor you haven't read the ToS for.
 *
 * The gate opens when AI_BAA_SIGNED=true (or AI_VENDOR_APPROVED=true, the
 * renamed semantically-correct alias). You MUST ONLY set this when the
 * currently-configured provider is one of the qualifying vendors above.
 *
 * Additional belt-and-suspenders: every prompt is also passed through
 * scrubNotes() in llm.ts before the vendor sees it, so even if a user
 * typed PHI and upstream scrubbing missed it, the regex catches obvious
 * identifiers server-side at the last moment.
 */

// Extends LlmUnavailableError (imported at runtime to avoid circular imports)
// so existing graceful-fallback logic in brief/debrief/voice-log treats the
// "AI disabled" case the same as "vendor down" — the app keeps working.
// Routes that want to surface the distinction (e.g. PHI preflight in the
// composer) do an `instanceof AiDisabledError` check.
import { LlmUnavailableError } from "./dictation/llm-error";

export class AiDisabledError extends LlmUnavailableError {
  code = "AI_DISABLED" as const;
  constructor(reason: string) {
    super(reason);
    this.name = "AiDisabledError";
  }
}

export function isAiAllowed(): boolean {
  // Accept either the original env name or the semantically clearer alias.
  return (
    process.env.AI_BAA_SIGNED === "true" ||
    process.env.AI_VENDOR_APPROVED === "true"
  );
}

/**
 * Call at the top of every route that sends user text to an external LLM.
 * Throws AiDisabledError when the gate is closed; the handler should catch
 * and return HTTP 503 with a clear message.
 */
export function requireAiAllowed(): void {
  if (!isAiAllowed()) {
    throw new AiDisabledError(
      "AI features are temporarily disabled pending a signed zero-retention agreement with our AI provider. This protects your patients' privacy under PHIA.",
    );
  }
}
