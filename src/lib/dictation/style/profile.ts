import type { NoteType, ServiceKey } from "../types";

// ---------------------------------------------------------------------------
// Dictation Style Profile
//
// A durable record of how the user likes their notes to be written. The
// profile is updated over time via `learn.ts` whenever the user supplies a
// corrected dictation, and applied at render time via `apply.ts`.
// ---------------------------------------------------------------------------

export interface StyleProfile {
  /** Schema version so we can migrate older stored profiles. */
  version: 1;

  /** Global preferences that apply to every note. */
  global: {
    /** How brief the user likes their notes. Higher = more trimming. */
    brevity: "verbose" | "standard" | "concise";
    /** Preferred section-header style. */
    headerStyle: "upper" | "title" | "plain";
    /**
     * Preferred section order keyed by section label. When present, the
     * renderer will reorder to match and drop any sections the user
     * consistently removes.
     */
    sectionOrder?: string[];
    /** Sections the user consistently removed from their corrections. */
    droppedSections?: string[];
    /** Wording patterns the user reliably uses. */
    preferredPhrases: string[];
    /** Wording patterns the user explicitly removed when correcting. */
    avoidPhrases: string[];
    /**
     * Phrase substitutions the user has shown a preference for —
     * { from: "drafted phrase", to: "preferred phrase" }. Applied at
     * render time as a literal replace.
     */
    phraseSubstitutions?: Array<{ from: string; to: string }>;
    /** Formatting preferences — line spacing, blank lines between sections. */
    formatting?: {
      /** 0 = no blank line between sections, 1 = one blank (default), 2 = two. */
      blankLinesBetweenSections?: number;
      /** If true, keep blank lines between labeled header rows. */
      blankLineAfterHeaders?: boolean;
      /** If true, section headers end with a colon on their own line. */
      headersOnOwnLine?: boolean;
      /** User's preferred bullet character, or null if they prefer prose. */
      bulletStyle?: "-" | "•" | "*" | null;
    };
    /**
     * Count of corrections ingested. Used to weight noisy single-correction
     * signals versus high-confidence repeated patterns.
     */
    correctionCount?: number;
  };

  /** Service-scoped overrides, keyed by ServiceKey. */
  services: Partial<Record<ServiceKey, ServiceStyle>>;

  /** Note-type-scoped overrides, keyed by NoteType. */
  noteTypes: Partial<Record<NoteType, NoteTypeStyle>>;

  /** Examples the user has labeled as "good" — used for future few-shot priming. */
  examples: Array<{
    noteType: NoteType;
    service: ServiceKey;
    excerpt: string;
    savedAt: string;
  }>;

  /** Timestamp of the last profile update. */
  updatedAt: string;
}

export interface ServiceStyle {
  preferredPhrases?: string[];
  avoidPhrases?: string[];
  /** Per-procedure wording pearls the user wants surfaced. */
  procedurePearls?: Record<string, string[]>;
}

export interface NoteTypeStyle {
  /** Preferred section order, e.g. ["HPI", "Exam", "Imaging", "A/P"]. */
  sectionOrder?: string[];
  preferredPhrases?: string[];
  avoidPhrases?: string[];
}

export const DEFAULT_STYLE_PROFILE: StyleProfile = {
  version: 1,
  global: {
    brevity: "standard",
    headerStyle: "upper",
    preferredPhrases: [],
    avoidPhrases: [
      // Generic AI-ish phrasing residents consistently dislike
      "it is important to note that",
      "in conclusion",
      "in summary",
      "as an AI",
    ],
  },
  services: {},
  noteTypes: {},
  examples: [],
  updatedAt: new Date(0).toISOString(),
};
