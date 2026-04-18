"use client";

import { useEffect, useState } from "react";
import { Share, Plus, X } from "lucide-react";

// ---------------------------------------------------------------------------
// iOS install prompt — the "Add to Home Screen" explainer for iPhone users.
//
// Android / desktop Chrome show a native `beforeinstallprompt` banner. iOS
// never will — Apple hides the install flow inside Safari's Share menu
// and doesn't surface it in any programmatic API. The result is that most
// iPhone users never install the PWA because they don't know they can.
//
// This component fixes that by:
//   1. Detecting iOS + Safari + not-already-installed + not-dismissed-before
//   2. Showing a one-time banner with a visual guide: tap Share → scroll →
//      "Add to Home Screen"
//   3. Remembering the dismissal so we never nag the same user twice
//
// Deliberate choices:
//   - Shows ONCE per device. If a user dismissed, they don't see it again.
//     They can always install manually via Safari's native flow.
//   - Waits 4 seconds after mount to show up — enough time for the app to
//     render so the banner doesn't feel ambush-y.
//   - Uses position: fixed + bottom-inset so it sits above the home bar
//     on notched iPhones.
//   - Does NOT appear inside the PWA itself (display-mode: standalone).
//     That would be useless and weird.
// ---------------------------------------------------------------------------

const DISMISS_KEY = "hippo_ios_install_dismissed_v1";

type Phase = "hidden" | "banner" | "details";

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
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      return;
    }

    // Don't ambush a freshly-loaded page — give the app 4s to breathe.
    const t = setTimeout(() => setPhase("banner"), 4000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
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
        <button
          onClick={() => setPhase("details")}
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
          }}
        >
          How
        </button>
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

  // ── Details: full-screen-ish modal with the 3-step visual guide ─────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How to install Hippo"
      onClick={() => setPhase("banner")}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#0b131c",
          border: "1px solid rgba(255,255,255,.06)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,.55)",
          position: "relative",
          padding: "22px 20px 18px",
        }}
      >
        <button
          onClick={() => setPhase("banner")}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            background: "transparent",
            border: "none",
            color: "#64748B",
            cursor: "pointer",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <img
            src="/icons/icon-180.png"
            alt=""
            width={48}
            height={48}
            style={{ borderRadius: 11 }}
          />
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#E2E8F0",
                letterSpacing: "-0.01em",
              }}
            >
              Install Hippo on your iPhone
            </div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
              Three taps. Works offline after.
            </div>
          </div>
        </div>

        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <Step
            n={1}
            title="Tap the Share icon"
            subtitle="At the bottom of Safari (or top on iPad)."
            icon={<Share size={18} color="#0EA5E9" />}
          />
          <Step
            n={2}
            title={'Scroll down, tap "Add to Home Screen"'}
            subtitle='Look for the icon with a "+" symbol.'
            icon={<Plus size={18} color="#0EA5E9" />}
          />
          <Step
            n={3}
            title={'Tap "Add" in the top right'}
            subtitle="Hippo lands on your home screen with its own icon."
            icon={
              <img
                src="/icons/icon-120.png"
                alt=""
                width={22}
                height={22}
                style={{ borderRadius: 5 }}
              />
            }
          />
        </ol>

        <button
          onClick={dismiss}
          style={{
            width: "100%",
            marginTop: 18,
            padding: "12px 16px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,.08)",
            color: "#94A3B8",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Don&apos;t show again
        </button>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  subtitle,
  icon,
}: {
  n: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <li
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "10px 12px",
        background: "rgba(14,165,233,0.04)",
        border: "1px solid rgba(14,165,233,0.12)",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          background: "rgba(14,165,233,0.15)",
          color: "#0EA5E9",
          fontSize: 12,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#E2E8F0",
            lineHeight: 1.35,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {title}
          <span style={{ flexShrink: 0 }}>{icon}</span>
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "#64748B",
            lineHeight: 1.45,
            marginTop: 2,
          }}
        >
          {subtitle}
        </div>
      </div>
    </li>
  );
}
