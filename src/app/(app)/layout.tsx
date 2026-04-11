"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, BarChart2, User, LogOut, Plus } from "lucide-react";
import { QuickAddModal } from "@/components/cases/QuickAddModal";
import { HippoMark } from "@/components/HippoMark";
import { useAuth } from "@/context/AuthContext";
import {
  hydrateStyleProfile,
  flushStyleProfileWrites,
} from "@/lib/dictation/style/store";

const NAV = [
  { href: "/dashboard", label: "Home",    icon: LayoutDashboard },
  { href: "/cases",     label: "Cases",   icon: ClipboardList },
  { href: "/log",       label: "Log",     icon: Plus, isAction: true },
  { href: "/analytics", label: "Stats",   icon: BarChart2 },
  { href: "/profile",   label: "Profile", icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, loading, onboardingDone, logout } = useAuth();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (!onboardingDone) { router.replace("/onboarding"); return; }
  }, [user, loading, onboardingDone, router]);

  // Pull the server-backed StyleProfile into the client cache once the user
  // is confirmed logged in. Non-blocking — the cache falls back to
  // localStorage / defaults until this resolves.
  useEffect(() => {
    if (loading || !user) return;
    hydrateStyleProfile().catch(() => { /* non-fatal */ });
  }, [loading, user]);

  // Flush pending profile writes before the tab unloads, so a freshly-saved
  // correction doesn't get lost if the user closes the tab within ~400ms.
  useEffect(() => {
    const handler = () => { void flushStyleProfileWrites(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  if (loading || !user || !onboardingDone) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          border: "1.5px solid var(--border-mid)",
          borderTop: "1.5px solid var(--primary)",
          animation: "spin .7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        padding: "0 20px",
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        maxWidth: 640,
        margin: "0 auto",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
      }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <HippoMark size={22} />
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-.3px",
            fontFamily: "'Geist', sans-serif",
          }}>
            Hippo
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => setQuickAddOpen(true)}
            style={{
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontFamily: "'Geist', sans-serif",
              letterSpacing: ".01em",
              transition: "all .15s cubic-bezier(.16,1,.3,1)",
            }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Log
          </button>
          <button
            onClick={() => { logout(); router.replace("/login"); }}
            title="Log out"
            style={{
              background: "none",
              border: "none",
              padding: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "var(--muted)",
              transition: "color .15s",
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <main style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "20px 20px 88px",
      }}>
        {children}
      </main>

      {/* ── Bottom Nav ─────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 640,
        display: "flex",
        justifyContent: "space-around",
        padding: "0 0 max(4px, env(safe-area-inset-bottom))",
        zIndex: 50,
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
      }}>
        {NAV.map(({ href, label, icon: Icon, isAction }) => {
          const active = pathname === href;

          if (isAction) {
            return (
              <button
                key={href}
                onClick={() => setQuickAddOpen(true)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  padding: "8px 16px 4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Geist', sans-serif",
                  color: "var(--primary)",
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  background: "var(--primary)",
                  borderRadius: 7,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Plus size={15} color="#fff" strokeWidth={2.5} />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "8px 16px 4px",
                color: active ? "var(--text)" : "var(--muted)",
                textDecoration: "none",
                fontSize: 9,
                fontWeight: 500,
                transition: "color .15s",
                letterSpacing: ".06em",
                textTransform: "uppercase",
                position: "relative",
                fontFamily: "'Geist', sans-serif",
              }}
            >
              {active && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 16,
                  height: 1.5,
                  borderRadius: 1,
                  background: "var(--primary)",
                }} />
              )}
              <Icon size={17} strokeWidth={active ? 2 : 1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
