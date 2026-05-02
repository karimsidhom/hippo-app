import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";
import { logClinicAudit, logClinicAi } from "@/lib/clinic/audit";
import { chatJson, ClinicLlmError } from "@/lib/clinic/llm";
import { buildNoteSystemPrompt, buildUserPrompt } from "@/lib/clinic/prompts";
import { findTemplate } from "@/lib/clinic/templates";
import { appendNoteVersion } from "@/lib/clinic/versions";
import type { ClinicNoteContent } from "@/lib/clinic/types";

// POST → generate the structured 4-paragraph note from the encounter's
// transcripts. We:
//   1. Concatenate all transcript segments (in startMs order).
//   2. Build the system prompt from note type + template + clinician.
//   3. Call the LLM, parse strict JSON.
//   4. Persist a clinic_notes row + a versioned snapshot.
//   5. Auto-create follow-up tasks from the model's `followUps` array.
//   6. Set encounter.status = NEEDS_REVIEW so the UI gates finalization.
//
// On failure: encounter.status flips to FAILED, transcript is preserved,
// and the client can call this endpoint again to retry.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id: encounterId } = await ctxArg.params;
  const { encounter, error: aclError } = await loadOwnedEncounter(encounterId, ctx.user.id);
  if (aclError) return aclError;

  if (encounter.status === "FINALIZED") {
    return NextResponse.json(
      { error: "Encounter is finalized and cannot be regenerated." },
      { status: 409 },
    );
  }

  // Mark generating so realtime listeners can update status.
  await db.clinicEncounter.update({
    where: { id: encounterId },
    data: { status: "GENERATING", failureReason: null },
  });

  // Concatenate transcripts.
  const transcripts = await db.clinicTranscript.findMany({
    where: { encounterId },
    orderBy: { startMs: "asc" },
  });
  const transcriptText = transcripts
    .map((t) => (t.speaker ? `[${t.speaker}] ${t.text}` : t.text))
    .join("\n")
    .trim();

  if (!transcriptText) {
    await db.clinicEncounter.update({
      where: { id: encounterId },
      data: { status: "FAILED", failureReason: "No transcript captured" },
    });
    return NextResponse.json(
      { error: "No transcript captured. Record audio, dictate, or paste content first." },
      { status: 400 },
    );
  }

  const template = findTemplate(encounter.templateKey);
  const promptInput = {
    noteType: encounter.noteType as never,
    template,
    clinician: ctx.clinician,
    transcript: transcriptText,
    visitReason: encounter.visitReason ?? undefined,
  };
  const system = buildNoteSystemPrompt(promptInput);
  const user = buildUserPrompt(promptInput);
  const promptHash = crypto
    .createHash("sha256")
    .update(system + "\n" + user)
    .digest("hex")
    .slice(0, 24);

  const startedAt = Date.now();
  let result: { json: ClinicNoteContent; model: string };
  try {
    const r = await chatJson<ClinicNoteContent>({ system, user, maxTokens: 3200 });
    result = { json: r.json, model: r.model };
  } catch (err) {
    const message = err instanceof ClinicLlmError ? err.message : (err as Error).message;
    const status = err instanceof ClinicLlmError ? err.status : 502;
    await db.clinicEncounter.update({
      where: { id: encounterId },
      data: { status: "FAILED", failureReason: message.slice(0, 800) },
    });
    void logClinicAi({
      encounterId,
      ownerUserId: ctx.user.id,
      action: "generate-note",
      ok: false,
      errorMessage: message,
      durationMs: Date.now() - startedAt,
      promptHash,
      inputCharCount: transcriptText.length,
    });
    return NextResponse.json({ error: message }, { status });
  }

  const content = result.json;
  if (!content?.paragraphs?.p1 || !content?.paragraphs?.p2 || !content?.paragraphs?.p3 || !content?.paragraphs?.p4) {
    await db.clinicEncounter.update({
      where: { id: encounterId },
      data: { status: "FAILED", failureReason: "LLM did not return all 4 paragraphs" },
    });
    return NextResponse.json({ error: "LLM did not return all 4 paragraphs" }, { status: 502 });
  }

  // Upsert the note. We use updateMany so we don't crash if a note row
  // doesn't yet exist.
  const existingNote = await db.clinicNote.findFirst({ where: { encounterId } });
  let noteId: string;
  if (existingNote) {
    const updated = await db.clinicNote.update({
      where: { id: existingNote.id },
      data: {
        paragraphs: content.paragraphs as never,
        letter: content.letter ?? null,
        patientInstructions: content.patientInstructions ?? null,
        shortSummary: content.shortSummary ?? null,
        uncertainSpans: content.uncertainSpans as never,
        inferredFlags: content.inferredFlags as never,
        structured: content.structured as never,
        templateKey: encounter.templateKey,
        generationModel: result.model,
        generationPromptHash: promptHash,
      },
    });
    noteId = updated.id;
  } else {
    const created = await db.clinicNote.create({
      data: {
        encounterId,
        paragraphs: content.paragraphs as never,
        letter: content.letter ?? null,
        patientInstructions: content.patientInstructions ?? null,
        shortSummary: content.shortSummary ?? null,
        uncertainSpans: content.uncertainSpans as never,
        inferredFlags: content.inferredFlags as never,
        structured: content.structured as never,
        templateKey: encounter.templateKey,
        generationModel: result.model,
        generationPromptHash: promptHash,
      },
    });
    noteId = created.id;
  }

  // Append a version snapshot — race-safe with retry on P2002/P2034.
  await appendNoteVersion({
    noteId,
    encounterId,
    source: "ai-initial",
    paragraphs: content.paragraphs as never,
    letter: content.letter ?? null,
    patientInstructions: content.patientInstructions ?? null,
    shortSummary: content.shortSummary ?? null,
    authorKind: "ai",
  });

  // Wipe + recreate AI-suggested follow-ups. The clinician will edit.
  if (Array.isArray(content.followUps) && content.followUps.length > 0) {
    await db.clinicFollowUpTask.deleteMany({
      where: { encounterId, status: "DUE_SOON" },
    });
    for (const f of content.followUps) {
      await db.clinicFollowUpTask.create({
        data: {
          encounterId,
          ownerUserId: ctx.user.id,
          patientId: encounter.patientId,
          kind: f.kind,
          title: f.title.slice(0, 200),
          detail: f.detail?.slice(0, 1000),
          intervalLabel: f.intervalLabel?.slice(0, 60),
          status: "DUE_SOON",
        },
      });
    }
  }

  await db.clinicEncounter.update({
    where: { id: encounterId },
    data: { status: "NEEDS_REVIEW", failureReason: null },
  });

  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.note.generate",
    entityId: encounterId,
    metadata: { noteId, transcriptChars: transcriptText.length },
    req,
  });
  void logClinicAi({
    encounterId,
    ownerUserId: ctx.user.id,
    action: "generate-note",
    model: result.model,
    promptHash,
    inputCharCount: transcriptText.length,
    outputCharCount: JSON.stringify(content).length,
    durationMs: Date.now() - startedAt,
    ok: true,
  });

  return NextResponse.json({ noteId, content, model: result.model });
}
