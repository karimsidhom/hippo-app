/**
 * "On track" projections.
 *
 * Pure functions: given a resident's cases, the targets their program holds
 * them to, and a graduation date, say for each target where they stand,
 * what their recent rate is, where that rate lands them at graduation, and
 * what rate they would need from today to make it. No database, no React,
 * so it can be unit-tested with fixtures and reused by the weekly digest.
 */

import type { CaseLog } from './types';

export type TargetMatchType = 'TOTAL' | 'CATEGORY' | 'PROCEDURE' | 'INDEPENDENT';

export interface CaseTargetDef {
  id: string;
  label: string;
  matchType: TargetMatchType;
  /** Category name, or a procedure-name substring; ignored for TOTAL and INDEPENDENT. */
  matchValue: string | null;
  target: number;
  /** Per-target due date. Falls back to the graduation date when null. */
  dueDate: Date | null;
}

export type TrackStatus = 'done' | 'on_track' | 'at_risk' | 'behind' | 'no_due_date';

export interface TargetProgress {
  id: string;
  label: string;
  matchType: TargetMatchType;
  matchValue: string | null;
  target: number;
  current: number;
  remaining: number;
  /** Cases per 30 days over the trailing window (or all time if the log is shorter). */
  ratePerMonth: number;
  /** Months from today to the due date, never negative. */
  monthsLeft: number | null;
  /** current + ratePerMonth * monthsLeft, rounded down. */
  projected: number | null;
  /** Cases per 30 days needed from today to hit the target on time. */
  neededPerMonth: number | null;
  status: TrackStatus;
  dueDate: Date | null;
}

export interface ProjectionOptions {
  today?: Date;
  graduationDate?: Date | null;
  /** Trailing window used to estimate the rate. Default 180 days. */
  windowDays?: number;
}

const DAY = 24 * 60 * 60 * 1000;
const MONTH_DAYS = 30.44;

function norm(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

/** Does this case count toward the target? */
export function caseMatchesTarget(c: CaseLog, t: CaseTargetDef): boolean {
  switch (t.matchType) {
    case 'TOTAL':
      return true;
    case 'INDEPENDENT':
      return c.autonomyLevel === 'INDEPENDENT' || c.autonomyLevel === 'TEACHING';
    case 'CATEGORY':
      return norm(c.procedureCategory) === norm(t.matchValue);
    case 'PROCEDURE': {
      const needle = norm(t.matchValue);
      return needle.length > 0 && norm(c.procedureName).includes(needle);
    }
    default:
      return false;
  }
}

/** Cases per 30 days over the trailing window. Uses the log's real span when it is shorter. */
export function ratePerMonth(dates: Date[], today: Date, windowDays: number): number {
  if (dates.length === 0) return 0;
  const windowStart = new Date(today.getTime() - windowDays * DAY);
  const earliest = dates.reduce((a, b) => (a < b ? a : b));
  const spanStart = earliest > windowStart ? earliest : windowStart;
  const spanDays = Math.max(1, (today.getTime() - spanStart.getTime()) / DAY);
  const inWindow = dates.filter((d) => d >= spanStart && d <= today).length;
  return (inWindow / spanDays) * MONTH_DAYS;
}

export function projectTarget(
  cases: CaseLog[],
  t: CaseTargetDef,
  opts: ProjectionOptions = {},
): TargetProgress {
  const today = opts.today ?? new Date();
  const windowDays = opts.windowDays ?? 180;
  const due = t.dueDate ?? opts.graduationDate ?? null;

  const matched = cases.filter((c) => caseMatchesTarget(c, t));
  const dates = matched.map((c) => new Date(c.caseDate)).filter((d) => !Number.isNaN(d.getTime()));
  const current = matched.length;
  const remaining = Math.max(0, t.target - current);
  const rate = ratePerMonth(dates, today, windowDays);

  let monthsLeft: number | null = null;
  let projected: number | null = null;
  let neededPerMonth: number | null = null;
  let status: TrackStatus;

  if (remaining === 0) {
    status = 'done';
    if (due) monthsLeft = Math.max(0, (due.getTime() - today.getTime()) / DAY / MONTH_DAYS);
  } else if (!due) {
    status = 'no_due_date';
  } else {
    monthsLeft = Math.max(0, (due.getTime() - today.getTime()) / DAY / MONTH_DAYS);
    projected = Math.floor(current + rate * monthsLeft);
    neededPerMonth = monthsLeft > 0 ? remaining / monthsLeft : Infinity;
    if (monthsLeft === 0) status = 'behind';
    else if (projected >= t.target) status = 'on_track';
    else if (projected >= t.target * 0.85) status = 'at_risk';
    else status = 'behind';
  }

  return {
    id: t.id,
    label: t.label,
    matchType: t.matchType,
    matchValue: t.matchValue,
    target: t.target,
    current,
    remaining,
    ratePerMonth: Math.round(rate * 10) / 10,
    monthsLeft: monthsLeft === null ? null : Math.round(monthsLeft * 10) / 10,
    projected,
    neededPerMonth:
      neededPerMonth === null ? null : Number.isFinite(neededPerMonth) ? Math.round(neededPerMonth * 10) / 10 : null,
    status,
    dueDate: due,
  };
}

export function projectAll(
  cases: CaseLog[],
  targets: CaseTargetDef[],
  opts: ProjectionOptions = {},
): TargetProgress[] {
  const order: Record<TrackStatus, number> = { behind: 0, at_risk: 1, no_due_date: 2, on_track: 3, done: 4 };
  return targets
    .map((t) => projectTarget(cases, t, opts))
    .sort((a, b) => order[a.status] - order[b.status] || b.remaining - a.remaining);
}

/**
 * Suggest targets from the resident's own log: the categories they log most,
 * with no number attached. The number is the program's, not ours.
 */
export function suggestTargetsFromLog(cases: CaseLog[], max = 8): Omit<CaseTargetDef, 'id' | 'target' | 'dueDate'>[] {
  const counts = new Map<string, number>();
  for (const c of cases) {
    const k = (c.procedureCategory ?? '').trim();
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max);
  return [
    { label: 'Total cases', matchType: 'TOTAL', matchValue: null },
    { label: 'Independent or teaching cases', matchType: 'INDEPENDENT', matchValue: null },
    ...top.map(([k]) => ({ label: k, matchType: 'CATEGORY' as const, matchValue: k })),
  ];
}

export const STATUS_LABEL: Record<TrackStatus, string> = {
  done: 'Done',
  on_track: 'On track',
  at_risk: 'At risk',
  behind: 'Behind',
  no_due_date: 'Set a date',
};
