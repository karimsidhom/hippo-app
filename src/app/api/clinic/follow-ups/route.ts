import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth } from "@/lib/clinic/access";

const CreateSchema = z.object({
  encounterId: z.string(),
  kind: z.string().refine((value) => value.length <= 40, { message: "String must contain at most 40 character(s)" }),
  title: z.string().refine((value) => value.length >= 1, { message: "String must contain at least 1 character(s)" }).refine((value) => value.length <= 200, { message: "String must contain at most 200 character(s)" }),
  detail: z.string().refine((value) => value.length <= 2000, { message: "String must contain at most 2000 character(s)" }).optional(),
  intervalLabel: z.string().refine((value) => value.length <= 60, { message: "String must contain at most 60 character(s)" }).optional(),
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
