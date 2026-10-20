// ---------------------------------------------------------------------------
// Carry-forward: the two-column view, and the rules for publishing.
//
// The previous meeting's column is never copied into this meeting's row. It
// is read through PdMeeting.previousMeetingId at render time, so correcting
// an old record does not silently rewrite the next one's left column, and a
// meeting is never storing someone else's text.
// ---------------------------------------------------------------------------
import {
  GOALS_SECTION_ID,
  PD_SECTIONS,
  type PdBullet,
  type PdSections,
} from './types';

export interface SectionView {
  id: string;
  label: string;
  /** Read-only, from the previous published meeting. Empty on a first meeting. */
  previous: PdBullet[];
  /** Editable, this meeting's column. */
  current: PdBullet[];
}

function bulletsOf(sections: PdSections | null, id: string): PdBullet[] {
  const s = sections?.[id];
  return Array.isArray(s?.bullets) ? s.bullets : [];
}

/**
 * Build the editor's eight rows. Always returns all eight in letter order,
 * whatever either side happens to contain, so the editor never has to guess
 * at a missing key and an older record with fewer sections still renders.
 */
export function buildMeetingView(
  current: PdSections,
  previous: PdSections | null,
  labels: Record<string, string> = {},
): SectionView[] {
  return PD_SECTIONS.map((s) => ({
    id: s.id,
    label: labels[s.id] ?? s.label,
    previous: bulletsOf(previous, s.id),
    current: bulletsOf(current, s.id),
  }));
}

/** Fresh id for a carried bullet. Stable enough; collisions do not matter. */
function newBulletId(): string {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Copy a previous-meeting bullet into this meeting. The outcome is
 * deliberately dropped: it described what happened to the OLD goal, and
 * re-stating the goal starts that question again.
 */
export function carryBullet(b: PdBullet): PdBullet {
  return { id: newBulletId(), text: b.text, carriedFrom: b.id };
}

export interface PublishProblem {
  sectionId: string;
  message: string;
}

/**
 * What must be true before a meeting can be published.
 *
 *   1. Something was actually recorded.
 *   2. Every goal the PREVIOUS meeting set has an outcome on some bullet in
 *      this meeting's goals section. That is the only thing this app asks
 *      for that the paper letter does not.
 */
export function validateForPublish(
  current: PdSections,
  previous: PdSections | null,
): PublishProblem[] {
  const problems: PublishProblem[] = [];

  const hasAnything = PD_SECTIONS.some((s) =>
    bulletsOf(current, s.id).some((b) => b.text.trim().length > 0),
  );
  if (!hasAnything) {
    problems.push({
      sectionId: PD_SECTIONS[0].id,
      message: 'There is nothing in this record yet.',
    });
    return problems;
  }

  const previousGoals = bulletsOf(previous, GOALS_SECTION_ID);
  if (previousGoals.length > 0) {
    const resolved = new Set(
      bulletsOf(current, GOALS_SECTION_ID)
        .filter((b) => b.outcome && b.carriedFrom)
        .map((b) => b.carriedFrom as string),
    );
    const unresolved = previousGoals.filter((g) => !resolved.has(g.id));
    if (unresolved.length > 0) {
      problems.push({
        sectionId: GOALS_SECTION_ID,
        message:
          unresolved.length === 1
            ? 'One goal from the last meeting still needs an outcome.'
            : `${unresolved.length} goals from the last meeting still need an outcome.`,
      });
    }
  }

  return problems;
}
