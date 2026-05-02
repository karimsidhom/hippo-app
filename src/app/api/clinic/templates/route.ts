import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClinicAuth } from "@/lib/clinic/access";
import { BUILTIN_CLINIC_TEMPLATES } from "@/lib/clinic/templates";

export async function GET(_req: NextRequest) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;

  const customTemplates = await db.clinicTemplate.findMany({
    where: { OR: [{ ownerUserId: ctx.user.id }, { scope: "builtin" }, { scope: "institution" }] },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    builtins: BUILTIN_CLINIC_TEMPLATES,
    custom: customTemplates,
  });
}
