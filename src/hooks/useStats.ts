'use client';

import { useMemo } from 'react';
import { CaseLog } from '@/lib/types';
import { getCaseStats, getOperativeTimeStats, getLearningCurveData, getMonthlyVolume, getRoleProgression, getApproachDistribution } from '@/lib/stats';

export function useStats(cases: CaseLog[]) {
  const safeCases = cases ?? [];
  const stats = useMemo(() => getCaseStats(safeCases), [safeCases]);
  const timeStats = useMemo(() => getOperativeTimeStats(safeCases), [safeCases]);
  const monthlyVolume = useMemo(() => getMonthlyVolume(safeCases), [safeCases]);
  const roleProgression = useMemo(() => getRoleProgression(safeCases), [safeCases]);
  const approachDist = useMemo(() => getApproachDistribution(safeCases), [safeCases]);

  const learningCurveFor = (procedure: string) =>
    getLearningCurveData(safeCases, procedure);

  const now = new Date();
  const thisMonth = safeCases.filter(c => {
    const d = new Date(c.caseDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const thisYear = safeCases.filter(c => new Date(c.caseDate).getFullYear() === now.getFullYear());

  const firstSurgeonRate = safeCases.length > 0
    ? Math.round((safeCases.filter(c => c.role === 'Primary Surgeon' || c.role === 'Console Surgeon' || c.role === 'Fully Independent').length / safeCases.length) * 100)
    : 0;

  const avgDuration = safeCases.length > 0
    ? Math.round(safeCases.reduce((s, c) => s + (c.operativeDurationMinutes ?? 0), 0) / safeCases.length)
    : 0;

  return {
    stats,
    timeStats,
    monthlyVolume,
    roleProgression,
    approachDist,
    learningCurveFor,
    thisMonthCount: thisMonth.length,
    thisYearCount: thisYear.length,
    firstSurgeonRate,
    avgDuration,
    totalCases: safeCases.length,
  };
}
