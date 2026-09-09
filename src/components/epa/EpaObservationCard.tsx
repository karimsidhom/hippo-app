"use client";

import { useState } from "react";
import { Link2, Copy, Share2, Send, Eye } from "lucide-react";
import type { EpaObservation } from "@/lib/types";
import { EpaStatusBadge, EpaVerifiedLine, type EpaStatus } from "@/components/epa/EpaStatusBadge";

interface EpaObservationCardProps {
  observation: EpaObservation;
  onClick?: () => void;
}

interface ReviewLinkInfo {
  reviewUrl: string;
  recipientEmail: string;
  recipientName: string;
  sentAt: string;
  viewedAt: string | null;
  respondedAt: string | null;
  expiresAt: string | null;
  channel: string;
}

function getStageColor(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTP")) return "#10b981";
  if (id.startsWith("TD")) return "#6366f1";
  if (id.startsWith("C")) return "#0ea5e9";
  if (id.startsWith("F")) return "#f59e0b";
  return "#0ea5e9";
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
  const achieved = observation.achievement === "ACHIEVED";
  const isSigned = observation.status === "SIGNED";
  const isPending = observation.status === "PENDING_REVIEW";
  const dateStr = new Date(observation.observationDate).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" }
  );
  const oScore = observation.entrustmentScore;

  // ── Review-link panel (PENDING_REVIEW only) — lets the resident grab or
  // re-send the sign-off link themselves without leaving the dashboard. All
  // observations here already belong to the signed-in resident (the list
  // API scopes to userId), so no extra ownership check is needed. ──
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkInfo, setLinkInfo] = useState<ReviewLinkInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [remindMessage, setRemindMessage] = useState<string | null>(null);

  async function loadReviewLink() {
    setLinkLoading(true);
    setLinkError(null);
    try {
      const res = await fetch(`/api/epa/observations/${observation.id}/review-link`);
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Couldn't load the review link.");
      setLinkInfo(body as ReviewLinkInfo);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Couldn't load the review link.");
    } finally {
      setLinkLoading(false);
    }
  }

  function handleToggleLink(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !linkOpen;
    setLinkOpen(next);
    setRemindMessage(null);
    if (next && !linkInfo && !linkLoading) loadReviewLink();
  }

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!linkInfo?.reviewUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(linkInfo.reviewUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Clipboard unavailable — the selectable input is the fallback.
    }
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    if (!linkInfo?.reviewUrl || !navigator.share) return;
    try {
      await navigator.share({
        title: "EPA sign-off request",
        text: `Please review and sign off on ${observation.epaId}: ${observation.epaTitle}.`,
        url: linkInfo.reviewUrl,
      });
    } catch {
      // User cancelled the share sheet.
    }
  }

  async function handleRemind(e: React.MouseEvent) {
    e.stopPropagation();
    setReminding(true);
    setRemindMessage(null);
    try {
      const res = await fetch(`/api/epa/observations/${observation.id}/remind`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Couldn't send the reminder.");
      setRemindMessage(
        body?.delivery?.emailSent === false
          ? `Couldn't email: ${body.delivery.emailError ?? "delivery failed"}. Copy the link instead.`
          : "Reminder sent.",
      );
      loadReviewLink();
    } catch (err) {
      setRemindMessage(err instanceof Error ? err.message : "Couldn't send the reminder.");
    } finally {
      setReminding(false);
    }
  }

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const canRemind = linkInfo && linkInfo.channel !== "in_app";

  return (
    <div
      onClick={onClick}
      style={{
        // Signed EPAs get a subtle green left accent rail so they stand out
        // in a list without needing the reader to parse the badge. Pending
        // and returned use their own accent colours — anything unsigned
        // stays muted.
        background: "var(--bg-2)",
        border: "1px solid var(--border-mid)",
        borderLeft: isSigned
          ? "3px solid #10b981"
          : observation.status === "PENDING_REVIEW"
          ? "3px solid rgba(14,165,233,0.5)"
          : observation.status === "RETURNED"
          ? "3px solid rgba(245,158,11,0.5)"
          : "3px solid transparent",
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
        <EpaStatusBadge status={observation.status as EpaStatus} size="sm" />
      </div>

      {/* Verified-by line: this is the single highest-impact addition for
          status clarity. Residents can now see at a glance WHO signed this
          and WHEN, without opening the card. */}
      {isSigned && (
        <EpaVerifiedLine
          signedAt={observation.signedAt}
          signedByName={observation.signedByName}
        />
      )}

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

      {/* Review-link action — PENDING_REVIEW only. Lets the resident grab
          the sign-off link themselves (the point of this card entirely: an
          email that silently failed shouldn't be a dead end). */}
      {isPending && (
        <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={handleToggleLink}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 9px", borderRadius: 6,
                background: linkOpen ? "rgba(14,165,233,0.12)" : "transparent",
                border: "1px solid rgba(14,165,233,0.3)",
                color: "#38bdf8", fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <Link2 size={11} />
              Review link
            </button>
            {linkInfo?.viewedAt && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 10, color: "var(--text-3)",
              }}>
                <Eye size={10} />
                Opened
              </span>
            )}
          </div>

          {linkOpen && (
            <div style={{
              marginTop: 8, padding: "10px 12px",
              background: "var(--bg-1)", border: "1px solid var(--border-mid)",
              borderRadius: 8, display: "flex", flexDirection: "column", gap: 8,
            }}>
              {linkLoading && (
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>Loading…</div>
              )}
              {linkError && (
                <div style={{ fontSize: 11, color: "#ef4444" }}>{linkError}</div>
              )}
              {linkInfo && (
                <>
                  <input
                    readOnly
                    value={linkInfo.reviewUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Review link"
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "var(--surface2)", border: "1px solid var(--border-mid)",
                      borderRadius: 6, color: "var(--text-2)", fontSize: 11,
                      padding: "6px 8px", fontFamily: "'Geist Mono', monospace",
                    }}
                  />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleCopy}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "5px 9px", borderRadius: 6,
                        border: "1px solid var(--border-mid)", background: "var(--surface2)",
                        color: "var(--text-1)", fontSize: 11, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      <Copy size={11} />
                      {copied ? "Copied" : "Copy"}
                    </button>
                    {canShare && (
                      <button
                        type="button"
                        onClick={handleShare}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "5px 9px", borderRadius: 6,
                          border: "1px solid var(--border-mid)", background: "var(--surface2)",
                          color: "var(--text-1)", fontSize: 11, fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        <Share2 size={11} />
                        Share
                      </button>
                    )}
                    {canRemind && (
                      <button
                        type="button"
                        onClick={handleRemind}
                        disabled={reminding}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "5px 9px", borderRadius: 6,
                          border: "1px solid var(--border-mid)", background: "var(--surface2)",
                          color: "var(--text-1)", fontSize: 11, fontWeight: 600,
                          cursor: reminding ? "not-allowed" : "pointer", fontFamily: "inherit",
                          opacity: reminding ? 0.6 : 1,
                        }}
                      >
                        <Send size={11} />
                        {reminding ? "Sending…" : "Send reminder"}
                      </button>
                    )}
                  </div>
                  {remindMessage && (
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{remindMessage}</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Returned feedback — shown prominently so resident knows why */}
      {observation.status === "RETURNED" && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            borderRadius: 8,
            background: "#ef444410",
            border: "1px solid #ef444430",
          }}
        >
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#ef4444",
            textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4,
          }}>
            Returned for revision
          </div>
          {observation.returnedReason ? (
            <div style={{
              fontSize: 12, color: "var(--text-1)", lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}>
              {observation.returnedReason}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-3)", fontStyle: "italic" }}>
              No reason provided.
            </div>
          )}
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>
            Click to edit and resubmit.
          </div>
        </div>
      )}

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
