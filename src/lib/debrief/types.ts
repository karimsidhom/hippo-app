// ---------------------------------------------------------------------------
// Post-Op Debrief — shared types
//
// A "debrief" is the resident's structured reflection on a case they've
// already done: what went well, what to do differently, what to work on.
// It lives on CaseLog.reflection as a JSON-encoded StructuredDebrief blob.
//
// Storage shape (on CaseLog.reflection):
//   - OLD rows (pre-debrief feature) contain a plain freeform string.
//   - NEW rows contain `JSON.stringify(StructuredDebrief)`.
//
// Callers that read reflection data MUST use `parseStoredReflection()`
// below to get a normalized view — never JSON.parse directly.
// ---------------------------------------------------------------------------

/**
 * Structured debrief payload. Versioned so future additions (e.g. per-step
 * self-ratings) don't break older rows.
 */
export interface StructuredDebrief {
  v: 2;
  wentWell: string;
  doBetter: string;
  workOn: string;
  /** Raw transcript when the debrief came from voice input, for auditing. */
  raw?: string;
  /** ISO timestamp — set server-side when the debrief is saved. */
  createdAt?: string;
}

/**
 * Normalized view of whatever was stored in `CaseLog.reflection`. Always
 * safe to render — `structured` is populated for new-format rows, `freeform`
 * for legacy rows, and both are empty for rows with no reflection at all.
 */
export interface ParsedReflection {
  structured: StructuredDebrief | null;
  freeform: string | null;
}

/**
 * Best-effort parse of a stored `CaseLog.reflection` value. Handles:
 *   - null / empty string → { structured: null, freeform: null }
 *   - JSON string with v===2 → { structured, freeform: null }
 *   - plain text → { structured: null, freeform: text }
 *
 * Never throws — even invalid JSON falls through to freeform.
 */
export function parseStoredReflection(
  raw: string | null | undefined,
): ParsedReflection {
  if (!raw) return { structured: null, freeform: null };

  const trimmed = raw.trim();
  if (!trimmed) return { structured: null, freeform: null };

  // Heuristic: only attempt JSON.parse if it looks like a JSON object.
  // Avoids spurious parse attempts on freeform reflections that happen
  // to contain curly braces from quoted speech.
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (isStructuredDebrief(parsed)) {
        return { structured: parsed, freeform: null };
      }
    } catch {
      // Fall through — treat as freeform.
    }
  }

  return { structured: null, freeform: trimmed };
}

function isStructuredDebrief(value: unknown): value is StructuredDebrief {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === 2 &&
    typeof v.wentWell === "string" &&
    typeof v.doBetter === "string" &&
    typeof v.workOn === "string"
  );
}

/** Server response from /api/debrief/parse. */
export interface DebriefParseResult {
  debrief: StructuredDebrief;
  engine: "claude-opus-4-6" | "unavailable";
  usage?: { input_tokens: number; output_tokens: number };
  warnings?: string[];
}
