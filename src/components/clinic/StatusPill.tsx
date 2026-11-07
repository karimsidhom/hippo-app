"use client";

import type { ClinicNoteStatus } from "@/lib/clinic/types";

const LABELS: Record<ClinicNoteStatus, { label: string; tone: "muted" | "warning" | "primary" | "success" | "danger" }> = {
  DRAFT:         { label: "Draft",        tone: "muted" },
  RECORDING:     { label: "Recording",    tone: "primary" },
  UPLOADING:     { label: "Uploading",    tone: "primary" },
  TRANSCRIBING:  { label: "Transcribing", tone: "primary" },
  GENERATING:    { label: "Generating",   tone: "primary" },
  NEEDS_REVIEW:  { label: "Needs review", tone: "warning" },
  FINALIZED:     { label: "Finalized",    tone: "success" },
  FAILED:        { label: "Failed",       tone: "danger" },
};

export function StatusPill({ status, pulsing }: { status: ClinicNoteStatus; pulsing?: boolean }) {
  const cfg = LABELS[status];
  const pulse = pulsing && (status === "RECORDING" || status === "GENERATING" || status === "TRANSCRIBING");
  const cls = `badge badge-${cfg.tone === "muted" ? "muted" : cfg.tone === "warning" ? "warning" : cfg.tone === "success" ? "success" : cfg.tone === "danger" ? "danger" : "primary"}`;
  return (
    <span className={cls} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {pulse && (
        <span
          aria-hidden
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "currentColor",
            animation: "clinicPulse 1.2s ease-in-out infinite",
          }}
        />
      )}
      <style>{`@keyframes clinicPulse { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }`}</style>
      {cfg.label}
    </span>
  );
}
