// ---------------------------------------------------------------------------
// LLM abstraction layer — supports Google Gemini, Groq, and Anthropic Claude.
//
// Server-side only — do not import this from client components.
//
// Priority order (current demo configuration):
//   1. GOOGLE_AI_API_KEY   → Gemini 2.5 Flash. Confirmed working for the
//                            demo. NOTE: the consumer / AI Studio free tier
//                            MAY retain inputs for training — do NOT enter
//                            PHI. For production we must move to Vertex AI
//                            (no-log) or a signed BAA vendor.
//   2. GROQ_API_KEY        → Llama 3.3 70B Versatile on Groq. Free dev tier,
//                            no training on inputs per commercial terms.
//                            Kept as a fallback if Gemini is unavailable.
//   3. ANTHROPIC_API_KEY   → Claude (no training on API inputs per
//                            commercial terms; paid, not free).
//   4. None set            → throws LlmUnavailableError, callers fall back
//                            to deterministic pipelines.
//
// Every prompt is scrubbed server-side (via scrubNotes from @/lib/phia)
// before being sent to any vendor, defense-in-depth against PHI leakage.
// ---------------------------------------------------------------------------

// ── Groq config (fallback — free, no-training) ───────────────────────────────

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ── Gemini config ────────────────────────────────────────────────────────────

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-2.5-flash";

// ── Anthropic config ─────────────────────────────────────────────────────────

const ANTHROPIC_BASE_URL_DEFAULT = "https://api.anthropic.com";
const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_MODEL = "claude-opus-4-6";

// ── Public exports ───────────────────────────────────────────────────────────

/** Exported for callers that reference it — reflects whichever model is active. */
export const DICTATION_MODEL = process.env.GOOGLE_AI_API_KEY
  ? GEMINI_MODEL
  : process.env.GROQ_API_KEY
    ? GROQ_MODEL
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
 * Defined in llm-error.ts to avoid a circular import with ai-gate.ts.
 */
export { LlmUnavailableError } from "./llm-error";
import { LlmUnavailableError } from "./llm-error";

// ── Groq implementation (OpenAI-compatible chat completions) ─────────────────

async function callGroq(opts: LlmCallOptions): Promise<LlmCallResult> {
  const apiKey = process.env.GROQ_API_KEY!;
  const url = `${GROQ_BASE_URL}/chat/completions`;

  const body = {
    model: GROQ_MODEL,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 4096,
    // Groq's JSON mode — when the caller expects JSON output. We enable it
    // globally since virtually every Hippo LLM call wants structured output.
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };

  console.log(`[llm] callGroq → ${GROQ_MODEL}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (err) {
    throw new LlmUnavailableError(
      `Network error calling Groq: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "<no body>");
    throw new LlmUnavailableError(
      `Groq returned ${response.status}: ${errText.slice(0, 500)}`,
    );
  }

  const json = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string | null };
      finish_reason?: string;
    }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
    };
  };

  const choice = json.choices?.[0];
  const text = (choice?.message?.content ?? "").trim();

  if (!text) {
    throw new LlmUnavailableError("Empty response from Groq");
  }

  if (choice?.finish_reason === "length") {
    throw new LlmUnavailableError(
      "Groq response was truncated (hit max_tokens). Try a shorter input.",
    );
  }

  return {
    text,
    model: GROQ_MODEL,
    usage: json.usage
      ? {
          input_tokens: json.usage.prompt_tokens ?? 0,
          output_tokens: json.usage.completion_tokens ?? 0,
        }
      : undefined,
  };
}

// ── Gemini implementation ────────────────────────────────────────────────────

async function callGemini(opts: LlmCallOptions): Promise<LlmCallResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY!;
  // Model cascade: try flash first (fast, cheap), fall back to flash-lite
  // on overload/5xx/rate-limit errors. This is what actually fixed the
  // "sometimes Gemini just doesn't work" reports from beta — the free
  // tier of Gemini returns 429/503 under load and without a fallback the
  // whole call fails. flash-lite is the same API surface, usually
  // available when flash is throttled.
  const modelChain = [GEMINI_MODEL, "gemini-2.5-flash-lite"];

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

  // Cap the individual fetch at 45s. Vercel's maxDuration is 60s on the
  // route, so leaving a 15s buffer means we can fail fast on one model
  // and retry the next without the whole function getting killed.
  const FETCH_TIMEOUT_MS = 45_000;

  let response: Response | null = null;
  let lastErr: string | null = null;

  for (let attempt = 0; attempt < modelChain.length; attempt++) {
    const model = modelChain[attempt];
    const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;
    console.log(`[llm] callGemini → ${model} (attempt ${attempt + 1}/${modelChain.length})`);

    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      console.warn(`[llm] ${model} network/timeout error: ${lastErr}`);
      // Network error or timeout — try the next model.
      response = null;
      continue;
    }

    // 429 (rate limit) and 5xx (server overload) are retryable — try next
    // model. Everything else bubbles up as-is.
    if (response.status === 429 || response.status >= 500) {
      const errText = await response.text().catch(() => "<no body>");
      lastErr = `${model} ${response.status}: ${errText.slice(0, 200)}`;
      console.warn(`[llm] ${lastErr}`);
      response = null;
      continue;
    }

    // Hit a usable response (OK or client error) — stop cascading.
    break;
  }

  if (!response) {
    throw new LlmUnavailableError(
      `All Gemini models unavailable. Last error: ${lastErr ?? "unknown"}`,
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
      // Fail the fetch after 45s so we surface an LlmUnavailableError instead
      // of hitting Vercel's 60s function limit and dropping the user's
      // request with no recovery path.
      signal: AbortSignal.timeout(45_000),
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

import { requireAiAllowed, AiDisabledError } from "@/lib/ai-gate";
import { scrubNotes } from "@/lib/phia";

export { AiDisabledError };

/**
 * Server-side belt-and-suspenders scrub. The client runs scrubNotes before
 * submitting and the composer runs the Gemini-style holistic preflight, but
 * we scrub ONCE MORE here right before the prompt leaves the server. This
 * catches (a) any route that forgot to scrub upstream, (b) any future client
 * bug that skips the client-side scrubber. Zero cost and pure defense.
 *
 * We only scrub the user content (not the system prompt — system prompts
 * are developer-authored and never contain PHI).
 */
function scrubPromptForVendor(opts: LlmCallOptions): LlmCallOptions {
  return {
    ...opts,
    user: scrubNotes(opts.user),
  };
}

/**
 * Call the configured LLM with a system + user prompt.
 *
 * TRUE provider cascade — not a single if/else. We try Gemini first
 * (cheap, fast), fall through to Groq (free, no-training ToS) on any
 * Gemini failure, then to Anthropic as final backstop. Each provider
 * call is wrapped in try/catch so a rate-limit or 5xx on one vendor
 * falls cleanly to the next instead of bubbling up to the user.
 *
 * This is the fix for "sometimes Gemini doesn't work" — we no longer
 * leave the user staring at a failure when any one provider is down.
 *
 * Every prompt is scrubbed through scrubNotes() before being sent to the
 * vendor, even though upstream callers should also be scrubbing. This is
 * defense in depth — if one route ever forgets, the LLM still never sees
 * obvious PHI patterns.
 *
 * The AI gate (`AI_BAA_SIGNED` env) is consulted first. When using Groq,
 * set AI_BAA_SIGNED=true — Groq's commercial terms already provide the
 * no-training guarantee the gate is meant to enforce. Do NOT set it to
 * true while using the consumer Gemini free tier.
 *
 * Throws LlmUnavailableError only when every configured provider fails.
 * Throws AiDisabledError if AI_BAA_SIGNED is not "true".
 */
export async function callClaude(opts: LlmCallOptions): Promise<LlmCallResult> {
  requireAiAllowed();

  const safeOpts = scrubPromptForVendor(opts);

  // Build the cascade in priority order. We only include providers whose
  // API keys are actually configured, so a missing key doesn't look like
  // a failure in the logs.
  const cascade: Array<{
    name: "gemini" | "groq" | "anthropic";
    call: (o: LlmCallOptions) => Promise<LlmCallResult>;
    enabled: boolean;
  }> = [
    {
      name: "gemini",
      call: callGemini,
      enabled: !!process.env.GOOGLE_AI_API_KEY,
    },
    {
      name: "groq",
      call: callGroq,
      enabled: !!process.env.GROQ_API_KEY,
    },
    {
      name: "anthropic",
      call: callAnthropic,
      enabled: !!process.env.ANTHROPIC_API_KEY,
    },
  ];

  const enabled = cascade.filter((p) => p.enabled);
  if (enabled.length === 0) {
    throw new LlmUnavailableError(
      "No LLM API key configured. Set GOOGLE_AI_API_KEY, GROQ_API_KEY, or ANTHROPIC_API_KEY.",
    );
  }

  const errors: string[] = [];

  for (const provider of enabled) {
    try {
      const result = await provider.call(safeOpts);
      if (errors.length > 0) {
        // Structured telemetry — log the fact that we fell back from a
        // failing primary to a working backup. Invaluable when tracking
        // "Gemini died but the user saw a response" events in prod.
        console.warn(
          `[llm] Cascade recovered via ${provider.name} after ${errors.length} failure(s): ${errors.join(" | ")}`,
        );
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.name}: ${msg.slice(0, 160)}`);
      console.warn(`[llm] Cascade ${provider.name} failed — trying next. ${msg}`);
      // Keep cascading. We only give up once every enabled provider has
      // been exhausted.
    }
  }

  throw new LlmUnavailableError(
    `All ${enabled.length} LLM provider(s) failed. Errors: ${errors.join(" | ")}`,
  );
}
