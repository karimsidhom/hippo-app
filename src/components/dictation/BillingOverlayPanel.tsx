"use client";

import { useState, useMemo } from "react";
import {
  resolveBillingKeys,
  getBillingOverlay,
} from "@/lib/dictation/billing";
import type {
  DictationContext,
  BillingPrompt,
  RenderedBillingOverlay,
} from "@/lib/dictation/billing";
import type { CaseLog } from "@/lib/types";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Clock,
  X,
} from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function severityIcon(severity: BillingPrompt["severity"]) {
  if (severity === "required")
    return <AlertTriangle size={11} style={{ color: "#DC2626", flexShrink: 0 }} />;
  if (severity === "recommended")
    return <DollarSign size={11} style={{ color: "#F59E0B", flexShrink: 0 }} />;
  return <Clock size={11} style={{ color: "#F59E0B", flexShrink: 0 }} />;
}

function severityBg(severity: BillingPrompt["severity"]) {
  if (severity === "required") return "rgba(220,38,38,0.08)";
  if (severity === "recommended") return "rgba(245,158,11,0.08)";
  return "rgba(245,158,11,0.06)";
}

function severityBorder(severity: BillingPrompt["severity"]) {
  if (severity === "required") return "rgba(220,38,38,0.25)";
  if (severity === "recommended") return "rgba(245,158,11,0.25)";
  return "rgba(245,158,11,0.18)";
}

// ── Context builder ─────────────────────────────────────────────────────────

interface BillingToggles {
  performedLysisOfAdhesions: boolean;
  lysisMinutes: string;
  sameIncisionMultipleProcedures: boolean;
  separateIncisionMultipleProcedures: boolean;
  bilateralSameSession: boolean;
  assistantUsed: boolean;
  twoSurgeons: boolean;
  additionalProcedureWithin3Weeks: boolean;
}

const DEFAULT_TOGGLES: BillingToggles = {
  performedLysisOfAdhesions: false,
  lysisMinutes: "",
  sameIncisionMultipleProcedures: false,
  separateIncisionMultipleProcedures: false,
  bilateralSameSession: false,
  assistantUsed: false,
  twoSurgeons: false,
  additionalProcedureWithin3Weeks: false,
};

function buildContext(
  caseLog: CaseLog,
  keys: string[],
  toggles: BillingToggles,
): DictationContext {
  return {
    procedureKey: keys[0] ?? "",
    performedLysisOfAdhesions: toggles.performedLysisOfAdhesions,
    lysisMinutes: toggles.lysisMinutes ? parseInt(toggles.lysisMinutes) : undefined,
    totalCaseMinutes: caseLog.operativeDurationMinutes ?? undefined,
    sameIncisionMultipleProcedures: toggles.sameIncisionMultipleProcedures,
    separateIncisionMultipleProcedures: toggles.separateIncisionMultipleProcedures,
    bilateralSameSession: toggles.bilateralSameSession,
    assistantUsed: toggles.assistantUsed,
    twoSurgeons: toggles.twoSurgeons,
    additionalProcedureWithin3Weeks: toggles.additionalProcedureWithin3Weeks,
    laterality: undefined,
  };
}

// ── Component ───────────────────────────────────────────────────────────────

interface BillingOverlayPanelProps {
  caseLog: CaseLog;
  /** When true, only show the collapsed summary. */
  compact?: boolean;
}

export function BillingOverlayPanel({
  caseLog,
  compact = false,
}: BillingOverlayPanelProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [dismissed, setDismissed] = useState(false);
  const [toggles, setToggles] = useState<BillingToggles>(DEFAULT_TOGGLES);
  const [showToggles, setShowToggles] = useState(false);

  const billingKeys = useMemo(
    () => resolveBillingKeys(caseLog.procedureName || ""),
    [caseLog.procedureName],
  );

  const overlay: RenderedBillingOverlay = useMemo(
    () => getBillingOverlay(billingKeys, buildContext(caseLog, billingKeys, toggles)),
    [billingKeys, caseLog, toggles],
  );

  // Don't render if no billing data and no codes
  if (billingKeys.length === 0 || dismissed) return null;

  const requiredPrompts = overlay.visiblePrompts.filter((p) => p.severity === "required");
  const otherPrompts = overlay.visiblePrompts.filter((p) => p.severity !== "required");

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(245,158,11,0.2)",
        background: "linear-gradient(180deg, rgba(245,158,11,0.04) 0%, transparent 100%)",
      }}
    >
      {/* Header bar — always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <DollarSign size={13} style={{ color: "#F59E0B", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#FDE68A",
              letterSpacing: "-0.2px",
            }}
          >
            Manitoba Billing
          </span>
          {!expanded && overlay.billableCodes.length > 0 && (
            <span
              style={{
                fontSize: 11,
                color: "#fbbf24",
                marginLeft: 8,
                opacity: 0.7,
              }}
            >
              {overlay.billableCodes.length} code{overlay.billableCodes.length !== 1 ? "s" : ""} attached
            </span>
          )}
          {!expanded && requiredPrompts.length > 0 && (
            <span
              style={{
                fontSize: 11,
                color: "#f87171",
                marginLeft: 8,
                fontWeight: 600,
              }}
            >
              {requiredPrompts.length} required
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          style={{
            background: "none",
            border: "none",
            padding: 2,
            cursor: "pointer",
            color: "var(--muted)",
            opacity: 0.5,
          }}
          title="Dismiss billing panel"
        >
          <X size={12} />
        </button>
        {expanded ? (
          <ChevronUp size={14} style={{ color: "var(--muted)" }} />
        ) : (
          <ChevronDown size={14} style={{ color: "var(--muted)" }} />
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 20px 14px" }}>
          {/* ⚠️ Verified-source warning.
              The tariff codes in this library were compiled in early dev
              and have NOT been audited against the current Manitoba
              Physician's Manual. A full rebuild is in progress (see
              docs/billing-audit.md). Until that lands, treat these codes
              as a DOCUMENTATION CHECKLIST ONLY — do not submit for
              billing without cross-checking against the official manual:
              https://www.gov.mb.ca/health/documents/physmanual.pdf */}
          {overlay.billableCodes.length > 0 && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px 10px",
                background: "rgba(220,38,38,0.08)",
                border: "1px solid rgba(220,38,38,0.3)",
                borderRadius: 6,
                fontSize: 11,
                color: "#fca5a5",
                lineHeight: 1.45,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <AlertTriangle size={11} style={{ color: "#ef4444" }} />
                <strong style={{ color: "#fca5a5" }}>
                  Codes pending audit — do not submit without verifying
                </strong>
              </div>
              <div style={{ color: "#fca5a5", opacity: 0.85 }}>
                The tariff code below is a rough match and has not been
                cross-checked against the current Manitoba Physician&rsquo;s
                Manual. Use the documentation prompts as a checklist, but
                verify the code number and fee against the official
                source before billing.
              </div>
            </div>
          )}
          {/* Billing codes */}
          {overlay.billableCodes.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                Suggested codes (unverified)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {overlay.billableCodes.map((code) => (
                  <div
                    key={code.code}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      // Amber, not green — these are unverified suggestions,
                      // not authoritative billing codes. See audit warning above.
                      background: "rgba(245,158,11,0.08)",
                      border: "1px dashed rgba(245,158,11,0.4)",
                      borderRadius: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#10b981",
                        fontFamily: "'Geist Mono', monospace",
                      }}
                    >
                      {code.code}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      {code.label}
                    </span>
                    {code.fee && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#10b981",
                          fontFamily: "'Geist Mono', monospace",
                        }}
                      >
                        ${code.fee}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required prompts (red) */}
          {requiredPrompts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              {requiredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "8px 10px",
                    background: severityBg(prompt.severity),
                    border: `1px solid ${severityBorder(prompt.severity)}`,
                    borderRadius: 6,
                  }}
                >
                  {severityIcon(prompt.severity)}
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: prompt.color,
                        marginBottom: 2,
                      }}
                    >
                      {prompt.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.5 }}>
                      {prompt.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommended / conditional prompts */}
          {otherPrompts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              {otherPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "6px 10px",
                    background: severityBg(prompt.severity),
                    border: `1px solid ${severityBorder(prompt.severity)}`,
                    borderRadius: 6,
                  }}
                >
                  {severityIcon(prompt.severity)}
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
                    <strong style={{ color: "#e2e8f0" }}>{prompt.label}:</strong>{" "}
                    {prompt.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {overlay.warnings.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {overlay.warnings.map((w, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 6,
                    marginBottom: 4,
                  }}
                >
                  <AlertTriangle size={11} style={{ color: "#f87171", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#fca5a5" }}>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Context toggles */}
          <div style={{ marginTop: 6 }}>
            <button
              onClick={() => setShowToggles(!showToggles)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {showToggles ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              Billing context
            </button>

            {showToggles && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {/* Toggle: adhesiolysis */}
                <ToggleRow
                  label="Lysis of adhesions performed"
                  checked={toggles.performedLysisOfAdhesions}
                  onChange={(v) =>
                    setToggles((prev) => ({ ...prev, performedLysisOfAdhesions: v }))
                  }
                />
                {toggles.performedLysisOfAdhesions && (
                  <div style={{ marginLeft: 22, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Lysis time (min):</span>
                    <input
                      type="number"
                      min={0}
                      max={600}
                      value={toggles.lysisMinutes}
                      onChange={(e) =>
                        setToggles((prev) => ({ ...prev, lysisMinutes: e.target.value }))
                      }
                      placeholder="e.g. 45"
                      style={{
                        width: 70,
                        padding: "4px 8px",
                        fontSize: 12,
                        fontFamily: "'Geist Mono', monospace",
                        background: "var(--glass-lo, #0c1219)",
                        border: "1px solid var(--border, rgba(255,255,255,0.08))",
                        borderRadius: 5,
                        color: "var(--text, #e2e8f0)",
                        outline: "none",
                      }}
                    />
                  </div>
                )}
                <ToggleRow
                  label="Multiple procedures, same incision"
                  checked={toggles.sameIncisionMultipleProcedures}
                  onChange={(v) =>
                    setToggles((prev) => ({ ...prev, sameIncisionMultipleProcedures: v }))
                  }
                />
                <ToggleRow
                  label="Multiple procedures, separate incisions"
                  checked={toggles.separateIncisionMultipleProcedures}
                  onChange={(v) =>
                    setToggles((prev) => ({ ...prev, separateIncisionMultipleProcedures: v }))
                  }
                />
                <ToggleRow
                  label="Bilateral same session"
                  checked={toggles.bilateralSameSession}
                  onChange={(v) =>
                    setToggles((prev) => ({ ...prev, bilateralSameSession: v }))
                  }
                />
                <ToggleRow
                  label="Surgical assistant used"
                  checked={toggles.assistantUsed}
                  onChange={(v) =>
                    setToggles((prev) => ({ ...prev, assistantUsed: v }))
                  }
                />
                <ToggleRow
                  label="Two surgeons"
                  checked={toggles.twoSurgeons}
                  onChange={(v) =>
                    setToggles((prev) => ({ ...prev, twoSurgeons: v }))
                  }
                />
                <ToggleRow
                  label="Additional surgery within 3 weeks"
                  checked={toggles.additionalProcedureWithin3Weeks}
                  onChange={(v) =>
                    setToggles((prev) => ({ ...prev, additionalProcedureWithin3Weeks: v }))
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Toggle helper ───────────────────────────────────────────────────────────

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        fontSize: 11,
        color: checked ? "#e2e8f0" : "#64748b",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: 14,
          height: 14,
          accentColor: "#F59E0B",
          cursor: "pointer",
        }}
      />
      {label}
    </label>
  );
}
