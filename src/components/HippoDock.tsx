"use client";

/**
 * HippoDock: the suite switcher and account chip for app headers.
 *
 * Copied byte-identical into each suite repo that shows it (Cases and
 * Handover), next to src/lib/hippo-id.ts. Styling uses the house
 * tokens every Hippo app already defines (--surface, --border, --text-*,
 * --primary, --r, --rl), so it takes on each app's light and dark theme.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  HIPPO_PROFILE_URL,
  HIPPO_SUITE_APPS,
  getHippoUser,
  type HippoUser,
  type SuiteAppId,
} from "@/lib/hippo-id";

interface HippoDockProps {
  /** The app this dock sits in; it is marked and not linked. */
  current: SuiteAppId;
  /** The app's Supabase browser client. The dock reads the session and hub profile itself. */
  supabase: Parameters<typeof getHippoUser>[0];
  /** Pending Hippo Link handoffs for this user. Nothing renders while it is 0 or absent. */
  inbox?: number;
  /** Where the Inbox row goes. Cases passes its own /inbox. */
  inboxHref?: string;
  /** Where "Edit profile" goes. Cases passes its own /profile. */
  profileHref?: string;
}

const EASE = "cubic-bezier(.16,1,.3,1)";

export function HippoDock({
  current,
  supabase,
  inbox,
  inboxHref = "https://hippomedicine.com/inbox",
  profileHref = HIPPO_PROFILE_URL,
}: HippoDockProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<HippoUser | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let alive = true;
    getHippoUser(supabase, { verify: false }).then((u) => {
      if (alive) setUser(u);
    });
    return () => {
      alive = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = inbox && inbox > 0 ? inbox : 0;
  const detail = [user?.level, user?.program].filter(Boolean).join(" · ");

  return (
    <div ref={root} style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <style>{DOCK_CSS}</style>
      <button
        ref={trigger}
        type="button"
        className="hippo-dock-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          (user?.displayName ? `Hippo Suite apps and account, ${user.displayName}` : "Hippo Suite apps and account") +
          (unread > 0 ? `, ${unread} waiting in your inbox` : "")
        }
        onClick={() => setOpen((o) => !o)}
        style={styles.trigger}
      >
        <GridGlyph />
        <Avatar user={user} size={24} />
        {unread > 0 && <span style={styles.badge}>{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div role="dialog" aria-label="Hippo Suite" className="hippo-dock-panel" style={styles.panel}>
          <div style={styles.head}>
            <Avatar user={user} size={36} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={styles.name}>{user?.displayName || user?.email || "Hippo account"}</div>
              <div style={styles.sub}>{detail || "One sign-in for every Hippo app"}</div>
            </div>
          </div>

          {unread > 0 && (
            <a href={inboxHref} className="hippo-dock-row" style={{ ...styles.row, ...styles.inboxRow }}>
              <span aria-hidden="true" style={styles.inboxCount}>{unread > 9 ? "9+" : unread}</span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <span style={styles.appName}>Inbox</span>
                <span style={styles.blurb}>{unread === 1 ? "1 waiting to review" : `${unread} waiting to review`}</span>
              </span>
            </a>
          )}

          <nav aria-label="Hippo Suite apps" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {HIPPO_SUITE_APPS.map((app, i) => {
              const here = app.id === current;
              return (
                <a
                  key={app.id}
                  href={here ? undefined : app.url}
                  aria-current={here ? "page" : undefined}
                  className="hippo-dock-row"
                  onClick={here ? () => setOpen(false) : undefined}
                  style={{ ...styles.row, animationDelay: `${40 + i * 35}ms`, cursor: "pointer" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={app.icon} alt="" width={32} height={32} style={styles.icon} />
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <span style={styles.appName}>{app.name}</span>
                    <span style={styles.blurb}>{app.blurb}</span>
                  </span>
                  {here && <span style={styles.here}>Here</span>}
                </a>
              );
            })}
          </nav>

          <a href={profileHref} className="hippo-dock-row" style={styles.footer}>
            Edit profile in Cases
          </a>
        </div>
      )}
    </div>
  );
}

function Avatar({ user, size }: { user: HippoUser | null; size: number }) {
  const base: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background: "var(--primary-dim, rgba(14,165,233,0.14))",
    color: "var(--primary, #0EA5E9)",
    fontSize: Math.round(size * 0.4),
    fontWeight: 600,
    letterSpacing: "0.02em",
  };
  if (user?.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt="" width={size} height={size} style={{ ...base, objectFit: "cover" }} />;
  }
  return (
    <span aria-hidden="true" style={base}>
      {user ? user.initials : ""}
    </span>
  );
}

function GridGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ color: "var(--text-2, #64748B)" }}>
      <rect x="1" y="1" width="5" height="5" rx="1.2" fill="currentColor" />
      <rect x="8" y="1" width="5" height="5" rx="1.2" fill="currentColor" />
      <rect x="1" y="8" width="5" height="5" rx="1.2" fill="currentColor" />
      <rect x="8" y="8" width="5" height="5" rx="1.2" fill="currentColor" />
    </svg>
  );
}

const styles: Record<string, CSSProperties> = {
  trigger: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    height: 34,
    padding: "0 5px 0 9px",
    borderRadius: "var(--r, 6px)",
    border: "1px solid var(--border, rgba(255,255,255,0.06))",
    background: "var(--surface, rgba(255,255,255,0.03))",
    color: "var(--text, #E2E8F0)",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    padding: "0 4px",
    borderRadius: 8,
    background: "var(--primary, #0EA5E9)",
    color: "#fff",
    fontSize: 9.5,
    fontWeight: 700,
    lineHeight: "16px",
    textAlign: "center",
  },
  panel: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: "min(300px, calc(100vw - 24px))",
    padding: 8,
    borderRadius: "var(--rl, 10px)",
    border: "1px solid var(--border-mid, var(--border, rgba(255,255,255,0.08)))",
    background: "var(--bg-elevated, var(--bg-1, #0b1620))",
    boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
    zIndex: 80,
    animation: `hippo-dock-in .24s ${EASE} both`,
  },
  head: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 8px 10px",
    marginBottom: 4,
    borderBottom: "1px solid var(--border, rgba(255,255,255,0.06))",
  },
  name: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text, #E2E8F0)",
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  sub: {
    fontSize: 12,
    color: "var(--text-2, #64748B)",
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    padding: "7px 8px",
    borderRadius: "var(--r, 6px)",
    color: "var(--text, #E2E8F0)",
    textDecoration: "none",
    animation: `hippo-dock-row .4s ${EASE} both`,
  },
  icon: { width: 32, height: 32, borderRadius: 8, flexShrink: 0, objectFit: "cover" },
  inboxRow: {
    marginBottom: 4,
    border: "1px solid var(--border-mid, rgba(255,255,255,0.06))",
    background: "var(--primary-dim, rgba(14,165,233,0.08))",
  },
  inboxCount: {
    width: 32,
    height: 32,
    borderRadius: 8,
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--primary, #0EA5E9)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
  },
  appName: { fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" },
  blurb: { fontSize: 12, color: "var(--text-2, #64748B)", marginTop: 1 },
  here: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--primary, #0EA5E9)",
    padding: "2px 7px",
    borderRadius: 999,
    background: "var(--primary-dim, rgba(14,165,233,0.12))",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    minHeight: 44,
    marginTop: 4,
    padding: "0 8px",
    borderTop: "1px solid var(--border, rgba(255,255,255,0.06))",
    borderRadius: 0,
    fontSize: 13,
    color: "var(--text-2, #64748B)",
    textDecoration: "none",
  },
};

const DOCK_CSS = `
.hippo-dock-trigger::before { content: ""; position: absolute; inset: -5px; }
.hippo-dock-trigger:focus-visible, .hippo-dock-row:focus-visible { outline: 2px solid var(--primary, #0EA5E9); outline-offset: 2px; }
.hippo-dock-row:hover { background: var(--surface2, rgba(255,255,255,0.05)); }
@keyframes hippo-dock-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes hippo-dock-row { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .hippo-dock-panel, .hippo-dock-row { animation: none !important; }
}
`;
