import type { Metadata } from "next";
import { HippoMark } from "@/components/HippoMark";

// ---------------------------------------------------------------------------
// Offline fallback page.
//
// Served by the service worker as a last resort when a navigation request
// fails and no cached version of the requested page is available. Kept
// static so it doesn't depend on any data that would itself need network.
//
// This page is reachable via /offline as a real route too — useful for
// manually testing the offline UX inside Chrome DevTools (Network →
// Offline, reload).
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Offline · Hippo",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px max(16px, env(safe-area-inset-left)) calc(24px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-right))",
        background: "var(--bg, #060d13)",
        color: "var(--text, #E2E8F0)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <HippoMark size={64} />
      </div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: 8,
          color: "var(--text, #E2E8F0)",
        }}
      >
        You&rsquo;re offline
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "var(--text-3, #64748B)",
          lineHeight: 1.55,
          maxWidth: 320,
          marginBottom: 20,
        }}
      >
        Hippo couldn&rsquo;t reach the server. Case logs you have already
        opened will still load from cache. New cases you enter now will be
        saved on this device and sync when you&rsquo;re back online.
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-3, #64748B)",
        }}
      >
        Dashboard · Cases · Log a case are all available below.
      </p>

      <nav
        style={{
          marginTop: 28,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/cases", label: "Cases" },
          { href: "/log", label: "Log a case" },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid var(--border, rgba(255,255,255,.08))",
              background: "var(--surface, rgba(14,165,233,.04))",
              color: "var(--text, #E2E8F0)",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
