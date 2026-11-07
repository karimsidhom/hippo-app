import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth } from "@/lib/clinic/access";
import { logClinicAudit } from "@/lib/clinic/audit";

const CreatePatientSchema = z.object({
  givenName: z.string().refine((value) => value.length >= 1, { message: "String must contain at least 1 character(s)" }).refine((value) => value.length <= 120, { message: "String must contain at most 120 character(s)" }),
  familyName: z.string().refine((value) => value.length >= 1, { message: "String must contain at least 1 character(s)" }).refine((value) => value.length <= 120, { message: "String must contain at most 120 character(s)" }),
  preferredName: z.string().refine((value) => value.length <= 120, { message: "String must contain at most 120 character(s)" }).optional(),
  pronouns: z.string().refine((value) => value.length <= 40, { message: "String must contain at most 40 character(s)" }).optional(),
  dateOfBirth: z.string().datetime().optional(),
  sex: z.string().refine((value) => value.length <= 20, { message: "String must contain at most 20 character(s)" }).optional(),
  contactPhone: z.string().refine((value) => value.length <= 40, { message: "String must contain at most 40 character(s)" }).optional(),
  contactEmail: z.string().email().refine((value) => value.length <= 200, { message: "String must contain at most 200 character(s)" }).optional(),
  externalId: z.string().refine((value) => value.length <= 200, { message: "String must contain at most 200 character(s)" }).optional(),
  institutionLabel: z.string().refine((value) => value.length <= 200, { message: "String must contain at most 200 character(s)" }).optional(),
  notes: z.string().refine((value) => value.length <= 2000, { message: "String must contain at most 2000 character(s)" }).optional(),
  isTemporary: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 25), 100);

  const patients = await db.clinicPatient.findMany({
    where: {
      ownerUserId: ctx.user.id,
      ...(q
        ? {
            OR: [
              { familyName: { contains: q, mode: "insensitive" } },
              { givenName: { contains: q, mode: "insensitive" } },
              { preferredName: { contains: q, mode: "insensitive" } },
              { externalId: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ familyName: "asc" }, { givenName: "asc" }],
    take: limit,
  });

  return NextResponse.json({ patients });
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;

  const json = await req.json().catch(() => null);
  const parsed = CreatePatientSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const patient = await db.clinicPatient.create({
    data: {
      ownerUserId: ctx.user.id,
      givenName: data.givenName,
      familyName: data.familyName,
      preferredName: data.preferredName,
      pronouns: data.pronouns,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      sex: data.sex,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      externalId: data.externalId,
      institutionLabel: data.institutionLabel,
      notes: data.notes,
      isTemporary: data.isTemporary ?? false,
    },
  });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.patient.create",
    entityId: patient.id,
    after: { id: patient.id, isTemporary: patient.isTemporary },
    req,
  });
  return NextResponse.json({ patient });
}
