import { callClaude, LlmUnavailableError } from "@/lib/dictation/llm";
import type {
  BriefCaseContext,
  BriefResult,
  CaseBrief,
} from "./types";

// ---------------------------------------------------------------------------
// Pre-Op Brief generator
//
// Given a free-text description of an upcoming case and the resident's own
// case history, ask Claude Opus 4.6 to synthesize a personalized prep sheet.
//
// The prompt is structured so the model returns STRICT JSON that matches
// the CaseBrief shape. The server parses + validates the JSON before
// returning to the client; if parsing fails we surface an error rather than
// guessing at a partial brief.
// ---------------------------------------------------------------------------

export interface GenerateBriefInput {
  userInput: string;
  cases: BriefCaseContext[];
}

const SYSTEM_PROMPT = `You are a senior surgical attending writing a targeted pre-op prep brief for a surgical resident.

You receive TWO things:
1. The resident's free-text description of the case they're about to do (procedure, attending, timing — may be rough).
2. A list of their OWN recent cases, including any reflections, notes, and complications they logged.

Your job is to write a short, practical brief that will make THIS resident sharper for THIS case tomorrow. It must be personalized using their own history, not generic textbook content.

Return ONLY a single JSON object matching this TypeScript type exactly, with no markdown, no commentary, no code fence:

{
  "context": {
    "procedure": string,                  // canonicalized procedure name
    "attending"?: string,                 // if parseable from input
    "when"?: string                       // human-readable, e.g. "Tomorrow 7am"
  },
  "keySteps": [                           // 5-8 critical operative steps
    { "step": string, "note"?: string }   // note is optional — 1 sentence of nuance
  ],
  "anatomy": string[],                    // 3-5 anatomy reminders relevant to pitfalls
  "redFlags": string[],                   // 3-5 specific things not to miss
  "history": {
    "priorCount": number,                 // count of similar cases in their log
    "summary": string,                    // one sentence about their history with this
    "patterns": [                         // 2-4 patterns from THEIR logged data
      { "kind": "strength" | "weakness" | "note", "text": string }
    ],
    "lastReflection"?: string             // quote/paraphrase of most relevant reflection
  },
  "focusForThisCase": string[]            // 2-3 specific things for THIS resident to work on
}

Hard rules:
- Every item in "patterns" and "focusForThisCase" MUST be grounded in their actual logged history. If they have no history, say so in "history.summary" and leave "patterns" empty.
- Do NOT invent complications, reflections, or events that are not in the provided case list.
- Keep each string under 200 characters. No filler, no hedging, no "as an AI".
- Use standard surgical terminology. Normal medical abbreviations are fine.
- If the user's input is too vague to identify a procedure, set "context.procedure" to your best guess and include a note in "focusForThisCase" asking them to clarify next time.
- Return the JSON object and nothing else.`;

function buildUserPrompt(
  userInput: string,
  cases: BriefCaseContext[],
): string {
  const caseBlock = cases.length
    ? cases
        .map((c, i) => {
          const parts = [
            `#${i + 1} (${c.caseDate.slice(0, 10)}) — ${c.procedureName}`,
            `approach: ${c.surgicalApproach}`,
            `role: ${c.role}`,
            c.operativeDurationMinutes
              ? `duration: ${c.operativeDurationMinutes}m`
              : null,
            c.attendingLabel ? `attending: ${c.attendingLabel}` : null,
            c.outcomeCategory !== "UNCOMPLICATED"
              ? `outcome: ${c.outcomeCategory}`
              : null,
            c.complicationCategory !== "NONE"
              ? `complication: ${c.complicationCategory}`
              : null,
            c.notes ? `notes: ${c.notes.slice(0, 400)}` : null,
            c.reflection ? `reflection: ${c.reflection.slice(0, 400)}` : null,
          ]
            .filter(Boolean)
            .join(" | ");
          return parts;
        })
        .join("\n")
    : "(no prior cases logged)";

  return `Upcoming case (free text from resident):
${userInput}

Resident's prior case log (most recent first, up to 30):
${caseBlock}

Return the JSON brief now.`;
}

/**
 * Runtime validation: narrow an `unknown` into a CaseBrief. Returns null
 * rather than throwing, so the caller can surface a clean error instead
 * of crashing.
 */
function asCaseBrief(value: unknown): CaseBrief | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;

  const context = v.context as Record<string, unknown> | undefined;
  if (!context || typeof context.procedure !== "string") return null;

  const keySteps = Array.isArray(v.keySteps) ? v.keySteps : [];
  const anatomy = Array.isArray(v.anatomy) ? v.anatomy : [];
  const redFlags = Array.isArray(v.redFlags) ? v.redFlags : [];
  const focusForThisCase = Array.isArray(v.focusForThisCase)
    ? v.focusForThisCase
    : [];

  const history = (v.history as Record<string, unknown>) ?? {};
  const patterns = Array.isArray(history.patterns) ? history.patterns : [];

  return {
    context: {
      procedure: String(context.procedure),
      attending:
        typeof context.attending === "string" ? context.attending : undefined,
      when: typeof context.when === "string" ? context.when : undefined,
    },
    keySteps: keySteps
      .map((s) => {
        if (typeof s === "string") return { step: s };
        if (s && typeof s === "object" && typeof (s as { step?: unknown }).step === "string") {
          const obj = s as { step: string; note?: unknown };
          return {
            step: obj.step,
            note: typeof obj.note === "string" ? obj.note : undefined,
          };
        }
        return null;
      })
      .filter((x): x is { step: string; note?: string } => x !== null),
    anatomy: anatomy.filter((x): x is string => typeof x === "string"),
    redFlags: redFlags.filter((x): x is string => typeof x === "string"),
    history: {
      priorCount:
        typeof history.priorCount === "number" ? history.priorCount : 0,
      summary:
        typeof history.summary === "string"
          ? history.summary
          : "No prior cases of this type logged.",
      patterns: patterns
        .map((p) => {
          if (!p || typeof p !== "object") return null;
          const obj = p as { kind?: unknown; text?: unknown };
          if (typeof obj.text !== "string") return null;
          const kind =
            obj.kind === "strength" || obj.kind === "weakness" ? obj.kind : "note";
          return { kind, text: obj.text };
        })
        .filter(
          (x): x is { kind: "strength" | "weakness" | "note"; text: string } =>
            x !== null,
        ),
      lastReflection:
        typeof history.lastReflection === "string"
          ? history.lastReflection
          : undefined,
    },
    focusForThisCase: focusForThisCase.filter(
      (x): x is string => typeof x === "string",
    ),
  };
}

/**
 * Strip a ```json ... ``` code fence if Claude wrapped the JSON in one despite
 * being told not to. Defensive — saves a parse failure on a minor prompt drift.
 */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\n?([\s\S]*?)\n?```$/);
  return fence ? fence[1].trim() : trimmed;
}

/**
 * Generate a Pre-Op Brief. Throws only on programmer errors — LLM failures
 * are returned as `{ engine: "unavailable", brief: <minimal fallback> }` so
 * the UI always has something to show.
 */
export async function generateBrief(
  input: GenerateBriefInput,
): Promise<BriefResult> {
  try {
    const result = await callClaude({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(input.userInput, input.cases),
      temperature: 0.3,
      maxTokens: 2048,
    });

    const cleaned = stripCodeFence(result.text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      throw new LlmUnavailableError(
        `Failed to parse brief JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const brief = asCaseBrief(parsed);
    if (!brief) {
      throw new LlmUnavailableError("Brief JSON did not match expected shape");
    }

    return {
      brief,
      engine: "claude-opus-4-6",
      usage: result.usage,
    };
  } catch (err) {
    if (!(err instanceof LlmUnavailableError)) throw err;
    // Minimal fallback: the client still renders something usable and the
    // warning banner tells the user why it's thin.
    return {
      brief: {
        context: { procedure: input.userInput.slice(0, 60) },
        keySteps: [],
        anatomy: [],
        redFlags: [],
        history: {
          priorCount: input.cases.length,
          summary:
            input.cases.length > 0
              ? `You've logged ${input.cases.length} cases in your history.`
              : "No prior cases logged yet.",
          patterns: [],
        },
        focusForThisCase: [],
      },
      engine: "unavailable",
      warnings: [`AI brief unavailable (${err.message}). Try again in a moment.`],
    };
  }
}
