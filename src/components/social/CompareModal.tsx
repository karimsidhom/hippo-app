'use client';

import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CompareModalProps {
  currentUser: {
    name: string;
    initials: string;
    totalCases: number;
    thisMonth: number;
    avgDuration: number;
    topProcedure: string;
    firstSurgeonRate: number;
  };
  friend: {
    id: string;
    name: string;
    avatarInitials: string;
    specialty: string;
    totalCases: number;
    thisMonth: number;
    topProcedure: string;
  };
  onClose: () => void;
}

function Indicator({ mine, theirs }: { mine: number; theirs: number }) {
  if (mine > theirs) return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (mine < theirs) return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-slate-500" />;
}

function CompareRow({
  label,
  mine,
  theirs,
  unit = '',
  higherIsBetter = true,
}: {
  label: string;
  mine: number | string;
  theirs: number | string;
  unit?: string;
  higherIsBetter?: boolean;
}) {
  const mineNum = typeof mine === 'number' ? mine : 0;
  const theirsNum = typeof theirs === 'number' ? theirs : 0;
  const isBetter = higherIsBetter ? mineNum >= theirsNum : mineNum <= theirsNum;

  return (
    <div className="grid grid-cols-3 items-center py-3 border-b border-[#1e2130] last:border-0">
      <div className={`text-right pr-4 ${isBetter ? 'text-slate-100 font-semibold' : 'text-slate-400'}`}>
        {mine}{unit}
      </div>
      <div className="text-center text-slate-500 text-xs">{label}</div>
      <div className={`text-left pl-4 ${!isBetter ? 'text-slate-100 font-semibold' : 'text-slate-400'}`}>
        {theirs}{unit}
      </div>
    </div>
  );
}

export function CompareModal({ currentUser, friend, onClose }: CompareModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-[#16161f] border border-[#1e2130] rounded-2xl w-full max-w-lg p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-slate-100 font-bold text-lg">Head-to-Head</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Headers */}
        <div className="grid grid-cols-3 items-center mb-2">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mx-auto mb-1">
              {currentUser.initials}
            </div>
            <p className="text-slate-300 text-xs font-medium truncate">{currentUser.name.split(' ').pop()}</p>
            <p className="text-blue-400 text-xs">You</p>
          </div>
          <div className="text-center text-slate-600 text-sm font-medium">vs</div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm mx-auto mb-1">
              {friend.avatarInitials}
            </div>
            <p className="text-slate-300 text-xs font-medium truncate">{friend.name.split(' ').pop()}</p>
            <p className="text-slate-500 text-xs">{friend.specialty}</p>
          </div>
        </div>

        <div className="bg-[#111118] rounded-xl p-2">
          <CompareRow label="Total Cases" mine={currentUser.totalCases} theirs={friend.totalCases} />
          <CompareRow label="This Month" mine={currentUser.thisMonth} theirs={friend.thisMonth} />
          <CompareRow label="1st Surgeon %" mine={currentUser.firstSurgeonRate} theirs={72} unit="%" />
          <CompareRow label="Avg OR Time" mine={currentUser.avgDuration} theirs={58} unit=" min" higherIsBetter={false} />
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          Only anonymized aggregates are shared. No case-level details.
        </p>

        <button onClick={onClose} className="w-full mt-4 py-2.5 bg-[#1e2130] hover:bg-[#252535] text-slate-300 rounded-xl text-sm font-medium transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
