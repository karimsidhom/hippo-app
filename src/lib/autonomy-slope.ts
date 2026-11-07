/**
 * Autonomy slope: how fast a resident becomes independent.
 *
 * Programs report case counts. Nobody reports the rate at which residents
 * move from observer to independent. This module computes it from the case
 * log, per resident and per program, so the number exists the day someone
 * wants to publish it.
 *
 * Definitions (keep these fixed once data collection starts):
 *   - Autonomy ordinal: OBSERVER 0, ASSISTANT 1, SUPERVISOR_PRESENT 2,
 *     INDEPENDENT 3, TEACHING 4.
 *   - Training time: months from the resident's residencyStartDate to the
 *     case date. Without a start date the resident is excluded, not guessed.
 *   - Slope: ordinary least squares of autonomy ordinal on training months,
 *     in ordinal units per 12 months. Requires >= 20 cases spanning >= 6 months.
 *   - Program aggregate: median and interquartile range of member slopes,
 *     with n; never reported below 5 residents.
 *
 * Pure functions, unit-tested in scripts/test-autonomy-slope.ts.
 */

import type { AutonomyLevel, CaseLog } from './types';

export const AUTONOMY_ORDINAL: Record<AutonomyLevel, number> = {
  OBSERVER: 0,
  ASSISTANT: 1,
  SUPERVISOR_PRESENT: 2,
  INDEPENDENT: 3,
  TEACHING: 4,
};

export const MIN_CASES = 20;
export const MIN_SPAN_MONTHS = 6;
export const MIN_RESIDENTS_TO_REPORT = 5;

const MONTH_MS = 30.44 * 24 * 60 * 60 * 1000;

export interface ResidentSlope {
  userId: string;
  n: number;
  spanMonths: number;
  /** Ordinal units per 12 months of training. */
  slopePerYear: number | null;
  intercept: number | null;
  /** Share of cases INDEPENDENT or TEACHING in the last 6 months of the log. */
  recentIndependentShare: number | null;
  eligible: boolean;
  reason: string | null;
}

export function residentSlope(userId: string, cases: CaseLog[], residencyStart: Date | null): ResidentSlope {
  if (!residencyStart) {
    return { userId, n: cases.length, spanMonths: 0, slopePerYear: null, intercept: null, recentIndependentShare: null, eligible: false, reason: 'no residency start date' };
  }
  const pts = cases
    .map((c) => ({ x: (new Date(c.caseDate).getTime() - residencyStart.getTime()) / MONTH_MS, y: AUTONOMY_ORDINAL[c.autonomyLevel] }))
    .filter((p) => Number.isFinite(p.x) && p.x >= -1 && Number.isFinite(p.y));
  const n = pts.length;
  if (n === 0) return { userId, n: 0, spanMonths: 0, slopePerYear: null, intercept: null, recentIndependentShare: null, eligible: false, reason: 'no cases' };
  const xs = pts.map((p) => p.x);
  const span = Math.max(...xs) - Math.min(...xs);
  const latest = Math.max(...xs);
  const recent = pts.filter((p) => p.x >= latest - 6);
  const recentShare = recent.length ? recent.filter((p) => p.y >= 3).length / recent.length : null;

  if (n < MIN_CASES) return { userId, n, spanMonths: round1(span), slopePerYear: null, intercept: null, recentIndependentShare: recentShare, eligible: false, reason: `fewer than ${MIN_CASES} cases` };
  if (span < MIN_SPAN_MONTHS) return { userId, n, spanMonths: round1(span), slopePerYear: null, intercept: null, recentIndependentShare: recentShare, eligible: false, reason: `log spans under ${MIN_SPAN_MONTHS} months` };

  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of pts) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) * (p.x - mx);
  }
  if (sxx === 0) return { userId, n, spanMonths: round1(span), slopePerYear: null, intercept: null, recentIndependentShare: recentShare, eligible: false, reason: 'no spread in dates' };
  const slopePerMonth = sxy / sxx;
  return {
    userId,
    n,
    spanMonths: round1(span),
    slopePerYear: round2(slopePerMonth * 12),
    intercept: round2(my - slopePerMonth * mx),
    recentIndependentShare: recentShare === null ? null : round2(recentShare),
    eligible: true,
    reason: null,
  };
}

export interface ProgramSlope {
  residentsTotal: number;
  residentsEligible: number;
  residentsMissingStartDate: number;
  reportable: boolean;
  medianSlopePerYear: number | null;
  iqrSlopePerYear: [number, number] | null;
  medianRecentIndependentShare: number | null;
}

export function programSlope(slopes: ResidentSlope[]): ProgramSlope {
  const eligible = slopes.filter((s) => s.eligible && s.slopePerYear !== null);
  const missing = slopes.filter((s) => s.reason === 'no residency start date').length;
  const reportable = eligible.length >= MIN_RESIDENTS_TO_REPORT;
  const vals = eligible.map((s) => s.slopePerYear as number).sort((a, b) => a - b);
  const shares = eligible.map((s) => s.recentIndependentShare).filter((v): v is number => v !== null).sort((a, b) => a - b);
  return {
    residentsTotal: slopes.length,
    residentsEligible: eligible.length,
    residentsMissingStartDate: missing,
    reportable,
    medianSlopePerYear: reportable ? median(vals) : null,
    iqrSlopePerYear: reportable ? [quantile(vals, 0.25), quantile(vals, 0.75)] : null,
    medianRecentIndependentShare: reportable && shares.length ? median(shares) : null,
  };
}

function median(v: number[]): number {
  return quantile(v, 0.5);
}
function quantile(v: number[], q: number): number {
  if (v.length === 0) return NaN;
  const pos = (v.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return round2(v[lo] + (v[hi] - v[lo]) * (pos - lo));
}
function round1(x: number) { return Math.round(x * 10) / 10; }
function round2(x: number) { return Math.round(x * 100) / 100; }
