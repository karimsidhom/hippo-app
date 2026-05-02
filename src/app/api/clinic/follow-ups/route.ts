import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth } from "@/lib/clinic/access";

const CreateSchema = z.object({
  encounterId: z.string(),
  kind: z.string().max(40),
  title: z.string().min(1).max(200),
  detail: z.string().max(2000).optional(),
  intervalLabel: z.string().max(60).optional(),
  dueAt: z.string().datetime().optional(),
});

const StatusEnum = z.enum([
  "DUE_SOON","OVERDUE","WAITING_RESULTS","NEEDS_CALL","NEEDS_LETTER","NEEDS_BOOKING","COMPLETED","CANCELLED",
]);

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

  const followUps = await db.clinicFollowUpTask.findMany({
    where: {
      ownerUserId: ctx.user.id,
      ...(status ? { status } : {}),
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 250,
    include: {
      encounter: {
        select: {
          id: true,
          encounterDate: true,
          patient: { select: { id: true, givenName: true, familyName: true } },
        },
      },
    },
  });
  return NextResponse.json({ followUps });
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }
  // Verify encounter ownership.
  const enc = await db.clinicEncounter.findFirst({
    where: { id: parsed.data.encounterId, clinicianId: ctx.user.id },
    select: { id: true, patientId: true },
  });
  if (!enc) return NextResponse.json({ error: "Encounter not found" }, { status: 404 });

  const task = await db.clinicFollowUpTask.create({
    data: {
      encounterId: enc.id,
      ownerUserId: ctx.user.id,
      patientId: enc.patientId,
      kind: parsed.data.kind,
      title: parsed.data.title,
      detail: parsed.data.detail,
      intervalLabel: parsed.data.intervalLabel,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      status: "DUE_SOON",
    },
  });
  return NextResponse.json({ task });
}
