"use client";

import { useMemo, useState } from "react";
import type { CaseLog } from "@/lib/types";
import { getSpecialtyEpaData, getSystemLabel, getMilestoneFramework } from "@/lib/epa/data";
import type { SpecialtyEpaData } from "@/lib/epa/data";
import { computeEpaProgress } from "@/lib/epa/mapper";
import type { EpaProgress, MilestoneProgress, EpaDashboardData } from "@/lib/epa/mapper";

// ── Sub-tabs within EPA Dashboard ──────────────────────────────────────────
const EPA_TABS = ["Overview", "EPAs", "Milestones", "Gaps"];

// ── Colors ─────────────────────────────────────────────────────────────────
const LEVEL_COLORS = ["#64748b", "#f59e0b", "#0ea5e9", "#10b981", "#8b5cf6"];
const EPA_STAGE_COLORS: Record<string, string> = {
  // ACGME
  EPA: "#0ea5e9",
  // Royal College CBD stages
  FOD: "#f59e0b",
  COD: "#0ea5e9",
  TTP: "#10b981",
};

function getStageColor(epaId: string): string {
  const prefix = epaId.replace(/\d+$/, "");
  return EPA_STAGE_COLORS[prefix] || "#0ea5e9";
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
function EpaCard({ epa, expanded, onToggle }: {
  epa: EpaProgress; expanded: boolean; onToggle: () => void;
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
            <LevelDots level={epa.estimatedLevel} />
            <span style={{
              fontSize: 10, color: "var(--text-3)",
            }}>
              L{epa.estimatedLevel}
            </span>
          </div>
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
}

export function EpaDashboard({ cases, specialty, trainingCountry }: EpaDashboardProps) {
  const [subTab, setSubTab] = useState("Overview");
  const [expandedEpa, setExpandedEpa] = useState<string | null>(null);

  // Resolve EPA data based on specialty + country
  const epaData: SpecialtyEpaData | undefined = useMemo(() => {
    if (!specialty) return undefined;
    return getSpecialtyEpaData(specialty, trainingCountry);
  }, [specialty, trainingCountry]);

  // Compute progress
  const dashboard: EpaDashboardData | null = useMemo(() => {
    if (!epaData || cases.length === 0) return null;
    return computeEpaProgress(cases, epaData);
  }, [cases, epaData]);

  // No EPA data for this specialty
  if (!epaData) {
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
          Currently available for General Surgery ({trainingCountry === "CA" ? "Royal College CBD" : "ACGME"}).
          More specialties being added.
        </div>
      </div>
    );
  }

  if (!dashboard || cases.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: 200, color: "var(--text-3)", fontSize: 14, textAlign: "center", gap: 8,
        padding: "48px 0",
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)" }}>No cases logged yet</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
          Log cases to see your EPA progress and milestone tracking
        </div>
      </div>
    );
  }

  const systemLabel = getSystemLabel(epaData.system);
  const frameworkLabel = getMilestoneFramework(epaData.system);

  // Group milestones by domain
  const milestonesByDomain = dashboard.milestoneProgress.reduce((acc, m) => {
    if (!acc[m.domain]) acc[m.domain] = [];
    acc[m.domain].push(m);
    return acc;
  }, {} as Record<string, MilestoneProgress[]>);

  // Sort EPAs by stage for Royal College
  const sortedEpas = [...dashboard.epaProgress];

  // EPA completion stats
  const completedEpas = dashboard.epaProgress.filter(e => e.percentComplete >= 100).length;
  const totalEpas = dashboard.epaProgress.length;
  const avgCompletion = Math.round(
    dashboard.epaProgress.reduce((s, e) => s + e.percentComplete, 0) / totalEpas
  );

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
          {/* Top Strengths */}
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

          {/* Milestone Overview */}
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
          {epaData.system === "RCPSC" && (
            <div style={{
              display: "flex", gap: 10, marginBottom: 8,
            }}>
              {[
                { label: "Foundations", color: "#f59e0b", prefix: "FOD" },
                { label: "Core", color: "#0ea5e9", prefix: "COD" },
                { label: "Transition", color: "#10b981", prefix: "TTP" },
              ].map(({ label, color }) => (
                <span key={label} style={{
                  fontSize: 9, fontWeight: 600, color,
                  background: `${color}15`, padding: "2px 6px", borderRadius: 3,
                  letterSpacing: ".5px", textTransform: "uppercase",
                }}>
                  {label}
                </span>
              ))}
            </div>
          )}
          {sortedEpas.map((epa) => (
            <EpaCard
              key={epa.epaId}
              epa={epa}
              expanded={expandedEpa === epa.epaId}
              onToggle={() => setExpandedEpa(expandedEpa === epa.epaId ? null : epa.epaId)}
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
              textAlign: "center", padding: "40px 0",
              color: "var(--text-3)", fontSize: 13,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
              <div style={{ fontWeight: 500, color: "var(--text-2)" }}>No major gaps!</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>All your EPAs are at 50%+ completion</div>
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
    </div>
  );
}
