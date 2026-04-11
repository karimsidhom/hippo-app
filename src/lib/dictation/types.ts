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
  | "cardiothoracic"
  | "unknown";

/**
 * The only note type this system produces right now is the operative note.
 * Kept as a single-member union so other files keep their type imports clean
 * and so adding future note types (if ever) is a one-line change.
 */
export type NoteType = "operative";

/**
 * Three length variants for the operative note:
 * - full: the complete dictation, suitable for the formal record
 * - concise: trimmed to the clinically relevant essentials
 * - handover: one-screen summary suitable for sign-out / verbal handoff
 */
export type LengthLevel = "full" | "concise" | "handover";

/** Result of building / revising a note — text plus any warnings. */
export interface BuildResult {
  text: string;
  missing: string[];
  warnings: string[];
}
