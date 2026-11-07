import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth } from "@/lib/clinic/access";

// GET   /api/clinic/billing?province=MB → list configured codes for province
// POST  /api/clinic/billing            → user adds a custom code (ownerUserId=self)
// DELETE                                → handled in [id] sibling route below

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const url = new URL(req.url);
  const province = url.searchParams.get("province");
  if (!province) {
    return NextResponse.json({ error: "Missing province parameter" }, { status: 400 });
  }

  const [codes, count] = await Promise.all([
    db.clinicBillingCode.findMany({
      where: {
        province,
        isActive: true,
        OR: [{ ownerUserId: null }, { ownerUserId: ctx.user.id }],
      },
      orderBy: [{ ownerUserId: "asc" }, { code: "asc" }],
      take: 500,
    }),
    db.clinicBillingCode.count({ where: { province, isActive: true } }),
  ]);

  return NextResponse.json({
    province,
    configured: count > 0,
    codes,
  });
}

const PostSchema = z.object({
  province: z.string().refine((value) => value.length === 2, { message: "String must contain exactly 2 character(s)" }),
  code: z.string().refine((value) => value.length >= 1, { message: "String must contain at least 1 character(s)" }).refine((value) => value.length <= 20, { message: "String must contain at most 20 character(s)" }),
  shortLabel: z.string().refine((value) => value.length >= 1, { message: "String must contain at least 1 character(s)" }).refine((value) => value.length <= 120, { message: "String must contain at most 120 character(s)" }),
  description: z.string().refine((value) => value.length <= 500, { message: "String must contain at most 500 character(s)" }).optional(),
  modifier: z.string().refine((value) => value.length <= 20, { message: "String must contain at most 20 character(s)" }).optional(),
  feeCents: z.number().int().nonnegative().optional(),
  noteTypes: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  source: z.string().refine((value) => value.length >= 1, { message: "String must contain at least 1 character(s)" }).refine((value) => value.length <= 200, { message: "String must contain at most 200 character(s)" }),
});

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const json = await req.json().catch(() => null);
  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;
  const code = await db.clinicBillingCode.create({
    data: {
      province: data.province,
      code: data.code,
      shortLabel: data.shortLabel,
      description: data.description,
      modifier: data.modifier,
      feeCents: data.feeCents,
      noteTypes: data.noteTypes ?? [],
      specialties: data.specialties ?? [],
      source: data.source,
      ownerUserId: ctx.user.id,
    },
  });
  return NextResponse.json({ code });
}
