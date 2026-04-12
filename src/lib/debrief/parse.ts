import { callClaude, LlmUnavailableError } from "@/lib/dictation/llm";
import type { DebriefParseResult, StructuredDebrief } from "./types";

// ---------------------------------------------------------------------------
// Post-Op Debrief parser
//
// Takes the resident's raw debrief text (typed or voice-transcribed) plus
// light case context, and asks Claude Opus 4.6 to extract the three
// structured fields: wentWell, doBetter, workOn.
//
// If the resident wrote a structured answer ("1) It went well because X"
// or "Well: X. Better: Y. Work: Z") the model just pulls it apart. If they
// rambled, the model distills. If the LLM is unavailable we fall back to
// putting the entire raw text in `wentWell` and leaving the others empty —
// the user can then edit inline before saving.
// ---------------------------------------------------------------------------

export interface ParseDebriefInput {
  raw: string;
  /** Minimal case metadata — gives the model something to ground against. */
  context?: {
    procedureName: string;
    role: string;
    caseDate: string;
  };
}

const SYSTEM_PROMPT = `You are a senior surgical attending helping a resident structure a quick post-op debrief.

You will receive the resident's rough debrief text (likely from voice or quick typing) and some minimal context about the case.

Return ONLY a single JSON object matching this TypeScript type exactly, with no markdown, no code fence, no commentary:

{
  "wentWell": string,   // What went well — 1 to 3 concise sentences
  "doBetter": string,   // What they would do differently next time — 1 to 3 sentences
  "workOn":   string    // Concrete skill or concept to work on before the next similar case
}

Hard rules:
- Do NOT invent facts the resident did not mention. If a field is empty in their input, leave the corresponding JSON field as an empty string ("").
- Keep each field under 300 characters.
- Write in first person, from the resident's voice. No AI filler. No hedging. No "as an AI".
- Use standard surgical terminology. Normal abbreviations are fine.
- If the raw input is completely blank or nonsense, return {"wentWell": "", "doBetter": "", "workOn": ""}.
- Return the JSON object and nothing else.`;

function buildUserPrompt(input: ParseDebriefInput): string {
  const ctx = input.context;
  const contextBlock = ctx
    ? `Case context:
- Procedure: ${ctx.procedureName}
- Role: ${ctx.role}
- Date: ${ctx.caseDate.slice(0, 10)}`
    : "Case context: (none provided)";

  return `${contextBlock}

Raw debrief from resident:
"""
${input.raw}
"""

Return the JSON object now.`;
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\n?([\s\S]*?)\n?```$/);
  return fence ? fence[1].trim() : trimmed;
}

function asStructuredDebrief(value: unknown): StructuredDebrief | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const wentWell = typeof v.wentWell === "string" ? v.wentWell : "";
  const doBetter = typeof v.doBetter === "string" ? v.doBetter : "";
  const workOn = typeof v.workOn === "string" ? v.workOn : "";
  // Accept even when all three are empty — the caller will decide whether
  // to bail or let the user edit inline.
  return { v: 2, wentWell, doBetter, workOn };
}

/**
 * Parse a raw debrief into the structured shape. Never throws — LLM errors
 * are surfaced as `engine: "unavailable"` with a warning so the caller can
 * show a banner and let the user edit manually.
 */
export async function parseDebrief(
  input: ParseDebriefInput,
): Promise<DebriefParseResult> {
  const raw = input.raw.trim();
  if (!raw) {
    return {
      debrief: { v: 2, wentWell: "", doBetter: "", workOn: "" },
      engine: "unavailable",
      warnings: ["Debrief text is empty"],
    };
  }

  try {
    const result = await callClaude({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(input),
      temperature: 0.2,
      maxTokens: 1024,
    });

    const cleaned = stripCodeFence(result.text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      throw new LlmUnavailableError(
        `Failed to parse debrief JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const structured = asStructuredDebrief(parsed);
    if (!structured) {
      throw new LlmUnavailableError("Debrief JSON did not match expected shape");
    }

    return {
      debrief: {
        ...structured,
        raw,
        createdAt: new Date().toISOString(),
      },
      engine: "claude-opus-4-6",
      usage: result.usage,
    };
  } catch (err) {
    if (!(err instanceof LlmUnavailableError)) throw err;
    return {
      debrief: {
        v: 2,
        wentWell: raw,
        doBetter: "",
        workOn: "",
        raw,
        createdAt: new Date().toISOString(),
      },
      engine: "unavailable",
      warnings: [
        `AI parsing unavailable (${err.message}). You can edit the fields manually before saving.`,
      ],
    };
  }
}
