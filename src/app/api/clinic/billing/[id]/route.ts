import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClinicAuth } from "@/lib/clinic/access";

export async function DELETE(_req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id } = await ctxArg.params;
  const existing = await db.clinicBillingCode.findUnique({ where: { id } });
  if (!existing || (existing.ownerUserId && existing.ownerUserId !== ctx.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!existing.ownerUserId) {
    // Global rows can be hidden per-user but never hard-deleted by a non-admin.
    return NextResponse.json(
      { error: "Cannot delete a system-loaded code. Mark inactive in your settings instead." },
      { status: 403 },
    );
  }
  await db.clinicBillingCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
