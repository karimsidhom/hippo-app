"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Target, Stethoscope } from "lucide-react";
import { QuickAddModal } from "@/components/cases/QuickAddModal";
import type { CaseLog, EpaObservation, EpaObservationInput } from "@/lib/types";
import { getSpecialtyEpaData, getSystemLabel, getMilestoneFramework } from "@/lib/epa/data";
import type { SpecialtyEpaData } from "@/lib/epa/data";
import { computeEpaProgress } from "@/lib/epa/mapper";
import type { EpaProgress, MilestoneProgress, EpaDashboardData } from "@/lib/epa/mapper";
import { EpaObservationCard } from "./EpaObservationCard";
import { EpaObservationForm } from "./EpaObservationForm";
import { ModalShell } from "@/components/shared/ModalShell";
import { EpaSubReqChecklist } from "./EpaSubReqChecklist";
import { trackSubRequirements } from "@/lib/epa/subreqs";
import type { ObservationForTracking, EpaSubRequirementSummary } from "@/lib/epa/subreqs";

// ── Sub-tabs within EPA Dashboard ──────────────────────────────────────────
const EPA_TABS = ["Overview", "EPAs", "Milestones", "Gaps", "Observations"];

// ── Colors ─────────────────────────────────────────────────────────────────
const LEVEL_COLORS = ["#64748b", "#f59e0b", "#0ea5e9", "#10b981", "#8b5cf6"];

/** Determine CBD stage color from EPA id prefix */
function getStageColor(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTP")) return "#10b981"; // Transition to Practice — green
  if (id.startsWith("TD")) return "#6366f1";  // Transition to Discipline — indigo
  if (id.startsWith("CSA") || id.startsWith("FSA") || id.startsWith("TTPSA")) return "#a855f7"; // Special assessments — purple
  if (id.startsWith("C")) return "#0ea5e9";   // Core of Discipline — blue
  if (id.startsWith("F")) return "#f59e0b";   // Foundations — amber
  return "#0ea5e9";
}

/** Determine CBD stage label from EPA id prefix */
function getStageLabel(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTPSA")) return "TTP Special Assessment";
  if (id.startsWith("TTP")) return "Transition to Practice";
  if (id.startsWith("TD")) return "Transition to Discipline";
  if (id.startsWith("CSA")) return "Core Special Assessment";
  if (id.startsWith("FSA")) return "Foundations Special Assessment";
  if (id.startsWith("C")) return "Core of Discipline";
  if (id.startsWith("F")) return "Foundations";
  return "EPA";
}

function getLevelLabel(level: number): string {
  const labels = ["", "Novice", "Advanced Beginner", "Competent", "Proficient", "Expert"];
  return labels[level] || "";
}

// ── Progress Ring ──────────────────────────────────────────────────────────
function ProgressRing({ percent, size = 48, strokeWidth = 4, color = "#0ea5e9" }: {
  percent: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-mid)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)" }}
      />
    </svg>
  );
}

// ── Level Dots ─────────────────────────────────────────────────────────────
function LevelDots({ level, max = 5 }: { level: number; max?: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i < level ? LEVEL_COLORS[Math.min(level - 1, 4)] : "var(--border-mid)",
            transition: "background .3s",
          }}
        />
      ))}
    </div>
  );
}

// ── Milestone Radar (simple CSS-based) ─────────────────────────────────────
function MilestoneRadar({ milestones }: { milestones: MilestoneProgress[] }) {
  if (milestones.length === 0) return null;
  const maxLevel = 5;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {milestones.map((m) => {
        const pct = (m.estimatedLevel / maxLevel) * 100;
        return (
          <div key={m.milestoneId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 44, fontSize: 11, fontWeight: 600, color: "var(--text-2)",
              fontFamily: "'Geist Mono', monospace", flexShrink: 0,
            }}>
              {m.milestoneId}
            </div>
            <div style={{
              flex: 1, height: 6, background: "var(--border-mid)", borderRadius: 3,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${pct}%`,
                background: LEVEL_COLORS[Math.min(m.estimatedLevel - 1, 4)],
                transition: "width .5s cubic-bezier(.16,1,.3,1)",
              }} />
            </div>
            <div style={{
              width: 20, fontSize: 11, fontWeight: 600, color: "var(--text-2)",
              fontFamily: "'Geist Mono', monospace", textAlign: "right",
            }}>
              {m.estimatedLevel}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── EPA Card ───────────────────────────────────────────────────────────────
function EpaCard({ epa, expanded, onToggle, observationCount, onLogEpa, subReqSummary }: {
  epa: EpaProgress; expanded: boolean; onToggle: () => void;
  observationCount?: number; onLogEpa?: () => void;
  subReqSummary?: EpaSubRequirementSummary;
}) {
  const color = getStageColor(epa.epaId);
  return (
    <div
      onClick={onToggle}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 14,
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <ProgressRing percent={epa.percentComplete} size={44} color={color} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "var(--text)",
            fontFamily: "'Geist Mono', monospace",
          }}>
            {epa.percentComplete}%
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color, fontFamily: "'Geist Mono', monospace",
              background: `${color}15`, padding: "1px 5px", borderRadius: 3,
              flexShrink: 0,
            }}>
              {epa.epaId}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 600, color: "var(--text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {epa.title}
            </span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginTop: 4,
          }}>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>
              {epa.totalCases}/{epa.targetCases} cases
            </span>
            {observationCount !== undefined && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: "#10b981",
                background: "#10b98115", padding: "1px 6px", borderRadius: 3,
              }}>
                {observationCount}/{epa.targetCases} observed
              </span>
            )}
            <LevelDots level={epa.estimatedLevel} />
            <span style={{
              fontSize: 10, color: "var(--text-3)",
            }}>
              L{epa.estimatedLevel}
            </span>
          </div>
          {/* Compact sub-req badges when collapsed */}
          {!expanded && subReqSummary && subReqSummary.remaining.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <EpaSubReqChecklist summary={subReqSummary} compact />
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
          }}>
            {Object.entries(epa.byAutonomy).map(([level, count]) => (
              <div key={level} style={{
                background: "var(--surface2)", borderRadius: 6, padding: "6px 8px",
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: "var(--text)",
                  fontFamily: "'Geist Mono', monospace",
                }}>
                  {count}
                </div>
                <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".5px" }}>
                  {level.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 8 }}>
            Estimated Level: <strong style={{ color: "var(--text)" }}>
              {epa.estimatedLevel} — {getLevelLabel(epa.estimatedLevel)}
            </strong>
          </div>

          {/* Sub-requirement checklist */}
          {subReqSummary && subReqSummary.subRequirements.length > 0 && (
            <div style={{
              marginTop: 12, paddingTop: 12,
              borderTop: "1px solid var(--border)",
            }}>
              <EpaSubReqChecklist summary={subReqSummary} />
            </div>
          )}

          {onLogEpa && (
            <button
              onClick={(e) => { e.stopPropagation(); onLogEpa(); }}
              style={{
                marginTop: 10,
                padding: "7px 16px",
                borderRadius: 6,
                border: "none",
                background: "var(--primary)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity .15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              Log EPA Observation
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stage Legend Badges ───────────────────────────────────────────────────
function StageLegend({ epaData }: { epaData: SpecialtyEpaData }) {
  if (epaData.system !== "RCPSC") return null;

  // Detect which stages are present in this dataset
  const stageSet = new Set<string>();
  for (const epa of epaData.epas) {
    stageSet.add(getStageLabel(epa.id));
  }

  const stageOrder = [
    "Transition to Discipline",
    "Foundations",
    "Foundations Special Assessment",
    "Core of Discipline",
    "Core Special Assessment",
    "Transition to Practice",
    "TTP Special Assessment",
  ];

  const stages = stageOrder.filter(s => stageSet.has(s));

  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
      {stages.map((stage) => {
        // Get color from a sample EPA in that stage
        const sampleEpa = epaData.epas.find(e => getStageLabel(e.id) === stage);
        const color = sampleEpa ? getStageColor(sampleEpa.id) : "#0ea5e9";
        // Short label
        const shortLabel = stage
          .replace("Transition to Discipline", "TTD")
          .replace("Foundations Special Assessment", "FSA")
          .replace("Foundations", "Foundations")
          .replace("Core Special Assessment", "CSA")
          .replace("Core of Discipline", "Core")
          .replace("TTP Special Assessment", "TTP SA")
          .replace("Transition to Practice", "TTP");
        return (
          <span key={stage} style={{
            fontSize: 9, fontWeight: 600, color,
            background: `${color}15`, padding: "2px 6px", borderRadius: 3,
            letterSpacing: ".5px", textTransform: "uppercase",
          }}>
            {shortLabel}
          </span>
        );
      })}
    </div>
  );
}

// ── EPA Panel (reusable for both Surgical Foundations and Specialty) ──────
function EpaPanel({
  epaData,
  dashboard,
  cases,
  observations,
  observationCounts,
  onLogEpa,
  initialTab: initialTabProp,
}: {
  epaData: SpecialtyEpaData;
  dashboard: EpaDashboardData | null;
  cases: CaseLog[];
  observations: EpaObservation[];
  observationCounts: Record<string, number>;
  onLogEpa: (epaId: string, epaTitle: string) => void;
  initialTab?: string;
}) {
  const [subTab, setSubTab] = useState(initialTabProp && EPA_TABS.includes(initialTabProp) ? initialTabProp : "Overview");
  const [expandedEpa, setExpandedEpa] = useState<string | null>(null);

  const systemLabel = getSystemLabel(epaData.system);
  const frameworkLabel = getMilestoneFramework(epaData.system);

  if (!dashboard || cases.length === 0) {
    return <EpaEmptyCases />;
  }

  // Group milestones by domain
  const milestonesByDomain = dashboard.milestoneProgress.reduce((acc, m) => {
    if (!acc[m.domain]) acc[m.domain] = [];
    acc[m.domain].push(m);
    return acc;
  }, {} as Record<string, MilestoneProgress[]>);

  // Compute sub-requirement summaries for each EPA using observations
  const subReqSummaries = useMemo(() => {
    const summaryMap: Record<string, EpaSubRequirementSummary> = {};
    const obsForTracking: ObservationForTracking[] = observations.map((obs) => ({
      epaId: obs.epaId,
      complexity: obs.complexity ?? null,
      technique: obs.technique ?? null,
      assessorName: obs.assessorName,
      setting: obs.setting ?? null,
      status: obs.status,
    }));

    for (const epaDef of epaData.epas) {
      const summary = trackSubRequirements(epaDef, obsForTracking);
      if (summary.subRequirements.length > 0) {
        summaryMap[epaDef.id] = summary;
      }
    }
    return summaryMap;
  }, [observations, epaData.epas]);

  const sortedEpas = [...dashboard.epaProgress];
  const completedEpas = dashboard.epaProgress.filter(e => e.percentComplete >= 100).length;
  const totalEpas = dashboard.epaProgress.length;
  const avgCompletion = totalEpas > 0
    ? Math.round(dashboard.epaProgress.reduce((s, e) => s + e.percentComplete, 0) / totalEpas)
    : 0;

  return (
    <div>
      {/* System Badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: ".5px",
          textTransform: "uppercase", color: "#0ea5e9",
          background: "#0ea5e915", padding: "3px 8px", borderRadius: 4,
        }}>
          {systemLabel}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: ".5px",
          textTransform: "uppercase", color: "#10b981",
          background: "#10b98115", padding: "3px 8px", borderRadius: 4,
        }}>
          {frameworkLabel}
        </span>
      </div>

      {/* Quick Stats Strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10,
        marginBottom: 20,
      }}>
        {[
          { label: "Overall Level", value: dashboard.overallLevel.toFixed(1), sub: "of 5.0" },
          { label: "EPA Completion", value: `${avgCompletion}%`, sub: `${completedEpas}/${totalEpas} complete` },
          { label: "Mapped Cases", value: String(dashboard.epaProgress.reduce((s, e) => s + e.totalCases, 0)), sub: `of ${cases.length} total` },
          { label: "Gaps", value: String(dashboard.gaps.length), sub: "EPAs < 50%" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "10px 12px", textAlign: "center",
          }}>
            <div style={{
              fontSize: 18, fontWeight: 700, color: "var(--text)",
              fontFamily: "'Geist Mono', monospace",
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 500, marginTop: 2 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 1 }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{
        display: "flex", gap: 2, overflowX: "auto",
        paddingBottom: 14, marginBottom: 18,
        borderBottom: "1px solid var(--border)",
        scrollbarWidth: "none",
      }}>
        {EPA_TABS.map(tab => {
          const active = subTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              style={{
                flexShrink: 0, padding: "5px 12px",
                background: active ? "var(--surface2)" : "none",
                border: active ? "1px solid var(--border-mid)" : "1px solid transparent",
                color: active ? "var(--text)" : "var(--text-3)",
                borderRadius: 4, fontSize: 11, fontWeight: active ? 600 : 500,
                cursor: "pointer", fontFamily: "'Geist', sans-serif",
                transition: "all .15s",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── Overview Sub-tab ── */}
      {subTab === "Overview" && (
        <div>
          {dashboard.strengths.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10,
              }}>Top Strengths</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dashboard.strengths.map((s) => (
                  <div key={s.epaId} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 8, padding: "8px 12px",
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: getStageColor(s.epaId),
                      fontFamily: "'Geist Mono', monospace",
                      background: `${getStageColor(s.epaId)}15`,
                      padding: "1px 5px", borderRadius: 3,
                    }}>
                      {s.epaId}
                    </span>
                    <span style={{ flex: 1, fontSize: 12, color: "var(--text)", fontWeight: 500 }}>
                      {s.title}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: "#10b981",
                      fontFamily: "'Geist Mono', monospace",
                    }}>
                      {s.cases}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section style={{
            paddingTop: 20, borderTop: "1px solid var(--border)",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: "var(--text-3)",
              textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12,
            }}>{frameworkLabel} Progress</div>
            {Object.entries(milestonesByDomain).map(([domain, milestones]) => (
              <div key={domain} style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: "var(--text-2)", marginBottom: 8,
                }}>
                  {domain}
                </div>
                <MilestoneRadar milestones={milestones} />
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ── EPAs Sub-tab ── */}
      {subTab === "EPAs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <StageLegend epaData={epaData} />
          {sortedEpas.map((epa) => (
            <EpaCard
              key={epa.epaId}
              epa={epa}
              expanded={expandedEpa === epa.epaId}
              onToggle={() => setExpandedEpa(expandedEpa === epa.epaId ? null : epa.epaId)}
              observationCount={observationCounts[epa.epaId] ?? 0}
              onLogEpa={() => onLogEpa(epa.epaId, epa.title)}
              subReqSummary={subReqSummaries[epa.epaId]}
            />
          ))}
        </div>
      )}

      {/* ── Milestones Sub-tab ── */}
      {subTab === "Milestones" && (
        <div>
          {Object.entries(milestonesByDomain).map(([domain, milestones]) => (
            <section key={domain} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12,
              }}>{domain}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {milestones.map((m) => (
                  <div key={m.milestoneId} style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: 14,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: LEVEL_COLORS[Math.min(m.estimatedLevel - 1, 4)],
                            fontFamily: "'Geist Mono', monospace",
                            background: `${LEVEL_COLORS[Math.min(m.estimatedLevel - 1, 4)]}15`,
                            padding: "1px 5px", borderRadius: 3,
                          }}>
                            {m.milestoneId}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                            {m.title}
                          </span>
                        </div>
                        <div style={{
                          fontSize: 11, color: "var(--text-3)", marginTop: 4,
                        }}>
                          {m.evidenceCases} evidence cases
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <LevelDots level={m.estimatedLevel} />
                        <div style={{
                          fontSize: 10, color: "var(--text-3)", marginTop: 4,
                        }}>
                          Level {m.estimatedLevel} — {getLevelLabel(m.estimatedLevel)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Gaps Sub-tab ── */}
      {subTab === "Gaps" && (
        <div>
          {dashboard.gaps.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "48px 20px 20px", textAlign: "center",
              maxWidth: 360, margin: "0 auto",
            }}>
              <Target size={32} strokeWidth={1.25} style={{ color: "var(--success)", marginBottom: 14 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                No gaps right now
              </div>
              <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 14 }}>
                Every EPA is at 50%+ completion. Keep the streak going — pick an EPA from the list to push it over the line.
              </div>
              <button
                onClick={() => setSubTab("EPAs")}
                style={{
                  fontSize: 12, fontWeight: 600, color: "var(--primary)",
                  background: "none", border: "none",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Browse EPAs →
              </button>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12,
              }}>EPAs Below 50% Completion</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dashboard.gaps.map((gap) => {
                  const epaProgress = dashboard.epaProgress.find(e => e.epaId === gap.epaId);
                  return (
                    <div key={gap.epaId} style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: 10, padding: 14,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: "#ef444420", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: "#ef4444",
                          fontFamily: "'Geist Mono', monospace",
                        }}>
                          {gap.epaId}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                            {gap.title}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                            Need <strong style={{ color: "#ef4444" }}>{gap.needed}</strong> more cases
                            {epaProgress && (
                              <> &middot; {epaProgress.totalCases}/{epaProgress.targetCases} logged</>
                            )}
                          </div>
                          {/* Sub-requirement gaps */}
                          {subReqSummaries[gap.epaId] && subReqSummaries[gap.epaId].remaining.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              <EpaSubReqChecklist summary={subReqSummaries[gap.epaId]} compact />
                            </div>
                          )}
                        </div>
                        {epaProgress && (
                          <div style={{ position: "relative" }}>
                            <ProgressRing percent={epaProgress.percentComplete} size={36} strokeWidth={3} color="#ef4444" />
                            <div style={{
                              position: "absolute", inset: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, fontWeight: 700, color: "var(--text-2)",
                              fontFamily: "'Geist Mono', monospace",
                            }}>
                              {epaProgress.percentComplete}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Observations Sub-tab ── */}
      {subTab === "Observations" && (
        <div>
          {observations.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "48px 20px 20px", textAlign: "center",
              maxWidth: 360, margin: "0 auto",
            }}>
              <Stethoscope size={32} strokeWidth={1.25} style={{ color: "var(--text-3)", marginBottom: 14 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                No observations yet
              </div>
              <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 14 }}>
                Pick an EPA and log an observation — attach it to a case to send it to an attending for sign-off.
              </div>
              <button
                onClick={() => setSubTab("EPAs")}
                style={{
                  fontSize: 12, fontWeight: 600, color: "var(--primary)",
                  background: "none", border: "none",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Choose an EPA →
              </button>
            </div>
          ) : (
            <>
              {/* Signed */}
              {observations.filter(o => o.status === "SIGNED").length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                    textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10,
                  }}>Signed</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {observations.filter(o => o.status === "SIGNED").map((obs) => (
                      <EpaObservationCard key={obs.id} observation={obs} />
                    ))}
                  </div>
                </section>
              )}

              {/* Pending Review */}
              {observations.filter(o => o.status === "PENDING_REVIEW" || o.status === "SUBMITTED").length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                    textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10,
                  }}>Pending Review</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {observations.filter(o => o.status === "PENDING_REVIEW" || o.status === "SUBMITTED").map((obs) => (
                      <EpaObservationCard key={obs.id} observation={obs} />
                    ))}
                  </div>
                </section>
              )}

              {/* Drafts */}
              {observations.filter(o => o.status === "DRAFT").length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                    textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10,
                  }}>Drafts</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {observations.filter(o => o.status === "DRAFT").map((obs) => (
                      <EpaObservationCard key={obs.id} observation={obs} />
                    ))}
                  </div>
                </section>
              )}

              {/* Returned */}
              {observations.filter(o => o.status === "RETURNED").length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                    textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10,
                  }}>Returned</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {observations.filter(o => o.status === "RETURNED").map((obs) => (
                      <EpaObservationCard key={obs.id} observation={obs} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard Component ───────────────────────────────────────────────

interface EpaDashboardProps {
  cases: CaseLog[];
  specialty?: string;
  trainingCountry?: string;
  /** Optional initial sub-tab to show (e.g., "Milestones") */
  initialTab?: string;
}

export function EpaDashboard({ cases, specialty, trainingCountry, initialTab }: EpaDashboardProps) {
  // Hippo is a Manitoba-based CBD app — absent an explicit country, assume CA
  // so Surgical Foundations is available. Only an explicit non-CA value
  // switches to ACGME.
  const isCanadian = !trainingCountry || trainingCountry === "CA";

  // Top-level tab: "Surgical Foundations" vs specialty
  const [topTab, setTopTab] = useState<"foundations" | "specialty">("specialty");

  // Observations state
  const [observations, setObservations] = useState<EpaObservation[]>([]);
  const [observationsLoaded, setObservationsLoaded] = useState(false);

  // EPA form modal state
  const [epaFormModal, setEpaFormModal] = useState<{ epaId: string; epaTitle: string } | null>(null);

  // Fetch observations
  const loadObservations = useCallback(async () => {
    try {
      const res = await fetch("/api/epa/observations", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setObservations(data);
      }
    } catch {
      // silently fail
    } finally {
      setObservationsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!observationsLoaded) {
      loadObservations();
    }
  }, [observationsLoaded, loadObservations]);

  // Compute signed observation counts per EPA
  const observationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const obs of observations) {
      if (obs.status === "SIGNED" || obs.status === "SUBMITTED" || obs.status === "PENDING_REVIEW") {
        counts[obs.epaId] = (counts[obs.epaId] || 0) + 1;
      }
    }
    return counts;
  }, [observations]);

  const handleLogEpa = (epaId: string, epaTitle: string) => {
    setEpaFormModal({ epaId, epaTitle });
  };

  const handleEpaFormSubmit = async (data: EpaObservationInput) => {
    try {
      const createRes = await fetch("/api/epa/observations", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...data,
          observationDate: data.observationDate instanceof Date
            ? data.observationDate.toISOString()
            : data.observationDate,
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create observation");
      const observation = await createRes.json();

      await fetch(`/api/epa/observations/${observation.id}/submit`, {
        method: "POST",
        credentials: "include",
      });

      setEpaFormModal(null);
      loadObservations();
    } catch (err) {
      console.error("EPA observation submit failed:", err);
    }
  };

  const handleEpaFormDraft = async (data: EpaObservationInput) => {
    try {
      await fetch("/api/epa/observations", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...data,
          observationDate: data.observationDate instanceof Date
            ? data.observationDate.toISOString()
            : data.observationDate,
        }),
      });
      setEpaFormModal(null);
      loadObservations();
    } catch (err) {
      console.error("EPA observation draft failed:", err);
    }
  };

  // Resolve EPA data for specialty
  const specialtyEpaData: SpecialtyEpaData | undefined = useMemo(() => {
    if (!specialty) return undefined;
    return getSpecialtyEpaData(specialty, trainingCountry);
  }, [specialty, trainingCountry]);

  // Resolve EPA data for Surgical Foundations (only for Canadian residents)
  const foundationsEpaData: SpecialtyEpaData | undefined = useMemo(() => {
    if (!isCanadian) return undefined;
    return getSpecialtyEpaData("surgical-foundations", "CA");
  }, [isCanadian]);

  // Compute progress for foundations panel. Always compute when data exists
  // (even with 0 cases) so the EPA list renders.
  const foundationsDashboard: EpaDashboardData | null = useMemo(() => {
    if (!foundationsEpaData) return null;
    return computeEpaProgress(cases, foundationsEpaData);
  }, [cases, foundationsEpaData]);

  // When viewing the specialty panel for a Canadian trainee, hide the
  // "Foundations of Discipline" (F-prefix) EPAs and their milestones — those
  // are covered in the dedicated Surgical Foundations tab. Without this,
  // users see the same F1..F9 content in both tabs and ask "why are the
  // Surgical Foundations EPAs still in the specialty milestones view?"
  const specialtyEpaDataFiltered = useMemo<SpecialtyEpaData | undefined>(() => {
    if (!specialtyEpaData) return undefined;
    // Only filter when a separate SF panel exists (Canadian system). ACGME
    // specialties don't have a parallel SF track, so keep everything.
    if (!foundationsEpaData) return specialtyEpaData;
    const keepEpas = specialtyEpaData.epas.filter(
      (e) => !/^F\d/i.test(e.id),
    );
    // Milestones referenced only by F-EPAs should also drop out.
    const keptMilestoneIds = new Set<string>();
    for (const epa of keepEpas) {
      for (const mId of epa.relatedMilestones) keptMilestoneIds.add(mId);
    }
    const keepMilestones = specialtyEpaData.milestones.filter((m) =>
      keptMilestoneIds.has(m.id),
    );
    return { ...specialtyEpaData, epas: keepEpas, milestones: keepMilestones };
  }, [specialtyEpaData, foundationsEpaData]);

  const specialtyDashboardFiltered: EpaDashboardData | null = useMemo(() => {
    if (!specialtyEpaDataFiltered) return null;
    return computeEpaProgress(cases, specialtyEpaDataFiltered);
  }, [cases, specialtyEpaDataFiltered]);

  // Determine which panel is active
  const activeEpaData = topTab === "foundations" ? foundationsEpaData : specialtyEpaDataFiltered;
  const activeDashboard = topTab === "foundations" ? foundationsDashboard : specialtyDashboardFiltered;

  // No EPA data for this specialty at all
  if (!specialtyEpaData && !foundationsEpaData) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: 200, color: "var(--text-3)", fontSize: 14, textAlign: "center", gap: 8,
        padding: "48px 0",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)" }}>
          EPA tracking coming soon for {specialty || "your specialty"}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 300 }}>
          Currently available for General Surgery and Urology ({isCanadian ? "Royal College CBD" : "ACGME"}).
          More specialties being added.
        </div>
      </div>
    );
  }

  const specialtyLabel = specialtyEpaData?.specialty || specialty || "Specialty";

  return (
    <div>
      {/* ── Top-level Tab Toggle (Canadian residents only) ── */}
      {isCanadian && foundationsEpaData && (
        <div style={{
          display: "flex", gap: 0, marginBottom: 20,
          background: "var(--surface2)", borderRadius: 8,
          padding: 3, border: "1px solid var(--border)",
        }}>
          <button
            onClick={() => setTopTab("foundations")}
            style={{
              flex: 1, padding: "8px 12px",
              background: topTab === "foundations" ? "var(--surface)" : "transparent",
              border: topTab === "foundations" ? "1px solid var(--border-mid)" : "1px solid transparent",
              borderRadius: 6, cursor: "pointer",
              fontSize: 12, fontWeight: topTab === "foundations" ? 700 : 500,
              color: topTab === "foundations" ? "var(--text)" : "var(--text-3)",
              fontFamily: "'Geist', sans-serif",
              transition: "all .15s",
              boxShadow: topTab === "foundations" ? "0 1px 3px rgba(0,0,0,.08)" : "none",
            }}
          >
            <span style={{ marginRight: 6 }}>🏥</span>
            Surgical Foundations
          </button>
          <button
            onClick={() => setTopTab("specialty")}
            style={{
              flex: 1, padding: "8px 12px",
              background: topTab === "specialty" ? "var(--surface)" : "transparent",
              border: topTab === "specialty" ? "1px solid var(--border-mid)" : "1px solid transparent",
              borderRadius: 6, cursor: "pointer",
              fontSize: 12, fontWeight: topTab === "specialty" ? 700 : 500,
              color: topTab === "specialty" ? "var(--text)" : "var(--text-3)",
              fontFamily: "'Geist', sans-serif",
              transition: "all .15s",
              boxShadow: topTab === "specialty" ? "0 1px 3px rgba(0,0,0,.08)" : "none",
            }}
          >
            <span style={{ marginRight: 6 }}>🔬</span>
            {specialtyLabel}
          </button>
        </div>
      )}

      {/* ── Active Panel ── */}
      {activeEpaData ? (
        <EpaPanel
          key={topTab}
          epaData={activeEpaData}
          dashboard={activeDashboard}
          cases={cases}
          observations={observations}
          observationCounts={observationCounts}
          onLogEpa={handleLogEpa}
          initialTab={initialTab}
        />
      ) : (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: 200, color: "var(--text-3)", fontSize: 14, textAlign: "center", gap: 8,
          padding: "48px 0",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)" }}>
            EPA tracking coming soon for {topTab === "foundations" ? "Surgical Foundations" : specialtyLabel}
          </div>
        </div>
      )}

      {/* ── EPA Observation Form Modal ── */}
      {epaFormModal && (
        <ModalShell onClose={() => setEpaFormModal(null)}>
          <EpaObservationForm
            epaId={epaFormModal.epaId}
            epaTitle={epaFormModal.epaTitle}
            specialtySlug={specialty || ""}
            trainingSystem={isCanadian ? "RCPSC" : "ACGME"}
            onSubmit={handleEpaFormSubmit}
            onCancel={() => setEpaFormModal(null)}
            onSaveDraft={handleEpaFormDraft}
          />
        </ModalShell>
      )}
    </div>
  );
}

function EpaEmptyCases() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "48px 20px 20px", textAlign: "center",
      maxWidth: 360, margin: "0 auto",
    }}>
      <ClipboardList size={32} strokeWidth={1.25} style={{ color: "var(--text-3)", marginBottom: 14 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
        No cases logged yet
      </div>
      <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 18 }}>
        Log your first case to start tracking EPA progress and milestones.
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
  );
}
