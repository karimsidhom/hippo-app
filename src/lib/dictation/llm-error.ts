/**
 * LlmUnavailableError lives in its own file (not llm.ts) so that other
 * modules — notably ai-gate.ts — can extend it without creating a circular
 * import between llm.ts and ai-gate.ts. llm.ts re-exports this class.
 *
 * Callers should catch LlmUnavailableError to mean "LLM is unusable for any
 * reason" (network error, missing key, rate limit, AI gate closed). Routines
 * that want to distinguish "gate closed" from "vendor down" can
 * `instanceof AiDisabledError`.
 */

export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}
