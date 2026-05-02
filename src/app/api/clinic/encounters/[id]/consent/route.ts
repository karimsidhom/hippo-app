import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";
import { logClinicAudit } from "@/lib/clinic/audit";

const ConsentSchema = z.object({
  mode: z.enum(["VERBAL", "WRITTEN", "DECLINED", "NOT_REQUIRED"]),
  text: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id: encounterId } = await ctxArg.params;
  const { encounter, error: aclError } = await loadOwnedEncounter(encounterId, ctx.user.id);
  if (aclError) return aclError;

  const json = await req.json().catch(() => null);
  const parsed = ConsentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const record = await db.clinicConsentRecord.create({
    data: {
      encounterId,
      patientId: encounter.patientId,
      mode: parsed.data.mode,
      text: parsed.data.text,
      capturedById: ctx.user.id,
      ipAddress,
      userAgent,
    },
  });
  await db.clinicEncounter.update({
    where: { id: encounterId },
    data: {
      consentMode: parsed.data.mode,
      consentText: parsed.data.text,
      consentRecordedAt: new Date(),
      // If the patient declined, force the input mode to TYPED — no audio.
      inputMode: parsed.data.mode === "DECLINED" ? "TYPED" : encounter.inputMode,
    },
  });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.consent.capture",
    entityId: encounterId,
    metadata: { mode: parsed.data.mode },
    req,
  });
  return NextResponse.json({ record });
}
