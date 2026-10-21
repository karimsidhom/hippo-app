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
  getSpecialtyBreakdown,
} from "@/lib/stats";
import { EpaDashboard } from "@/components/epa/EpaDashboard";
import { EpaAnalyticsPanel } from "@/components/epa/EpaAnalyticsPanel";
import { EpaProgressTotals } from "@/components/epa/HistoricalEpaProgress";
import type { ProgramProgressResident } from "@/components/epa/ProgramProgressPanel";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { BarChart2, Plus, AlertTriangle, ChevronRight, LayoutDashboard, Users2, Inbox } from "lucide-react";
import { QuickAddModal } from "@/components/cases/QuickAddModal";
import { isSmsnaProfile } from "@/lib/smsna/gate";
import { SmsnaAssessmentPanel } from "@/components/smsna/SmsnaAssessmentPanel";

// Staff (attendings, PDs) see a Cohort tab instead of Learning Curve / Volume.
const STAFF_ROLES = new Set(["STAFF", "ATTENDING", "PROGRAM_DIRECTOR"]);

type CohortResident = ProgramProgressResident & {
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
  programName: string;
  residents: CohortResident[];
};


export default function AnalyticsPage() {
  const { cases } = useCases();
  const { stats } = useStats(cases);
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedProcedure, setSelectedProcedure] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab")?.toLowerCase() === "epas") setActiveTab("EPAs");
  }, []);

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

  const topProcedures = Object.entries(stats?.byProcedure || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name]) => name);

  const activeProcedure = selectedProcedure || topProcedures[0] || "";

  const learningCurveData = getLearningCurveData(cases, activeProcedure);
  const heatmapData = getWeeklyHeatmapData(cases);
  const monthlyVolume = getMonthlyVolume(cases);
  const autonomyProgression = getAutonomyProgression(cases);
  const specialtyBreakdown = getSpecialtyBreakdown(cases);

  const hasNoCases = cases.length === 0;

  // ── Cohort data fetch (staff only) ────────────────────────────────
  const [cohortData, setCohortData] = useState<CohortData | null>(null);
  const [cohortPrograms, setCohortPrograms] = useState<{ id: string; name: string; myRole: string }[]>([]);
  const [cohortProgramId, setCohortProgramId] = useState("");
  const [cohortError, setCohortError] = useState("");
  const [cohortProgressResidentId, setCohortProgressResidentId] = useState("");
  useEffect(() => {
    if (!isStaff) return;
    const controller = new AbortController();
    void fetch("/api/programs", { credentials: "include", cache: "no-store", signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Could not load your programs.");
      const data = await response.json();
      const available = (data.programs ?? []).filter((program: { myRole: string }) => program.myRole !== "COORDINATOR");
      if (controller.signal.aborted) return;
      setCohortPrograms(available);
      const preferred = new URLSearchParams(window.location.search).get("programId");
      setCohortProgramId(available.find((program: { id: string }) => program.id === preferred)?.id ?? available[0]?.id ?? "");
      if (!available.length) setCohortError("Join a program with access to resident progress to view a cohort.");
    }).catch(error => { if (!controller.signal.aborted) setCohortError(error instanceof Error ? error.message : "Could not load your programs."); });
    return () => controller.abort();
  }, [isStaff]);

  useEffect(() => {
    if (!isStaff || !cohortProgramId) return;
    const controller = new AbortController();
    setCohortData(null); setCohortError(""); setCohortProgressResidentId("");
    void fetch(`/api/pd/residents?programId=${encodeURIComponent(cohortProgramId)}`, { credentials: "include", cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load this program’s cohort.");
      if (!controller.signal.aborted) setCohortData(data);
    }).catch(error => { if (!controller.signal.aborted) setCohortError(error instanceof Error ? error.message : "Could not load this program’s cohort."); });
    return () => controller.abort();
  }, [isStaff, cohortProgramId]);
  const cohortDashboardHref = cohortProgramId ? `/pd-dashboard?programId=${encodeURIComponent(cohortProgramId)}` : "/pd-dashboard";
  const cohortProgressResident = cohortData?.residents.find(resident => resident.userId === cohortProgressResidentId) ?? cohortData?.residents[0];

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
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-.4px" }}>Analytics</span>
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
                    ? "You're all caught up — check the sign-off inbox."
                    : "Open the sign-off inbox to review and sign."}
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-3)", flexShrink: 0 }} />
            </Link>
          );
        })()
      )}

      {/* Tabs — understated, text-based */}
      <div style={{
        display: "flex", gap: 2, overflowX: "auto",
        paddingBottom: 16, marginBottom: 20,
        borderBottom: "1px solid var(--border)",
        scrollbarWidth: "none",
      }}>
        {CHART_TABS.map(tab => {
          const active = activeTab === tab;
          if (tab === "PD Dashboard") {
            return (
              <Link
                key={tab}
                href={cohortDashboardHref}
                style={{
                  flexShrink: 0, padding: "5px 12px",
                  background: "none",
                  border: "1px solid transparent",
                  color: "var(--accent, #0EA5E9)",
                  borderRadius: 4, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Geist', sans-serif",
                  transition: "all .15s cubic-bezier(.16,1,.3,1)",
                  whiteSpace: "nowrap", letterSpacing: ".01em",
                  textDecoration: "none",
                }}
              >
                {tab} →
              </Link>
            );
          }
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flexShrink: 0, padding: "5px 12px",
                background: active ? "var(--surface2)" : "none",
                border: active ? "1px solid var(--border-mid)" : "1px solid transparent",
                color: active ? "var(--text)" : "var(--text-3)",
                borderRadius: 4, fontSize: 11, fontWeight: active ? 600 : 500,
                cursor: "pointer", fontFamily: "'Geist', sans-serif",
                transition: "all .15s cubic-bezier(.16,1,.3,1)",
                whiteSpace: "nowrap",
                letterSpacing: ".01em",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {hasNoCases && activeTab !== "EPAs" && (
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
        <div>
          {/* Heatmap */}
          <section style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: "var(--text-3)",
              textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12,
            }}>Activity</div>
            <VolumeHeatmap data={heatmapData} />
          </section>

          {/* Monthly + Specialty */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            <section>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12,
              }}>Monthly Volume</div>
              <BarChart
                data={monthlyVolume.map(m => ({ label: m.month, value: m.count }))}
                color="#0EA5E9"
                height={160}
              />
            </section>
            <section>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12,
              }}>By Specialty</div>
              <DonutChart
                data={specialtyBreakdown.map(s => ({ label: s.specialty, value: s.count, color: s.color }))}
                height={160}
              />
            </section>
          </div>

          {/* Autonomy Trend */}
          <section style={{
            paddingTop: 24,
            borderTop: "1px solid var(--border)",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: "var(--text-3)",
              textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4,
            }}>Autonomy Progression</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 14 }}>Average score over time (1-5)</div>
            <LineChart
              data={autonomyProgression.map(d => ({ label: d.month, value: d.avgAutonomyScore }))}
              color="#10B981"
              height={140}
              yMin={0}
              yMax={5}
            />
          </section>
        </div>
      )}

      {/* ── EPAs ── */}
      {activeTab === "EPAs" && (
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
        <div>
          <section style={{ marginBottom: 28 }}>
            <div style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              gap: 12, marginBottom: 16,
            }}>
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                  textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4,
                }}>Learning Curve</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>OR time vs case number</div>
              </div>
              <select
                className="st-input"
                style={{ width: "auto", fontSize: 11, padding: "6px 10px" }}
                value={activeProcedure}
                onChange={e => setSelectedProcedure(e.target.value)}
              >
                {topProcedures.map(p => <option key={p} value={p}>{p.length > 35 ? p.slice(0, 35) + "\u2026" : p}</option>)}
              </select>
            </div>
            {learningCurveData.length > 1 ? (
              <LearningCurveChart data={learningCurveData} procedureName={activeProcedure} height={280} />
            ) : (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: 140, color: "var(--text-3)", fontSize: 12,
              }}>Need 2+ cases of this procedure</div>
            )}
          </section>

          {/* Procedure table */}
          {topProcedures.length > 0 && (
            <section style={{ paddingTop: 24, borderTop: "1px solid var(--border)" }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14,
              }}>Procedure Summary</div>
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
                          }}>{avgDur || "\u2014"}</td>
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
            </section>
          )}
        </div>
      )}

      {/* ── Volume ── */}
      {!hasNoCases && activeTab === "Volume" && (
        <div>
          <section style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: "var(--text-3)",
              textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12,
            }}>Contribution Heatmap</div>
            <VolumeHeatmap data={heatmapData} large />
          </section>

          <section style={{
            paddingTop: 24, borderTop: "1px solid var(--border)", marginBottom: 28,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: "var(--text-3)",
              textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14,
            }}>Monthly Case Volume</div>
            <BarChart
              data={monthlyVolume.map(m => ({ label: `${m.month} '${String(m.year).slice(2)}`, value: m.count }))}
              color="#0EA5E9"
              height={220}
              showValues
            />
          </section>

          <section style={{ paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: "var(--text-3)",
              textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14,
            }}>Top Procedures by Volume</div>
            <BarChart
              data={Object.entries(stats?.byProcedure || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([name, count]) => ({
                  label: name.length > 30 ? name.slice(0, 30) + "\u2026" : name,
                  value: count as number,
                }))}
              color="#0EA5E9"
              height={260}
              horizontal
            />
          </section>
        </div>
      )}

      {/* ── Cohort (staff only) ── */}
      {isStaff && activeTab === "Cohort" && (
        <div>
          {cohortPrograms.length ? <label style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, color: "var(--text-2)", fontSize: 12, marginBottom: 20 }}>Program<select value={cohortProgramId} onChange={event => {
            setCohortData(null); setCohortProgramId(event.target.value);
            const url = new URL(window.location.href); url.searchParams.set("programId", event.target.value); window.history.replaceState(null, "", url);
          }} style={{ padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 7, background: "var(--surface)", color: "var(--text)", font: "inherit", maxWidth: "100%" }}>{cohortPrograms.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label> : null}
          {cohortError ? <p role="alert" style={{ color: "var(--text-3)", fontSize: 13, lineHeight: 1.7, padding: "28px 0" }}>{cohortError}</p> : !cohortData ? (
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
                Residents who join this program and fall within your assigned scope will show up here.
              </div>
            </div>
          ) : (
            <div>
              {isPD && (
                <Link
                  href={cohortDashboardHref}
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

              {cohortProgressResident ? <section style={{ marginBottom: 24 }} aria-label="Resident EPA progress totals">
                <h2 style={{ fontSize: 14, color: "var(--text)", margin: "0 0 12px", fontWeight: 650 }}>Resident EPA progress</h2>
                <label style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, color: "var(--text-2)", fontSize: 12, marginBottom: 14 }}>Resident<select value={cohortProgressResident.userId} onChange={event => setCohortProgressResidentId(event.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 7, background: "var(--surface)", color: "var(--text)", font: "inherit", maxWidth: "100%" }}>{cohortData.residents.map(resident => <option key={resident.userId} value={resident.userId}>{resident.name ?? resident.email}</option>)}</select></label>
                {cohortProgressResident.historicalProgress?.summary ? <><EpaProgressTotals summary={cohortProgressResident.historicalProgress.summary} /><p style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.7, marginTop: 10 }}>Source: {cohortProgressResident.historicalProgress.sourceFilename} · reviewed {cohortProgressResident.historicalProgress.reviewDate} · {cohortProgressResident.historicalProgress.reconciliationStatus.replaceAll("_", " ")}</p></> : <p style={{ color: "var(--text-3)", fontSize: 12 }}>No historical EPA progress is imported for this resident. Individual totals are unknown.</p>}
              </section> : null}

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
                      label="Avg observations signed"
                    />
                  </div>
                  {cohortKpis.silentResidents > 0 && (
                    <Link
                      href={cohortDashboardHref}
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
                      href={cohortDashboardHref}
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
                                  href={`/pd-dashboard/${encodeURIComponent(r.userId)}?programId=${encodeURIComponent(cohortProgramId)}`}
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
      {!hasNoCases && activeTab === "OR Time Trend" && (
        <div>
          <section>
            <div style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              gap: 12, marginBottom: 16,
            }}>
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                  textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4,
                }}>Operative Time Trend</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>Average OR time per month</div>
              </div>
              <select
                className="st-input"
                style={{ width: "auto", fontSize: 11, padding: "6px 10px" }}
                value={activeProcedure}
                onChange={e => setSelectedProcedure(e.target.value)}
              >
                <option value="">All procedures</option>
                {topProcedures.map(p => <option key={p} value={p}>{p.length > 30 ? p.slice(0, 30) + "\u2026" : p}</option>)}
              </select>
            </div>
            <LineChart
              data={getOperativeTimeTrend(cases, activeProcedure || undefined).map(d => ({
                label: d.month,
                value: d.avgDuration,
                secondary: d.caseCount,
              }))}
              color="#F59E0B"
              height={260}
              formatY={v => `${Math.round(v)} min`}
            />
          </section>
        </div>
      )}
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
