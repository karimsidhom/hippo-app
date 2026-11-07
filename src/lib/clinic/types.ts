// Hippo Clinic — shared types.
//
// We mirror the Prisma enums as string-literal unions so client components
// can use them without pulling in the Prisma client. Keep these in sync with
// prisma/schema.prisma if you add a value.

export type ClinicNoteType =
  | "NEW_CONSULT"
  | "FOLLOW_UP"
  | "POST_OP"
  | "CANCER_SURVEILLANCE"
  | "RESULTS_REVIEW"
  | "PROCEDURE_COUNSELLING"
  | "MEDICATION_FOLLOW_UP"
  | "DISCHARGE_FOLLOW_UP"
  | "CUSTOM";

export type ClinicInputMode =
  | "AMBIENT"
  | "DICTATION"
  | "TYPED"
  | "PASTED"
  | "UPLOADED";

export type ClinicNoteStatus =
  | "DRAFT"
  | "RECORDING"
  | "UPLOADING"
  | "TRANSCRIBING"
  | "GENERATING"
  | "NEEDS_REVIEW"
  | "FINALIZED"
  | "FAILED";

export type ClinicConsentMode =
  | "VERBAL"
  | "WRITTEN"
  | "DECLINED"
  | "NOT_REQUIRED";

export type ClinicFollowUpStatus =
  | "DUE_SOON"
  | "OVERDUE"
  | "WAITING_RESULTS"
  | "NEEDS_CALL"
  | "NEEDS_LETTER"
  | "NEEDS_BOOKING"
  | "COMPLETED"
  | "CANCELLED";

export type MarkerKind =
  | "important"
  | "exam"
  | "plan"
  | "medication"
  | "follow-up"
  | "patient-instruction";

export interface ClinicNoteParagraphs {
  /** Intro + HPI (or follow-up context for follow-up notes). */
  p1: string;
  /** Past history + recent context (or interval history for follow-up). */
  p2: string;
  /** Subjective/objective/exam (or objective review for follow-up). */
  p3: string;
  /** Assessment + plan. */
  p4: string;
}

export interface ClinicNoteContent {
  paragraphs: ClinicNoteParagraphs;
  letter?: string;
  patientInstructions?: string;
  shortSummary?: string;
  /**
   * Spans the model marked uncertain — the UI highlights them so the
   * clinician sees where to scrutinise. Coordinates are character offsets
   * inside the paragraph string.
   */
  uncertainSpans?: Array<{
    section: keyof ClinicNoteParagraphs | "letter" | "patientInstructions";
    start: number;
    end: number;
    reason: string;
  }>;
  /** Sections marked "ai-inferred" rather than "said by patient". */
  inferredFlags?: Partial<Record<keyof ClinicNoteParagraphs, boolean>>;
  structured?: Record<string, unknown>;
  followUps?: Array<{
    kind: string;
    title: string;
    detail?: string;
    intervalLabel?: string;
  }>;
}

export interface ClinicTemplateDefinition {
  key: string;
  name: string;
  specialty: string;
  noteType: ClinicNoteType;
  description?: string;
  /** Hints prepended to the system prompt — what to look for in this template. */
  hints?: string[];
  /** Structured fields the UI surfaces for direct entry. */
  structuredFields?: Array<{
    key: string;
    label: string;
    type: "text" | "number" | "select" | "trend";
    options?: string[];
    placeholder?: string;
  }>;
  /** Optional letter style override (e.g. "consult to family physician"). */
  letterStyle?: string;
}

export interface ClinicianContext {
  fullName: string;
  email?: string;
  role?: string;        // "Resident, PGY-3" | "Staff Urologist" | etc.
  roleType?: string;    // raw enum value: "RESIDENT" | "STAFF" | etc.
  specialty?: string;
  province?: string;
  signatureLine?: string;
  /** "Make it sound like me" — clinician's saved voice preferences. */
  stylePrefs?: {
    /** From Profile.dictationLength: "complete" | "extra-detailed" | "brief" */
    length?: string;
    /** From Profile.dictationTone: "standard" | "academic" | "concise-attending" | "resident-teaching" */
    tone?: string;
    /** Phrases the clinician consistently keeps when correcting drafts. */
    preferredPhrases?: string[];
    /** Phrases they consistently strip out. */
    avoidPhrases?: string[];
  };
}

export interface AudioStatusSnapshot {
  state: "idle" | "recording" | "paused" | "uploading" | "transcribing" | "done" | "failed";
  qualityWarning?: string | null;
  chunksTotal: number;
  chunksUploaded: number;
  chunksTranscribed: number;
}
