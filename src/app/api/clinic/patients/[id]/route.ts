import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth } from "@/lib/clinic/access";
import { logClinicAudit } from "@/lib/clinic/audit";

const PatchSchema = z.object({
  givenName: z.string().min(1).max(120).optional(),
  familyName: z.string().min(1).max(120).optional(),
  preferredName: z.string().max(120).optional(),
  pronouns: z.string().max(40).optional(),
  dateOfBirth: z.string().datetime().nullable().optional(),
  sex: z.string().max(20).optional(),
  contactPhone: z.string().max(40).optional(),
  contactEmail: z.string().email().max(200).nullable().optional(),
  externalId: z.string().max(200).nullable().optional(),
  institutionLabel: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  isTemporary: z.boolean().optional(),
});

export async function GET(_req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id } = await ctxArg.params;

  const patient = await db.clinicPatient.findUnique({
    where: { id },
    include: {
      encounters: {
        orderBy: { encounterDate: "desc" },
        take: 50,
        select: {
          id: true,
          encounterDate: true,
          noteType: true,
          status: true,
          visitReason: true,
          templateKey: true,
          finalizedAt: true,
        },
      },
    },
  });
  if (!patient || patient.ownerUserId !== ctx.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ patient });
}

export async function PATCH(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id } = await ctxArg.params;

  const existing = await db.clinicPatient.findUnique({ where: { id } });
  if (!existing || existing.ownerUserId !== ctx.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const patient = await db.clinicPatient.update({
    where: { id },
    data: {
      ...data,
      dateOfBirth:
        data.dateOfBirth === null
          ? null
          : data.dateOfBirth
          ? new Date(data.dateOfBirth)
          : undefined,
    },
  });
  // Don't dump full PHI rows into the audit log — names, DOB, phone,
  // email, free-text notes are all sensitive. Record only the metadata
  // needed to reconstruct WHEN and WHO; the full diff is not needed for
  // the audit posture, and PII in audit storage is a leakage path.
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.patient.update",
    entityId: id,
    before: { id: existing.id, updatedAt: existing.updatedAt, isTemporary: existing.isTemporary },
    after: { id: patient.id, updatedAt: patient.updatedAt, isTemporary: patient.isTemporary },
    req,
  });
  return NextResponse.json({ patient });
}

export async function DELETE(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id } = await ctxArg.params;

  const existing = await db.clinicPatient.findUnique({ where: { id } });
  if (!existing || existing.ownerUserId !== ctx.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.clinicPatient.delete({ where: { id } });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.patient.delete",
    entityId: id,
    // Same as above — don't store the patient's PHI in the audit row.
    before: { id: existing.id, isTemporary: existing.isTemporary },
    req,
  });
  return NextResponse.json({ ok: true });
}
