"use client";

import type { EpaObservation, EpaObservationStatus } from "@/lib/types";

interface EpaObservationCardProps {
  observation: EpaObservation;
  onClick?: () => void;
}

function getStageColor(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTP")) return "#10b981";
  if (id.startsWith("TD")) return "#6366f1";
  if (id.startsWith("C")) return "#0ea5e9";
  if (id.startsWith("F")) return "#f59e0b";
  return "#0ea5e9";
}

function getStatusStyle(status: EpaObservationStatus): {
  label: string;
  color: string;
  bg: string;
} {
  switch (status) {
    case "DRAFT":
      return { label: "Draft", color: "#94a3b8", bg: "#64748b15" };
    case "SUBMITTED":
      return { label: "Submitted", color: "#0ea5e9", bg: "#0ea5e915" };
    case "PENDING_REVIEW":
      return { label: "Pending", color: "#f59e0b", bg: "#f59e0b15" };
    case "SIGNED":
      return { label: "Signed", color: "#10b981", bg: "#10b98115" };
    case "RETURNED":
      return { label: "Returned", color: "#ef4444", bg: "#ef444415" };
    default:
      return { label: status, color: "#94a3b8", bg: "#64748b15" };
  }
}

const ENTRUSTMENT_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#22c55e",
  5: "#10b981",
};

const ENTRUSTMENT_SHORT: Record<number, string> = {
  1: "Had to do",
  2: "Talk through",
  3: "Prompted",
  4: "Just in case",
  5: "Independent",
};

export function EpaObservationCard({
  observation,
  onClick,
}: EpaObservationCardProps) {
  const stageColor = getStageColor(observation.epaId);
  const statusStyle = getStatusStyle(observation.status);
  const achieved = observation.achievement === "ACHIEVED";
  const dateStr = new Date(observation.observationDate).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" }
  );
  const oScore = observation.entrustmentScore;

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border-mid)",
        borderRadius: 10,
        padding: 14,
        cursor: onClick ? "pointer" : "default",
        transition: "all .15s",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--text-3)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-mid)";
      }}
    >
      {/* Top row: EPA badge + title + status */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 10, fontWeight: 700, color: stageColor,
            fontFamily: "'Geist Mono', monospace",
            background: `${stageColor}15`, padding: "2px 6px", borderRadius: 4, flexShrink: 0,
          }}
        >
          {observation.epaId}
        </span>
        <span
          style={{
            flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-1)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {observation.epaTitle}
        </span>
        <span
          style={{
            fontSize: 10, fontWeight: 600, color: statusStyle.color,
            background: statusStyle.bg, padding: "2px 7px", borderRadius: 4, flexShrink: 0,
          }}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Bottom row: date, assessor, O-score, achievement */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{dateStr}</span>
        <span style={{ fontSize: 11, color: "var(--text-2)" }}>{observation.assessorName}</span>
        <div style={{ flex: 1 }} />

        {/* O-Score badge (Royal College) */}
        {oScore != null && oScore >= 1 && oScore <= 5 && (
          <span
            style={{
              fontSize: 10, fontWeight: 700,
              color: ENTRUSTMENT_COLORS[oScore],
              background: `${ENTRUSTMENT_COLORS[oScore]}15`,
              padding: "2px 7px", borderRadius: 4,
              fontFamily: "'Geist Mono', monospace",
            }}
            title={ENTRUSTMENT_SHORT[oScore]}
          >
            O-{oScore}
          </span>
        )}

        {/* Achievement badge */}
        <span
          style={{
            fontSize: 10, fontWeight: 600,
            color: achieved ? "#10b981" : "#94a3b8",
            background: achieved ? "#10b98115" : "#64748b15",
            padding: "2px 7px", borderRadius: 4,
          }}
        >
          {achieved ? "Achieved" : "Not Yet"}
        </span>
      </div>

      {/* Safety concern flag */}
      {(observation.safetyConcern || observation.professionalismConcern) && (
        <div
          style={{
            marginTop: 8, display: "flex", alignItems: "center", gap: 6,
            padding: "4px 8px", borderRadius: 6,
            background: "#ef444410", border: "1px solid #ef444420",
          }}
        >
          <span style={{ fontSize: 12 }}>&#9888;</span>
          <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>
            {observation.safetyConcern && observation.professionalismConcern
              ? "Safety & Professionalism Concern"
              : observation.safetyConcern
                ? "Safety Concern"
                : "Professionalism Concern"}
          </span>
        </div>
      )}
    </div>
  );
}
