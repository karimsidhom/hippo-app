import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";
import { logClinicAudit, logClinicAi } from "@/lib/clinic/audit";
import { chatJson, ClinicLlmError } from "@/lib/clinic/llm";
import { buildRegenSectionPrompt } from "@/lib/clinic/prompts";
import { findTemplate } from "@/lib/clinic/templates";
import { appendNoteVersion } from "@/lib/clinic/versions";

const RegenSchema = z.object({
  section: z.enum(["p1", "p2", "p3", "p4", "letter", "patientInstructions"]),
  guidance: z.string().max(800).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id: encounterId } = await ctxArg.params;
  const { encounter, error: aclError } = await loadOwnedEncounter(encounterId, ctx.user.id);
  if (aclError) return aclError;

  if (encounter.status === "FINALIZED") {
    return NextResponse.json({ error: "Encounter is finalized." }, { status: 409 });
  }

  const json = await req.json().catch(() => null);
  const parsed = RegenSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }
  const { section, guidance } = parsed.data;

  const note = await db.clinicNote.findFirst({ where: { encounterId } });
  if (!note) {
    return NextResponse.json(
      { error: "No note exists yet. Run generate first." },
      { status: 409 },
    );
  }
  const transcripts = await db.clinicTranscript.findMany({
    where: { encounterId },
    orderBy: { startMs: "asc" },
  });
  const transcriptText = transcripts.map((t) => t.text).join("\n").trim();

  const paragraphs = note.paragraphs as { p1: string; p2: string; p3: string; p4: string };
  const template = findTemplate(encounter.templateKey);
  const { system, user } = buildRegenSectionPrompt(
    {
      noteType: encounter.noteType as never,
      template,
      clinician: ctx.clinician,
      transcript: transcriptText,
      visitReason: encounter.visitReason ?? undefined,
    },
    section,
    {
      paragraphs,
      letter: note.letter ?? undefined,
      patientInstructions: note.patientInstructions ?? undefined,
    },
    guidance,
  );

  const promptHash = crypto.createHash("sha256").update(system + "\n" + user).digest("hex").slice(0, 24);
  const startedAt = Date.now();

  let result: { json: Record<string, unknown>; model: string };
  try {
    const r = await chatJson<Record<string, unknown>>({ system, user, maxTokens: 1600 });
    result = { json: r.json, model: r.model };
  } catch (err) {
    const message = err instanceof ClinicLlmError ? err.message : (err as Error).message;
    const status = err instanceof ClinicLlmError ? err.status : 502;
    void logClinicAi({
      encounterId,
      ownerUserId: ctx.user.id,
      action: "regenerate-section",
      ok: false,
      errorMessage: message,
      durationMs: Date.now() - startedAt,
      promptHash,
    });
    return NextResponse.json({ error: message }, { status });
  }

  const next = result.json[section];
  if (typeof next !== "string" || next.length === 0) {
    return NextResponse.json({ error: `Model did not return a "${section}" string.` }, { status: 502 });
  }

  // Apply the patch.
  let nextParagraphs = paragraphs;
  let nextLetter = note.letter ?? null;
  let nextInstructions = note.patientInstructions ?? null;
  if (section === "letter") {
    nextLetter = next;
  } else if (section === "patientInstructions") {
    nextInstructions = next;
  } else {
    nextParagraphs = { ...paragraphs, [section]: next };
  }

  const updated = await db.clinicNote.update({
    where: { id: note.id },
    data: {
      paragraphs: nextParagraphs as never,
      letter: nextLetter,
      patientInstructions: nextInstructions,
    },
  });
  await appendNoteVersion({
    noteId: note.id,
    encounterId,
    source: "ai-regen-section",
    section,
    paragraphs: nextParagraphs as never,
    letter: nextLetter,
    patientInstructions: nextInstructions,
    authorKind: "ai",
  });

  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.note.regenerate",
    entityId: encounterId,
    metadata: { section, length: next.length },
    req,
  });
  void logClinicAi({
    encounterId,
    ownerUserId: ctx.user.id,
    action: "regenerate-section",
    model: result.model,
    promptHash,
    inputCharCount: JSON.stringify(paragraphs).length,
    outputCharCount: next.length,
    durationMs: Date.now() - startedAt,
    ok: true,
  });

  return NextResponse.json({ note: updated, section, value: next, model: result.model });
}
