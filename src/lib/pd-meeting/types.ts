// ---------------------------------------------------------------------------
// PD 1:1 meeting record types.
//
// The eight section IDs are fixed here rather than configured, because the
// PDF layout in Phase 3 depends on knowing them. A programme may relabel or
// hide a section through ProgramMeetingConfig.sectionConfig; it may not
// invent a ninth.
// ---------------------------------------------------------------------------

export interface PdSectionDef {
  id: string;
  /** Default heading. ProgramMeetingConfig.sectionConfig may override it. */
  label: string;
}

// `as const satisfies` rather than an annotation: an annotation would widen
// every id back to `string` and PdSectionId below would stop being a union.
export const PD_SECTIONS = [
  { id: 'progress',          label: 'Progress in training' },
  { id: 'goals',             label: 'Immediate goals' },
  { id: 'career',            label: 'Career planning' },
  { id: 'resident_concerns', label: 'Areas of concern on behalf of residents' },
  { id: 'faculty_concerns',  label: 'Areas for improvement / areas of concern on behalf of Faculty' },
  { id: 'tres',              label: 'T-RES' },
  { id: 'cbd',               label: 'Current CBD levels' },
  { id: 'entrada',           label: 'Entrada reminders' },
] as const satisfies readonly PdSectionDef[];

export type PdSectionId = (typeof PD_SECTIONS)[number]['id'];

/**
 * The one section whose previous-meeting bullets must be given an outcome
 * before this meeting can be published. It is the loop the paper letter
 * never closes: goals are restated, never resolved.
 */
export const GOALS_SECTION_ID = 'goals';

export type PdGoalOutcome = 'met' | 'partly' | 'not_met' | 'carried';

export interface PdBullet {
  id: string;
  text: string;
  /** Only meaningful inside the goals section. */
  outcome?: PdGoalOutcome;
  /** The previous-meeting bullet id this was carried forward from. */
  carriedFrom?: string;
}

/** Stored on PdMeeting.sections. This meeting's column only. */
export interface PdSections {
  [sectionId: string]: { bullets: PdBullet[] };
}

// ── Per-program configuration ──────────────────────────────────────────

export interface ChecklistItemDef {
  id: string;
  label: string;
  /** Free text, e.g. "PGY1" or "PGY 3-5". Printed in its own column. */
  targetYear?: string;
}

export interface ChecklistDef {
  id: string;
  title: string;
  items: ChecklistItemDef[];
}

export interface ScoreColumnDef {
  id: string;
  label: string;
}

export interface ScoreTableDef {
  id: string;
  title: string;
  /** The date column is implicit and always first. */
  columns: ScoreColumnDef[];
}

export interface CertificationDef {
  id: string;
  label: string;
}

export interface LetterheadDef {
  lines: string[];
}

export interface MeetingConfig {
  checklists: ChecklistDef[];
  scoreTables: ScoreTableDef[];
  certifications: CertificationDef[];
  introText: string;
  letterhead: LetterheadDef;
}

/**
 * Coerce a Prisma Json column into PdSections.
 *
 * Prisma types a Json column as string | number | boolean | JsonObject |
 * JsonArray, none of which overlaps PdSections, so a direct cast is a type
 * error and `as unknown as` at every call site invites a real array or
 * string through. This checks the shape once and hands back empty sections
 * when the value is anything else, which is also what a legacy row with a
 * null column should render as.
 */
export function asSections(value: unknown): PdSections {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return emptySections();
  }
  return value as PdSections;
}

/** Empty sections for a brand new meeting. */
export function emptySections(): PdSections {
  const out: PdSections = {};
  for (const s of PD_SECTIONS) out[s.id] = { bullets: [] };
  return out;
}
