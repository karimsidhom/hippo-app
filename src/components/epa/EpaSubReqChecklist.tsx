"use client";

import type { SubRequirementProgress, EpaSubRequirementSummary } from "@/lib/epa/subreqs";
import { Check, AlertCircle, Users, Layers, Wrench, Target } from "lucide-react";

// ── Icons by type ──

function typeIcon(type: string) {
  switch (type) {
    case "complexity":
      return <Layers size={11} style={{ flexShrink: 0 }} />;
    case "technique":
      return <Wrench size={11} style={{ flexShrink: 0 }} />;
    case "assessor":
      return <Users size={11} style={{ flexShrink: 0 }} />;
    case "scenario":
      return <Target size={11} style={{ flexShrink: 0 }} />;
    default:
      return <AlertCircle size={11} style={{ flexShrink: 0 }} />;
  }
}

// ── Single requirement row ──

function SubReqRow({ progress }: { progress: SubRequirementProgress }) {
  const met = progress.met;
  const pct = Math.min(
    100,
    Math.round((progress.current / progress.requirement.minCount) * 100),
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        background: met
          ? "rgba(16,185,129,0.06)"
          : "rgba(245,158,11,0.04)",
        border: `1px solid ${met ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.15)"}`,
        borderRadius: 6,
      }}
    >
      {/* Check / warning icon */}
      {met ? (
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "rgba(16,185,129,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Check size={10} style={{ color: "#10b981" }} />
        </div>
      ) : (
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "rgba(245,158,11,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {typeIcon(progress.requirement.type)}
        </div>
      )}

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: met ? 500 : 600,
            color: met ? "#94a3b8" : "#e2e8f0",
            textDecoration: met ? "line-through" : "none",
            opacity: met ? 0.7 : 1,
          }}
        >
          {progress.requirement.label}
        </div>
      </div>

      {/* Progress badge */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "'Geist Mono', monospace",
          color: met ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444",
          flexShrink: 0,
        }}
      >
        {progress.current}/{progress.requirement.minCount}
      </div>
    </div>
  );
}

// ── Main component ──

interface EpaSubReqChecklistProps {
  summary: EpaSubRequirementSummary;
  /** If true, show a compact inline version */
  compact?: boolean;
}

export function EpaSubReqChecklist({
  summary,
  compact = false,
}: EpaSubReqChecklistProps) {
  if (summary.subRequirements.length === 0) return null;

  const metCount = summary.subRequirements.filter((p) => p.met).length;
  const totalReqs = summary.subRequirements.length;
  const allMet = summary.allSubReqsMet;

  if (compact) {
    // Compact: just show remaining items as inline badges
    if (allMet) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: "#10b981",
          }}
        >
          <Check size={10} /> All sub-requirements met
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {summary.remaining.map((prog) => (
          <span
            key={prog.requirement.rawText}
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.2)",
              color: "#f59e0b",
              whiteSpace: "nowrap",
            }}
          >
            Need {prog.requirement.minCount - prog.current} more{" "}
            {prog.requirement.label.replace(/^\d+\+\s*/, "")}
          </span>
        ))}
      </div>
    );
  }

  // Full checklist
  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Specific Requirements
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: allMet ? "#10b981" : "#f59e0b",
          }}
        >
          {metCount}/{totalReqs} met
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {summary.subRequirements.map((prog) => (
          <SubReqRow key={prog.requirement.rawText} progress={prog} />
        ))}
      </div>

      {/* Observation count */}
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        Total observations: {summary.totalObservations}/{summary.targetCount}
        {summary.totalObservations >= summary.targetCount && allMet && (
          <span style={{ color: "#10b981", fontWeight: 600 }}>
            {" "}
            — Ready for review
          </span>
        )}
      </div>
    </div>
  );
}
