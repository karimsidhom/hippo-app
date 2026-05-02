// Hippo Clinic — AI prompts.
//
// Centralised so we can audit them. Every external LLM call should pull its
// system prompt from here. Constraints encoded:
//
//   - Strict 4-paragraph model (Template A new consult, Template B follow-up).
//   - "Do not invent" guardrails: never fabricate exam findings, negatives,
//     medications, or doses.
//   - "Not discussed" preferred over inferred negatives.
//   - Mark uncertainty with bracketed flags so the UI can highlight.
//   - Always require clinician review.

import type {
  ClinicianContext,
  ClinicNoteType,
  ClinicTemplateDefinition,
} from "./types";

const CORE_RULES = `
You are Hippo Clinic — a clinic-note generator for licensed clinicians. The
clinician will REVIEW and edit your output before it becomes the medical
record. You are not the final authority.

Hard rules — violations are clinical errors:

1.  NEVER invent or "round out" physical exam findings. If the transcript
    or notes don't say an exam was done, write "Examination not performed
    today" or omit the exam entirely. Do not insert generic phrases like
    "abdomen soft, non-tender" unless the clinician actually said them.

2.  NEVER invent negative symptoms. If the patient was not asked about
    nausea/fevers/etc, do NOT write "denies nausea, denies fevers". Use
    "Not discussed" or simply omit.

3.  NEVER invent medications, doses, frequencies, or routes. Preserve the
    clinician's exact words for drug names and doses.

4.  When uncertain about a value, name, or finding, wrap it in
    [[UNCERTAIN: ...]] inline. The UI will highlight these for review.

5.  Distinguish "said by the patient/clinician" from your own inference.
    If you must infer to make the note read clinically, mark the paragraph
    with [[INFERRED]] at the very start of that paragraph only.

6.  Use plain clinical English. Avoid filler phrases like "the patient is
    a pleasant ___-year-old ___". Avoid AI-isms ("It's important to note
    that...", "I'd like to highlight..."). Be concise.

7.  Preserve the clinician's voice when their style profile is provided.

8.  Output STRICT JSON in the schema requested. No prose outside the JSON.
    No markdown code fences.
`.trim();

const FOUR_PARAGRAPH_NEW_CONSULT = `
TEMPLATE A — NEW CONSULT (4 paragraphs).

Paragraph 1 — Intro + HPI.
  Patient demographics if available, the referral reason, presenting
  concern, symptom timeline, relevant positives/negatives that were
  ACTUALLY discussed, and the reason for consultation.

Paragraph 2 — Past history + recent context.
  PMHx, surgical history, medications, allergies, relevant family/social
  history, prior investigations, prior treatments, and recent events.
  If a domain wasn't discussed, write "Not discussed" — do not invent.

Paragraph 3 — Subjective / objective / exam.
  How the patient is currently doing, symptom status, objective data
  (labs, imaging, pathology, cystoscopy, etc) only if mentioned, and
  the physical examination ONLY if it was actually performed. Do not
  invent an exam.

Paragraph 4 — Assessment + plan.
  Diagnosis/impression, clinical reasoning, management plan,
  investigations ordered, medications started/stopped/continued,
  counselling points, follow-up timing, red flags, and patient
  instructions.
`.trim();

const FOUR_PARAGRAPH_FOLLOW_UP = `
TEMPLATE B — FOLLOW-UP (4 paragraphs).

Paragraph 1 — Follow-up context.
  Who the patient is, why they are being followed, prior diagnosis or
  problem, and reason for today's follow-up.

Paragraph 2 — Interval history.
  Recent events since last visit, symptom changes, treatment response,
  complications, new concerns, relevant patient-reported outcomes.

Paragraph 3 — Objective review / exam.
  Labs, imaging, pathology, procedures, vitals, physical exam if
  performed, and any relevant objective changes. Do not fabricate
  missing details.

Paragraph 4 — Assessment + plan.
  Updated impression, current status, plan, next steps, investigations,
  medication changes, counselling, and follow-up interval.
`.trim();

export interface NotePromptInput {
  noteType: ClinicNoteType;
  template?: ClinicTemplateDefinition | null;
  clinician: ClinicianContext;
  transcript: string;
  visitReason?: string;
  patientLabel?: string; // e.g. "55M" or "Patient" — never full name in the prompt
  styleHint?: string;    // user's "make it sound like me" preference
  patientFriendly?: boolean;
}

export function buildNoteSystemPrompt(input: NotePromptInput): string {
  const isFollowUp =
    input.noteType === "FOLLOW_UP" ||
    input.noteType === "MEDICATION_FOLLOW_UP" ||
    input.noteType === "DISCHARGE_FOLLOW_UP" ||
    input.noteType === "CANCER_SURVEILLANCE";

  const templateBlock = input.template
    ? `\n\nTEMPLATE HINTS — "${input.template.name}" (${input.template.specialty}):\n` +
      (input.template.hints?.map((h) => `- ${h}`).join("\n") ?? "(none)")
    : "";

  const styleBlock = input.styleHint
    ? `\n\nCLINICIAN STYLE PREFERENCE:\n${input.styleHint}`
    : "";

  const signatureBlock = `
SIGNATURE — every note must end with:

Sincerely,

${input.clinician.fullName}, MD
${input.clinician.role ?? input.clinician.specialty ?? ""}
`.trim();

  return [
    CORE_RULES,
    isFollowUp ? FOUR_PARAGRAPH_FOLLOW_UP : FOUR_PARAGRAPH_NEW_CONSULT,
    templateBlock,
    styleBlock,
    "",
    signatureBlock,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const JSON_SCHEMA_INSTRUCTION = `
Return STRICT JSON matching this TypeScript type — no prose, no markdown:

{
  "paragraphs": { "p1": string, "p2": string, "p3": string, "p4": string },
  "letter": string,                  // Letter to the referring physician — same content, formatted as a clinic letter, ending with the signature.
  "patientInstructions": string,     // Plain-language instructions for the patient. Avoid jargon.
  "shortSummary": string,            // ≤ 200 chars one-liner for the longitudinal chart.
  "uncertainSpans": [                // Optional. Spans you are unsure about.
    { "section": "p1"|"p2"|"p3"|"p4"|"letter"|"patientInstructions",
      "start": number, "end": number, "reason": string }
  ],
  "inferredFlags": { "p1"?: boolean, "p2"?: boolean, "p3"?: boolean, "p4"?: boolean },
  "followUps": [                     // Tasks extracted from the visit.
    { "kind": "investigation"|"imaging"|"lab"|"referral"|"med-change"|"instruction"|"callback"|"letter"|"booking",
      "title": string, "detail"?: string, "intervalLabel"?: string }
  ],
  "structured"?: object              // Template-specific fields if applicable (PSA values, IPSS, etc).
}
`.trim();

export function buildUserPrompt(input: NotePromptInput): string {
  return [
    `Clinician: ${input.clinician.fullName}${input.clinician.role ? ` — ${input.clinician.role}` : ""}`,
    input.clinician.specialty ? `Specialty: ${input.clinician.specialty}` : null,
    input.patientLabel ? `Patient label: ${input.patientLabel}` : null,
    input.visitReason ? `Visit reason: ${input.visitReason}` : null,
    "",
    "TRANSCRIPT / NOTES:",
    input.transcript || "(no transcript captured)",
    "",
    JSON_SCHEMA_INSTRUCTION,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

// ─── Section regeneration ───────────────────────────────────────────────
export function buildRegenSectionPrompt(
  base: NotePromptInput,
  section: "p1" | "p2" | "p3" | "p4" | "letter" | "patientInstructions",
  currentNote: { paragraphs: { p1: string; p2: string; p3: string; p4: string }; letter?: string; patientInstructions?: string },
  guidance?: string,
): { system: string; user: string } {
  const system = buildNoteSystemPrompt(base);
  const user = [
    `Regenerate ONLY the "${section}" portion of the existing note.`,
    "Keep the rest unchanged. Apply the same hard rules — no invented exams, no invented negatives, no invented meds.",
    guidance ? `Clinician guidance: ${guidance}` : null,
    "",
    "EXISTING NOTE:",
    JSON.stringify(currentNote, null, 2),
    "",
    "TRANSCRIPT / NOTES:",
    base.transcript || "(no transcript captured)",
    "",
    `Return STRICT JSON in the form: { "${section}": string, "uncertainSpans"?: [...] } — nothing else.`,
  ]
    .filter((l) => l !== null)
    .join("\n");
  return { system, user };
}

// ─── One-click transforms ───────────────────────────────────────────────
export const TRANSFORMS = {
  shorten: {
    label: "Shorten",
    instruction: "Shorten the note by ~30% while preserving every clinical fact. Remove filler phrasing only — never delete a finding, plan item, or medication.",
  },
  billing: {
    label: "Make billing-ready",
    instruction: "Reword the note so each documented element required for the visit's complexity is explicit. Do NOT invent codes. Do NOT add findings. Only restructure existing content.",
  },
  patientFriendly: {
    label: "Patient-friendly",
    instruction: "Translate the patient instructions into plain language at a Grade 6 reading level. No jargon. Keep medication names and doses exact.",
  },
  letter: {
    label: "Convert to letter",
    instruction: "Rewrite as a clinic letter to the referring physician. Same content, formatted as 'Dear Dr. ___,' opening, narrative paragraphs, signature.",
  },
} as const;

export type TransformKind = keyof typeof TRANSFORMS;
