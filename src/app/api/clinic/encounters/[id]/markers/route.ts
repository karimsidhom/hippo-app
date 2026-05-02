import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";

const MarkerSchema = z.object({
  kind: z.enum(["important","exam","plan","medication","follow-up","patient-instruction"]),
  atMs: z.number().int().nonnegative(),
  label: z.string().max(200).optional(),
});

export async function POST(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id: encounterId } = await ctxArg.params;
  const { error: aclError } = await loadOwnedEncounter(encounterId, ctx.user.id);
  if (aclError) return aclError;

  const json = await req.json().catch(() => null);
  const parsed = MarkerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }
  const marker = await db.clinicEncounterMarker.create({
    data: { encounterId, ...parsed.data },
  });
  return NextResponse.json({ marker });
}
