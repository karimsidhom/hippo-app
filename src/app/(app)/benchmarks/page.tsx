"use client";

import { useState } from "react";
import { useCases } from "@/hooks/useCases";
import { useUser } from "@/hooks/useUser";
import { useSubscription } from "@/context/SubscriptionContext";
import { ProGate } from "@/components/shared/ProGate";
import { mockBenchmarks } from "@/data/mockData";
import { Search, TrendingUp, Users, Lock, Info } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBenchmark = any;

export default function BenchmarksPage() {
  const { cases } = useCases();
  const { profile } = useUser();
  const { isFree } = useSubscription();
  const isPro = !isFree;

  const [search, setSearch] = useState("");
  const [selectedPGY, setSelectedPGY] = useState<number | null>(null);
  const [contributeEnabled, setContributeEnabled] = useState(profile?.allowBenchmarkSharing ?? true);
  const [showProGate, setShowProGate] = useState(false);

  const filteredBenchmarks = (mockBenchmarks as AnyBenchmark[]).filter((b: AnyBenchmark) => {
    if (search && !b.procedureName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Find user's value for each benchmark
  const enrichedBenchmarks = filteredBenchmarks.map((b: AnyBenchmark) => {
    const userCases = cases.filter(
      (c) =>
        c.procedureName === b.procedureName &&
        c.operativeDurationMinutes &&
        c.operativeDurationMinutes > 0
    );

    if (userCases.length === 0) return { ...b, userValue: undefined, userPercentile: undefined };

    const sortedDurations = userCases.map((c) => c.operativeDurationMinutes!).sort((a, bv) => a - bv);
    const medianDuration = sortedDurations[Math.floor(sortedDurations.length / 2)];

    // Calculate percentile (lower time = better)
    const percentile =
      medianDuration <= b.p10 ? 90 :
      medianDuration <= b.p25 ? 75 :
      medianDuration <= b.p50 ? 50 :
      medianDuration <= b.p75 ? 25 :
      10;

    return { ...b, userValue: medianDuration, userPercentile: percentile, userCaseCount: userCases.length };
  });

  const getPercentileColor = (p?: number) => {
    if (!p) return "#64748b";
    if (p >= 75) return "#10b981";
    if (p >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getPercentileLabel = (p?: number) => {
    if (!p) return "No data";
    if (p >= 90) return "Top 10%";
    if (p >= 75) return "Top 25%";
    if (p >= 50) return "Above Median";
    if (p >= 25) return "Below Median";
    return "Bottom 25%";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Benchmarks</h1>
          <p className="text-[#94a3b8] text-sm mt-0.5">
            Compare your operative times against national training benchmarks
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
          <Users className="w-4 h-4" />
          <span>{(mockBenchmarks[0] as AnyBenchmark)?.sampleSize || 0}+ contributing surgeons</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-[#1a1a2e] border border-[#2563eb]/30 rounded-xl">
        <Info className="w-4 h-4 text-[#3b82f6] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-[#f1f5f9] font-medium">How benchmarks work</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Benchmarks are calculated from anonymized operative times contributed by Hippo users across training programs. Your data is never individually identifiable. Percentile comparisons are available to Pro subscribers.
          </p>
        </div>
      </div>

      {/* Contribute Toggle */}
      <div className="flex items-center justify-between p-4 bg-[#111118] border border-[#1e2130] rounded-xl">
        <div>
          <p className="text-sm font-medium text-[#f1f5f9]">Contribute to benchmarks</p>
          <p className="text-xs text-[#64748b] mt-0.5">
            Your anonymized operative times improve data quality for all trainees
          </p>
        </div>
        <button
          onClick={() => setContributeEnabled(!contributeEnabled)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            contributeEnabled ? "bg-[#2563eb]" : "bg-[#1e2130]"
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
              contributeEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Search + PGY Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input
            type="text"
            placeholder="Search procedures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>
        <div className="flex gap-2">
          {[null, 2, 3, 4, 5].map((pgy) => (
            <button
              key={pgy ?? "all"}
              onClick={() => setSelectedPGY(pgy)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPGY === pgy
                  ? "bg-[#2563eb] text-white"
                  : "bg-[#16161f] border border-[#1e2130] text-[#94a3b8] hover:text-[#f1f5f9]"
              }`}
            >
              {pgy ? `PGY-${pgy}` : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Benchmark Cards */}
      <div className="space-y-3">
        {enrichedBenchmarks.map((b) => (
          <div key={b.procedureName} className="bg-[#111118] border border-[#1e2130] rounded-xl p-5 hover:border-[#252838] transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-[#f1f5f9]">{b.procedureName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#64748b]">{b.specialty}</span>
                  <span className="text-[#252838]">·</span>
                  <span className="text-xs text-[#64748b]">{b.sampleSize} cases</span>
                  {b.approach && (
                    <>
                      <span className="text-[#252838]">·</span>
                      <span className="text-xs text-[#64748b]">{b.approach}</span>
                    </>
                  )}
                </div>
              </div>

              {/* User Performance Badge */}
              {b.userValue ? (
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <TrendingUp className="w-4 h-4" style={{ color: getPercentileColor(b.userPercentile) }} />
                    <span className="text-sm font-semibold" style={{ color: getPercentileColor(b.userPercentile) }}>
                      {getPercentileLabel(b.userPercentile)}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] mt-0.5">Your median: {b.userValue} min</p>
                </div>
              ) : (
                <span className="text-xs text-[#64748b] bg-[#16161f] px-2 py-1 rounded-lg">
                  No cases logged
                </span>
              )}
            </div>

            {/* Percentile Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#64748b] mb-1">
                <span>P10: {b.p10}m</span>
                <span>P25: {b.p25}m</span>
                <span className="font-medium text-[#f1f5f9]">Median: {b.p50}m</span>
                <span>P75: {b.p75}m</span>
                <span>P90: {b.p90}m</span>
              </div>
              <div className="relative h-4 bg-[#16161f] rounded-full overflow-hidden">
                {/* Distribution gradient */}
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    left: "0%",
                    width: "100%",
                    background: "linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)",
                    opacity: 0.3,
                  }}
                />
                {/* P25-P75 highlight */}
                <div
                  className="absolute top-0 h-full"
                  style={{
                    left: `${((b.p25 - b.p10) / (b.p90 - b.p10)) * 100}%`,
                    width: `${((b.p75 - b.p25) / (b.p90 - b.p10)) * 100}%`,
                    backgroundColor: "rgba(37, 99, 235, 0.25)",
                  }}
                />
                {/* Median line */}
                <div
                  className="absolute top-0 w-0.5 h-full bg-[#2563eb]"
                  style={{
                    left: `${((b.p50 - b.p10) / (b.p90 - b.p10)) * 100}%`,
                  }}
                />
                {/* User marker */}
                {b.userValue && b.userValue >= b.p10 && b.userValue <= b.p90 && (
                  <div
                    className="absolute top-0 w-1 h-full rounded-full"
                    style={{
                      left: `${((b.userValue - b.p10) / (b.p90 - b.p10)) * 100}%`,
                      backgroundColor: getPercentileColor(b.userPercentile),
                    }}
                  />
                )}
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1 text-[#64748b]">
                  <span className="w-2 h-2 bg-[#2563eb] rounded-full inline-block" /> Median
                </span>
                <span className="flex items-center gap-1 text-[#64748b]">
                  <span className="w-2 h-2 bg-[#2563eb]/25 rounded-sm inline-block" /> IQR (P25–P75)
                </span>
                {b.userValue && (
                  <span className="flex items-center gap-1" style={{ color: getPercentileColor(b.userPercentile) }}>
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getPercentileColor(b.userPercentile) }} /> You
                  </span>
                )}
              </div>
            </div>

            {/* Percentile Details — Pro Gate */}
            {!isPro && (
              <button
                onClick={() => setShowProGate(true)}
                className="mt-3 flex items-center gap-2 text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors"
              >
                <Lock className="w-3 h-3" />
                Unlock detailed percentile breakdown (Pro)
              </button>
            )}
          </div>
        ))}
      </div>

      {showProGate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowProGate(false)}>
          <div style={{ background: "var(--surface)", borderRadius: 16, padding: 24, maxWidth: 380, width: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>⚡</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", textAlign: "center" }}>Pro Feature</div>
            <div style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", marginTop: 8 }}>Detailed benchmark percentiles require a Pro subscription.</div>
            <button onClick={() => setShowProGate(false)} style={{ marginTop: 20, width: "100%", padding: "10px 0", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
