import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth } from "@/lib/clinic/access";
import { logClinicAudit } from "@/lib/clinic/audit";

const PatchSchema = z.object({
  status: z.enum([
    "DUE_SOON","OVERDUE","WAITING_RESULTS","NEEDS_CALL","NEEDS_LETTER","NEEDS_BOOKING","COMPLETED","CANCELLED",
  ]).optional(),
  title: z.string().refine((value) => value.length >= 1, { message: "String must contain at least 1 character(s)" }).refine((value) => value.length <= 200, { message: "String must contain at most 200 character(s)" }).optional(),
  detail: z.string().refine((value) => value.length <= 2000, { message: "String must contain at most 2000 character(s)" }).nullable().optional(),
  intervalLabel: z.string().refine((value) => value.length <= 60, { message: "String must contain at most 60 character(s)" }).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  completedNotes: z.string().refine((value) => value.length <= 1000, { message: "String must contain at most 1000 character(s)" }).nullable().optional(),
});

export async function PATCH(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id } = await ctxArg.params;
  const existing = await db.clinicFollowUpTask.findUnique({ where: { id } });
  if (!existing || existing.ownerUserId !== ctx.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;
  const task = await db.clinicFollowUpTask.update({
    where: { id },
    data: {
      ...data,
      dueAt: data.dueAt === null ? null : data.dueAt ? new Date(data.dueAt) : undefined,
      completedAt: data.status === "COMPLETED" ? new Date() : undefined,
    },
  });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.followup.update",
    entityId: id,
    metadata: { status: task.status },
    req,
  });
  return NextResponse.json({ task });
}

export async function DELETE(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id } = await ctxArg.params;
  const existing = await db.clinicFollowUpTask.findUnique({ where: { id } });
  if (!existing || existing.ownerUserId !== ctx.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.clinicFollowUpTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
