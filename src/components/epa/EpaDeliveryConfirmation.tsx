"use client";

import { useEffect, useState } from "react";
import { Check, AlertTriangle, Copy, Share2, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Post-submit delivery confirmation.
//
// The EPA submit route always tells us how the attending was actually
// notified (in-app, email, or nothing at all) and whether the email really
// went out. Silently trusting "submit succeeded" used to mean a resident
// believed their attending had been emailed when Resend had quietly
// rejected the send. This toast makes that outcome visible and, when the
// email failed, hands the resident the working review link so they can
// send it themselves (text, WhatsApp, whatever works).
// ---------------------------------------------------------------------------

export interface EpaDeliveryInfo {
  channel: "in_app" | "email" | "none";
  emailSent: boolean;
  emailError?: string;
  reviewUrl?: string;
}

interface EpaDeliveryConfirmationProps {
  delivery: EpaDeliveryInfo;
  /** The attending's display name, for the headline copy. */
  assessorName?: string;
  onClose: () => void;
}

export function EpaDeliveryConfirmation({
  delivery,
  assessorName,
  onClose,
}: EpaDeliveryConfirmationProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const failed = delivery.channel === "email" && !delivery.emailSent;
  const who = assessorName?.trim() || "your attending";

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  // Clean, uneventful outcomes auto-dismiss. A failed email stays on screen
  // until the resident copies/shares the link or closes it themselves —
  // this is the one case where auto-dismissing would recreate the original
  // "silently swallowed" bug.
  useEffect(() => {
    if (failed) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [failed, onClose]);

  const handleCopy = async () => {
    if (!delivery.reviewUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(delivery.reviewUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Clipboard permission denied or unavailable — the visible, selectable
      // input below is the fallback, so there's nothing else to do here.
    }
  };

  const handleShare = async () => {
    if (!delivery.reviewUrl || !navigator.share) return;
    try {
      await navigator.share({
        title: "EPA sign-off request",
        text: `Please review and sign off on this EPA observation for ${who}.`,
        url: delivery.reviewUrl,
      });
    } catch {
      // User cancelled the native share sheet — not an error.
    }
  };

  let headline: string;
  let sub: string | null = null;
  if (delivery.channel === "in_app") {
    headline = `Sent to ${who} in their Hippo inbox`;
    sub = delivery.emailSent ? "A backup email went out too." : null;
  } else if (delivery.channel === "email" && delivery.emailSent) {
    headline = `Emailed ${who} a sign-off link`;
    sub = "Valid for 12 months. No login needed.";
  } else if (failed) {
    headline = `We could not email ${who}`;
    sub = "Copy the review link and send it yourself.";
  } else {
    headline = "Observation saved";
    sub = "No sign-off was requested.";
  }

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "max(20px, env(safe-area-inset-bottom))",
        transform: "translateX(-50%)",
        zIndex: 1400,
        width: "min(92vw, 420px)",
        background: "var(--surface, #141c28)",
        border: `1px solid ${failed ? "rgba(239,68,68,0.35)" : "var(--border-mid)"}`,
        borderRadius: 12,
        padding: "14px 16px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        animation: "epaDeliveryToastIn .2s cubic-bezier(.16,1,.3,1)",
      }}
    >
      <style>{`
        @keyframes epaDeliveryToastIn {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            flexShrink: 0,
            background: failed ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {failed ? (
            <AlertTriangle size={14} style={{ color: "#ef4444" }} />
          ) : (
            <Check size={14} style={{ color: "#10b981" }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1, #e2e8f0)" }}>
            {headline}
          </div>
          {sub && (
            <div style={{ fontSize: 12, color: "var(--text-3, #64748b)", marginTop: 2 }}>
              {sub}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-3, #64748b)",
            cursor: "pointer",
            padding: 2,
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {failed && delivery.reviewUrl && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            readOnly
            value={delivery.reviewUrl}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Review link"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "var(--surface2, #0e1520)",
              border: "1px solid var(--border-mid)",
              borderRadius: 6,
              color: "var(--text-2, #94a3b8)",
              fontSize: 12,
              padding: "7px 9px",
              fontFamily: "'Geist Mono', monospace",
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid var(--border-mid)",
                background: "var(--surface2, #0e1520)",
                color: "var(--text-1, #e2e8f0)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Copy size={12} />
              {copied ? "Copied" : "Copy link"}
            </button>
            {canShare && (
              <button
                type="button"
                onClick={handleShare}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--border-mid)",
                  background: "var(--surface2, #0e1520)",
                  color: "var(--text-1, #e2e8f0)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Share2 size={12} />
                Share
              </button>
            )}
          </div>
          {delivery.emailError && (
            <div style={{ fontSize: 11, color: "var(--text-3, #64748b)" }}>
              Details: {delivery.emailError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
