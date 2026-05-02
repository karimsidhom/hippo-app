import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";
import { logClinicAudit } from "@/lib/clinic/audit";
import { appendNoteVersion } from "@/lib/clinic/versions";

// Clinician edits to the note. Each save records a version snapshot so the
// audit trail can show "AI generated → clinician edited" precisely.
const NoteEditSchema = z.object({
  paragraphs: z.object({
    p1: z.string().max(20000),
    p2: z.string().max(20000),
    p3: z.string().max(20000),
    p4: z.string().max(20000),
  }),
  letter: z.string().max(20000).nullable().optional(),
  patientInstructions: z.string().max(20000).nullable().optional(),
  shortSummary: z.string().max(500).nullable().optional(),
  structured: z.record(z.string(), z.unknown()).optional(),
});

export async function PUT(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id: encounterId } = await ctxArg.params;
  const { encounter, error: aclError } = await loadOwnedEncounter(encounterId, ctx.user.id);
  if (aclError) return aclError;
  if (encounter.status === "FINALIZED") {
    return NextResponse.json({ error: "Encounter is finalized." }, { status: 409 });
  }

  const json = await req.json().catch(() => null);
  const parsed = NoteEditSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const note = await db.clinicNote.findFirst({ where: { encounterId } });
  if (!note) {
    return NextResponse.json({ error: "No note exists yet." }, { status: 404 });
  }

  const updated = await db.clinicNote.update({
    where: { id: note.id },
    data: {
      paragraphs: data.paragraphs as never,
      letter: data.letter,
      patientInstructions: data.patientInstructions,
      shortSummary: data.shortSummary,
      structured: data.structured as never,
      reviewedAt: new Date(),
      reviewedById: ctx.user.id,
    },
  });
  await appendNoteVersion({
    noteId: note.id,
    encounterId,
    source: "clinician-edit",
    paragraphs: data.paragraphs as never,
    letter: data.letter,
    patientInstructions: data.patientInstructions,
    shortSummary: data.shortSummary,
    authorId: ctx.user.id,
    authorKind: "clinician",
  });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.note.edit",
    entityId: encounterId,
    metadata: { noteId: note.id },
    req,
  });
  return NextResponse.json({ note: updated });
}
