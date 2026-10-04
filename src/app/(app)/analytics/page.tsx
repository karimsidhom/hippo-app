"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useCases } from "@/hooks/useCases";
import { useStats } from "@/hooks/useStats";
import { LearningCurveChart } from "@/components/charts/LearningCurveChart";
import { VolumeHeatmap } from "@/components/charts/VolumeHeatmap";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { LineChart } from "@/components/charts/LineChart";
import {
  getLearningCurveData,
  getWeeklyHeatmapData,
  getMonthlyVolume,
  getOperativeTimeTrend,
  getAutonomyProgression,
} from "@/lib/stats";
import { AUTONOMY_LEVELS, SPECIALTIES } from "@/lib/constants";
import { inferUserSpecialty, sectionBreakdown } from "@/lib/subspecialty";
import { SectionBars } from "@/components/charts/SectionBars";
import { EpaDashboard } from "@/components/epa/EpaDashboard";
import { EpaAnalyticsPanel } from "@/components/epa/EpaAnalyticsPanel";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { BarChart2, Plus, AlertTriangle, ChevronRight, LayoutDashboard, Users2, Inbox } from "lucide-react";
import { QuickAddModal } from "@/components/cases/QuickAddModal";
import { isSmsnaProfile } from "@/lib/smsna/gate";
import { SmsnaAssessmentPanel } from "@/components/smsna/SmsnaAssessmentPanel";

// Staff (attendings, PDs) see a Cohort tab instead of Learning Curve / Volume.
const STAFF_ROLES = new Set(["STAFF", "ATTENDING", "PROGRAM_DIRECTOR"]);

type CohortResident = {
  userId: string;
  name: string | null;
  totalCases: number;
  casesThisWeek: number;
  casesThisMonth: number;
  epaTotal: number;
  epaSigned: number;
  epaPending: number;
  lastCaseDate: string | null;
};

type CohortData = {
  institution: string;
  residents: CohortResident[];
};


export default function AnalyticsPage() {
  const { cases } = useCases();
  const { stats } = useStats(cases);
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedProcedure, setSelectedProcedure] = useState("");

  const isPD = profile?.roleType === "PROGRAM_DIRECTOR";
  const isStaff = !!(profile?.roleType && STAFF_ROLES.has(profile.roleType));
  const isSmsna = isSmsnaProfile(profile);

  // Staff see Cohort in place of Learning Curve + Volume; PDs also get a
  // direct link to the full PD Dashboard.
  const CHART_TABS = isStaff
    ? (isPD
        ? ["Overview", "EPAs", "Milestones", "Cohort", "OR Time Trend", "PD Dashboard"]
        : ["Overview", "EPAs", "Milestones", "Cohort", "OR Time Trend"])
    : ["Overview", "EPAs", "Milestones", "Learning Curve", "Volume", "OR Time Trend"];
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Deep link: /analytics?tab=Milestones opens that tab (the dashboard
  // Progress card links here). Read once on mount; window is used instead of
  // useSearchParams so the page needs no Suspense boundary.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("tab");
    if (wanted && CHART_TABS.includes(wanted) && wanted !== "PD Dashboard") setActiveTab(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  const topProcedures = Object.entries(stats?.byProcedure || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name]) => name);

  const activeProcedure = selectedProcedure || topProcedures[0] || "";

  const learningCurveData = getLearningCurveData(cases, activeProcedure);
  const heatmapData = getWeeklyHeatmapData(cases);
  const monthlyVolume = getMonthlyVolume(cases);
  const autonomyProgression = getAutonomyProgression(cases).filter(d => d.avgAutonomyScore > 0);
  const userSpecialty = useMemo(() => inferUserSpecialty(profile?.specialty, cases), [profile?.specialty, cases]);
  const specialtyLabel = SPECIALTIES.find(s => s.slug === userSpecialty)?.name ?? "your specialty";
  const sections = useMemo(() => sectionBreakdown(cases, userSpecialty), [cases, userSpecialty]);
  const autonomyMix = useMemo(() => AUTONOMY_LEVELS
    .map(a => ({ label: a.label, color: a.color, value: cases.filter(c => c.autonomyLevel === a.value).length }))
    .filter(d => d.value > 0), [cases]);

  const hasNoCases = cases.length === 0;

  // ── Cohort data fetch (staff only) ────────────────────────────────
  const [cohortData, setCohortData] = useState<CohortData | null>(null);
  useEffect(() => {
    if (!isStaff) return;
    let cancelled = false;
    fetch("/api/pd/residents", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setCohortData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isStaff]);

  // ── Pending sign-off count for the persistent "EPAs to complete" card.
  // Mirrors the dashboard behaviour so staff have the inbox entry point
  // available from Stats too. Endpoint is cheap (single count query).
  const [pendingSignOffs, setPendingSignOffs] = useState<number | null>(null);
  useEffect(() => {
    if (!isStaff) return;
    let cancelled = false;
    fetch("/api/attending/summary", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setPendingSignOffs(d.pendingReview ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isStaff]);

  const cohortKpis = useMemo(() => {
    if (!cohortData?.residents?.length) return null;
    const rs = cohortData.residents;
    const totalResidents = rs.length;
    const casesThisWeek = rs.reduce((s, r) => s + r.casesThisWeek, 0);
    const casesThisMonth = rs.reduce((s, r) => s + r.casesThisMonth, 0);
    const epasPending = rs.reduce((s, r) => s + r.epaPending, 0);
    const avgEpaCompletion = Math.round(
      rs.reduce(
        (s, r) => s + (r.epaTotal > 0 ? (r.epaSigned / r.epaTotal) * 100 : 0),
        0,
      ) / totalResidents,
    );
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const silentResidents = rs.filter((r) => {
      if (!r.lastCaseDate) return true;
      return new Date(r.lastCaseDate).getTime() < twoWeeksAgo;
    }).length;
    return {
      totalResidents,
      casesThisWeek,
      casesThisMonth,
      epasPending,
      avgEpaCompletion,
      silentResidents,
    };
  }, [cohortData]);

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      {/* Header */}
      <div className="page-head">
        <h1 className="page-title">Stats</h1>
        {!hasNoCases && (
          <p className="page-sub">
            {cases.length.toLocaleString()} case{cases.length === 1 ? "" : "s"} logged
            {topProcedures.length > 0 ? `, ${Object.keys(stats?.byProcedure || {}).length} distinct procedures` : ""}
          </p>
        )}
      </div>

      {/* Staff: persistent "EPAs to complete" entry point. Stats is where
          attendings review their own teaching output — the inbox link
          belongs right here. Scales visually with pendingSignOffs. */}
      {isStaff && (
        (() => {
          const pending = pendingSignOffs ?? 0;
          const hot = pending > 0;
          return (
            <Link
              href="/inbox"
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", marginBottom: 18,
                background: hot ? "#0EA5E910" : "var(--surface)",
                border: hot ? "1px solid #0EA5E930" : "1px solid var(--border)",
                borderRadius: 10,
                textDecoration: "none",
                color: "var(--text)",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: hot ? "#0EA5E920" : "var(--bg-1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: hot ? "#0EA5E9" : "var(--text-3)", flexShrink: 0,
              }}>
                <Inbox size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  {pending === 0
                    ? "EPAs to complete"
                    : pending === 1
                      ? "1 EPA awaiting your signature"
                      : `${pending} EPAs awaiting your signature`}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                  {pending === 0
                    ? "You're all caught up. Check the sign-off inbox."
                    : "Open the sign-off inbox to review and sign."}
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-3)", flexShrink: 0 }} />
            </Link>
          );
        })()
      )}

      {/* Tabs */}
      <div className="stats-tabs" role="tablist" aria-label="Stats sections">
        {CHART_TABS.map(tab => {
          const active = activeTab === tab;
          if (tab === "PD Dashboard") {
            return (
              <Link key={tab} href="/pd-dashboard" className="stats-tab link">
                {tab} →
              </Link>
            );
          }
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab)}
              className={active ? "stats-tab on" : "stats-tab"}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {hasNoCases && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "48px 20px 20px", textAlign: "center",
          maxWidth: 360, margin: "0 auto",
        }}>
          <BarChart2 size={32} strokeWidth={1.25} style={{ color: "var(--text-3)", marginBottom: 14 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
            Nothing to chart yet
          </div>
          <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 18 }}>
            Log a few cases and your trends, volume, and EPA progress will show up here.
          </div>
          <button
            onClick={() => setQuickAddOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 16px",
              background: "var(--primary)", color: "#fff",
              border: "none", borderRadius: 6,
              fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              letterSpacing: ".01em",
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Log your first case
          </button>
          <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
        </div>
      )}

      {/* ── Overview ── */}
      {!hasNoCases && activeTab === "Overview" && (
        <div className="stats-grid">
          <ChartCard title="Activity" subtitle="Cases per day" wide>
            <VolumeHeatmap data={heatmapData} />
          </ChartCard>

          <ChartCard
            title="By subspecialty"
            subtitle={userSpecialty
              ? `Sections of ${specialtyLabel}, ranked by cases`
              : "Set your specialty in Settings to see this breakdown"}
          >
            <SectionBars
              rows={userSpecialty ? sections : []}
              hrefFor={userSpecialty ? (r => `/cases?section=${encodeURIComponent(r.key)}`) : undefined}
              emptyText="Set your specialty in Settings > Profile to group cases by subspecialty."
            />
          </ChartCard>

          <ChartCard title="Monthly volume" subtitle="Cases logged, last 12 months">
            <BarChart
              data={monthlyVolume.map(m => ({ label: m.month, tooltipLabel: m.label, value: m.count }))}
              height={260}
            />
          </ChartCard>

          <ChartCard title="Autonomy mix" subtitle="Your level of independence across all cases">
            <DonutChart data={autonomyMix} unit="cases" />
          </ChartCard>

          <ChartCard title="Autonomy progression" subtitle="Average score per month, 1 observer to 5 teaching">
            <LineChart
              data={autonomyProgression.map(d => ({ label: d.month, value: d.avgAutonomyScore }))}
              color="#10B981"
              height={180}
              yMin={0}
              yMax={5}
              formatY={v => (Number.isInteger(v) ? String(v) : v.toFixed(1))}
            />
          </ChartCard>
        </div>
      )}

      {/* ── EPAs ── */}
      {!hasNoCases && activeTab === "EPAs" && (
        isSmsna ? (
          <SmsnaAssessmentPanel />
        ) : (
          <EpaAnalyticsPanel
            cases={cases}
            specialty={profile?.specialty ?? undefined}
            trainingCountry={profile?.trainingCountry ?? undefined}
          />
        )
      )}

      {/* ── Milestones ── */}
      {!hasNoCases && activeTab === "Milestones" && (
        isSmsna ? (
          <SmsnaAssessmentPanel />
        ) : (
          <EpaDashboard
            cases={cases}
            specialty={profile?.specialty ?? undefined}
            trainingCountry={profile?.trainingCountry ?? undefined}
            initialTab="Milestones"
          />
        )
      )}

      {/* ── Learning Curve ── */}
      {!hasNoCases && activeTab === "Learning Curve" && (
        <div className="stats-grid">
          <ChartCard
            title="Learning curve"
            subtitle="OR time by case number for one procedure"
            wide
            action={
              <select
                className="st-input stats-select"
                aria-label="Procedure"
                value={activeProcedure}
                onChange={e => setSelectedProcedure(e.target.value)}
              >
                {topProcedures.map(p => <option key={p} value={p}>{p.length > 40 ? p.slice(0, 40) + "…" : p}</option>)}
              </select>
            }
          >
            {learningCurveData.length > 1 ? (
              <LearningCurveChart data={learningCurveData} procedureName={activeProcedure} height={280} />
            ) : (
              <div className="stats-empty">Log 2 or more of this procedure with an OR time to see a curve.</div>
            )}
          </ChartCard>

          {/* Procedure table */}
          {topProcedures.length > 0 && (
            <ChartCard title="Procedure summary" subtitle="Your 8 most frequent procedures" wide>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{
                        textAlign: "left", color: "var(--text-3)", fontWeight: 500,
                        paddingBottom: 10, borderBottom: "1px solid var(--border)", fontSize: 11,
                      }}>Procedure</th>
                      <th style={{
                        textAlign: "right", color: "var(--text-3)", fontWeight: 500,
                        paddingBottom: 10, borderBottom: "1px solid var(--border)", fontSize: 11,
                      }}>Cases</th>
                      <th style={{
                        textAlign: "right", color: "var(--text-3)", fontWeight: 500,
                        paddingBottom: 10, borderBottom: "1px solid var(--border)", fontSize: 11,
                      }}>Avg OR</th>
                      <th style={{
                        textAlign: "right", color: "var(--text-3)", fontWeight: 500,
                        paddingBottom: 10, borderBottom: "1px solid var(--border)", fontSize: 11,
                      }}>Indep %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProcedures.map(proc => {
                      const procCases = cases.filter(c => c.procedureName === proc);
                      const avgDur = Math.round(
                        procCases.filter(c => c.operativeDurationMinutes).reduce((s, c) => s + (c.operativeDurationMinutes || 0), 0) /
                        Math.max(procCases.filter(c => c.operativeDurationMinutes).length, 1)
                      );
                      const indepRate = Math.round(
                        (procCases.filter(c => c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING").length /
                          Math.max(procCases.length, 1)) * 100
                      );
                      return (
                        <tr key={proc}>
                          <td style={{
                            color: "var(--text)", paddingTop: 10, paddingBottom: 10,
                            borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 500,
                          }}>{proc}</td>
                          <td style={{
                            color: "var(--text-2)", paddingTop: 10, paddingBottom: 10,
                            borderBottom: "1px solid var(--border)", textAlign: "right",
                            fontFamily: "'Geist Mono', monospace", fontSize: 12,
                          }}>{procCases.length}</td>
                          <td style={{
                            color: "var(--text-2)", paddingTop: 10, paddingBottom: 10,
                            borderBottom: "1px solid var(--border)", textAlign: "right",
                            fontFamily: "'Geist Mono', monospace", fontSize: 12,
                          }}>{avgDur ? `${avgDur} min` : "-"}</td>
                          <td style={{
                            paddingTop: 10, paddingBottom: 10,
                            borderBottom: "1px solid var(--border)", textAlign: "right",
                            fontFamily: "'Geist Mono', monospace", fontSize: 12,
                            color: indepRate >= 50 ? "var(--success)" : "var(--text-3)",
                          }}>{indepRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}
        </div>
      )}

      {/* ── Volume ── */}
      {!hasNoCases && activeTab === "Volume" && (
        <div className="stats-grid">
          <ChartCard title="Activity" subtitle="Cases per day" wide>
            <VolumeHeatmap data={heatmapData} large />
          </ChartCard>

          <ChartCard title="Monthly case volume" subtitle="Last 12 months">
            <BarChart
              data={monthlyVolume.map(m => ({ label: m.month, tooltipLabel: m.label, value: m.count }))}
              height={240}
              showValues
            />
          </ChartCard>

          <ChartCard title="Top procedures" subtitle="By number of cases logged">
            <BarChart
              data={Object.entries(stats?.byProcedure || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([name, count]) => ({ label: name, value: count as number }))}
              horizontal
            />
          </ChartCard>
        </div>
      )}

      {/* ── Cohort (staff only) ── */}
      {isStaff && activeTab === "Cohort" && (
        <div>
          {!cohortData ? (
            <div
              style={{
                padding: "48px 0",
                textAlign: "center",
                color: "var(--text-3)",
                fontSize: 13,
              }}
            >
              Loading cohort…
            </div>
          ) : cohortData.residents.length === 0 ? (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: "var(--text-3)",
              }}
            >
              <Users2
                size={28}
                strokeWidth={1.25}
                style={{ marginBottom: 10, opacity: 0.6 }}
              />
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-2)",
                  marginBottom: 4,
                }}
              >
                No residents yet
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                Once residents join your institution they'll show up here.
              </div>
            </div>
          ) : (
            <div>
              {isPD && (
                <Link
                  href="/pd-dashboard"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    marginBottom: 18,
                    background:
                      "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(16,185,129,0.06))",
                    border: "1px solid rgba(14,165,233,0.35)",
                    borderRadius: 10,
                    color: "var(--text)",
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: "rgba(14,165,233,0.18)",
                      border: "1px solid rgba(14,165,233,0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0EA5E9",
                      flexShrink: 0,
                    }}
                  >
                    <LayoutDashboard size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      Open PD Dashboard
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        marginTop: 2,
                      }}
                    >
                      Full roster, filters, and CSV export
                    </div>
                  </div>
                  <ChevronRight
                    size={15}
                    style={{ color: "var(--text-3)" }}
                  />
                </Link>
              )}

              {/* KPI grid */}
              {cohortKpis && (
                <section style={{ marginBottom: 22 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: 12,
                    }}
                  >
                    At a Glance
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <CohortKpi
                      value={String(cohortKpis.totalResidents)}
                      label="Residents"
                    />
                    <CohortKpi
                      value={String(cohortKpis.casesThisWeek)}
                      label="Cases this wk"
                    />
                    <Link
                      href="/inbox"
                      style={{ textDecoration: "none" }}
                    >
                      <CohortKpi
                        value={String(cohortKpis.epasPending)}
                        label="EPAs pending"
                        accent={cohortKpis.epasPending > 0}
                      />
                    </Link>
                    <CohortKpi
                      value={`${cohortKpis.avgEpaCompletion}%`}
                      label="Avg EPA done"
                    />
                  </div>
                  {cohortKpis.silentResidents > 0 && (
                    <Link
                      href="/pd-dashboard"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 14px",
                        background: "#F59E0B10",
                        border: "1px solid #F59E0B25",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "var(--text-2)",
                        textDecoration: "none",
                      }}
                    >
                      <AlertTriangle
                        size={13}
                        style={{ color: "#F59E0B", flexShrink: 0 }}
                      />
                      <span style={{ flex: 1 }}>
                        {cohortKpis.silentResidents === 1
                          ? "1 resident hasn\u2019t logged a case in 14+ days"
                          : `${cohortKpis.silentResidents} residents haven\u2019t logged a case in 14+ days`}
                      </span>
                      <ChevronRight
                        size={12}
                        style={{ color: "var(--text-3)" }}
                      />
                    </Link>
                  )}
                </section>
              )}

              {/* Resident mini-table */}
              <section
                style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Residents
                  </div>
                  {isPD && (
                    <Link
                      href="/pd-dashboard"
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        textDecoration: "none",
                      }}
                    >
                      Full view →
                    </Link>
                  )}
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      fontSize: 12,
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={cohortTh}>Name</th>
                        <th style={{ ...cohortTh, textAlign: "right" }}>
                          Cases
                        </th>
                        <th style={{ ...cohortTh, textAlign: "right" }}>
                          Wk
                        </th>
                        <th style={{ ...cohortTh, textAlign: "right" }}>
                          EPA
                        </th>
                        <th style={{ ...cohortTh, textAlign: "right" }}>
                          Last
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...cohortData.residents]
                        .sort((a, b) => {
                          const la = a.lastCaseDate
                            ? new Date(a.lastCaseDate).getTime()
                            : 0;
                          const lb = b.lastCaseDate
                            ? new Date(b.lastCaseDate).getTime()
                            : 0;
                          return lb - la;
                        })
                        .map((r) => {
                          const silent =
                            !r.lastCaseDate ||
                            new Date(r.lastCaseDate).getTime() <
                              Date.now() - 14 * 24 * 60 * 60 * 1000;
                          return (
                            <tr key={r.userId}>
                              <td style={cohortTd}>
                                <Link
                                  href={`/pd-dashboard/${r.userId}`}
                                  style={{
                                    color: "var(--text)",
                                    textDecoration: "none",
                                    fontWeight: 500,
                                  }}
                                >
                                  {r.name ?? "—"}
                                </Link>
                              </td>
                              <td
                                style={{
                                  ...cohortTd,
                                  textAlign: "right",
                                  fontFamily: "'Geist Mono', monospace",
                                  color: "var(--text-2)",
                                }}
                              >
                                {r.totalCases}
                              </td>
                              <td
                                style={{
                                  ...cohortTd,
                                  textAlign: "right",
                                  fontFamily: "'Geist Mono', monospace",
                                  color: "var(--text-2)",
                                }}
                              >
                                {r.casesThisWeek}
                              </td>
                              <td
                                style={{
                                  ...cohortTd,
                                  textAlign: "right",
                                  fontFamily: "'Geist Mono', monospace",
                                  color:
                                    r.epaPending > 0
                                      ? "#0EA5E9"
                                      : "var(--text-2)",
                                }}
                              >
                                {r.epaSigned}/{r.epaTotal}
                              </td>
                              <td
                                style={{
                                  ...cohortTd,
                                  textAlign: "right",
                                  fontFamily: "'Geist Mono', monospace",
                                  color: silent ? "#F59E0B" : "var(--text-3)",
                                }}
                              >
                                {r.lastCaseDate
                                  ? new Date(
                                      r.lastCaseDate,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {/* ── OR Time Trend ── */}
      {!hasNoCases && activeTab === "OR Time Trend" && (() => {
        const trend = getOperativeTimeTrend(cases, selectedProcedure || undefined).filter(d => d.caseCount > 0 && d.avgDuration > 0);
        return (
          <div className="stats-grid">
            <ChartCard
              title="Operative time trend"
              subtitle="Average OR time per month"
              wide
              action={
                <select
                  className="st-input stats-select"
                  aria-label="Procedure"
                  value={selectedProcedure}
                  onChange={e => setSelectedProcedure(e.target.value)}
                >
                  <option value="">All procedures</option>
                  {topProcedures.map(p => <option key={p} value={p}>{p.length > 40 ? p.slice(0, 40) + "…" : p}</option>)}
                </select>
              }
            >
              {trend.length > 0 ? (
                <LineChart
                  data={trend.map(d => ({ label: d.month, value: d.avgDuration, secondary: d.caseCount }))}
                  color="#F59E0B"
                  height={260}
                  formatY={v => `${Math.round(v)} min`}
                />
              ) : (
                <div className="stats-empty">No OR times logged for this selection yet. Add an operative time when you log a case.</div>
              )}
            </ChartCard>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Cohort tab helpers ────────────────────────────────────────────────────

function CohortKpi({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        border: accent ? "1px solid #0EA5E930" : "1px solid var(--border)",
        borderRadius: 10,
        background: accent ? "#0EA5E908" : "var(--surface2)",
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: accent ? "#0EA5E9" : "var(--text)",
          fontFamily: "'Geist Mono', monospace",
          letterSpacing: "-1px",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: "var(--text-3)",
          marginTop: 6,
          textTransform: "uppercase",
          letterSpacing: ".6px",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}

const cohortTh: React.CSSProperties = {
  textAlign: "left",
  color: "var(--text-3)",
  fontWeight: 500,
  paddingBottom: 8,
  borderBottom: "1px solid var(--border)",
  fontSize: 11,
};

const cohortTd: React.CSSProperties = {
  paddingTop: 10,
  paddingBottom: 10,
  borderBottom: "1px solid var(--border)",
  fontSize: 12,
};

// ─── Overview helpers ──────────────────────────────────────────────────────

/** Card shell shared by every chart on the Stats page. */
function ChartCard({
  title,
  subtitle,
  action,
  wide,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={wide ? "stats-card wide" : "stats-card"}>
      <header className="stats-card-head">
        <div style={{ minWidth: 0 }}>
          <h2 className="stats-card-title">{title}</h2>
          {subtitle && <p className="stats-card-sub">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

