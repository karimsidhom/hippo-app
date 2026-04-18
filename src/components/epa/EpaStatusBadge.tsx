"use client";

import { Check, Clock, FileEdit, RotateCcw, Inbox } from "lucide-react";

// ---------------------------------------------------------------------------
// EpaStatusBadge — the single source of truth for "what status is this EPA?"
//
// The product concern here is real: a resident can log an EPA that looks
// visually identical to one that's been signed by their attending, and
// that's catastrophic for their records. This component gives each state
// an unmistakable visual weight:
//
//   SIGNED         → SOLID green pill with a tick, white text. "Counts."
//   PENDING_REVIEW → outlined teal pill with a clock. "Sitting on a desk."
//   RETURNED       → outlined amber pill with a return arrow. "Needs work."
//   DRAFT          → muted grey pill. "Not submitted yet."
//   SUBMITTED      → muted grey pill. "Logged, no reviewer."
//
// Size variants:
//   "sm"  — list rows, inbox entries  (compact)
//   "md"  — card headers              (default)
//   "lg"  — detail screens            (loud — pair with verifier line)
// ---------------------------------------------------------------------------

export type EpaStatus = "DRAFT" | "SUBMITTED" | "PENDING_REVIEW" | "SIGNED" | "RETURNED";

interface EpaStatusBadgeProps {
  status: EpaStatus;
  size?: "sm" | "md" | "lg";
  /** When the EPA was signed, to show inside the badge at lg size. */
  signedAt?: Date | string | null;
  /** Who signed it, for the "Verified by X" label next to lg size. */
  signedByName?: string | null;
}

export function EpaStatusBadge({
  status,
  size = "md",
  signedAt,
  signedByName,
}: EpaStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const dims = SIZE[size];

  // Loud mode — used on detail screens where the distinction matters
  // most. Full verifier line, strong color, can't-miss.
  if (size === "lg") {
    return (
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 14px",
        borderRadius: 8,
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        boxShadow: config.solid ? `0 0 0 4px ${config.bg}` : "none",
      }}>
        <Icon size={14} strokeWidth={2.25} />
        <span>{config.label}</span>
        {status === "SIGNED" && signedByName && (
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            opacity: 0.85,
            paddingLeft: 8,
            borderLeft: `1px solid ${config.color}40`,
          }}>
            by {signedByName}
            {signedAt && ` · ${formatSignedDate(signedAt)}`}
          </span>
        )}
      </div>
    );
  }

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: dims.gap,
      padding: dims.padding,
      borderRadius: dims.radius,
      background: config.bg,
      border: `1px solid ${config.border}`,
      color: config.color,
      fontSize: dims.fontSize,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    }}>
      <Icon size={dims.iconSize} strokeWidth={2.25} />
      <span>{config.label}</span>
    </span>
  );
}

/**
 * A one-line "Verified by Dr. X on DATE" label. Use alongside the badge
 * when the badge itself is small (sm/md) and we still want the verifier
 * info to read. Renders nothing if the EPA isn't signed.
 */
export function EpaVerifiedLine({
  signedAt,
  signedByName,
}: {
  signedAt?: Date | string | null;
  signedByName?: string | null;
}) {
  if (!signedAt || !signedByName) return null;
  return (
    <div style={{
      fontSize: 11,
      color: "#10b981",
      fontWeight: 500,
      marginTop: 4,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      lineHeight: 1.3,
    }}>
      <Check size={11} strokeWidth={2.5} />
      <span>Verified by {signedByName} · {formatSignedDate(signedAt)}</span>
    </div>
  );
}

interface StatusConfig {
  label: string;
  icon: typeof Check;
  bg: string;
  border: string;
  color: string;
  solid: boolean;
}

const STATUS_CONFIG: Record<EpaStatus, StatusConfig> = {
  SIGNED: {
    label: "Verified",
    icon: Check,
    // Solid fill so this pops against everything else. This is "this EPA
    // counts" — it must be impossible to miss.
    bg: "#10b981",
    border: "#10b981",
    color: "#ffffff",
    solid: true,
  },
  PENDING_REVIEW: {
    label: "Awaiting review",
    icon: Clock,
    bg: "rgba(14,165,233,0.08)",
    border: "rgba(14,165,233,0.35)",
    color: "#38bdf8",
    solid: false,
  },
  RETURNED: {
    label: "Needs edits",
    icon: RotateCcw,
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.35)",
    color: "#fbbf24",
    solid: false,
  },
  DRAFT: {
    label: "Draft",
    icon: FileEdit,
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.08)",
    color: "#64748b",
    solid: false,
  },
  SUBMITTED: {
    label: "Logged",
    icon: Inbox,
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.08)",
    color: "#94a3b8",
    solid: false,
  },
};

const SIZE = {
  sm: { fontSize: 10, padding: "3px 7px", radius: 4, gap: 4, iconSize: 10 },
  md: { fontSize: 11, padding: "4px 9px", radius: 5, gap: 5, iconSize: 11 },
  lg: { fontSize: 12, padding: "5px 10px", radius: 6, gap: 6, iconSize: 12 },
} as const;

function formatSignedDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
