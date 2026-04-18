"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Share, Plus, CheckCircle2, ArrowDown, Download, Sparkles } from "lucide-react";
import { HippoMark } from "@/components/HippoMark";
import { usePWAInstall } from "@/hooks/usePWAInstall";

// ---------------------------------------------------------------------------
// /onboarding/install — the finale of the sign-up flow.
//
// Three visual states keyed off usePWAInstall().kind:
//
//   "native"      — big "Install Hippo" button. One tap, browser's native
//                   install sheet, done. This is the Android Chrome + desktop
//                   Chrome path.
//
//   "ios"         — three-step visual guide with the Share icon + Plus icon
//                   + arrow pointing at Safari's toolbar. Apple gives us no
//                   programmatic install so instructions are the only way.
//
//   "installed" / "unavailable" — no install UI, just a "Continue to
//                   dashboard" button. This page is NOT on a path a user
//                   would hit accidentally; onboarding routes here only
//                   after they finish the profile step.
//
// Uses `<HippoMark />` inline — the vector version the onboarding splash
// uses, not a PNG. The user asked specifically for this.
// ---------------------------------------------------------------------------

export default function InstallPage() {
  const router = useRouter();
  const { kind, canInstallNative, installing, triggerInstall } =
    usePWAInstall();

  const [triedInstall, setTriedInstall] = useState<"accepted" | "dismissed" | null>(null);

  // Auto-skip logic: if we're running inside the PWA already (e.g. user
  // re-opens from home screen), send them straight through — this page
  // has nothing to say to an already-installed user.
  useEffect(() => {
    if (kind === "installed" && !installing) {
      const t = setTimeout(() => router.replace("/dashboard"), 400);
      return () => clearTimeout(t);
    }
  }, [kind, installing, router]);

  const handleInstall = async () => {
    const result = await triggerInstall();
    setTriedInstall(result === "accepted" ? "accepted" : "dismissed");
    if (result === "accepted") {
      // Give the browser a moment to show the install animation, then go.
      setTimeout(() => router.replace("/dashboard"), 800);
    }
  };

  const handleSkip = () => router.replace("/dashboard");

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#060d13",
        color: "#E2E8F0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding:
          "max(24px, env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Ambient teal glow — matches the auth splash vibe */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          width: 500,
          height: 500,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(ellipse, rgba(14,165,233,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo — the actual SVG, NOT a raster. Always crisp. */}
      <div
        style={{
          marginTop: "8vh",
          marginBottom: 20,
          animation: "hippo-install-fadeup .5s cubic-bezier(.16,1,.3,1) .05s both",
          position: "relative",
        }}
      >
        <HippoMark size={96} />
      </div>

      {/* Wordmark + progress chip */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 4,
          animation: "hippo-install-fadeup .5s cubic-bezier(.16,1,.3,1) .15s both",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#E2E8F0",
            marginBottom: 6,
          }}
        >
          Hippo
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 9px",
            borderRadius: 999,
            background: "rgba(14,165,233,0.12)",
            color: "#0EA5E9",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <Sparkles size={10} /> One more step
        </div>
      </div>

      {/* Heading */}
      <h1
        style={{
          marginTop: 32,
          marginBottom: 10,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "-0.025em",
          lineHeight: 1.2,
          textAlign: "center",
          maxWidth: 340,
          animation: "hippo-install-fadeup .5s cubic-bezier(.16,1,.3,1) .25s both",
        }}
      >
        Install Hippo on your phone
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#94A3B8",
          textAlign: "center",
          maxWidth: 320,
          lineHeight: 1.55,
          marginBottom: 28,
          animation: "hippo-install-fadeup .5s cubic-bezier(.16,1,.3,1) .3s both",
        }}
      >
        Home-screen icon, full-screen, works offline in the OR. Takes 3 seconds.
      </p>

      {/* Kind-specific body */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          animation: "hippo-install-fadeup .5s cubic-bezier(.16,1,.3,1) .4s both",
        }}
      >
        {kind === "native" || kind === "installed" ? (
          <NativeInstallPanel
            canInstall={canInstallNative}
            installing={installing}
            installed={kind === "installed" || triedInstall === "accepted"}
            onInstall={handleInstall}
          />
        ) : kind === "ios" ? (
          <IOSGuidePanel />
        ) : (
          <UnavailablePanel />
        )}
      </div>

      {/* Skip — always available but muted so it doesn't compete */}
      <button
        onClick={handleSkip}
        style={{
          marginTop: 28,
          padding: "10px 22px",
          background: "transparent",
          border: "none",
          color: "#64748B",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          letterSpacing: "0.01em",
        }}
      >
        Skip — continue in browser
      </button>

      <style jsx>{`
        @keyframes hippo-install-fadeup {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// ─── Android / desktop-Chrome path: real install button ────────────────

function NativeInstallPanel({
  canInstall,
  installing,
  installed,
  onInstall,
}: {
  canInstall: boolean;
  installing: boolean;
  installed: boolean;
  onInstall: () => void;
}) {
  if (installed) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: "24px 20px",
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: 14,
        }}
      >
        <CheckCircle2 size={32} color="#10B981" />
        <div style={{ fontSize: 16, fontWeight: 600, color: "#E2E8F0" }}>
          Hippo is installed
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#94A3B8",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Tap the Hippo icon on your home screen to open it next time.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <button
        onClick={onInstall}
        disabled={!canInstall || installing}
        style={{
          width: "100%",
          padding: "18px 22px",
          background:
            canInstall && !installing
              ? "linear-gradient(135deg, #0EA5E9, #0284C7)"
              : "rgba(14,165,233,0.18)",
          color: "#fff",
          border: "none",
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.01em",
          cursor: canInstall && !installing ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow:
            canInstall && !installing
              ? "0 20px 40px -15px rgba(14,165,233,0.55), inset 0 1px 0 rgba(255,255,255,0.1)"
              : "none",
          transition: "transform .1s cubic-bezier(.16,1,.3,1), opacity .2s",
          minHeight: 56,
        }}
      >
        <Download size={18} />
        {installing ? "Opening install sheet…" : "Add Hippo to my phone"}
      </button>
      <div
        style={{
          fontSize: 11,
          color: "#64748B",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Your browser will show a confirmation. It&rsquo;s instant and free.
      </div>
    </div>
  );
}

// ─── iOS path: visual guide, no programmatic install possible ───────────

function IOSGuidePanel() {
  return (
    <div
      style={{
        background: "rgba(14,165,233,0.04)",
        border: "1px solid rgba(14,165,233,0.15)",
        borderRadius: 16,
        padding: "20px 18px 18px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#0EA5E9",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        On iPhone · 3 taps
      </div>

      <ol
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <IOSStep
          n={1}
          title="Tap the Share icon"
          subtitle="At the bottom of Safari."
          icon={<Share size={20} color="#0EA5E9" strokeWidth={2.5} />}
        />
        <IOSStep
          n={2}
          title={'Tap "Add to Home Screen"'}
          subtitle="Scroll down if you don't see it."
          icon={<Plus size={20} color="#0EA5E9" strokeWidth={2.5} />}
        />
        <IOSStep
          n={3}
          title='Tap "Add" in the top right'
          subtitle="Hippo lands on your home screen."
          icon={
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HippoMark size={22} />
            </div>
          }
        />
      </ol>

      {/* Arrow pointing to Safari's toolbar */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          color: "#94A3B8",
          fontSize: 12,
        }}
      >
        <ArrowDown
          size={14}
          style={{
            animation: "hippo-bounce 1.5s ease-in-out infinite",
          }}
        />
        <span>The Share icon is at the bottom of Safari</span>
      </div>

      <style jsx>{`
        @keyframes hippo-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}

function IOSStep({
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
        alignItems: "center",
        padding: "10px 12px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(14,165,233,0.14)",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          background: "rgba(14,165,233,0.18)",
          color: "#0EA5E9",
          fontSize: 13,
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
            fontSize: 13.5,
            fontWeight: 600,
            color: "#E2E8F0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {title}
          <span style={{ flexShrink: 0 }}>{icon}</span>
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "#64748B",
            marginTop: 2,
          }}
        >
          {subtitle}
        </div>
      </div>
    </li>
  );
}

// ─── Fallback: browser doesn't support install (iOS Chrome, Edge, FB webview) ─

function UnavailablePanel() {
  return (
    <div
      style={{
        padding: "20px 18px",
        background: "rgba(245,158,11,0.05)",
        border: "1px solid rgba(245,158,11,0.2)",
        borderRadius: 14,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#F59E0B",
          marginBottom: 10,
        }}
      >
        One quick note
      </div>
      <div
        style={{
          fontSize: 13.5,
          color: "#E2E8F0",
          lineHeight: 1.55,
          marginBottom: 10,
        }}
      >
        Install isn&rsquo;t available in this browser. You can still use
        Hippo normally — just open hippomedicine.com when you need it.
      </div>
      <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.55 }}>
        To install the app, open <strong>hippomedicine.com</strong> in Safari
        (iPhone / iPad) or Chrome (Android / desktop) and you&rsquo;ll see an
        install button here.
      </div>
    </div>
  );
}
