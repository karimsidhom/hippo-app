import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";
import { logClinicAudit } from "@/lib/clinic/audit";
import { appendNoteVersion } from "@/lib/clinic/versions";

const FinalizeSchema = z.object({
  signatureText: z.string().min(2).max(500),
});

export async function POST(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id: encounterId } = await ctxArg.params;
  const { encounter, error: aclError } = await loadOwnedEncounter(encounterId, ctx.user.id);
  if (aclError) return aclError;
  if (encounter.status === "FINALIZED") {
    return NextResponse.json({ error: "Already finalized." }, { status: 409 });
  }

  const note = await db.clinicNote.findFirst({ where: { encounterId } });
  if (!note) {
    return NextResponse.json(
      { error: "There must be a reviewed note before finalizing." },
      { status: 409 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = FinalizeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }

  const updated = await db.clinicEncounter.update({
    where: { id: encounterId },
    data: {
      status: "FINALIZED",
      finalizedAt: new Date(),
      finalizedById: ctx.user.id,
      signedBy: ctx.clinician.fullName,
      signatureText: parsed.data.signatureText,
    },
  });
  await appendNoteVersion({
    noteId: note.id,
    encounterId,
    source: "finalize",
    paragraphs: note.paragraphs as never,
    letter: note.letter ?? null,
    patientInstructions: note.patientInstructions ?? null,
    shortSummary: note.shortSummary ?? null,
    authorId: ctx.user.id,
    authorKind: "clinician",
  });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.encounter.finalize",
    entityId: encounterId,
    after: { signedBy: ctx.clinician.fullName },
    req,
  });
  return NextResponse.json({ encounter: updated });
}
