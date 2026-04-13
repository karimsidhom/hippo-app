'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { CaseLog } from '@/lib/types';

export type CaseFilters = {
  specialty?: string;
  procedure?: string;
  role?:      string;
  approach?:  string;
  startDate?: Date;
  endDate?:   Date;
  search?:    string;
};

function getWeekStart(): Date {
  const now  = new Date();
  const day  = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function useCases(filters: CaseFilters = {}) {
  const { cases, addCase, addCaseAsync, updateCase, deleteCase } = useAuth();
  const { isFree } = useSubscription();

  const weekStart    = getWeekStart();
  const weeklyLimit  = isFree ? 5 : Infinity;

  const casesThisWeek = useMemo(
    () => cases.filter(c => new Date(c.caseDate) >= weekStart),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cases],
  );

  const weeklyUsed      = casesThisWeek.length;
  const weeklyRemaining = isFree ? Math.max(0, 5 - weeklyUsed) : Infinity;
  const weeklyLimitReached = isFree && weeklyUsed >= 5;

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      if (filters.specialty) {
        const match =
          (c.specialtyId   ?? '') === filters.specialty ||
          (c.specialtyName ?? '') === filters.specialty;
        if (!match) return false;
      }
      if (filters.procedure && !c.procedureName.toLowerCase().includes(filters.procedure.toLowerCase())) return false;
      if (filters.role     && c.role !== filters.role) return false;
      if (filters.approach && c.surgicalApproach !== filters.approach) return false;
      if (filters.startDate && new Date(c.caseDate) < filters.startDate) return false;
      if (filters.endDate   && new Date(c.caseDate) > filters.endDate)   return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hit =
          c.procedureName.toLowerCase().includes(q) ||
          (c.specialtyName ?? '').toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [cases, filters]);

  const recentCases = useMemo(
    () =>
      [...cases]
        .sort((a, b) => new Date(b.caseDate).getTime() - new Date(a.caseDate).getTime())
        .slice(0, 5),
    [cases],
  );

  function duplicateCase(id: string): CaseLog | undefined {
    const original = cases.find(c => c.id === id);
    if (!original) return;
    return addCase({ ...original, caseDate: new Date() });
  }

  return {
    cases,
    filteredCases,
    recentCases,
    addCase,
    addCaseAsync,
    updateCase,
    deleteCase,
    duplicateCase,
    weeklyUsed,
    weeklyLimit,
    weeklyRemaining,
    weeklyLimitReached,
  };
}
