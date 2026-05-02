import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth } from "@/lib/clinic/access";
import { logClinicAudit } from "@/lib/clinic/audit";

const NoteTypeEnum = z.enum([
  "NEW_CONSULT","FOLLOW_UP","POST_OP","CANCER_SURVEILLANCE","RESULTS_REVIEW",
  "PROCEDURE_COUNSELLING","MEDICATION_FOLLOW_UP","DISCHARGE_FOLLOW_UP","CUSTOM",
]);
const InputModeEnum = z.enum(["AMBIENT","DICTATION","TYPED","PASTED","UPLOADED"]);
const StatusEnum = z.enum([
  "DRAFT","RECORDING","UPLOADING","TRANSCRIBING","GENERATING","NEEDS_REVIEW","FINALIZED","FAILED",
]);

const CreateSchema = z.object({
  patientId: z.string().optional().nullable(),
  noteType: NoteTypeEnum.default("NEW_CONSULT"),
  inputMode: InputModeEnum.default("AMBIENT"),
  templateKey: z.string().max(120).optional(),
  visitReason: z.string().max(500).optional(),
  scheduledFor: z.string().datetime().optional(),
  retainAudio: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const url = new URL(req.url);
  const rawStatus = url.searchParams.get("status");
  const statusParse = rawStatus ? StatusEnum.safeParse(rawStatus) : null;
  if (statusParse && !statusParse.success) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }
  const status = statusParse?.success ? statusParse.data : undefined;
  const patientId = url.searchParams.get("patientId") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  const encounters = await db.clinicEncounter.findMany({
    where: {
      clinicianId: ctx.user.id,
      ...(status ? { status } : {}),
      ...(patientId ? { patientId } : {}),
    },
    orderBy: { encounterDate: "desc" },
    take: limit,
    include: {
      patient: { select: { id: true, givenName: true, familyName: true, isTemporary: true } },
      audioStatus: true,
    },
  });

  return NextResponse.json({ encounters });
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  // If a patientId was supplied, ensure ownership.
  if (data.patientId) {
    const owns = await db.clinicPatient.findFirst({
      where: { id: data.patientId, ownerUserId: ctx.user.id },
      select: { id: true },
    });
    if (!owns) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const encounter = await db.clinicEncounter.create({
    data: {
      clinicianId: ctx.user.id,
      patientId: data.patientId ?? null,
      noteType: data.noteType,
      inputMode: data.inputMode,
      templateKey: data.templateKey,
      visitReason: data.visitReason,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      retainAudio: data.retainAudio ?? false,
      status: "DRAFT",
      audioStatus: { create: { state: "idle" } },
    },
    include: { audioStatus: true },
  });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.encounter.create",
    entityId: encounter.id,
    after: { id: encounter.id, noteType: encounter.noteType, inputMode: encounter.inputMode },
    req,
  });
  return NextResponse.json({ encounter });
}
