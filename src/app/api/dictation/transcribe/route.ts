import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

// Gemini 2.5 Flash accepts inline audio and will transcribe it. We lean on
// the "surgical dictation" system prompt to bias toward medical terminology
// (Web Speech mangles words like "cholecystectomy" and "Pringle manoeuvre").
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_PROMPT = `You are a medical transcription assistant specializing in \
surgical dictation. Transcribe the audio you receive as accurately as possible, \
preserving exact medical terminology (anatomy, procedures, drugs, eponymous \
manoeuvres, Canadian spellings). Do not summarize, do not editorialize, do not \
add commentary. Output only the transcribed text, nothing else.`;

const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20 MB — Gemini inline limit is 20MB total

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_AI_API_KEY not configured' },
      { status: 500 },
    );
  }

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

  // Content-Type from the client MediaRecorder (typically audio/webm;codecs=opus
  // on Chrome, audio/mp4 on Safari). Gemini accepts webm, mp4, wav, mp3, flac,
  // ogg, aac.
  const contentType =
    req.headers.get('content-type')?.split(';')[0]?.trim() || 'audio/webm';

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

  let response: Response;
  try {
    response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Network error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '<no body>');
    return NextResponse.json(
      { error: `Gemini returned ${response.status}: ${errText.slice(0, 400)}` },
      { status: 502 },
    );
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim();

  if (!text) {
    return NextResponse.json(
      { error: 'Gemini returned no transcription' },
      { status: 502 },
    );
  }

  return NextResponse.json({ text });
}
