"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check, Sparkles, X, Zap } from "lucide-react";
import { PRICING } from "@/lib/pricing";
import { useSubscription } from "@/context/SubscriptionContext";

// ---------------------------------------------------------------------------
// PaywallModal
//
// Reusable paywall modal shown when a free user tries to use a Pro-gated
// feature. Accepts a feature-specific headline + body so each gate can
// explain the exact value the user is about to unlock.
//
// Usage:
//   const [paywall, setPaywall] = useState(false);
//   if (!isPro) { setPaywall(true); return; }
//   ...
//   <PaywallModal
//     open={paywall}
//     onClose={() => setPaywall(false)}
//     feature="logbookPdf"
//     headline="Download your logbook as a PDF"
//     body="Portable, print-ready, and interview-ready."
//   />
// ---------------------------------------------------------------------------

export interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  /** Short, noun-phrase headline of the gated feature (e.g. "Logbook PDF"). */
  headline: string;
  /** One-sentence pitch for why this feature is worth paying for. */
  body: string;
  /** Optional key used for future analytics — which gate triggered the modal. */
  feature?: string;
  /** Override the bullet list shown below the pitch. Defaults to PRICING.pro.features. */
  bullets?: readonly string[];
}

export function PaywallModal({
  open,
  onClose,
  headline,
  body,
  feature,
  bullets,
}: PaywallModalProps) {
  const { startCheckout } = useSubscription();

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const list = bullets ?? PRICING.pro.features;

  return (
    <div
      onClick={onClose}
      data-paywall-feature={feature}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--surface, #0b0b0e)",
          border: "1px solid var(--border, #1f1f23)",
          borderRadius: 18,
          padding: 0,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,.5)",
          animation: "slideUp .25s cubic-bezier(.16,1,.3,1)",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          aria-label="Close"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 30,
            height: 30,
            background: "transparent",
            border: "none",
            color: "var(--text-3, #71717a)",
            cursor: "pointer",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
            zIndex: 1,
          }}
        >
          <X size={16} />
        </button>

        {/* Hero */}
        <div
          style={{
            padding: "24px 22px 16px",
            background:
              "linear-gradient(135deg, rgba(59,130,246,.14), rgba(14,165,233,.08))",
            borderBottom: "1px solid var(--border, #1f1f23)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 8px",
              borderRadius: 999,
              background: "rgba(59,130,246,.2)",
              color: "#60a5fa",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            <Sparkles size={11} /> Hippo Pro
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text, #fafafa)",
              letterSpacing: "-.01em",
              lineHeight: 1.3,
              marginBottom: 6,
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-3, #a1a1aa)",
              lineHeight: 1.5,
            }}
          >
            {body}
          </div>
        </div>

        {/* Price + features */}
        <div style={{ padding: "16px 22px 8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "var(--text, #fafafa)",
                letterSpacing: "-.03em",
              }}
            >
              {PRICING.pro.monthlyDisplay}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-3, #71717a)" }}>
              /month · cancel any time
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 6,
            }}
          >
            {list.slice(0, 6).map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--text-2, #d4d4d8)",
                  lineHeight: 1.4,
                }}
              >
                <Check size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div
          style={{
            padding: "14px 22px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            onClick={() => {
              startCheckout();
            }}
            style={{
              width: "100%",
              padding: "13px 16px",
              background: "var(--primary, #3b82f6)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Zap size={14} /> Start Pro — {PRICING.pro.monthlyDisplay}/mo
          </button>
          <Link
            href="/upgrade"
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "var(--text-3, #71717a)",
              textDecoration: "none",
              padding: "6px",
            }}
            onClick={onClose}
          >
            See all plan details
          </Link>
        </div>
      </div>
    </div>
  );
}
