import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";
import { logClinicAudit, logClinicAi } from "@/lib/clinic/audit";
import { transcribeAudio, whisperConfig } from "@/lib/clinic/whisper";
import { createServiceRoleClient } from "@/lib/supabase-server";

// POST a single recording chunk. Body is multipart/form-data with:
//   - file: the audio blob (webm/ogg/mp4/wav)
//   - chunkIndex (number)
//   - startMs (number)
//   - durationMs (number)
//   - mimeType (string, optional — defaults to file.type)
//
// Behaviour:
//   1. Persist a clinic_recording_chunks row (status PENDING).
//   2. Try to upload to Supabase Storage `clinic-audio` bucket. If storage
//      isn't configured we still keep the chunk row so transcription can be
//      retried later.
//   3. Transcribe via Whisper if configured. Append a clinic_transcripts
//      row. If Whisper isn't configured, we skip transcription — the
//      recorder may already be providing browser-native STT segments via
//      the /transcript endpoint.
//   4. Bump clinic_audio_status counters.
//
// We keep the chunk + audio bytes preserved even if transcription fails so
// the clinician can retry or fall back to the raw transcript.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Match the Storage bucket's allowed_mime_types. Keep these in sync.
const ALLOWED_AUDIO_MIME = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-m4a",
]);
function normaliseMime(raw: string): string | null {
  const trimmed = raw.split(";")[0].trim().toLowerCase();
  // Only return the canonical short form when the original (with codec
  // params) is in our allowlist. Otherwise reject — never echo arbitrary
  // client-provided MIME strings.
  if (ALLOWED_AUDIO_MIME.has(raw.toLowerCase())) return raw.toLowerCase();
  if (ALLOWED_AUDIO_MIME.has(trimmed)) return trimmed;
  return null;
}

export async function POST(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id: encounterId } = await ctxArg.params;
  const { encounter, error: aclError } = await loadOwnedEncounter(encounterId, ctx.user.id);
  if (aclError) return aclError;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const chunkIndex = Number(form.get("chunkIndex") ?? "0");
  const startMs    = Number(form.get("startMs") ?? "0");
  const durationMs = Number(form.get("durationMs") ?? "0");
  const rawMime    = String(form.get("mimeType") ?? file.type ?? "audio/webm");

  if (!Number.isFinite(chunkIndex) || chunkIndex < 0) {
    return NextResponse.json({ error: "Invalid chunkIndex" }, { status: 400 });
  }
  // Allowlist: never store an unverified MIME string in the DB or use it
  // as the Storage Content-Type. The bucket policy enforces the same
  // list — this check makes the rejection surface a 400 instead of a
  // 500 from the bucket later.
  const mimeType = normaliseMime(rawMime);
  if (!mimeType) {
    return NextResponse.json(
      { error: `Unsupported audio MIME type: ${rawMime.slice(0, 80)}` },
      { status: 415 },
    );
  }

  // Idempotent upsert by (encounterId, chunkIndex). Prevents duplicate rows
  // when the recorder retries the same chunk after a flaky upload.
  const buffer = Buffer.from(await file.arrayBuffer());
  const sizeBytes = buffer.byteLength;

  const chunk = await db.clinicRecordingChunk.upsert({
    where: { encounterId_chunkIndex: { encounterId, chunkIndex } },
    update: { startMs, durationMs, sizeBytes, mimeType, status: "PENDING" },
    create: {
      encounterId,
      chunkIndex,
      startMs,
      durationMs,
      sizeBytes,
      mimeType,
      status: "PENDING",
    },
  });

  // Try Supabase Storage upload. Best-effort — failure is logged but does
  // not abort the request; transcription and the encounter timeline keep
  // working off the in-memory blob.
  let storagePath: string | null = null;
  try {
    const supa = createServiceRoleClient();
    const path = `${ctx.user.id}/${encounterId}/chunk-${String(chunkIndex).padStart(5, "0")}.${extFromMime(mimeType)}`;
    const { error: storageErr } = await supa.storage
      .from("clinic-audio")
      .upload(path, buffer, { upsert: true, contentType: mimeType });
    if (storageErr) {
      console.warn("[clinic.chunk] storage upload failed:", storageErr.message);
    } else {
      storagePath = path;
    }
  } catch (err) {
    console.warn("[clinic.chunk] storage transport error:", (err as Error).message);
  }

  // Mark uploaded.
  await db.clinicRecordingChunk.update({
    where: { id: chunk.id },
    data: { status: "UPLOADED", uploadedAt: new Date(), storagePath: storagePath ?? undefined },
  });

  // Bump audio status counters.
  await db.clinicAudioStatus.upsert({
    where: { encounterId },
    update: {
      state: encounter.recordingStoppedAt ? "transcribing" : "recording",
      chunksUploaded: { increment: 1 },
      chunksTotal: { increment: 1 },
      lastUpdate: new Date(),
    },
    create: {
      encounterId,
      state: "uploading",
      chunksUploaded: 1,
      chunksTotal: 1,
    },
  });

  // Transcribe if Whisper is configured. If not, we just keep the chunk —
  // the recorder client may be sending browser-STT segments separately.
  let transcribedText: string | null = null;
  let transcriptError: string | null = null;
  const whisper = whisperConfig();
  if (whisper) {
    const startedAt = Date.now();
    try {
      const result = await transcribeAudio({
        audio: new Blob([buffer], { type: mimeType }),
        filename: `chunk-${chunkIndex}.${extFromMime(mimeType)}`,
        mimeType,
      });
      transcribedText = result.text.trim();
      if (transcribedText) {
        await db.clinicTranscript.create({
          data: {
            encounterId,
            chunkId: chunk.id,
            startMs,
            endMs: startMs + durationMs,
            text: transcribedText,
            isFinal: true,
            source: "whisper",
            provenance: "said",
          },
        });
      }
      await db.clinicRecordingChunk.update({
        where: { id: chunk.id },
        data: { status: "TRANSCRIBED", transcribedAt: new Date() },
      });
      await db.clinicAudioStatus.update({
        where: { encounterId },
        data: { chunksTranscribed: { increment: 1 }, lastUpdate: new Date() },
      });
      void logClinicAi({
        encounterId,
        ownerUserId: ctx.user.id,
        action: "transcribe",
        model: result.model,
        inputCharCount: 0,
        outputCharCount: transcribedText.length,
        durationMs: Date.now() - startedAt,
        ok: true,
      });
    } catch (err) {
      transcriptError = (err as Error).message;
      // Distinguish soft fallback (rate-limited free tier) from a hard
      // failure. On 429, we keep the chunk as UPLOADED — the audio is fine,
      // and the recorder is already feeding parallel browser-STT segments
      // into clinic_transcripts. We surface a quality warning so the UI
      // can tell the clinician "server transcription paused — using
      // device dictation". This keeps free-tier sessions productive.
      // PREMIUM-TIER TODO: a paid tier should bypass Groq's free-tier
      // 429 by routing to a dedicated Whisper instance.
      const code = (err as { code?: string }).code;
      const isRateLimit = code === "WHISPER_RATE_LIMITED" || /429/.test(transcriptError);
      if (isRateLimit) {
        await db.clinicRecordingChunk.update({
          where: { id: chunk.id },
          data: { status: "UPLOADED" }, // audio is preserved for retry
        });
        await db.clinicAudioStatus.update({
          where: { encounterId },
          data: {
            qualityWarning: "Server transcription rate-limited — using device dictation",
            lastUpdate: new Date(),
          },
        });
      } else {
        await db.clinicRecordingChunk.update({
          where: { id: chunk.id },
          data: { status: "FAILED" },
        });
      }
      void logClinicAi({
        encounterId,
        ownerUserId: ctx.user.id,
        action: "transcribe",
        ok: false,
        errorMessage: transcriptError,
        durationMs: Date.now() - startedAt,
      });
    }
  }

  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.audio.upload",
    entityId: encounterId,
    metadata: { chunkIndex, sizeBytes, mimeType, transcribed: Boolean(transcribedText) },
    req,
  });

  return NextResponse.json({
    chunk: { id: chunk.id, chunkIndex, status: transcribedText ? "TRANSCRIBED" : "UPLOADED" },
    transcribedText,
    transcriptError,
    whisperConfigured: Boolean(whisper),
  });
}

function extFromMime(mt: string): string {
  if (mt.includes("webm")) return "webm";
  if (mt.includes("ogg")) return "ogg";
  if (mt.includes("mp4")) return "m4a";
  if (mt.includes("mpeg")) return "mp3";
  if (mt.includes("wav")) return "wav";
  return "bin";
}
