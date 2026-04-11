'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star, Zap, X } from 'lucide-react';
import { Milestone, PersonalRecord } from '@/lib/types';
import { BADGE_KEYS } from '@/lib/constants';

interface CelebrationModalProps {
  milestones: Milestone[];
  prs: PersonalRecord[];
  onClose: () => void;
}

export function CelebrationModal({ milestones, prs, onClose }: CelebrationModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const hasMilestones = milestones.length > 0;
  const hasPRs = prs.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
      onClick={handleClose}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-sm animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}px`,
              backgroundColor: ['#2563eb', '#6366f1', '#10b981', '#f59e0b', '#ec4899'][i % 5],
              animationDelay: `${Math.random() * 1}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div
        className="relative bg-[#16161f] border border-[#1e2130] rounded-2xl w-full max-w-md p-8 text-center transition-transform duration-300"
        style={{ transform: visible ? 'scale(1)' : 'scale(0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
          {hasMilestones ? (
            <Trophy className="w-9 h-9 text-white" />
          ) : (
            <Zap className="w-9 h-9 text-white" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-slate-100 mb-1">
          {hasMilestones && hasPRs ? 'Double Achievement!' : hasMilestones ? 'Milestone Unlocked!' : 'New Personal Record!'}
        </h2>
        <p className="text-slate-400 text-sm mb-6">You're building something extraordinary.</p>

        {hasMilestones && (
          <div className="space-y-3 mb-4">
            {milestones.map(m => {
              const badge = BADGE_KEYS[m.badgeKey] ?? { emoji: "🏆", label: m.badgeKey, color: "#6c7fff" };
              return (
                <div key={m.id} className="flex items-center gap-3 bg-[#111118] border border-blue-500/20 rounded-xl p-4 text-left">
                  <span className="text-2xl">{badge.emoji}</span>
                  <div>
                    <p className="text-slate-200 font-semibold text-sm">{badge.label}</p>
                    <p className="text-slate-400 text-xs">{m.procedureName ?? m.type?.replace(/_/g, " ")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasPRs && (
          <div className="space-y-3 mb-6">
            {prs.map(pr => (
              <div key={pr.id} className="flex items-center gap-3 bg-[#111118] border border-green-500/20 rounded-xl p-4 text-left">
                <Star className="w-6 h-6 text-yellow-400 shrink-0" />
                <div>
                  <p className="text-slate-200 font-semibold text-sm">{pr.recordType.replace(/_/g, " ")} — {pr.procedureName}</p>
                  <p className="text-slate-400 text-xs">
                    {pr.value} min
                    {pr.previousValue && (
                      <span className="text-green-400 ml-1">↓ from {pr.previousValue} min</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors"
        >
          Keep Going
        </button>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
}
