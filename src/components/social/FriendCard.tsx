'use client';

import { Users, TrendingUp, Award } from 'lucide-react';

interface FriendCardProps {
  friend: {
    id: string;
    name: string;
    specialty: string;
    institution: string;
    roleType: string;
    pgyYear: number;
    totalCases: number;
    thisMonth: number;
    topProcedure: string;
    recentActivity: string;
    avatarInitials: string;
  };
  onCompare?: (friendId: string) => void;
}

export function FriendCard({ friend, onCompare }: FriendCardProps) {
  return (
    <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-5 hover:border-blue-500/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {friend.avatarInitials}
          </div>
          <div>
            <p className="text-slate-200 font-semibold text-sm">{friend.name}</p>
            <p className="text-slate-400 text-xs">{friend.specialty} · {friend.roleType} {friend.pgyYear > 0 ? `PGY-${friend.pgyYear}` : ''}</p>
            <p className="text-slate-500 text-xs">{friend.institution}</p>
          </div>
        </div>
        <button
          onClick={() => onCompare?.(friend.id)}
          className="shrink-0 px-3 py-1.5 bg-[#1e2130] hover:bg-[#252535] text-slate-300 text-xs rounded-lg transition-colors border border-[#2a2d3e]"
        >
          Compare
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-[#16161f] rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-slate-100">{friend.totalCases}</p>
          <p className="text-slate-500 text-xs">Total</p>
        </div>
        <div className="bg-[#16161f] rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-blue-400">{friend.thisMonth}</p>
          <p className="text-slate-500 text-xs">This mo.</p>
        </div>
        <div className="bg-[#16161f] rounded-lg p-2.5 text-center">
          <p className="text-xs font-semibold text-slate-300 truncate">{friend.topProcedure.split(' ').slice(-1)[0]}</p>
          <p className="text-slate-500 text-xs">Top proc.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#16161f] rounded-lg px-3 py-2">
        <TrendingUp className="w-3 h-3 text-green-400 shrink-0" />
        <p className="text-slate-400 text-xs truncate">{friend.recentActivity}</p>
      </div>
    </div>
  );
}
