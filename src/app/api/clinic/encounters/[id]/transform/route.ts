import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";
import { logClinicAudit, logClinicAi } from "@/lib/clinic/audit";
import { chatJson, ClinicLlmError } from "@/lib/clinic/llm";
import { TRANSFORMS, type TransformKind, CORE_RULES } from "@/lib/clinic/prompts";
import { appendNoteVersion } from "@/lib/clinic/versions";

// One-click transforms: shorten / billing-ready / patient-friendly / letter.
// Preserves clinical content; restructures voice. Each transform creates a
// new ClinicNoteVersion row with source="ai-regen-section" so the audit
// trail captures the change.

const Schema = z.object({
  kind: z.enum(["shorten", "billing", "patientFriendly", "letter"]),
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
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.issues }, { status: 400 });
  }
  const kind = parsed.data.kind as TransformKind;
  const transform = TRANSFORMS[kind];

  const note = await db.clinicNote.findFirst({ where: { encounterId } });
  if (!note) return NextResponse.json({ error: "No note exists yet." }, { status: 409 });

  const paragraphs = note.paragraphs as { p1: string; p2: string; p3: string; p4: string };
  const fullNote = [paragraphs.p1, paragraphs.p2, paragraphs.p3, paragraphs.p4].join("\n\n");

  // Always prepend CORE_RULES so transforms inherit the same hard
  // guardrails as note generation — especially important for the
  // "billing-ready" transform, which restructures clinical content and
  // could otherwise tempt the model to invent facts to fit the format.
  const system = `${CORE_RULES}

TRANSFORM TASK
You apply a SINGLE transformation to a clinic note. Preserve every clinical fact —
diagnoses, medications, doses, findings, plans. Never invent. The CORE RULES above
still apply.

TRANSFORM: ${transform.label}
INSTRUCTION: ${transform.instruction}

Return strict JSON:
${kind === "letter"
  ? `{ "letter": string }`
  : kind === "patientFriendly"
  ? `{ "patientInstructions": string }`
  : `{ "paragraphs": { "p1": string, "p2": string, "p3": string, "p4": string } }`
}
No prose, no markdown.`.trim();

  const user = `
EXISTING NOTE:
${fullNote}

${kind === "patientFriendly" ? `\nCURRENT PATIENT INSTRUCTIONS:\n${note.patientInstructions ?? "(none)"}\n` : ""}
${kind === "letter" ? `\nCURRENT LETTER:\n${note.letter ?? "(none)"}\n` : ""}
`.trim();

  const promptHash = crypto.createHash("sha256").update(system + "\n" + user).digest("hex").slice(0, 24);
  const startedAt = Date.now();

  let result;
  try {
    result = await chatJson<Record<string, unknown>>({ system, user, maxTokens: 2400 });
  } catch (err) {
    const message = err instanceof ClinicLlmError ? err.message : (err as Error).message;
    const status = err instanceof ClinicLlmError ? err.status : 502;
    void logClinicAi({
      encounterId, ownerUserId: ctx.user.id,
      action: kind === "shorten" ? "shorten" : kind === "billing" ? "billing" : kind === "patientFriendly" ? "patient-friendly" : "letter",
      ok: false, errorMessage: message, durationMs: Date.now() - startedAt, promptHash,
    });
    return NextResponse.json({ error: message }, { status });
  }

  let nextParagraphs = paragraphs;
  let nextLetter = note.letter ?? null;
  let nextInstructions = note.patientInstructions ?? null;

  if (kind === "letter") {
    const v = result.json.letter;
    if (typeof v !== "string" || !v) return NextResponse.json({ error: "Model didn't return a letter." }, { status: 502 });
    nextLetter = v;
  } else if (kind === "patientFriendly") {
    const v = result.json.patientInstructions;
    if (typeof v !== "string" || !v) return NextResponse.json({ error: "Model didn't return patient instructions." }, { status: 502 });
    nextInstructions = v;
  } else {
    const p = result.json.paragraphs as { p1?: string; p2?: string; p3?: string; p4?: string } | undefined;
    if (!p?.p1 || !p?.p2 || !p?.p3 || !p?.p4) {
      return NextResponse.json({ error: "Model didn't return all 4 paragraphs." }, { status: 502 });
    }
    nextParagraphs = { p1: p.p1, p2: p.p2, p3: p.p3, p4: p.p4 };
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
    section: kind,
    paragraphs: nextParagraphs as never,
    letter: nextLetter,
    patientInstructions: nextInstructions,
    authorKind: "ai",
  });

  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.note.transform",
    entityId: encounterId,
    metadata: { kind },
    req,
  });
  void logClinicAi({
    encounterId,
    ownerUserId: ctx.user.id,
    action: kind === "shorten" ? "shorten" : kind === "billing" ? "billing" : kind === "patientFriendly" ? "patient-friendly" : "letter",
    model: result.model,
    promptHash,
    inputCharCount: fullNote.length,
    outputCharCount: JSON.stringify({ nextParagraphs, nextLetter, nextInstructions }).length,
    durationMs: Date.now() - startedAt,
    ok: true,
  });

  return NextResponse.json({ note: updated, kind });
}
