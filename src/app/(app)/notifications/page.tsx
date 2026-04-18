"use client";

import { useRouter } from "next/navigation";
import { Bell, Check, Clock, Inbox, RotateCcw } from "lucide-react";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { NOTIFICATION_META } from "@/lib/notifications/types";
import { useInteraction } from "@/hooks/useInteraction";

// ---------------------------------------------------------------------------
// /notifications — full history view. The bell in the top-nav shows the
// most recent 30; this page shows everything (with pagination eventually).
//
// Design: one column, wide-rather-than-dense. Each row shows the full body
// of the notification (no two-line clamp like the bell), plus a "Signed"/
// "Returned" accent. Tapping a row marks read + navigates.
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } =
    useNotifications({ limit: 100 });
  const router = useRouter();
  const fx = useInteraction();

  const handleOpen = async (n: AppNotification) => {
    fx.nav();
    if (!n.readAt) void markRead(n.id);
    if (n.actionUrl) router.push(n.actionUrl);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.5px",
            margin: 0,
          }}>
            Notifications
          </h1>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
            {unreadCount > 0
              ? `${unreadCount} unread · tap to open`
              : "Caught up"}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            className="press"
            onClick={() => { fx.tap(); void markAllRead(); }}
            style={{
              background: "var(--glass)",
              border: "1px solid var(--border-mid)",
              borderRadius: 6,
              padding: "7px 12px",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--text-2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "inherit",
            }}
          >
            <Check size={12} />
            Mark all read
          </button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <SkeletonList />
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
        }}>
          {notifications.map((n, i) => (
            <Row
              key={n.id}
              n={n}
              onClick={() => handleOpen(n)}
              isLast={i === notifications.length - 1}
            />
          ))}
        </div>
      )}

      {/* Refresh hint */}
      <div style={{
        textAlign: "center",
        marginTop: 20,
        fontSize: 10,
        color: "var(--text-3)",
      }}>
        <button
          className="press"
          onClick={() => { fx.tap(); void refresh(); }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-3)",
            fontSize: 10,
            cursor: "pointer",
            padding: 4,
            fontFamily: "inherit",
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

function Row({ n, onClick, isLast }: { n: AppNotification; onClick: () => void; isLast: boolean }) {
  const unread = !n.readAt;
  const meta = NOTIFICATION_META[n.type as keyof typeof NOTIFICATION_META];
  const Icon = iconFor(meta?.icon ?? "bell");
  const accent = accentColorFor(meta?.accent ?? "muted");

  return (
    <button
      className="press"
      onClick={onClick}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        background: unread ? "var(--glass-mid)" : "transparent",
        border: "none",
        borderBottom: isLast ? "none" : "1px solid var(--border)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        color: "var(--text)",
        transition: "background .15s",
      }}
    >
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: `${accent}15`,
        color: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: unread ? 600 : 500,
            color: "var(--text)",
            lineHeight: 1.35,
          }}>
            {n.title}
          </div>
          <div style={{
            fontSize: 10,
            color: "var(--text-3)",
            fontFamily: "'Geist Mono', monospace",
            flexShrink: 0,
          }}>
            {formatRelative(n.createdAt)}
          </div>
        </div>
        {n.body && (
          <div style={{
            fontSize: 12,
            color: "var(--text-2)",
            marginTop: 4,
            lineHeight: 1.45,
          }}>
            {n.body}
          </div>
        )}
      </div>
      {unread && (
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--primary)",
          boxShadow: "0 0 8px rgba(14,165,233,0.5)",
          flexShrink: 0,
          marginTop: 12,
        }} />
      )}
    </button>
  );
}

function SkeletonList() {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          padding: "14px 16px",
          borderBottom: i === 3 ? "none" : "1px solid var(--border)",
          display: "flex",
          gap: 12,
        }}>
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: "60%", height: 13, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: "85%", height: 11 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      padding: "60px 20px",
      textAlign: "center",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
    }}>
      <Bell size={28} style={{ opacity: 0.25, marginBottom: 14, color: "var(--text-2)" }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
        Nothing here yet
      </div>
      <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, maxWidth: 340, margin: "0 auto" }}>
        When you submit an EPA for review, or an attending signs or returns one of yours,
        you&rsquo;ll see it here.
      </div>
    </div>
  );
}

function iconFor(name: string) {
  switch (name) {
    case "check":  return Check;
    case "clock":  return Clock;
    case "return": return RotateCcw;
    case "inbox":  return Inbox;
    default:       return Bell;
  }
}

function accentColorFor(name: string): string {
  switch (name) {
    case "success": return "#10b981";
    case "warning": return "#f59e0b";
    case "danger":  return "#ef4444";
    case "teal":    return "var(--primary)";
    default:        return "var(--text-2)";
  }
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 7 * 86_400) return `${Math.floor(diffSec / 86_400)}d ago`;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}
