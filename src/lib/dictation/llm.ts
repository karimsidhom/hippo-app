// ---------------------------------------------------------------------------
// LLM abstraction layer — supports Google Gemini (free) and Anthropic Claude.
//
// Server-side only — do not import this from client components.
//
// Priority order:
//   1. GOOGLE_AI_API_KEY  → Gemini 2.5 Flash (free tier, generous limits)
//   2. ANTHROPIC_API_KEY  → Claude Opus (premium, for future Pro tier)
//   3. Neither set        → throws LlmUnavailableError, callers fall back
//                           to deterministic pipelines.
// ---------------------------------------------------------------------------

// ── Gemini config ────────────────────────────────────────────────────────────

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-2.5-flash";

// ── Anthropic config (kept for future Pro tier) ──────────────────────────────

const ANTHROPIC_BASE_URL_DEFAULT = "https://api.anthropic.com";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_MODEL = "claude-opus-4-6";

// ── Public exports ───────────────────────────────────────────────────────────

/** Exported for callers that reference it — now reflects whichever model is active. */
export const DICTATION_MODEL = process.env.GOOGLE_AI_API_KEY
  ? GEMINI_MODEL
  : ANTHROPIC_MODEL;

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
 * Thrown when the LLM call fails or no API key is configured.
 * Callers should catch this and fall back to the deterministic pipeline.
 */
export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}

// ── Gemini implementation ────────────────────────────────────────────────────

async function callGemini(opts: LlmCallOptions): Promise<LlmCallResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY!;
  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: opts.system }],
    },
    contents: [
      { role: "user", parts: [{ text: opts.user }] },
    ],
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxTokens ?? 4096,
      responseMimeType: "application/json",
    },
  };

  console.log(`[llm] callGemini → ${GEMINI_MODEL}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new LlmUnavailableError(
      `Network error calling Gemini: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "<no body>");
    throw new LlmUnavailableError(
      `Gemini returned ${response.status}: ${errText.slice(0, 500)}`,
    );
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  };

  const candidate = json.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new LlmUnavailableError("Empty response from Gemini");
  }

  // Detect truncated responses — Gemini returns MAX_TOKENS when it runs out
  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new LlmUnavailableError(
      "Gemini response was truncated (hit token limit). Try a shorter input.",
    );
  }

  return {
    text,
    model: GEMINI_MODEL,
    usage: json.usageMetadata
      ? {
          input_tokens: json.usageMetadata.promptTokenCount ?? 0,
          output_tokens: json.usageMetadata.candidatesTokenCount ?? 0,
        }
      : undefined,
  };
}

// ── Anthropic implementation ─────────────────────────────────────────────────

async function callAnthropic(opts: LlmCallOptions): Promise<LlmCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const base = (process.env.ANTHROPIC_BASE_URL ?? ANTHROPIC_BASE_URL_DEFAULT)
    .trim()
    .replace(/\/+$/, "");
  const url = `${base}/v1/messages`;

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.2,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  };

  console.log(`[llm] callAnthropic → ${url}`);

  let response: Response;
  try {
    response = await fetch(url, {
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
      `Claude returned ${response.status}: ${errText.slice(0, 500)}`,
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

// ── Public entry point ───────────────────────────────────────────────────────

/**
 * Call the configured LLM with a system + user prompt.
 * Tries Gemini first (free), falls back to Anthropic if configured.
 * Throws LlmUnavailableError if neither key is set or the call fails.
 */
export async function callClaude(opts: LlmCallOptions): Promise<LlmCallResult> {
  if (process.env.GOOGLE_AI_API_KEY) {
    return callGemini(opts);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return callAnthropic(opts);
  }

  throw new LlmUnavailableError(
    "No LLM API key configured. Set GOOGLE_AI_API_KEY (free) or ANTHROPIC_API_KEY.",
  );
}
