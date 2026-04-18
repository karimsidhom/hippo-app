"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Inbox, Clock, RotateCcw, X } from "lucide-react";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { NOTIFICATION_META } from "@/lib/notifications/types";
import { useInteraction } from "@/hooks/useInteraction";

// ---------------------------------------------------------------------------
// NotificationBell — top-nav bell icon with unread badge + slide-in sheet.
//
// Design goals (echoing the rest of the app):
//   - Single-accent (teal). No red badge — residents already swim in red
//     alerts at work. Unread uses the teal glow instead.
//   - Sheet slides in from the right on mobile, hovers on desktop.
//   - Tapping a notification marks-read + navigates to actionUrl.
//   - "Mark all read" mass-action sits at the top so residents with 40+
//     unread (post-call check-in) can zero the badge in one gesture.
// ---------------------------------------------------------------------------

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const fx = useInteraction();
  const router = useRouter();

  const handleToggle = () => {
    fx.tap();
    setOpen(v => !v);
  };

  const handleItem = async (n: AppNotification) => {
    fx.nav();
    // Mark read first (optimistic), then navigate.
    if (!n.readAt) void markRead(n.id);
    setOpen(false);
    if (n.actionUrl) router.push(n.actionUrl);
  };

  const handleMarkAll = () => {
    fx.tap();
    void markAllRead();
  };

  return (
    <>
      <button
        className="press"
        onClick={handleToggle}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          padding: 8,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: unreadCount > 0 ? "var(--primary-hi)" : "var(--muted)",
          transition: "color .15s",
        }}
      >
        <Bell size={16} strokeWidth={unreadCount > 0 ? 2.25 : 1.75} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              minWidth: 14,
              height: 14,
              padding: "0 4px",
              borderRadius: 8,
              background: "var(--primary)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 8px rgba(14,165,233,0.45)",
              fontFamily: "'Geist Mono', monospace",
              letterSpacing: "-0.02em",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationSheet
        notifications={notifications}
        unreadCount={unreadCount}
        onClose={() => setOpen(false)}
        onItem={handleItem}
        onMarkAll={handleMarkAll}
      />}
    </>
  );
}

function NotificationSheet({
  notifications,
  unreadCount,
  onClose,
  onItem,
  onMarkAll,
}: {
  notifications: AppNotification[];
  unreadCount: number;
  onClose: () => void;
  onItem: (n: AppNotification) => void;
  onMarkAll: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 100,
          animation: "fadeIn .15s ease-out",
        }}
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-label="Notifications"
        style={{
          position: "fixed",
          top: "calc(48px + env(safe-area-inset-top))",
          right: "max(12px, env(safe-area-inset-right))",
          // Mobile: take most of the width. Desktop: fixed 380px.
          width: "min(380px, calc(100vw - 24px))",
          maxHeight: "calc(80vh - env(safe-area-inset-bottom))",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-glass)",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(14,165,233,0.08)",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUp .2s cubic-bezier(.16,1,.3,1)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 8,
                fontSize: 10,
                fontWeight: 600,
                color: "var(--primary-hi)",
                background: "var(--primary-dim)",
                padding: "2px 7px",
                borderRadius: 4,
                fontFamily: "'Geist Mono', monospace",
              }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {unreadCount > 0 && (
              <button
                className="press"
                onClick={onMarkAll}
                title="Mark all as read"
                aria-label="Mark all as read"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-mid)",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--text-2)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "inherit",
                }}
              >
                <CheckCheck size={11} />
                Clear all
              </button>
            )}
            <button
              className="press"
              onClick={onClose}
              aria-label="Close notifications"
              style={{
                background: "transparent",
                border: "none",
                padding: 4,
                cursor: "pointer",
                color: "var(--muted)",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
          {notifications.length === 0 ? (
            <EmptyNotifications />
          ) : (
            notifications.map(n => (
              <NotificationRow key={n.id} notification={n} onClick={() => onItem(n)} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: AppNotification;
  onClick: () => void;
}) {
  const unread = !notification.readAt;
  const meta = NOTIFICATION_META[notification.type as keyof typeof NOTIFICATION_META];
  const Icon = iconFor(meta?.icon ?? "bell");
  const accentColor = accentColorFor(meta?.accent ?? "muted");

  return (
    <button
      className="press"
      onClick={onClick}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 14px",
        background: unread ? "var(--glass-mid)" : "transparent",
        border: "none",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        color: "var(--text)",
        transition: "background .15s",
      }}
    >
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: `${accentColor}15`,
        color: accentColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 1,
      }}>
        <Icon size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12,
          fontWeight: unread ? 600 : 500,
          color: "var(--text)",
          lineHeight: 1.35,
        }}>
          {notification.title}
        </div>
        {notification.body && (
          <div style={{
            fontSize: 11,
            color: "var(--text-2)",
            marginTop: 2,
            lineHeight: 1.4,
            // Truncate to two lines on the bell row; the full body is on
            // the /notifications page.
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {notification.body}
          </div>
        )}
        <div style={{
          fontSize: 10,
          color: "var(--text-3)",
          marginTop: 4,
          fontFamily: "'Geist Mono', monospace",
          letterSpacing: "0.02em",
        }}>
          {formatRelative(notification.createdAt)}
        </div>
      </div>
      {unread && (
        <div style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--primary)",
          boxShadow: "0 0 8px rgba(14,165,233,0.5)",
          flexShrink: 0,
          marginTop: 9,
        }} />
      )}
    </button>
  );
}

function EmptyNotifications() {
  return (
    <div style={{
      padding: "32px 20px",
      textAlign: "center",
      color: "var(--text-3)",
    }}>
      <Bell size={22} style={{ opacity: 0.3, marginBottom: 10 }} />
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)", marginBottom: 4 }}>
        All quiet
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.5 }}>
        You&rsquo;ll see EPA reviews, sign-offs, and sign-ins here.
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

/** "2m" "3h" "5d" style timestamps; falls through to locale date. */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 7 * 86_400) return `${Math.floor(diffSec / 86_400)}d ago`;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}
