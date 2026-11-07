import { callClaude, LlmUnavailableError } from "@/lib/dictation/llm";

// ---------------------------------------------------------------------------
// Voice Case Log parser
//
// Takes a raw voice transcript (e.g. "Did a lap chole today with Dr. Chen,
// robotic, I was console surgeon, took about 90 minutes, uncomplicated")
// and extracts structured CaseLog fields via Claude Opus 4.6.
//
// The output shape is a subset of LogFormState — the client merges these
// fields into the log form, letting the user review before submitting.
// ---------------------------------------------------------------------------

export interface ParsedCaseFields {
  procedureName?: string;
  surgicalApproach?: string;
  role?: string;
  autonomyLevel?: string;
  attendingLabel?: string;
  operativeDurationMinutes?: number;
  outcomeCategory?: string;
  complicationCategory?: string;
  notes?: string;
  reflection?: string;
  caseDate?: string;
}

export interface VoiceLogParseResult {
  fields: ParsedCaseFields;
  engine: "claude-opus-4-6" | "unavailable";
  usage?: { input_tokens: number; output_tokens: number };
  warnings?: string[];
}

const SYSTEM_PROMPT = `You are a surgical case log parser. A resident dictated a quick description of a surgical case they just finished. Extract the structured fields below from the raw text.

Return ONLY a single JSON object with these fields (all optional — omit any field that was not mentioned or cannot be inferred):

{
  "procedureName": string,             // e.g. "Laparoscopic Cholecystectomy"
  "surgicalApproach": string,           // One of: OPEN, LAPAROSCOPIC, ROBOTIC, ENDOSCOPIC, HYBRID, PERCUTANEOUS, OTHER
  "role": string,                       // e.g. "First Surgeon", "Console Surgeon", "First Assist", "Second Assist", "Observer"
  "autonomyLevel": string,             // One of: OBSERVER, ASSISTANT, SUPERVISOR_PRESENT, INDEPENDENT, TEACHING
  "attendingLabel": string,            // Attending surgeon name
  "operativeDurationMinutes": number,  // Duration in minutes
  "outcomeCategory": string,           // One of: UNCOMPLICATED, MINOR_COMPLICATION, MAJOR_COMPLICATION, REOPERATION, DEATH, UNKNOWN
  "complicationCategory": string,      // One of: NONE, BLEEDING, INFECTION, ORGAN_INJURY, ANASTOMOTIC_LEAK, DVT_PE, ILEUS, CONVERSION, READMISSION, OTHER
  "notes": string,                     // Any clinical notes or operative details mentioned
  "reflection": string,                // Any self-reflection or learning points mentioned
  "caseDate": string                   // ISO date string if a specific date was mentioned (e.g. "today" → today's date, "yesterday" → yesterday)
}

Rules:
- Only include fields the resident actually mentioned or strongly implied
- Use UPPERCASE enum values for approach/autonomy/outcome/complication fields
- For procedureName, use the standard formal name (e.g. "Laparoscopic Cholecystectomy" not "lap chole")
- If "today" is mentioned, set caseDate to the current date
- If "yesterday" is mentioned, set caseDate to yesterday's date
- Do NOT invent clinical details. If unsure, omit the field.
- Return the JSON and nothing else. No markdown, no code fence.`;

function buildUserPrompt(raw: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `Today's date: ${today}

Raw voice transcript:
"""
${raw}
"""

Return the JSON now.`;
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\n?([\s\S]*?)\n?```$/);
  return fence ? fence[1].trim() : trimmed;
}

const VALID_APPROACHES = new Set([
  "OPEN", "LAPAROSCOPIC", "ROBOTIC", "ENDOSCOPIC", "HYBRID", "PERCUTANEOUS", "OTHER",
]);
const VALID_AUTONOMY = new Set([
  "OBSERVER", "ASSISTANT", "SUPERVISOR_PRESENT", "INDEPENDENT", "TEACHING",
]);
const VALID_OUTCOME = new Set([
  "UNCOMPLICATED", "MINOR_COMPLICATION", "MAJOR_COMPLICATION", "REOPERATION", "DEATH", "UNKNOWN",
]);
const VALID_COMPLICATION = new Set([
  "NONE", "BLEEDING", "INFECTION", "ORGAN_INJURY", "ANASTOMOTIC_LEAK", "DVT_PE", "ILEUS", "CONVERSION", "READMISSION", "OTHER",
]);

function sanitizeFields(raw: Record<string, unknown>): ParsedCaseFields {
  const fields: ParsedCaseFields = {};

  if (typeof raw.procedureName === "string" && raw.procedureName.trim()) {
    fields.procedureName = raw.procedureName.trim();
  }
  if (typeof raw.surgicalApproach === "string" && VALID_APPROACHES.has(raw.surgicalApproach)) {
    fields.surgicalApproach = raw.surgicalApproach;
  }
  if (typeof raw.role === "string" && raw.role.trim()) {
    fields.role = raw.role.trim();
  }
  if (typeof raw.autonomyLevel === "string" && VALID_AUTONOMY.has(raw.autonomyLevel)) {
    fields.autonomyLevel = raw.autonomyLevel;
  }
  if (typeof raw.attendingLabel === "string" && raw.attendingLabel.trim()) {
    fields.attendingLabel = raw.attendingLabel.trim();
  }
  if (typeof raw.operativeDurationMinutes === "number" && raw.operativeDurationMinutes > 0) {
    fields.operativeDurationMinutes = Math.round(raw.operativeDurationMinutes);
  }
  if (typeof raw.outcomeCategory === "string" && VALID_OUTCOME.has(raw.outcomeCategory)) {
    fields.outcomeCategory = raw.outcomeCategory;
  }
  if (typeof raw.complicationCategory === "string" && VALID_COMPLICATION.has(raw.complicationCategory)) {
    fields.complicationCategory = raw.complicationCategory;
  }
  if (typeof raw.notes === "string" && raw.notes.trim()) {
    fields.notes = raw.notes.trim().slice(0, 2000);
  }
  if (typeof raw.reflection === "string" && raw.reflection.trim()) {
    fields.reflection = raw.reflection.trim().slice(0, 1000);
  }
  if (typeof raw.caseDate === "string") {
    const d = new Date(raw.caseDate);
    if (!Number.isNaN(d.getTime())) {
      fields.caseDate = d.toISOString();
    }
  }

  return fields;
}

export async function parseVoiceCaseLog(raw: string): Promise<VoiceLogParseResult> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      fields: {},
      engine: "unavailable",
      warnings: ["No transcript provided"],
    };
  }

  try {
    const result = await callClaude({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(trimmed),
      temperature: 0.1,
      maxTokens: 1024,
    });

    const cleaned = stripCodeFence(result.text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      throw new LlmUnavailableError(
        `Failed to parse voice log JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!parsed || typeof parsed !== "object") {
      throw new LlmUnavailableError("Voice log JSON is not an object");
    }

    const fields = sanitizeFields(parsed as Record<string, unknown>);
    return {
      fields,
      engine: "claude-opus-4-6",
      usage: result.usage,
    };
  } catch (err) {
    if (!(err instanceof LlmUnavailableError)) throw err;
    return {
      fields: { notes: trimmed },
      engine: "unavailable",
      warnings: [`Voice parsing unavailable (${err.message}). Transcript saved as notes.`],
    };
  }
}
