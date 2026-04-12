// ---------------------------------------------------------------------------
// Pre-Op Brief — shared types
//
// A "Case Brief" is a short, personalized prep sheet for an upcoming case.
// It takes the resident's free-text description of what they're about to do
// ("lap chole tomorrow with Chen") and combines it with their own case
// history to produce targeted prep notes: key steps, anatomy reminders,
// red flags, and — most importantly — specific things THEY struggled with
// last time so they can focus on them.
// ---------------------------------------------------------------------------

/** Parsed identifiers from the resident's free-text input. */
export interface BriefContext {
  procedure: string;
  attending?: string;
  when?: string;
}

/** One critical step of the operation. */
export interface BriefStep {
  step: string;
  note?: string;
}

/** A pattern surfaced from the user's own case history. */
export interface BriefPattern {
  kind: "strength" | "weakness" | "note";
  text: string;
}

/** Snapshot of the user's history with this procedure. */
export interface BriefHistory {
  priorCount: number;
  summary: string;
  patterns: BriefPattern[];
  lastReflection?: string;
}

/**
 * The full brief payload. Rendered by the client as a structured document;
 * kept as JSON (not markdown) so each section can be styled consistently
 * with the rest of the dashboard.
 */
export interface CaseBrief {
  context: BriefContext;
  keySteps: BriefStep[];
  anatomy: string[];
  redFlags: string[];
  history: BriefHistory;
  focusForThisCase: string[];
}

/** Server response returned from /api/brief/generate. */
export interface BriefResult {
  brief: CaseBrief;
  /** Which engine produced the brief. */
  engine: "claude-opus-4-6" | "unavailable";
  usage?: { input_tokens: number; output_tokens: number };
  /** Non-fatal warnings — e.g. LLM fallback message. */
  warnings?: string[];
}

/** Minimal projection of a CaseLog that's safe to feed to the LLM. */
export interface BriefCaseContext {
  procedureName: string;
  caseDate: string;
  role: string;
  surgicalApproach: string;
  operativeDurationMinutes: number | null;
  complicationCategory: string;
  outcomeCategory: string;
  notes: string | null;
  reflection: string | null;
  attendingLabel: string | null;
}
