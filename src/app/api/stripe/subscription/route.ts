import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { isProgramOwner } from "@/lib/program-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const programId = req.nextUrl.searchParams.get("programId");
  if (!programId || !(await isProgramOwner(auth.user.id, programId))) {
    return NextResponse.json({ error: "Program owner access required" }, { status: 403 });
  }
  const billing = await db.programSubscription.findUnique({ where: { programId } });
  return NextResponse.json(billing ? { status: billing.status, currentPeriodEnd: billing.currentPeriodEnd, cancelAtPeriodEnd: billing.cancelAtPeriodEnd } : { status: "none" });
}
