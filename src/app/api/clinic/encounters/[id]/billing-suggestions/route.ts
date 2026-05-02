import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";
import { suggestBillingCodes } from "@/lib/clinic/billing";

// GET → returns billing suggestions for this encounter, OR a clear
// "not configured" payload when the user's province has no codes loaded.

export async function GET(_req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id: encounterId } = await ctxArg.params;
  const { encounter, error: aclError } = await loadOwnedEncounter(encounterId, ctx.user.id);
  if (aclError) return aclError;

  const profile = await db.profile.findUnique({ where: { userId: ctx.user.id } });
  const province = profile?.billingRegion ?? null;
  const enabled = profile?.billingEnabled ?? false;

  if (!enabled) {
    return NextResponse.json({ enabled: false, configured: false, province, suggestions: [] });
  }
  if (!province) {
    return NextResponse.json({
      enabled: true,
      configured: false,
      province: null,
      suggestions: [],
      reason: "Billing module is enabled but no province is selected. Set one in Clinic settings.",
    });
  }

  const note = await db.clinicNote.findFirst({ where: { encounterId } });
  if (!note) {
    return NextResponse.json({ enabled: true, configured: true, province, suggestions: [] });
  }
  const p = note.paragraphs as { p1: string; p2: string; p3: string; p4: string };
  const noteText = [p.p1, p.p2, p.p3, p.p4].join("\n\n");

  const suggestions = await suggestBillingCodes({
    encounterId,
    ownerUserId: ctx.user.id,
    province,
    noteType: encounter.noteType,
    specialty: ctx.clinician.specialty,
    noteText,
  });

  return NextResponse.json({
    enabled: true,
    configured: suggestions.length > 0 || (await codesCount(province)) > 0,
    province,
    suggestions,
  });
}

async function codesCount(province: string): Promise<number> {
  return db.clinicBillingCode.count({ where: { province, isActive: true } });
}
