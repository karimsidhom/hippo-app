"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, BarChart2, User, LogOut, Plus, Users, FilePlus, CalendarClock, Settings as SettingsIcon, Inbox, GraduationCap, type LucideIcon } from "lucide-react";
import { QuickAddModal } from "@/components/cases/QuickAddModal";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { HippoMark } from "@/components/HippoMark";
import { ShadowRecordBanner } from "@/components/shared/ShadowRecordBanner";
import { SubprocessorBanner } from "@/components/SubprocessorBanner";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { useInteraction } from "@/hooks/useInteraction";
import {
  hydrateStyleProfile,
  flushStyleProfileWrites,
} from "@/lib/dictation/style/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, profile, loading, onboardingDone, logout } = useAuth();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const fx = useInteraction();

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

  // Module-scoped theme: /clinic routes paint with the red Hippo Clinic accent.
  // Pure CSS-variable swap (see globals.css [data-module="clinic"]) — no logic
  // or component changes needed elsewhere in the app.
  const inClinic = pathname.startsWith("/clinic");
  const moduleAttr = inClinic ? "clinic" : undefined;

  return (
    <div
      data-module={moduleAttr}
      className="app-shell"
      style={{
        background: "var(--bg)",
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        // Center the entire app shell on wide screens so header / main / nav
        // share the same horizontal axis instead of each centering itself.
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <ShadowRecordBanner />
      <SubprocessorBanner />
      <DesktopSidebar
        inClinic={inClinic}
        pathname={pathname}
        name={user.name}
        subtitle={[profile?.trainingYearLabel, profile?.specialty].filter(Boolean).join(" \u00b7 ")}
        roleType={profile?.roleType}
        onLog={() => { fx.tap(); setQuickAddOpen(true); }}
        onLogout={() => { logout(); router.replace("/login"); }}
      />
      {/* Responsive breakpoint styles.
       *
       * Width strategy:
       *   - Mobile (< 768): viewport-wide content with a comfortable 640px
       *     reading column cap. 16px side padding so content breathes
       *     without crowding safe-area edges.
       *   - Tablet (768–1199): 720px column.
       *   - Desktop (≥ 1200): 880px column.
       *
       * Bottom-nav is capped at 480px on every breakpoint so on desktop it
       * stays a phone-feel thumb-reachable element instead of stretching
       * across half the screen.
       */}
      <style>{`
        /* App shell width strategy.
           Header + main use the SAME side-padding scale so content lands
           on a single vertical axis at every breakpoint — no 4-pixel
           drift between the Hippo logo and the dashboard cards below.
           Side padding folds in env(safe-area-inset-left/right) so an
           iPhone in landscape with the notch on the left doesn't shove
           content sideways. */
        .app-header, .app-main {
          width: 100%;
          max-width: 640px;
          margin-left: auto;
          margin-right: auto;
        }
        .app-header {
          padding-left: max(18px, env(safe-area-inset-left));
          padding-right: max(18px, env(safe-area-inset-right));
        }
        .app-main {
          padding-left: max(18px, env(safe-area-inset-left));
          padding-right: max(18px, env(safe-area-inset-right));
          padding-top: 20px;
          padding-bottom: 96px;
        }
        .app-nav {
          width: 100%;
          max-width: 480px;
        }
        @media (min-width: 768px) {
          .app-header, .app-main { max-width: 720px; }
          .app-header {
            padding-left: max(28px, env(safe-area-inset-left));
            padding-right: max(28px, env(safe-area-inset-right));
          }
          .app-main {
            padding-left: max(28px, env(safe-area-inset-left));
            padding-right: max(28px, env(safe-area-inset-right));
            padding-top: 24px;
            padding-bottom: 96px;
          }
        }
        @media (min-width: 1200px) {
          .app-header, .app-main { max-width: 880px; }
          .app-header {
            padding-left: max(36px, env(safe-area-inset-left));
            padding-right: max(36px, env(safe-area-inset-right));
          }
          .app-main {
            padding-left: max(36px, env(safe-area-inset-left));
            padding-right: max(36px, env(safe-area-inset-right));
            padding-top: 28px;
            padding-bottom: 96px;
          }
        }
        /* Premium polish — sticky header sits above a subtle blur so
           content scrolling underneath ghosts through tastefully rather
           than slamming a hard line at the bottom of the bar. */
        .app-header {
          backdrop-filter: saturate(180%) blur(14px);
          -webkit-backdrop-filter: saturate(180%) blur(14px);
          background: color-mix(in oklab, var(--bg) 78%, transparent) !important;
        }
      `}</style>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      {/*
        Installed-PWA safe area: iOS runs the app "black-translucent" so
        our content renders BEHIND the status bar (time / wifi / battery).
        Without a top inset, the Hippo logo + Log button sit underneath
        the clock and are unreachable. Paint the status-bar area in our
        bg colour and add safe-area-inset-top padding so the actual chrome
        starts below the clock.
      */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          height: "env(safe-area-inset-top)",
          background: "var(--bg)",
          zIndex: 51,
          pointerEvents: "none",
        }}
      />
      <header className="app-header" style={{
        // Side padding handled by .app-header class above so it stays in
        // sync with .app-main and folds in safe-area-inset-left/right
        // for landscape iPhones with the notch on the left.
        paddingTop: "env(safe-area-inset-top)",
        height: "calc(48px + env(safe-area-inset-top))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        margin: "0 auto",
        // background applied via .app-header class (color-mix for blur)
        borderBottom: "1px solid var(--border)",
      }}>
        <Link
          href={inClinic ? "/clinic" : "/dashboard"}
          style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
        >
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
          {inClinic && (
            <span style={{
              marginLeft: 2,
              padding: "2px 6px",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--primary)",
              background: "var(--primary-dim)",
              border: "1px solid var(--border-glow)",
              borderRadius: 4,
              fontFamily: "'Geist', sans-serif",
            }}>
              Clinic
            </span>
          )}
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* The shared NotificationBell renders the existing global feed
              (EPA verifications, batch sign-offs, etc) — copy that's
              irrelevant for a clinic-only deployment. We hide it under
              [data-module="clinic"] so the clinician never lands in EPA
              vocabulary by mistake. Clinic-specific notifications live
              at /clinic/settings/notifications and on the dashboard. */}
          {!inClinic && <NotificationBell />}
          {inClinic ? (
            <Link
              href="/clinic/new"
              className="press"
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
                textDecoration: "none",
              }}
              onClick={() => fx.tap()}
            >
              <Plus size={12} strokeWidth={2.5} />
              Note
            </Link>
          ) : (
            <button
              className="press"
              onClick={() => { fx.tap(); setQuickAddOpen(true); }}
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
          )}
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

      {/* ── Bottom Nav backdrop ────────────────────────────────────────── */}
      {/*
        Full-viewport-width backdrop sits BEHIND the centred nav content.
        Without this, capping the nav at 480px on desktop made the border-top
        and bg only span 480px — the rest of the bottom edge showed empty,
        producing a "weird dash" effect against the page background.
        Backdrop renders the bar as a full-width strip; the nav content
        centres on top of it inside its 480px column.
      */}
      <div
        aria-hidden
        className="app-nav-backdrop"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "calc(56px + max(6px, env(safe-area-inset-bottom)) + 4px)",
          // Premium polish: same color-mix backdrop blur as the header
          // so the bottom bar reads as a single floating element, not a
          // hard slab. Falls back gracefully on browsers without
          // backdrop-filter (Edge/iOS pre-15) — those just see --bg.
          background: "color-mix(in oklab, var(--bg) 78%, transparent)",
          backdropFilter: "saturate(180%) blur(14px)",
          WebkitBackdropFilter: "saturate(180%) blur(14px)",
          borderTop: "1px solid var(--border)",
          zIndex: 49,
          pointerEvents: "none",
        }}
      />

      {/* ── Bottom Nav ─────────────────────────────────────────────────── */}
      <nav className="app-nav" style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        justifyContent: "space-around",
        // Center vertically so the elevated + button (negative margin-top)
        // doesn't drag the other tabs upward via flex-end alignment.
        alignItems: "center",
        // Reserve enough vertical space for the elevated + button to sit
        // 12px above the bar without being clipped at the top.
        minHeight: 56,
        paddingBottom: "max(6px, env(safe-area-inset-bottom))",
        paddingTop: 4,
        zIndex: 50,
        // No background or border on the nav itself — the backdrop above
        // owns those so the bar reads as full-width on every viewport.
        background: "transparent",
      }}>
        {inClinic ? (
          <>
            <NavTab href="/clinic" label="Home" icon={LayoutDashboard} active={pathname === "/clinic"} />
            <NavTab href="/clinic/patients" label="Patients" icon={Users} active={pathname.startsWith("/clinic/patients")} />
            {/* Center new-note button — anchors the action like the surgical Log nav */}
            {(() => {
              const newActive = pathname.startsWith("/clinic/new") || pathname.startsWith("/clinic/encounters");
              return (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                  marginTop: -12,
                }}>
                  <Link
                    href="/clinic/new"
                    className="press-key"
                    onClick={() => fx.tap()}
                    aria-label="New clinic note"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: "var(--primary)",
                      border: "3px solid var(--bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "box-shadow .15s cubic-bezier(.16,1,.3,1)",
                      boxShadow: "0 2px 8px rgba(220,38,38,.25)",
                      textDecoration: "none",
                    }}
                  >
                    <FilePlus size={20} color="#fff" strokeWidth={2.5} />
                  </Link>
                  <Link
                    href="/clinic/new"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      paddingTop: 2,
                      paddingBottom: 4,
                      textDecoration: "none",
                      color: newActive ? "var(--text)" : "var(--muted)",
                      transition: "color .15s",
                      position: "relative",
                    }}
                  >
                    {newActive && (
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
                    <span style={{
                      fontSize: 9,
                      fontWeight: 500,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      fontFamily: "'Geist', sans-serif",
                    }}>New Note</span>
                  </Link>
                </div>
              );
            })()}
            <NavTab href="/clinic/follow-ups" label="Follow-ups" icon={CalendarClock} active={pathname.startsWith("/clinic/follow-ups")} />
            <NavTab href="/clinic/settings" label="Settings" icon={SettingsIcon} active={pathname.startsWith("/clinic/settings")} />
          </>
        ) : (
        <>
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
              {/* + button — elevated, attached to Cases.
                  44×44 hits Apple HIG's minimum tappable target so the
                  most-used primary action never misfires on iPhone. */}
              <button
                className="press-key"
                onClick={() => { fx.tap(); setQuickAddOpen(true); }}
                aria-label="Log a case"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "var(--primary)",
                  border: "3px solid var(--bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  // Motion + haptic live in useInteraction() + the .press-key
                  // class. This button now has a uniform press feel matching
                  // every other primary action across the app.
                  transition: "box-shadow .15s cubic-bezier(.16,1,.3,1)",
                  boxShadow: "0 2px 8px rgba(99,102,241,.25)",
                }}
              >
                <Plus size={20} color="#fff" strokeWidth={2.5} />
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

        {/* Cohort tab lives inside Stats for PDs — see src/app/(app)/analytics/page.tsx.
            Kept off the bottom nav to avoid crowding. */}

        {/* ── Profile ── */}
        <NavTab href="/profile" label="Profile" icon={User} active={pathname === "/profile" || pathname.startsWith("/profile/")} />

        {/* ── Community ── */}
        <NavTab href="/social" label="Community" icon={Users} active={pathname === "/social"} />
        </>
        )}
      </nav>

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <IOSInstallPrompt />
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
      className="press"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        // 44×44 minimum hit area per Apple HIG. The visual chrome stays
        // compact (icon + 9pt label) but the tappable surface now meets
        // the iOS guideline — no more mis-taps on the bottom nav.
        minWidth: 44,
        minHeight: 44,
        padding: "8px 14px",
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

/** Desktop-only left sidebar (hidden below 1024px via .desk-sidebar). */
function DesktopSidebar({
  inClinic, pathname, name, subtitle, roleType, onLog, onLogout,
}: {
  inClinic: boolean;
  pathname: string;
  name: string;
  subtitle: string;
  roleType?: string;
  onLog: () => void;
  onLogout: () => void;
}) {
  const isStaff = roleType === "STAFF" || roleType === "ATTENDING" || roleType === "PROGRAM_DIRECTOR";
  const isPD = roleType === "PROGRAM_DIRECTOR";
  const items: { href: string; label: string; icon: LucideIcon; active: boolean }[] = inClinic
    ? [
        { href: "/clinic", label: "Home", icon: LayoutDashboard, active: pathname === "/clinic" },
        { href: "/clinic/patients", label: "Patients", icon: Users, active: pathname.startsWith("/clinic/patients") },
        { href: "/clinic/follow-ups", label: "Follow-ups", icon: CalendarClock, active: pathname.startsWith("/clinic/follow-ups") },
        { href: "/clinic/settings", label: "Settings", icon: SettingsIcon, active: pathname.startsWith("/clinic/settings") },
      ]
    : [
        { href: "/dashboard", label: "Home", icon: LayoutDashboard, active: pathname === "/dashboard" },
        { href: "/cases", label: "Cases", icon: ClipboardList, active: pathname.startsWith("/cases") },
        { href: "/analytics", label: "Stats", icon: BarChart2, active: pathname.startsWith("/analytics") },
        ...(isStaff ? [{ href: "/inbox", label: "EPA inbox", icon: Inbox, active: pathname.startsWith("/inbox") }] : []),
        ...(isPD ? [{ href: "/pd-dashboard", label: "Program", icon: GraduationCap, active: pathname.startsWith("/pd-dashboard") }] : []),
        { href: "/social", label: "Community", icon: Users, active: pathname.startsWith("/social") },
        { href: "/profile", label: "Profile", icon: User, active: pathname.startsWith("/profile") },
      ];
  const settingsActive = pathname.startsWith("/settings");

  return (
    <aside className="desk-sidebar" aria-label="Main navigation">
      <Link
        href={inClinic ? "/clinic" : "/dashboard"}
        style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 10px", textDecoration: "none" }}
      >
        <HippoMark size={26} />
        <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-.3px" }}>Hippo</span>
        {inClinic && (
          <span style={{
            padding: "2px 6px", fontSize: 9, fontWeight: 600, letterSpacing: ".08em",
            textTransform: "uppercase", color: "var(--primary)", background: "var(--primary-dim)",
            border: "1px solid var(--border-glow)", borderRadius: 4,
          }}>Clinic</span>
        )}
      </Link>

      {inClinic ? (
        <Link href="/clinic/new" className="press" style={deskPrimaryBtn}>
          <FilePlus size={16} strokeWidth={2.25} /> New note
        </Link>
      ) : (
        <button type="button" className="press" onClick={onLog} style={deskPrimaryBtn}>
          <Plus size={16} strokeWidth={2.5} /> Log a case
        </button>
      )}

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(({ href, label, icon: Icon, active }) => (
          <Link key={href} href={href} className="desk-nav-link" aria-current={active ? "page" : undefined}>
            <Icon size={17} strokeWidth={active ? 2 : 1.75} />
            {label}
          </Link>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {!inClinic && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 4 }}>
            <Link href="/settings" className="desk-nav-link" aria-current={settingsActive ? "page" : undefined} style={{ flex: 1 }}>
              <SettingsIcon size={17} strokeWidth={settingsActive ? 2 : 1.75} />
              Settings
            </Link>
            <NotificationBell />
          </div>
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 10px 4px", borderTop: "1px solid var(--border)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: "var(--text)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{name}</div>
          {subtitle && (
            <div style={{
              fontSize: 11, color: "var(--text-3)", marginTop: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{subtitle}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Log out"
          aria-label="Log out"
          style={{
            background: "none", border: "1px solid var(--border-mid)", borderRadius: 7,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-2)", cursor: "pointer", flexShrink: 0,
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}

const deskPrimaryBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
  height: 40, margin: "24px 0 18px",
  background: "var(--primary)", color: "#fff",
  border: "none", borderRadius: 9,
  fontSize: 14, fontWeight: 600, fontFamily: "inherit",
  cursor: "pointer", textDecoration: "none",
  boxShadow: "0 2px 10px rgba(14,165,233,.22)",
};
