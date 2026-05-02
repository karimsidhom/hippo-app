import { NextRequest, NextResponse } from "next/server";
import { requireClinicAuth } from "@/lib/clinic/access";
import {
  CLINIC_POLICY_KEY,
  CLINIC_POLICY_VERSION,
  CLINIC_POLICY_TEXT,
  hasAcceptedClinicPolicy,
  recordClinicAcceptance,
} from "@/lib/clinic/legal";
import { logClinicAudit } from "@/lib/clinic/audit";

export async function GET(_req: NextRequest) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const accepted = await hasAcceptedClinicPolicy(ctx.user.id);
  return NextResponse.json({
    policyKey: CLINIC_POLICY_KEY,
    version: CLINIC_POLICY_VERSION,
    text: CLINIC_POLICY_TEXT,
    accepted,
  });
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;
  await recordClinicAcceptance({ userId: ctx.user.id, ipAddress, userAgent });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.encounter.update", // generic; clinicAction in metadata says it's the policy ack
    metadata: { policyKey: CLINIC_POLICY_KEY, version: CLINIC_POLICY_VERSION },
    req,
  });
  return NextResponse.json({ ok: true });
}
