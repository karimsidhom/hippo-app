// Hippo Clinic — LLM client.
//
// Thin wrapper that:
//   - Enforces the AI vendor gate (lib/ai-gate.ts).
//   - Routes chat to Groq's OpenAI-compatible endpoint by default — same
//     vendor the rest of Hippo's AI features use.
//   - Falls back to OpenAI if OPENAI_API_KEY is set and Groq isn't.
//   - Returns a strict-JSON parsed object or throws.
//
// Whisper transcription lives in `whisper.ts` next door.

import { requireAiAllowed } from "@/lib/ai-gate";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export interface ChatProvider {
  name: string;
  url: string;
  model: string;
  apiKey: string;
}

export function pickProvider(): ChatProvider {
  const groq = process.env.GROQ_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;

  if (groq) {
    return {
      name: "groq",
      url: GROQ_URL,
      model: process.env.GROQ_CLINIC_MODEL || "llama-3.3-70b-versatile",
      apiKey: groq,
    };
  }
  if (openai) {
    return {
      name: "openai",
      url: OPENAI_URL,
      model: process.env.OPENAI_CLINIC_MODEL || "gpt-4o-mini",
      apiKey: openai,
    };
  }
  if (anthropic) {
    // Anthropic uses a different shape — surface a clean error rather than
    // pretending it works. The clinic module sticks to the OpenAI-compatible
    // contract for now.
    throw new ClinicLlmError(
      "Anthropic API is configured but the clinic module currently uses the OpenAI-compatible chat schema. Set GROQ_API_KEY or OPENAI_API_KEY.",
      503,
    );
  }
  throw new ClinicLlmError(
    "No LLM provider configured. Set GROQ_API_KEY (recommended) or OPENAI_API_KEY in .env.local.",
    503,
  );
}

export class ClinicLlmError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 502, code = "LLM_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface ChatJsonOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  /** Override provider model. */
  model?: string;
  /** Hard wall-clock timeout in ms. Default 45s. */
  timeoutMs?: number;
}

export interface ChatJsonResult<T> {
  json: T;
  rawText: string;
  model: string;
  provider: string;
  durationMs: number;
}

/**
 * One-shot chat completion that returns parsed JSON. Throws ClinicLlmError
 * on transport, parse, or schema failures — caller decides how to surface.
 */
export async function chatJson<T = unknown>(opts: ChatJsonOptions): Promise<ChatJsonResult<T>> {
  requireAiAllowed();
  const provider = pickProvider();
  const model = opts.model ?? provider.model;

  const body = {
    model,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 2400,
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };

  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 45_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  let res: Response;
  try {
    res = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const isAbort = err instanceof Error && err.name === "AbortError";
    throw new ClinicLlmError(
      isAbort ? `LLM call timed out after ${timeoutMs}ms` : `LLM transport error: ${(err as Error).message}`,
      isAbort ? 504 : 502,
      isAbort ? "LLM_TIMEOUT" : "LLM_TRANSPORT",
    );
  }
  clearTimeout(timer);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ClinicLlmError(
      `${provider.name} returned ${res.status}: ${text.slice(0, 400)}`,
      res.status,
      "LLM_HTTP",
    );
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawText = payload.choices?.[0]?.message?.content ?? "";
  if (!rawText) {
    throw new ClinicLlmError("LLM returned an empty response", 502, "LLM_EMPTY");
  }

  let json: T;
  try {
    json = JSON.parse(rawText) as T;
  } catch {
    // Some providers occasionally wrap JSON in fences despite response_format.
    // Strip the most common variants and retry once.
    const fenced = rawText.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
    try {
      json = JSON.parse(fenced) as T;
    } catch {
      throw new ClinicLlmError(
        "LLM returned non-JSON output: " + rawText.slice(0, 200),
        502,
        "LLM_BAD_JSON",
      );
    }
  }

  return {
    json,
    rawText,
    model,
    provider: provider.name,
    durationMs: Date.now() - startedAt,
  };
}
