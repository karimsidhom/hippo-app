// ---------------------------------------------------------------------------
// Dictation system — public types
// ---------------------------------------------------------------------------

/** Known clinical services. Add new ones here when you scaffold the service. */
export type ServiceKey =
  | "general-surgery"
  | "vascular"
  | "obgyn"
  | "urology"
  | "plastics"
  | "orthopedics"
  | "neurosurgery"
  | "ent"
  | "pediatric-surgery"
  | "icu-trauma"
  | "emergency"
  | "ward"
  | "unknown";

/** The kinds of notes the system can produce. */
export type NoteType =
  | "operative"
  | "bedside-procedure"
  | "consult"
  | "follow-up"
  | "clinic"
  | "discharge"
  | "handover";

/**
 * Three length variants for every note type:
 * - full: the complete dictation, suitable for the formal record
 * - concise: trimmed to the clinically relevant essentials
 * - handover: one-screen summary suitable for sign-out / verbal handoff
 */
export type LengthLevel = "full" | "concise" | "handover";

/** Minimal clinical context the non-operative note types need. */
export interface NoteContext {
  service: ServiceKey;
  /** Free-text problem / reason for consult / chief complaint. */
  reason?: string;
  /** One-liner about the patient (age, sex, comorbidities). */
  patientOneLiner?: string;
  /** Pertinent history of present illness. */
  hpi?: string;
  /** Relevant past medical/surgical history. */
  pmh?: string;
  /** Medications. */
  meds?: string;
  /** Allergies. */
  allergies?: string;
  /** Exam findings. */
  exam?: string;
  /** Labs / imaging / investigations. */
  investigations?: string;
  /** Clinical assessment / impression (free-text if pre-written). */
  assessment?: string;
  /** Management plan (free-text if pre-written). */
  plan?: string;
  /** Disposition for consult/discharge notes. */
  disposition?: string;
  /** Any additional context the revision engine should preserve. */
  raw?: string;
}

/** Core request object for building any note. */
export interface BuildRequest<TCtx = NoteContext> {
  noteType: NoteType;
  length: LengthLevel;
  service: ServiceKey;
  context: TCtx;
}

/** Result of building a note — text plus any warnings for missing details. */
export interface BuildResult {
  text: string;
  missing: string[];
  warnings: string[];
}
