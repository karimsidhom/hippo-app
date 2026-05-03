// Hippo Clinic — speech-to-text.
//
// Two paths:
//   1. Server-side Whisper via OpenAI's /v1/audio/transcriptions endpoint
//      (or any OpenAI-compatible Whisper host — set WHISPER_API_URL).
//      This is what the chunk-upload pipeline uses.
//   2. Browser-native SpeechRecognition. Used by the recorder when the
//      server-side path is not configured, OR when the clinician is offline.
//      Lives client-side; we don't import that here.
//
// We keep this provider-flexible by reading the URL/model from env so a
// self-hosted Whisper deployment (faster-whisper, whisper.cpp server) can
// drop in without code changes.
//
// ─── PREMIUM-TIER TODO ──────────────────────────────────────────────────────
// When Hippo Clinic gets a paid tier, revisit transcription:
//
//   - Free tier today: Groq's whisper-large-v3-turbo (free, but rate-limited
//     to ~7,200 audio-seconds/min per org). When the 429 hits, the recorder
//     falls back to the browser/phone's native SpeechRecognition — no
//     transcripts are lost, but accuracy degrades on noisy clinics.
//   - Paid tier should add: dedicated OpenAI Whisper ($0.006/audio-min) or a
//     self-hosted faster-whisper instance, so high-volume clinicians never
//     get downgraded to browser STT.
//   - Also: speaker diarisation (Deepgram Nova / AssemblyAI) becomes worth
//     the $$ once medico-legal scrutiny goes up — knowing exactly which
//     sentence came from clinician vs. patient sharpens the audit trail.
//
// Search for "PREMIUM-TIER TODO" across this repo to find every spot where
// paid features could improve a free-tier experience.

import { requireAiAllowed } from "@/lib/ai-gate";
import { ClinicLlmError } from "./llm";

const DEFAULT_URL = "https://api.openai.com/v1/audio/transcriptions";

export interface WhisperConfig {
  url: string;
  apiKey: string | null;  // self-hosted may be open
  model: string;
  language?: string;
}

export function whisperConfig(): WhisperConfig | null {
  const url = process.env.WHISPER_API_URL || (process.env.OPENAI_API_KEY ? DEFAULT_URL : null);
  if (!url) return null;
  return {
    url,
    apiKey: process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY || null,
    model: process.env.WHISPER_MODEL || "whisper-1",
    language: process.env.WHISPER_LANGUAGE || undefined,
  };
}

export interface TranscribeInput {
  /** Audio bytes — webm/ogg/mp4/wav supported by Whisper. */
  audio: ArrayBuffer | Blob;
  filename: string;
  mimeType: string;
  language?: string;
  /** Prepended to bias the model toward expected vocabulary (drug names). */
  prompt?: string;
}

export interface TranscribeResult {
  text: string;
  durationSeconds?: number;
  language?: string;
  rawJson: unknown;
  model: string;
}

export async function transcribeAudio(input: TranscribeInput): Promise<TranscribeResult> {
  requireAiAllowed();
  const cfg = whisperConfig();
  if (!cfg) {
    throw new ClinicLlmError(
      "No transcription provider configured. Set WHISPER_API_URL or OPENAI_API_KEY in .env.local, or use browser-native dictation on the recorder.",
      503,
      "WHISPER_NOT_CONFIGURED",
    );
  }

  const blob = input.audio instanceof Blob
    ? input.audio
    : new Blob([input.audio], { type: input.mimeType });

  const form = new FormData();
  form.set("file", new File([blob], input.filename, { type: input.mimeType }));
  form.set("model", cfg.model);
  form.set("response_format", "verbose_json");
  const lang = input.language || cfg.language;
  if (lang) form.set("language", lang);
  if (input.prompt) form.set("prompt", input.prompt);

  const headers: Record<string, string> = {};
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;

  let res: Response;
  try {
    res = await fetch(cfg.url, { method: "POST", headers, body: form });
  } catch (err) {
    throw new ClinicLlmError(
      `Whisper transport error: ${(err as Error).message}`,
      502,
      "WHISPER_TRANSPORT",
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // 429 = rate-limited. Surface a specific code so the caller can treat
    // it as "soft fallback" — keep the audio chunk, don't mark it FAILED,
    // and let the parallel browser-STT path carry the transcript instead.
    // This keeps clinicians on the free tier productive when Groq throttles.
    if (res.status === 429) {
      throw new ClinicLlmError(
        `Whisper rate-limited (429): falling back to browser dictation. Detail: ${text.slice(0, 200)}`,
        429,
        "WHISPER_RATE_LIMITED",
      );
    }
    throw new ClinicLlmError(
      `Whisper returned ${res.status}: ${text.slice(0, 400)}`,
      res.status,
      "WHISPER_HTTP",
    );
  }

  const data = (await res.json()) as {
    text?: string;
    duration?: number;
    language?: string;
  };

  return {
    text: data.text ?? "",
    durationSeconds: typeof data.duration === "number" ? data.duration : undefined,
    language: data.language,
    rawJson: data,
    model: cfg.model,
  };
}
