"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { mockLeaderboard } from "@/data/mockData";
import { Trophy, Medal, TrendingUp, Star, Filter } from "lucide-react";

const TABS = [
  { key: "volume", label: "Volume", icon: Trophy },
  { key: "autonomy", label: "Autonomy", icon: Star },
  { key: "improvement", label: "Improvement", icon: TrendingUp },
];

const SPECIALTIES_FILTER = ["All Specialties", "Urology", "General Surgery", "Orthopedics", "Cardiothoracic"];
const PGY_FILTER = ["All Years", "PGY-2", "PGY-3", "PGY-4", "PGY-5", "Fellow"];
const TIME_FILTER = ["This Month", "This Year", "All Time"];

export default function LeaderboardPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("volume");
  const [specialty, setSpecialty] = useState("All Specialties");
  const [pgy, setPGY] = useState("All Years");
  const [timeFilter, setTimeFilter] = useState("This Year");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ml = mockLeaderboard as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allEntries: any[] = activeTab === "volume" ? ml.caseVolume : (ml.efficiency ?? ml.caseVolume);
  const entries = allEntries;
  const currentUserEntry = entries.find((e: { isCurrentUser?: boolean }) => e.isCurrentUser);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: "🥇", color: "#fbbf24" };
    if (rank === 2) return { emoji: "🥈", color: "var(--text-2)" };
    if (rank === 3) return { emoji: "🥉", color: "#f97316" };
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Leaderboard</h1>
        <p className="text-[var(--text-2)] text-sm mt-0.5">
          Privacy-safe rankings across training programs
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="p-3 bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-3)] flex items-start gap-2">
        <span className="text-[#10b981] mt-0.5">🔒</span>
        <span>
          All rankings use anonymized display names. Only surgeons who have opted in to leaderboard participation are shown. You can opt out in Settings → Privacy.
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-[var(--primary)] text-white shadow-glow-blue"
                : "bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`ml-auto flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all ${
            filtersOpen
              ? "bg-[var(--surface2)] border-[var(--primary)] text-[#3b82f6]"
              : "bg-[var(--surface2)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Filters */}
      {filtersOpen && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-3)] mb-2">Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {SPECIALTIES_FILTER.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-3)] mb-2">Training Year</label>
              <select
                value={pgy}
                onChange={(e) => setPGY(e.target.value)}
                className="w-full bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {PGY_FILTER.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-3)] mb-2">Time Period</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {TIME_FILTER.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Current User Highlight */}
      {currentUserEntry && (
        <div className="bg-[var(--surface2)] border-2 border-[var(--primary)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center font-bold text-white">
                #{currentUserEntry.rank}
              </div>
              <div>
                <p className="font-semibold text-[var(--text)]">You — {currentUserEntry.displayName}</p>
                <p className="text-xs text-[var(--text-2)] mt-0.5">
                  {currentUserEntry.specialty} · {currentUserEntry.trainingYearLabel}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-[var(--text)]">{currentUserEntry.value}</p>
              <p className="text-xs text-[var(--text-3)]">cases</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="border-b border-[var(--border)] p-4">
          <h2 className="font-semibold text-[var(--text)]">
            {activeTab === "volume" ? "Operative Volume" :
             activeTab === "autonomy" ? "Independence Rate" :
             "Year-over-Year Improvement"}
            {" — "}{timeFilter}
          </h2>
        </div>
        {entries.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "48px 20px", textAlign: "center",
            maxWidth: 360, margin: "0 auto",
          }}>
            <Trophy size={32} strokeWidth={1.25} style={{ color: "var(--text-3)", marginBottom: 14 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
              Leaderboard updates weekly
            </div>
            <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>
              Keep logging cases — your ranking will appear on the next refresh.
            </div>
          </div>
        ) : (
        <div className="divide-y divide-[var(--border)]">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {entries.map((entry: any) => {
            const rankBadge = getRankBadge(entry.rank);
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[var(--surface2)] ${
                  entry.isCurrentUser ? "bg-[var(--surface2)]/50" : ""
                }`}
              >
                {/* Rank */}
                <div className="w-10 flex-shrink-0 text-center">
                  {rankBadge ? (
                    <span className="text-xl" title={`Rank ${entry.rank}`}>{rankBadge.emoji}</span>
                  ) : (
                    <span className="text-[var(--text-3)] font-mono text-sm font-medium">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[#6366f1] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {(entry.displayName ?? entry.name ?? "").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium truncate ${entry.isCurrentUser ? "text-[#3b82f6]" : "text-[var(--text)]"}`}>
                      {entry.displayName}
                      {entry.isCurrentUser && <span className="text-xs text-[var(--text-3)] ml-1">(you)</span>}
                    </p>
                    {entry.badge && (
                      <span className="text-sm flex-shrink-0">{entry.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-3)] mt-0.5 truncate">
                    {entry.specialty} · {entry.trainingYearLabel}
                  </p>
                </div>

                {/* Value */}
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-[var(--text)]">{entry.value}</p>
                  <p className="text-xs text-[var(--text-3)]">
                    {activeTab === "volume" ? "cases" :
                     activeTab === "autonomy" ? "% indep." :
                     "% improvement"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Note */}
      <p className="text-xs text-[var(--text-3)] text-center">
        Rankings are updated daily. Complexity-adjusted scoring coming soon. Opt out anytime in Settings.
      </p>
    </div>
  );
}
