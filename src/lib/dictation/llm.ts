// ---------------------------------------------------------------------------
// Minimal Anthropic Messages API client for the revision engine.
//
// Server-side only — do not import this from client components. Reads the
// API key from ANTHROPIC_API_KEY. Designed to be a thin wrapper; if we later
// switch to the @anthropic-ai/sdk package, the function signature stays the
// same so callers don't need to change.
// ---------------------------------------------------------------------------

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";

/**
 * The model ID we target for dictation revision. Claude Opus 4.6 is the
 * strongest model in the family — worth the latency/cost for clinical text.
 */
export const DICTATION_MODEL = "claude-opus-4-6";

export interface LlmCallOptions {
  system: string;
  user: string;
  /** Max output tokens. Clinical notes are long — default to 4096. */
  maxTokens?: number;
  /** Temperature. Default to 0.2 for stable, non-creative rewrites. */
  temperature?: number;
}

export interface LlmCallResult {
  text: string;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
}

/**
 * Thrown when the LLM call fails or the API key is missing. Callers should
 * catch this and fall back to the deterministic pipeline.
 */
export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}

/**
 * Call Claude Opus 4.6 with a system + user prompt and return the text
 * response. Throws LlmUnavailableError if the API key is missing or the call
 * fails — callers are expected to handle the fallback.
 */
export async function callClaude(opts: LlmCallOptions): Promise<LlmCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new LlmUnavailableError("ANTHROPIC_API_KEY not set");
  }

  const body = {
    model: DICTATION_MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.2,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  };

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new LlmUnavailableError(
      `Network error calling Claude: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "<no body>");
    throw new LlmUnavailableError(
      `Anthropic API returned ${response.status}: ${errText.slice(0, 500)}`,
    );
  }

  const json = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
    model: string;
    usage?: { input_tokens: number; output_tokens: number };
  };

  const text = (json.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new LlmUnavailableError("Empty response from Claude");
  }

  return { text, model: json.model, usage: json.usage };
}
