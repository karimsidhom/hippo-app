import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

// ---------------------------------------------------------------------------
// Audio transcription endpoint
//
// Cascade:
//   1. Groq Whisper-large-v3-turbo  — preferred when GROQ_API_KEY is set.
//      Same provider used for chat completions; no training on inputs per
//      Groq commercial terms; transcription cost is effectively free on the
//      developer tier. Faster + cheaper than Gemini.
//   2. Gemini 2.5 Flash inline audio — fallback when only GOOGLE_AI_API_KEY
//      is configured. Kept for backward-compatibility with existing demos.
//
// Input: raw audio body (audio/webm from Chrome MediaRecorder, audio/mp4
// from Safari). Body is the audio bytes themselves; Content-Type header
// signals the format.
//
// Output: { text: "<transcript>" } on success.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a medical transcription assistant specializing in \
surgical dictation. Transcribe the audio you receive as accurately as possible, \
preserving exact medical terminology (anatomy, procedures, drugs, eponymous \
manoeuvres, Canadian spellings). Do not summarize, do not editorialize, do not \
add commentary. Output only the transcribed text, nothing else.`;

// Whisper accepts a "prompt" parameter that biases the vocabulary. Same intent
// as Gemini's system instruction — push the model toward surgical terminology
// when there's ambiguity ("cholecystectomy" vs "Cole-cystectomy", "Pringle
// manoeuvre", "Anderson-Hynes pyeloplasty", etc.).
const WHISPER_PROMPT = `Surgical operative dictation. Preserve medical terminology: \
cholecystectomy, appendectomy, hemicolectomy, ureteroneocystostomy, pyeloplasty, \
Anderson-Hynes, Pringle manoeuvre, Lich-Gregoir, hemostasis, Pfannenstiel, \
laparoscopic, percutaneous, retrograde, Vicryl, Prolene, Monocryl, Sensor \
guidewire, Omnipaque, double-J stent, Mayfield, Yasargil, fluoroscopy.`;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // Groq Whisper limit is 25 MB
const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_MODEL = 'whisper-large-v3-turbo';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.byteLength === 0) {
    return NextResponse.json({ error: 'Empty audio body' }, { status: 400 });
  }
  if (buf.byteLength > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: `Audio exceeds ${MAX_AUDIO_BYTES} bytes` },
      { status: 413 },
    );
  }

  const contentType =
    req.headers.get('content-type')?.split(';')[0]?.trim() || 'audio/webm';

  // ── Cascade: Groq Whisper first ─────────────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      const text = await transcribeWithGroq(buf, contentType);
      return NextResponse.json({ text, model: GROQ_MODEL });
    } catch (err) {
      console.warn(
        `[transcribe] Groq Whisper failed, falling through: ${err instanceof Error ? err.message : err}`,
      );
      // fall through to Gemini
    }
  }

  // ── Fallback: Gemini inline audio ───────────────────────────────────────
  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      const text = await transcribeWithGemini(buf, contentType);
      return NextResponse.json({ text, model: 'gemini-2.5-flash' });
    } catch (err) {
      return NextResponse.json(
        {
          error: `Gemini transcription failed: ${err instanceof Error ? err.message : String(err)}`,
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json(
    {
      error:
        'No transcription provider configured. Set GROQ_API_KEY (preferred — Whisper-large-v3-turbo) or GOOGLE_AI_API_KEY (Gemini fallback).',
    },
    { status: 500 },
  );
}

// ── Groq Whisper-large-v3-turbo ───────────────────────────────────────────

async function transcribeWithGroq(buf: Buffer, contentType: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY!;

  // Pick a sensible filename extension from the Content-Type. Groq's API
  // requires a filename on the multipart form field — it inspects the
  // extension to infer the audio format.
  const ext = contentTypeToExtension(contentType);

  // Build multipart/form-data body manually because we need to attach a Blob
  // with a specific filename + content-type and avoid Buffer-stream gymnastics
  // in the Edge runtime.
  const form = new FormData();
  // Copy Node Buffer into a fresh ArrayBuffer-backed Uint8Array. Direct
  // wrapping triggers TS errors about ArrayBufferLike vs ArrayBuffer in
  // lib.dom (BlobPart expects an ArrayBuffer-backed view, not the broader
  // Buffer subtype). The 1-copy cost on a few-MB audio file is negligible
  // and avoids wrestling with the type system.
  const audioBytes = new Uint8Array(buf.byteLength);
  audioBytes.set(buf);
  form.append('file', new Blob([audioBytes], { type: contentType }), `audio.${ext}`);
  form.append('model', GROQ_MODEL);
  form.append('prompt', WHISPER_PROMPT);
  form.append('response_format', 'json');
  form.append('temperature', '0.0');
  form.append('language', 'en');

  const response = await fetch(GROQ_WHISPER_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '<no body>');
    throw new Error(`Groq Whisper returned ${response.status}: ${errText.slice(0, 400)}`);
  }

  const json = (await response.json()) as { text?: string };
  const text = (json.text ?? '').trim();
  if (!text) {
    throw new Error('Groq Whisper returned empty transcript');
  }
  return text;
}

// ── Gemini 2.5 Flash inline audio (fallback) ─────────────────────────────

async function transcribeWithGemini(buf: Buffer, contentType: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY!;

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: contentType,
              data: buf.toString('base64'),
            },
          },
          { text: 'Transcribe the audio above. Output plain text only.' },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.0,
      maxOutputTokens: 4096,
    },
  };

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '<no body>');
    throw new Error(`Gemini returned ${response.status}: ${errText.slice(0, 400)}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned no transcription');
  }
  return text;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function contentTypeToExtension(ct: string): string {
  if (ct.includes('webm')) return 'webm';
  if (ct.includes('mp4') || ct.includes('m4a')) return 'm4a';
  if (ct.includes('wav')) return 'wav';
  if (ct.includes('mpeg') || ct.includes('mp3')) return 'mp3';
  if (ct.includes('flac')) return 'flac';
  if (ct.includes('ogg')) return 'ogg';
  if (ct.includes('aac')) return 'aac';
  return 'webm';
}
