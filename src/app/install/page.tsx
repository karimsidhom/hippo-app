"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Share, Plus, CheckCircle2, ArrowDown, Download, Sparkles } from "lucide-react";
import { HippoMark } from "@/components/HippoMark";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useInteraction } from "@/hooks/useInteraction";

// ---------------------------------------------------------------------------
// /install — PUBLIC shareable install page.
//
// Exists separately from /onboarding/install so the URL works as a
// standalone share link: "hippomedicine.com/install" — no login required,
// no onboarding context, just "press here to get the app."
//
// Three visual states, keyed off usePWAInstall().kind (same hook used
// during onboarding):
//
//   "native"      — big "Install Hippo" button. One tap triggers Chrome's
//                   native install prompt. Android + desktop Chromium.
//
//   "ios"         — three-step visual guide because Apple gives us no
//                   programmatic install. Share icon, Add-to-Home-Screen,
//                   Add button. An animated arrow points down at Safari's
//                   toolbar.
//
//   "installed"   — they already have it. We offer a "Continue in the app"
//                   link that opens the PWA (or a sign-in link if they're
//                   not logged in).
//
//   "unavailable" — in-app browsers (Instagram, Twitter) or unknown
//                   contexts. Honest explainer + "open in Safari/Chrome"
//                   guidance.
//
// This is the page we'd link to from email footers, Twitter bios, the
// website's nav — anywhere someone might share "here's the app."
// ---------------------------------------------------------------------------

export default function InstallPage() {
  const router = useRouter();
  const install = usePWAInstall();
  const fx = useInteraction();
  const [installing, setInstalling] = useState(false);

  // If already installed, redirect to login after a short delay so the
  // user isn't stuck on a page that says "already installed" with no
  // next step.
  useEffect(() => {
    if (install.kind === "installed") {
      const t = setTimeout(() => router.replace("/login"), 2200);
      return () => clearTimeout(t);
    }
  }, [install.kind, router]);

  const onInstallNative = async () => {
    fx.tap();
    setInstalling(true);
    await install.triggerInstall();
    setInstalling(false);
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      color: "var(--text)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "calc(32px + env(safe-area-inset-top)) 20px calc(32px + env(safe-area-inset-bottom))",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient teal glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at top, rgba(14,165,233,0.06) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative",
        maxWidth: 420,
        width: "100%",
        textAlign: "center",
        animation: "fadeIn .5s cubic-bezier(.16,1,.3,1)",
      }}>
        {/* Logo — same vector we use in the onboarding splash. No PNG. */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          filter: "drop-shadow(0 0 24px rgba(14,165,233,0.15))",
        }}>
          <HippoMark size={88} />
        </div>

        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.8px",
          margin: "0 0 10px",
          color: "var(--text)",
        }}>
          Get Hippo on your phone
        </h1>
        <p style={{
          fontSize: 14,
          color: "var(--text-2)",
          lineHeight: 1.5,
          margin: "0 0 32px",
          maxWidth: 340,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          Home-screen icon, offline case logging, push notifications when an
          EPA is signed. Takes one tap.
        </p>

        {install.kind === "native" && (
          <NativePanel
            installing={installing || install.installing}
            onInstall={onInstallNative}
          />
        )}

        {install.kind === "ios" && <IOSPanel />}

        {install.kind === "ios-chrome" && <IOSChromePanel />}

        {install.kind === "chrome-manual" && <ChromeManualPanel />}

        {install.kind === "installed" && <InstalledPanel />}

        {install.kind === "in-app-browser" && <InAppBrowserPanel />}

        {install.kind === "unsupported" && <UnsupportedPanel />}

        <div style={{
          marginTop: 28,
          fontSize: 11,
          color: "var(--text-3)",
        }}>
          <Link
            href="/login"
            className="press"
            style={{
              color: "var(--text-3)",
              textDecoration: "none",
              padding: 6,
            }}
          >
            Skip — go to sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}

function NativePanel({
  installing, onInstall,
}: { installing: boolean; onInstall: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <button
        onClick={onInstall}
        disabled={installing}
        className="press-key"
        style={{
          background: "linear-gradient(135deg, #22D3EE, #0EA5E9)",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "14px 24px",
          fontSize: 15,
          fontWeight: 600,
          cursor: installing ? "wait" : "pointer",
          opacity: installing ? 0.7 : 1,
          fontFamily: "inherit",
          width: "100%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 12px 32px -8px rgba(14,165,233,0.4)",
          letterSpacing: "-0.2px",
        }}
      >
        {installing ? (
          <>
            <div
              style={{
                width: 14, height: 14, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                animation: "spin .7s linear infinite",
              }}
            />
            Installing...
          </>
        ) : (
          <>
            <Download size={16} strokeWidth={2.5} />
            Add Hippo to my phone
          </>
        )}
      </button>
      <div style={{ fontSize: 11, color: "var(--text-3)" }}>
        One tap. No app store. Uninstall any time.
      </div>
    </div>
  );
}

function IOSPanel() {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border-glass)",
      borderRadius: 14,
      padding: "20px 18px",
      textAlign: "left",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        marginBottom: 14,
        fontSize: 11, color: "var(--primary-hi)",
        fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
      }}>
        <Sparkles size={12} />
        iPhone — 3 quick steps
      </div>
      <Step
        n={1}
        title="Tap the Share button"
        subtitle="Bottom of Safari, the square with the up arrow."
        icon={<Share size={14} />}
      />
      <Step
        n={2}
        title="Add to Home Screen"
        subtitle="Scroll down the menu if you don't see it."
        icon={<Plus size={14} />}
      />
      <Step
        n={3}
        title="Tap Add"
        subtitle="Top-right corner. Hippo lands on your home screen."
        icon={<CheckCircle2 size={14} />}
        last
      />
      {/* Arrow pointing down at Safari's share button */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 18,
        paddingTop: 14,
        borderTop: "1px solid var(--border)",
        color: "var(--primary-hi)",
        fontSize: 11,
        fontWeight: 500,
      }}>
        <span>Share button is right down there</span>
        <ArrowDown size={12} style={{ animation: "bounce 1.4s ease-in-out infinite" }} />
      </div>
      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
      `}</style>
    </div>
  );
}

function Step({
  n, title, subtitle, icon, last,
}: {
  n: number; title: string; subtitle: string; icon: React.ReactNode; last?: boolean;
}) {
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      paddingBottom: last ? 0 : 14,
      marginBottom: last ? 0 : 14,
      borderBottom: last ? "none" : "1px solid var(--border)",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: "var(--glass-mid)",
        border: "1px solid var(--border-glass)",
        color: "var(--primary-hi)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700,
        fontFamily: "'Geist Mono', monospace",
        flexShrink: 0,
      }}>
        {n}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, fontWeight: 600, color: "var(--text)",
          lineHeight: 1.3,
        }}>
          {title}
          <span style={{
            color: "var(--primary-hi)",
            display: "inline-flex", alignItems: "center",
            flexShrink: 0,
          }}>
            {icon}
          </span>
        </div>
        <div style={{
          fontSize: 11.5, color: "var(--text-3)",
          marginTop: 3, lineHeight: 1.45,
        }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function InstalledPanel() {
  return (
    <div style={{
      background: "rgba(16,185,129,0.06)",
      border: "1px solid rgba(16,185,129,0.3)",
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      color: "#10b981",
      fontSize: 13,
      fontWeight: 600,
    }}>
      <CheckCircle2 size={18} />
      You already have Hippo installed. Taking you to sign in...
    </div>
  );
}

function IOSChromePanel() {
  return (
    <GuidePanel
      title="Open this in Safari to install"
      body={
        <>
          Apple only lets Safari install apps to the home screen. Tap the{" "}
          <strong style={{ color: "var(--text)" }}>three dots</strong> in
          the bottom-right, then <strong style={{ color: "var(--text)" }}>Open in
          Safari</strong>. Come back to this page and you&rsquo;ll see the
          install guide.
        </>
      }
    />
  );
}

function ChromeManualPanel() {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border-glass)",
      borderRadius: 14,
      padding: "20px 18px",
      textAlign: "left",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        marginBottom: 14,
        fontSize: 11, color: "var(--primary-hi)",
        fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
      }}>
        <Sparkles size={12} />
        Install from your browser menu
      </div>
      <div style={{
        fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 16,
      }}>
        Your browser didn&rsquo;t offer a one-tap install (it can happen if
        you&rsquo;ve dismissed it before, or if the site&rsquo;s still
        warming up). The menu path always works:
      </div>
      <Step
        n={1}
        title="Tap the three-dot menu"
        subtitle="Top-right of Chrome / Edge / Samsung Internet."
        icon={<span style={{ fontSize: 18, fontWeight: 700 }}>⋮</span>}
      />
      <Step
        n={2}
        title="Tap 'Install app' or 'Add to Home screen'"
        subtitle="The wording changes between Chrome, Edge, and Samsung. Any of these will install Hippo."
        icon={<Download size={14} />}
      />
      <Step
        n={3}
        title="Confirm"
        subtitle="Hippo lands on your home screen with the dark app icon."
        icon={<CheckCircle2 size={14} />}
        last
      />
    </div>
  );
}

function InAppBrowserPanel() {
  return (
    <GuidePanel
      title="Open in Safari or Chrome first"
      body={
        <>
          You&rsquo;re in an in-app browser (Instagram, Twitter, TikTok, etc.).
          Those can&rsquo;t install apps. Tap the <strong
          style={{ color: "var(--text)" }}>three dots</strong> or{" "}
          <strong style={{ color: "var(--text)" }}>...</strong> menu at the
          top and choose <strong style={{ color: "var(--text)" }}>Open in
          Safari</strong> (iPhone) or <strong
          style={{ color: "var(--text)" }}>Open in Chrome</strong> (Android).
        </>
      }
    />
  );
}

function UnsupportedPanel() {
  return (
    <GuidePanel
      title="Your browser can't install apps"
      body={
        <>
          Hippo installs on Safari (iPhone), Chrome / Edge (Android &amp;
          desktop), and Samsung Internet. Firefox on most platforms doesn&rsquo;t
          support app install — open this page in one of the above and try
          again. Or just keep using Hippo on the web.
        </>
      }
    />
  );
}

function GuidePanel({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border-mid)",
      borderRadius: 12,
      padding: "18px 18px",
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.55,
      textAlign: "left",
    }}>
      <div style={{
        fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8,
      }}>
        {title}
      </div>
      <div>{body}</div>
    </div>
  );
}
