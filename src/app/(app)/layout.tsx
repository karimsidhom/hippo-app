"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, BarChart2, User, LogOut, Plus, Users, GraduationCap, type LucideIcon } from "lucide-react";
import { QuickAddModal } from "@/components/cases/QuickAddModal";
import { HippoMark } from "@/components/HippoMark";
import { ShadowRecordBanner } from "@/components/shared/ShadowRecordBanner";
import { SubprocessorBanner } from "@/components/SubprocessorBanner";
import { useAuth } from "@/context/AuthContext";
import {
  hydrateStyleProfile,
  flushStyleProfileWrites,
} from "@/lib/dictation/style/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, profile, loading, onboardingDone, logout } = useAuth();
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
      <ShadowRecordBanner />
      <SubprocessorBanner />
      {/* Responsive breakpoint styles */}
      <style>{`
        .app-header { max-width: 640px; }
        .app-main { max-width: 640px; padding: 20px 20px 88px; }
        .app-nav { max-width: 640px; }
        @media (min-width: 768px) {
          .app-header { max-width: 960px; }
          .app-main { max-width: 960px; padding: 24px 32px 88px; }
          .app-nav { max-width: 960px; }
        }
        @media (min-width: 1200px) {
          .app-header { max-width: 1120px; }
          .app-main { max-width: 1120px; padding: 28px 40px 88px; }
          .app-nav { max-width: 1120px; }
        }
      `}</style>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="app-header" style={{
        padding: "0 20px",
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
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
      <main className="app-main" style={{
        margin: "0 auto",
      }}>
        {children}
      </main>

      {/* ── Bottom Nav ─────────────────────────────────────────────────── */}
      <nav className="app-nav" style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "flex-end",
        padding: "0 0 max(4px, env(safe-area-inset-bottom))",
        zIndex: 50,
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
      }}>
        {/* ── Home ── */}
        <NavTab href="/dashboard" label="Home" icon={LayoutDashboard} active={pathname === "/dashboard"} />

        {/* ── Stats ── */}
        <NavTab href="/analytics" label="Stats" icon={BarChart2} active={pathname === "/analytics"} />

        {/* ── Cases (center anchor with integrated +) ── */}
        {(() => {
          const casesActive = pathname === "/cases";
          return (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              marginTop: -12,
            }}>
              {/* + button — elevated, attached to Cases */}
              <button
                onClick={() => setQuickAddOpen(true)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "var(--primary)",
                  border: "3px solid var(--bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "transform .15s cubic-bezier(.16,1,.3,1), box-shadow .15s",
                  boxShadow: "0 2px 8px rgba(99,102,241,.25)",
                }}
                onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.92)"; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                <Plus size={17} color="#fff" strokeWidth={2.5} />
              </button>
              {/* Cases label/icon below */}
              <Link
                href="/cases"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  paddingTop: 2,
                  paddingBottom: 4,
                  textDecoration: "none",
                  color: casesActive ? "var(--text)" : "var(--muted)",
                  transition: "color .15s",
                  position: "relative",
                }}
              >
                {casesActive && (
                  <div style={{
                    position: "absolute",
                    top: -2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 16,
                    height: 1.5,
                    borderRadius: 1,
                    background: "var(--primary)",
                  }} />
                )}
                <ClipboardList size={15} strokeWidth={casesActive ? 2 : 1.5} />
                <span style={{
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  fontFamily: "'Geist', sans-serif",
                }}>Cases</span>
              </Link>
            </div>
          );
        })()}

        {/* ── Cohort (Program Directors only) ── */}
        {profile?.roleType === "PROGRAM_DIRECTOR" && (
          <NavTab
            href="/pd-dashboard"
            label="Cohort"
            icon={GraduationCap}
            active={pathname === "/pd-dashboard" || pathname.startsWith("/pd-dashboard/")}
          />
        )}

        {/* ── Profile ── */}
        <NavTab href="/profile" label="Profile" icon={User} active={pathname === "/profile" || pathname.startsWith("/profile/")} />

        {/* ── Community ── */}
        <NavTab href="/social" label="Community" icon={Users} active={pathname === "/social"} />
      </nav>

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}

/** Reusable bottom-nav tab */
function NavTab({
  href, label, icon: Icon, active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "8px 12px 4px",
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
}
