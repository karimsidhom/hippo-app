'use client';

import { Zap, Lock } from 'lucide-react';

interface WeeklyProgressProps {
  used: number;
  limit: number;
  isFree: boolean;
  onUpgrade?: () => void;
}

export function WeeklyProgress({ used, limit, isFree, onUpgrade }: WeeklyProgressProps) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const limitReached = used >= limit;

  const barColor = limitReached
    ? '#ef4444'
    : pct >= 80
    ? '#f59e0b'
    : '#2563eb';

  if (!isFree) return null;

  return (
    <div
      className={`bg-[#111118] border rounded-xl p-5 ${limitReached ? 'border-red-500/40' : 'border-[#1e2130]'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-slate-200 font-medium text-sm">Weekly Cases</p>
          <p className="text-slate-500 text-xs mt-0.5">Free tier — {limit} cases/week</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-slate-100">{used}</span>
          <span className="text-slate-500 text-sm"> / {limit}</span>
        </div>
      </div>

      <div className="h-2 bg-[#1e2130] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>

      {limitReached ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <Lock className="w-4 h-4" />
            <span>Weekly limit reached — resets Monday</span>
          </div>
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-medium transition-colors"
          >
            <Zap className="w-3 h-3" />
            Unlock Unlimited
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-xs">{limit - used} case{limit - used !== 1 ? 's' : ''} remaining this week</p>
          <button
            onClick={onUpgrade}
            className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
          >
            Upgrade for unlimited →
          </button>
        </div>
      )}
    </div>
  );
}
