"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CaseLog, EpaObservation, EpaObservationInput } from "@/lib/types";
import { getSpecialtyEpaData, getSystemLabel, getMilestoneFramework } from "@/lib/epa/data";
import type { SpecialtyEpaData } from "@/lib/epa/data";
import { computeEpaProgress } from "@/lib/epa/mapper";
import type { EpaProgress, EpaDashboardData } from "@/lib/epa/mapper";
import { EpaObservationForm } from "./EpaObservationForm";
import { ModalShell } from "@/components/shared/ModalShell";
import { EpaSubReqChecklist } from "./EpaSubReqChecklist";
import { trackSubRequirements } from "@/lib/epa/subreqs";
import type { ObservationForTracking, EpaSubRequirementSummary } from "@/lib/epa/subreqs";
import { Check, AlertTriangle, Clock, Target, TrendingUp, ChevronRight } from "lucide-react";

// ── Colors ──
const STAGE_COLORS: Record<string, string> = {
  F: "#f59e0b",
  C: "#0ea5e9",
  TTP: "#10b981",
  TD: "#6366f1",
};

function getStageColor(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTP")) return STAGE_COLORS.TTP;
  if (id.startsWith("TD")) return STAGE_COLORS.TD;
  if (id.startsWith("C")) return STAGE_COLORS.C;
  if (id.startsWith("F")) return STAGE_COLORS.F;
  return "#0ea5e9";
}

function getStageLabel(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTP")) return "TTP";
  if (id.startsWith("TD")) return "TTD";
  if (id.startsWith("C")) return "Core";
  if (id.startsWith("F")) return "Foundations";
  return "EPA";
}

// ── Progress Ring ──
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

// ── EPA Row (compact, focused view) ──
function EpaRow({
  epa,
  observationCount,
  subReqSummary,
  onLogEpa,
}: {
  epa: EpaProgress;
  observationCount: number;
  subReqSummary?: EpaSubRequirementSummary;
  onLogEpa: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = getStageColor(epa.epaId);
  const isComplete = epa.percentComplete >= 100;
  const hasSubReqGaps = subReqSummary && subReqSummary.remaining.length > 0;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${isComplete ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
        borderRadius: 10,
        overflow: "hidden",
        transition: "all .15s",
      }}
    >
      {/* Main row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          cursor: "pointer",
        }}
      >
        {/* Progress ring */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProgressRing percent={epa.percentComplete} size={40} strokeWidth={3} color={color} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, color: "var(--text)",
            fontFamily: "'Geist Mono', monospace",
          }}>
            {epa.percentComplete}%
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color,
              fontFamily: "'Geist Mono', monospace",
              background: `${color}15`, padding: "1px 5px", borderRadius: 3,
              flexShrink: 0,
            }}>
              {epa.epaId}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 500, color: "var(--text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {epa.title}
            </span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginTop: 3,
            fontSize: 11, color: "var(--text-3)",
          }}>
            <span>{observationCount}/{epa.targetCases} observed</span>
            {isComplete && !hasSubReqGaps && (
              <span style={{ color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                <Check size={10} /> Complete
              </span>
            )}
            {hasSubReqGaps && (
              <span style={{ color: "#f59e0b", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                <AlertTriangle size={10} /> Sub-reqs needed
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight
          size={14}
          color="var(--text-3)"
          style={{
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform .15s",
            flexShrink: 0,
          }}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: "0 14px 14px",
          borderTop: "1px solid var(--border)",
          paddingTop: 12,
        }}>
          {/* Observation stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 12,
          }}>
            <div style={{
              background: "var(--surface2)", borderRadius: 6, padding: "8px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
                {epa.totalCases}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase" }}>Mapped Cases</div>
            </div>
            <div style={{
              background: "var(--surface2)", borderRadius: 6, padding: "8px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0ea5e9", fontFamily: "'Geist Mono', monospace" }}>
                {observationCount}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase" }}>Observations</div>
            </div>
            <div style={{
              background: "var(--surface2)", borderRadius: 6, padding: "8px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: color, fontFamily: "'Geist Mono', monospace" }}>
                {epa.targetCases - observationCount > 0 ? epa.targetCases - observationCount : 0}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase" }}>Remaining</div>
            </div>
          </div>

          {/* Autonomy breakdown */}
          {Object.keys(epa.byAutonomy).length > 0 && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12,
            }}>
              {Object.entries(epa.byAutonomy).map(([level, count]) => (
                <span key={level} style={{
                  fontSize: 10, fontWeight: 600,
                  padding: "2px 6px", borderRadius: 4,
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                }}>
                  {level.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}: {count}
                </span>
              ))}
            </div>
          )}

          {/* Sub-requirements */}
          {subReqSummary && subReqSummary.subRequirements.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <EpaSubReqChecklist summary={subReqSummary} />
            </div>
          )}

          {/* Log button */}
          <button
            onClick={(e) => { e.stopPropagation(); onLogEpa(); }}
            style={{
              width: "100%",
              padding: "8px 16px",
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
        </div>
      )}
    </div>
  );
}


// ── Main Component ──

interface EpaAnalyticsPanelProps {
  cases: CaseLog[];
  specialty?: string;
  trainingCountry?: string;
}

export function EpaAnalyticsPanel({ cases, specialty, trainingCountry }: EpaAnalyticsPanelProps) {
  const isCanadian = trainingCountry === "CA";

  // Observations
  const [observations, setObservations] = useState<EpaObservation[]>([]);
  const [observationsLoaded, setObservationsLoaded] = useState(false);

  // EPA form modal
  const [epaFormModal, setEpaFormModal] = useState<{ epaId: string; epaTitle: string } | null>(null);

  // Filter
  const [stageFilter, setStageFilter] = useState<string>("all");

  const loadObservations = useCallback(async () => {
    try {
      const res = await fetch("/api/epa/observations", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setObservations(data);
      }
    } catch { /* silently fail */ }
    finally { setObservationsLoaded(true); }
  }, []);

  useEffect(() => {
    if (!observationsLoaded) loadObservations();
  }, [observationsLoaded, loadObservations]);

  // EPA data
  const specialtyEpaData = useMemo(() => {
    if (!specialty) return undefined;
    return getSpecialtyEpaData(specialty, trainingCountry);
  }, [specialty, trainingCountry]);

  const foundationsEpaData = useMemo(() => {
    if (!isCanadian) return undefined;
    return getSpecialtyEpaData("surgical-foundations", "CA");
  }, [isCanadian]);

  // Compute progress
  const specialtyDashboard = useMemo(() => {
    if (!specialtyEpaData || cases.length === 0) return null;
    return computeEpaProgress(cases, specialtyEpaData);
  }, [cases, specialtyEpaData]);

  const foundationsDashboard = useMemo(() => {
    if (!foundationsEpaData || cases.length === 0) return null;
    return computeEpaProgress(cases, foundationsEpaData);
  }, [cases, foundationsEpaData]);

  // Merge all EPAs for display
  const allEpaData = useMemo(() => {
    const items: { epa: EpaProgress; source: string }[] = [];
    if (foundationsDashboard) {
      foundationsDashboard.epaProgress.forEach(e => items.push({ epa: e, source: "Foundations" }));
    }
    if (specialtyDashboard) {
      specialtyDashboard.epaProgress.forEach(e => items.push({ epa: e, source: "Specialty" }));
    }
    return items;
  }, [foundationsDashboard, specialtyDashboard]);

  // Observation counts
  const observationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const obs of observations) {
      if (obs.status === "SIGNED" || obs.status === "SUBMITTED" || obs.status === "PENDING_REVIEW") {
        counts[obs.epaId] = (counts[obs.epaId] || 0) + 1;
      }
    }
    return counts;
  }, [observations]);

  // Sub-requirement summaries
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
    const allEpaDefs = [
      ...(foundationsEpaData?.epas || []),
      ...(specialtyEpaData?.epas || []),
    ];
    for (const epaDef of allEpaDefs) {
      const summary = trackSubRequirements(epaDef, obsForTracking);
      if (summary.subRequirements.length > 0) {
        summaryMap[epaDef.id] = summary;
      }
    }
    return summaryMap;
  }, [observations, foundationsEpaData, specialtyEpaData]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalEpas = allEpaData.length;
    const completed = allEpaData.filter(({ epa }) => {
      const obsCount = observationCounts[epa.epaId] || 0;
      const subReq = subReqSummaries[epa.epaId];
      return obsCount >= epa.targetCases && (!subReq || subReq.allSubReqsMet);
    }).length;
    const inProgress = allEpaData.filter(({ epa }) => {
      const obsCount = observationCounts[epa.epaId] || 0;
      return obsCount > 0 && obsCount < epa.targetCases;
    }).length;
    const notStarted = allEpaData.filter(({ epa }) => (observationCounts[epa.epaId] || 0) === 0).length;
    const totalObs = observations.filter(o => o.status !== "RETURNED").length;
    const signed = observations.filter(o => o.status === "SIGNED").length;
    const pending = observations.filter(o => o.status === "SUBMITTED" || o.status === "PENDING_REVIEW").length;
    const withSubReqGaps = Object.values(subReqSummaries).filter(s => !s.allSubReqsMet).length;

    return { totalEpas, completed, inProgress, notStarted, totalObs, signed, pending, withSubReqGaps };
  }, [allEpaData, observationCounts, observations, subReqSummaries]);

  // Stage filter options
  const stages = useMemo(() => {
    const s = new Set<string>();
    allEpaData.forEach(({ epa }) => s.add(getStageLabel(epa.epaId)));
    return Array.from(s);
  }, [allEpaData]);

  // Filtered EPAs
  const filteredEpas = useMemo(() => {
    if (stageFilter === "all") return allEpaData;
    return allEpaData.filter(({ epa }) => getStageLabel(epa.epaId) === stageFilter);
  }, [allEpaData, stageFilter]);

  // Sort: incomplete first (by % ascending), then complete
  const sortedEpas = useMemo(() => {
    return [...filteredEpas].sort((a, b) => {
      const aObs = observationCounts[a.epa.epaId] || 0;
      const bObs = observationCounts[b.epa.epaId] || 0;
      const aPct = Math.min(100, Math.round((aObs / a.epa.targetCases) * 100));
      const bPct = Math.min(100, Math.round((bObs / b.epa.targetCases) * 100));
      // Incomplete first, sorted by ascending %
      if (aPct < 100 && bPct >= 100) return -1;
      if (aPct >= 100 && bPct < 100) return 1;
      return aPct - bPct;
    });
  }, [filteredEpas, observationCounts]);

  // Handlers
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

  if (!specialtyEpaData && !foundationsEpaData) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: 200, color: "var(--text-3)", fontSize: 14, textAlign: "center", gap: 8,
        padding: "48px 0",
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)" }}>
          EPA tracking coming soon for {specialty || "your specialty"}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Summary Cards ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
        marginBottom: 24,
      }}>
        {[
          {
            label: "Complete",
            value: stats.completed,
            sub: `of ${stats.totalEpas} EPAs`,
            icon: <Check size={14} />,
            color: "#10b981",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            sub: "with observations",
            icon: <TrendingUp size={14} />,
            color: "#0ea5e9",
          },
          {
            label: "Not Started",
            value: stats.notStarted,
            sub: "no observations yet",
            icon: <Clock size={14} />,
            color: "#64748b",
          },
          {
            label: "Sub-Req Gaps",
            value: stats.withSubReqGaps,
            sub: "EPAs with specific needs",
            icon: <Target size={14} />,
            color: stats.withSubReqGaps > 0 ? "#f59e0b" : "#10b981",
          },
        ].map((card) => (
          <div key={card.label} style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 14px",
            textAlign: "center",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, marginBottom: 4,
            }}>
              <span style={{ color: card.color }}>{card.icon}</span>
              <span style={{
                fontSize: 22, fontWeight: 700, color: "var(--text)",
                fontFamily: "'Geist Mono', monospace",
              }}>
                {card.value}
              </span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-2)" }}>{card.label}</div>
            <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 1 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Observation Stats Strip ── */}
      <div style={{
        display: "flex", gap: 16, marginBottom: 20,
        padding: "10px 14px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        alignItems: "center",
      }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>Observations:</div>
        <div style={{ display: "flex", gap: 12, flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
            {stats.totalObs} total
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>
            {stats.signed} signed
          </span>
          {stats.pending > 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>
              {stats.pending} pending
            </span>
          )}
        </div>
      </div>

      {/* ── Stage Filter ── */}
      {stages.length > 1 && (
        <div style={{
          display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap",
        }}>
          <button
            onClick={() => setStageFilter("all")}
            style={{
              fontSize: 10, fontWeight: 600, padding: "4px 10px",
              borderRadius: 4, border: "1px solid",
              borderColor: stageFilter === "all" ? "var(--primary)" : "var(--border)",
              background: stageFilter === "all" ? "var(--primary)" : "transparent",
              color: stageFilter === "all" ? "#fff" : "var(--text-3)",
              cursor: "pointer", transition: "all .15s",
            }}
          >
            All ({allEpaData.length})
          </button>
          {stages.map((stage) => {
            const count = allEpaData.filter(({ epa }) => getStageLabel(epa.epaId) === stage).length;
            const sampleEpa = allEpaData.find(({ epa }) => getStageLabel(epa.epaId) === stage);
            const color = sampleEpa ? getStageColor(sampleEpa.epa.epaId) : "#0ea5e9";
            return (
              <button
                key={stage}
                onClick={() => setStageFilter(stage)}
                style={{
                  fontSize: 10, fontWeight: 600, padding: "4px 10px",
                  borderRadius: 4, border: "1px solid",
                  borderColor: stageFilter === stage ? color : "var(--border)",
                  background: stageFilter === stage ? color : "transparent",
                  color: stageFilter === stage ? "#fff" : color,
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                {stage} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ── EPA List ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sortedEpas.map(({ epa }) => (
          <EpaRow
            key={epa.epaId}
            epa={epa}
            observationCount={observationCounts[epa.epaId] || 0}
            subReqSummary={subReqSummaries[epa.epaId]}
            onLogEpa={() => handleLogEpa(epa.epaId, epa.title)}
          />
        ))}
      </div>

      {sortedEpas.length === 0 && (
        <div style={{
          textAlign: "center", padding: "40px 0",
          color: "var(--text-3)", fontSize: 13,
        }}>
          No EPAs found for this filter
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
