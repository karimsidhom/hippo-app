import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";
import { logClinicAudit } from "@/lib/clinic/audit";

const PatchSchema = z.object({
  patientId: z.string().nullable().optional(),
  noteType: z.enum([
    "NEW_CONSULT","FOLLOW_UP","POST_OP","CANCER_SURVEILLANCE","RESULTS_REVIEW",
    "PROCEDURE_COUNSELLING","MEDICATION_FOLLOW_UP","DISCHARGE_FOLLOW_UP","CUSTOM",
  ]).optional(),
  inputMode: z.enum(["AMBIENT","DICTATION","TYPED","PASTED","UPLOADED"]).optional(),
  templateKey: z.string().max(120).nullable().optional(),
  visitReason: z.string().max(1000).nullable().optional(),
  // FINALIZED is intentionally excluded — the only path that may set
  // FINALIZED is the dedicated /finalize endpoint, which enforces the
  // signature, version snapshot, and audit log. Allowing it here would
  // be a soft bypass of those guarantees.
  status: z.enum([
    "DRAFT","RECORDING","UPLOADING","TRANSCRIBING","GENERATING","NEEDS_REVIEW","FAILED",
  ]).optional(),
  recordingStartedAt: z.string().datetime().nullable().optional(),
  recordingStoppedAt: z.string().datetime().nullable().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  retainAudio: z.boolean().optional(),
  failureReason: z.string().max(1000).nullable().optional(),
  signatureText: z.string().max(500).nullable().optional(),
  signedBy: z.string().max(200).nullable().optional(),
});

export async function GET(_req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id } = await ctxArg.params;
  const { encounter, error: aclError } = await loadOwnedEncounter(id, ctx.user.id);
  if (aclError) return aclError;

  const [patient, transcripts, markers, note, followUps, audioStatus, chunks] = await Promise.all([
    encounter.patientId
      ? db.clinicPatient.findUnique({ where: { id: encounter.patientId } })
      : Promise.resolve(null),
    db.clinicTranscript.findMany({
      where: { encounterId: id },
      orderBy: { startMs: "asc" },
    }),
    db.clinicEncounterMarker.findMany({
      where: { encounterId: id },
      orderBy: { atMs: "asc" },
    }),
    db.clinicNote.findFirst({
      where: { encounterId: id },
      orderBy: { updatedAt: "desc" },
    }),
    db.clinicFollowUpTask.findMany({
      where: { encounterId: id },
      orderBy: { dueAt: "asc" },
    }),
    db.clinicAudioStatus.findUnique({ where: { encounterId: id } }),
    db.clinicRecordingChunk.findMany({
      where: { encounterId: id },
      orderBy: { chunkIndex: "asc" },
      select: { id: true, chunkIndex: true, status: true, durationMs: true, startMs: true, sizeBytes: true },
    }),
  ]);

  return NextResponse.json({
    encounter,
    patient,
    transcripts,
    markers,
    note,
    followUps,
    audioStatus,
    chunks,
  });
}

export async function PATCH(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id } = await ctxArg.params;
  const { encounter, error: aclError } = await loadOwnedEncounter(id, ctx.user.id);
  if (aclError) return aclError;

  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  // If we're setting a patientId, check ownership.
  if (data.patientId) {
    const owns = await db.clinicPatient.findFirst({
      where: { id: data.patientId, ownerUserId: ctx.user.id },
      select: { id: true },
    });
    if (!owns) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const updated = await db.clinicEncounter.update({
    where: { id },
    data: {
      ...data,
      recordingStartedAt:
        data.recordingStartedAt === null
          ? null
          : data.recordingStartedAt
          ? new Date(data.recordingStartedAt)
          : undefined,
      recordingStoppedAt:
        data.recordingStoppedAt === null
          ? null
          : data.recordingStoppedAt
          ? new Date(data.recordingStoppedAt)
          : undefined,
    },
  });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.encounter.update",
    entityId: id,
    before: { status: encounter.status },
    after: { status: updated.status },
    req,
  });
  return NextResponse.json({ encounter: updated });
}

export async function DELETE(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id } = await ctxArg.params;
  const { encounter, error: aclError } = await loadOwnedEncounter(id, ctx.user.id);
  if (aclError) return aclError;

  // Finalized notes cannot be hard-deleted from the API — refer the user
  // to their admin/audit flow. Drafts are fine to remove.
  if (encounter.status === "FINALIZED") {
    return NextResponse.json(
      { error: "Finalized notes cannot be deleted via this endpoint." },
      { status: 409 },
    );
  }
  await db.clinicEncounter.delete({ where: { id } });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.encounter.delete",
    entityId: id,
    before: { status: encounter.status },
    req,
  });
  return NextResponse.json({ ok: true });
}
