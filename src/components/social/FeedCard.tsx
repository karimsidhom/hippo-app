'use client';

import { Trophy, Zap, Star, TrendingUp } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeedEvent = any;

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

const eventIcons: Record<string, React.ElementType> = {
  MILESTONE: Trophy,
  PERSONAL_RECORD: Star,
  CASE_LOGGED: TrendingUp,
  STREAK: Zap,
};

const eventColors: Record<string, string> = {
  MILESTONE: 'text-yellow-400 bg-yellow-400/10',
  PERSONAL_RECORD: 'text-green-400 bg-green-400/10',
  CASE_LOGGED: 'text-blue-400 bg-blue-400/10',
  STREAK: 'text-orange-400 bg-orange-400/10',
};

interface FeedCardProps {
  event: FeedEvent;
}

export function FeedCard({ event }: FeedCardProps) {
  const Icon = eventIcons[event.eventType] ?? TrendingUp;
  const colorClass = eventColors[event.eventType] ?? 'text-blue-400 bg-blue-400/10';

  return (
    <div className="flex gap-4 py-4 border-b border-[#1e2130] last:border-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                {event.userInitials}
              </div>
              <span className="text-slate-300 text-sm font-medium">{event.userName}</span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-slate-500 text-xs">{event.userSpecialty}</span>
            </div>
            <p className="text-slate-200 text-sm font-semibold">{event.title}</p>
            <p className="text-slate-400 text-xs mt-0.5">{event.description}</p>
          </div>
          <span className="text-slate-600 text-xs shrink-0">{formatTimeAgo(event.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
