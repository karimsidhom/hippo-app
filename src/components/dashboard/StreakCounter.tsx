'use client';

import { Flame } from 'lucide-react';
import { CaseLog } from '@/lib/types';
import { getStreak } from '@/lib/milestones';

interface StreakCounterProps {
  cases: CaseLog[];
}

export function StreakCounter({ cases }: StreakCounterProps) {
  const { currentStreak, longestStreak } = getStreak(cases ?? []);

  return (
    <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-5 flex items-center gap-4 hover:border-orange-500/30 transition-colors">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: currentStreak > 0
            ? 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)'
            : '#1e2130',
        }}
      >
        <Flame className={`w-6 h-6 ${currentStreak > 0 ? 'text-white' : 'text-slate-600'}`} />
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-100">{currentStreak}</span>
          <span className="text-slate-400 text-sm">day streak</span>
        </div>
        <p className="text-slate-500 text-xs mt-0.5">
          {currentStreak === 0
            ? 'Log a case today to start your streak'
            : currentStreak === 1
            ? 'Keep it going — log tomorrow!'
            : `${currentStreak} consecutive days of logging`}
        </p>
        {longestStreak > 0 && (
          <p className="text-slate-600 text-xs mt-0.5">Best: {longestStreak} days</p>
        )}
      </div>
    </div>
  );
}
