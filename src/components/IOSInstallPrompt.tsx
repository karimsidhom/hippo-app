"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// iOS install prompt — the small nudge that catches users who SKIPPED the
// post-onboarding install step (/onboarding/install). That page is the
// primary install surface now; this banner is the "hey, you missed it"
// reminder.
//
// Differences from the old version:
//   - Routes to /onboarding/install instead of inlining the instructions.
//     Single source of install UX, no drift between the two.
//   - Gets dismissed for 30 days, not forever. Surgery is a 5+ year
//     residency; dropping the prompt once and never again would lose
//     install opportunities on new devices (new phone, device swap).
//
// Shows only when:
//   - User is iOS Safari (desktop / Android users install via the native
//     beforeinstallprompt captured in <InstallCapture/>, so this banner
//     doesn't fire for them)
//   - Not already installed (display-mode: standalone)
//   - Not dismissed in the last 30 days
// ---------------------------------------------------------------------------

const DISMISS_KEY = "hippo_ios_install_dismissed_v2";
const DISMISS_TTL_DAYS = 30;

type Phase = "hidden" | "banner";

/**
 * Detect iOS Safari (or iPadOS Safari posing as desktop).
 * We explicitly exclude in-app browsers (Instagram, Twitter, Gmail, etc.)
 * where Add-to-Home-Screen isn't available.
 */
function isInstallableIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent.toLowerCase();

  // iPadOS 13+ pretends to be Mac; disambiguate via touch points.
  const isIpadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isIOS =
    /iphone|ipad|ipod/.test(ua) || isIpadOS;
  if (!isIOS) return false;

  // iOS in-app browsers: FBAN/FBAV (Facebook), Instagram, Line, Twitter.
  // These can't install PWAs, so the banner would just frustrate.
  const isInAppBrowser =
    /fban|fbav|instagram|line\/|twitter|tiktok|linkedin/i.test(ua);
  if (isInAppBrowser) return false;

  // Chrome/Firefox on iOS all use WebKit underneath and CAN install, but
  // the install flow is in their own menus — out of scope for this banner.
  // Only show to actual Safari.
  const isSafari =
    /safari/.test(ua) && !/crios|fxios|edgios|yabrowser|ucbrowser/.test(ua);

  return isSafari;
}

/**
 * Already-installed? Standalone display mode means the app was launched
 * from the home screen. iOS also exposes `navigator.standalone` for
 * home-screen launches specifically.
 */
function isAlreadyInstalled(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // Legacy iOS Safari flag — still set in 2026.
  return (
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function IOSInstallPrompt() {
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    // Guard every branch so one SSR/client mismatch doesn't crash the
    // whole app tree.
    try {
      if (isAlreadyInstalled()) return;
      if (!isInstallableIOS()) return;
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        // Dismissal stored as an ISO timestamp — respect only if it's
        // still within the TTL window. After 30 days, re-surface.
        const dismissedAt = Date.parse(raw);
        if (
          !Number.isNaN(dismissedAt) &&
          Date.now() - dismissedAt < DISMISS_TTL_DAYS * 86_400_000
        ) {
          return;
        }
      }
    } catch {
      return;
    }

    // Don't ambush a freshly-loaded page — give the app 4s to breathe.
    const t = setTimeout(() => setPhase("banner"), 4000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch {
      // storage disabled — memory-only dismissal for this session
    }
    setPhase("hidden");
  };

  if (phase === "hidden") return null;

  // ── Banner: small bottom strip with "Install" action ────────────────
  if (phase === "banner") {
    return (
      <div
        role="dialog"
        aria-label="Install Hippo on your iPhone"
        style={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: "calc(12px + env(safe-area-inset-bottom))",
          zIndex: 1000,
          background: "rgba(14, 22, 32, 0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 14,
          border: "1px solid rgba(14, 165, 233, 0.25)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          animation: "hippo-install-slideup .35s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <img
          src="/icons/icon-180.png"
          alt=""
          width={40}
          height={40}
          style={{ borderRadius: 9, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#E2E8F0",
              lineHeight: 1.3,
            }}
          >
            Install Hippo
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "#94A3B8",
              lineHeight: 1.35,
              marginTop: 1,
            }}
          >
            Get a home-screen icon + offline case logging.
          </div>
        </div>
        <Link
          href="/onboarding/install"
          prefetch
          onClick={dismiss}
          style={{
            height: 34,
            padding: "0 14px",
            background: "#0EA5E9",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Install
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          style={{
            width: 28,
            height: 28,
            background: "transparent",
            border: "none",
            color: "#64748B",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
        <style jsx>{`
          @keyframes hippo-install-slideup {
            from { transform: translateY(120%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // "hidden" is the only other phase — render nothing.
  return null;
}
