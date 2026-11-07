'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkPersonalRecords } from '@/lib/milestones';
import { PersonalRecord } from '@/lib/types';

export function useMilestones() {
  const { cases, milestones, addMilestone } = useAuth();

  /**
   * Compute personal records from logged cases.
   * These are derived client-side from the case list for instant display;
   * the server also stores records via POST /api/personal-records for persistence.
   */
  const personalRecords = useMemo((): PersonalRecord[] => {
    const safeCases = cases ?? [];
    try {
      return checkPersonalRecords('user', {} as never, safeCases, []);
    } catch {
      return [];
    }
  }, [cases]);

  return {
    milestones:    milestones ?? [],
    personalRecords,
    addMilestone,
  };
}
