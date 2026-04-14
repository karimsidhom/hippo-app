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
import { useUser } from "@/hooks/useUser";
import Link from "next/link";

const BASE_CHART_TABS = ["Overview", "EPAs", "Milestones", "Learning Curve", "Volume", "OR Time Trend"];


export default function AnalyticsPage() {
  const { cases } = useCases();
  const { stats } = useStats(cases);
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedProcedure, setSelectedProcedure] = useState("");

  const isPD = profile?.roleType === "PROGRAM_DIRECTOR";
  const CHART_TABS = isPD ? [...BASE_CHART_TABS, "PD Dashboard"] : BASE_CHART_TABS;

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

  if (cases.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: 200, color: "var(--text-3)", fontSize: 14, textAlign: "center", gap: 8,
        padding: "48px 0",
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)", marginBottom: 4 }}>
          No data yet
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
          Log at least a few cases to see analytics
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-.4px" }}>Analytics</span>
      </div>

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
                href="/pd-dashboard"
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

      {/* ── Overview ── */}
      {activeTab === "Overview" && (
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
        <EpaAnalyticsPanel
          cases={cases}
          specialty={profile?.specialty ?? undefined}
          trainingCountry={profile?.trainingCountry ?? undefined}
        />
      )}

      {/* ── Milestones ── */}
      {activeTab === "Milestones" && (
        <EpaDashboard
          cases={cases}
          specialty={profile?.specialty ?? undefined}
          trainingCountry={profile?.trainingCountry ?? undefined}
          initialTab="Milestones"
        />
      )}

      {/* ── Learning Curve ── */}
      {activeTab === "Learning Curve" && (
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
      {activeTab === "Volume" && (
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

      {/* ── OR Time Trend ── */}
      {activeTab === "OR Time Trend" && (
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
