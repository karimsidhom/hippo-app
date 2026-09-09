/**
 * Single source of truth for turning a role + PGY year into the label the
 * app shows everywhere (profile header, dashboard, PD dashboard, exports).
 *
 * Previously the label was only ever written once, during onboarding, as
 * `PGY-${pgyYear}`. Editing pgyYear later never touched the label, so the
 * visible "training year" never changed. Anything that needs to display or
 * persist a training-year label should route through this function instead
 * of formatting `PGY-${n}` inline.
 */
export function trainingYearLabelFor(
  roleType: string | null | undefined,
  pgyYear: number | null | undefined,
): string | null {
  const isStaffLike =
    roleType === 'STAFF' || roleType === 'ATTENDING' || roleType === 'PROGRAM_DIRECTOR';

  if (isStaffLike) return null;
  if (pgyYear === null || pgyYear === undefined) return null;

  return `PGY-${pgyYear}`;
}

/**
 * Suggests a PGY year from a residency start date, using the standard
 * North American academic year boundary of July 1. Someone who started
 * 2023-07-01 is PGY-1 through 2024-06-30, PGY-2 through 2025-06-30, and so
 * on — so they read as PGY-4 on 2026-09-06.
 *
 * Returns null when there's no start date to anchor on. Clamped to 1..10
 * so a stale or far-future start date never produces a nonsensical label.
 */
export function suggestedPgyFromStart(
  residencyStartDate: Date | string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!residencyStartDate) return null;

  const start =
    residencyStartDate instanceof Date ? residencyStartDate : new Date(residencyStartDate);
  if (Number.isNaN(start.getTime())) return null;

  const academicYearOf = (d: Date): number => {
    const year = d.getFullYear();
    const julyFirst = new Date(year, 6, 1);
    return d.getTime() >= julyFirst.getTime() ? year : year - 1;
  };

  const elapsed = academicYearOf(now) - academicYearOf(start);
  const pgy = elapsed + 1;

  return Math.min(10, Math.max(1, pgy));
}
