import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";
import { logClinicAudit } from "@/lib/clinic/audit";

// Append a transcript segment. Used by:
//   1. The browser-native SpeechRecognition path on the recorder.
//   2. The "typed" / "pasted" entry modes — the entire user-typed body
//      becomes one transcript row with source="manual".
//   3. Manual edits / corrections from the desktop view.
const SegmentSchema = z.object({
  startMs: z.number().int().nonnegative().default(0),
  endMs: z.number().int().nonnegative().default(0),
  text: z.string().min(1).max(20000),
  speaker: z.string().max(40).nullable().optional(),
  isFinal: z.boolean().default(true),
  confidence: z.number().min(0).max(1).optional(),
  source: z.enum(["whisper", "browser-stt", "manual"]).default("manual"),
  provenance: z.enum(["said", "ai-inferred"]).default("said"),
});

export async function POST(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id: encounterId } = await ctxArg.params;
  const { error: aclError } = await loadOwnedEncounter(encounterId, ctx.user.id);
  if (aclError) return aclError;

  const json = await req.json().catch(() => null);
  const parsed = SegmentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }

  const segment = await db.clinicTranscript.create({
    data: {
      encounterId,
      startMs: parsed.data.startMs,
      endMs: parsed.data.endMs,
      text: parsed.data.text.trim(),
      speaker: parsed.data.speaker ?? null,
      isFinal: parsed.data.isFinal,
      confidence: parsed.data.confidence ?? null,
      source: parsed.data.source,
      provenance: parsed.data.provenance,
    },
  });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.transcript.append",
    entityId: encounterId,
    metadata: { source: parsed.data.source, length: parsed.data.text.length },
    req,
  });
  return NextResponse.json({ segment });
}

export async function GET(_req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id: encounterId } = await ctxArg.params;
  const { error: aclError } = await loadOwnedEncounter(encounterId, ctx.user.id);
  if (aclError) return aclError;

  const transcripts = await db.clinicTranscript.findMany({
    where: { encounterId },
    orderBy: { startMs: "asc" },
  });
  return NextResponse.json({ transcripts });
}
