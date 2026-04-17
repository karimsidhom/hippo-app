"use client";

import { useState } from "react";
import {
  X,
  MapPin,
  Link2,
  Video,
  Repeat,
  Trash2,
  ExternalLink,
  User,
} from "lucide-react";
import type { CalendarEvent } from "./ProgramCalendar";

// ---------------------------------------------------------------------------
// EventDetailSheet
//
// Read-only sheet showing full event details. The creator and program owners
// can delete the event.
// ---------------------------------------------------------------------------

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onChanged: () => void;
}

const RECURRENCE_LABEL: Record<string, string> = {
  NONE: "",
  DAILY: "Repeats daily",
  WEEKLY: "Repeats weekly",
  BIWEEKLY: "Repeats every 2 weeks",
  MONTHLY: "Repeats monthly",
};

export function EventDetailSheet({
  event,
  onClose,
  onChanged,
}: EventDetailSheetProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!event) return null;

  const start = new Date(event.startAt);
  const end = event.endAt ? new Date(event.endAt) : null;
  const isZoom = event.url && /zoom\.us/i.test(event.url);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/programs/events/${event.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? `Delete failed (${res.status})`);
      } else {
        onChanged();
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 16,
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {event.programName}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--text)",
                  letterSpacing: "-0.4px",
                }}
              >
                {event.title}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-2)",
              fontFamily: "'Geist Mono', monospace",
            }}
          >
            {start.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-3)",
              fontFamily: "'Geist Mono', monospace",
              marginTop: 2,
            }}
          >
            {event.allDay
              ? "All day"
              : `${start.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}${
                  end
                    ? ` – ${end.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    : ""
                }`}
          </div>
          {event.recurrence !== "NONE" && (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Repeat size={11} />
              {RECURRENCE_LABEL[event.recurrence] ?? event.recurrence}
              {event.recurrenceUntil &&
                ` until ${new Date(event.recurrenceUntil).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" },
                )}`}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflow: "auto", flex: 1 }}>
          {event.location && (
            <Row icon={<MapPin size={13} />} label="Location">
              {event.location}
            </Row>
          )}
          {event.url && (
            <Row icon={isZoom ? <Video size={13} /> : <Link2 size={13} />} label={isZoom ? "Zoom link" : "Link"}>
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--primary)",
                  textDecoration: "none",
                  wordBreak: "break-all",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {event.url.length > 50
                  ? event.url.slice(0, 50) + "..."
                  : event.url}
                <ExternalLink size={11} />
              </a>
            </Row>
          )}
          {event.description && (
            <Row icon={null} label="Details">
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {event.description}
              </div>
            </Row>
          )}
          {event.createdByName && (
            <Row icon={<User size={13} />} label="Added by">
              {event.createdByName}
            </Row>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {confirming ? (
            <>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-2)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "#ef4444",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: deleting ? "wait" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {deleting ? "Deleting..." : "Confirm delete"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-2)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Close
              </button>
              <button
                onClick={() => setConfirming(true)}
                style={{
                  padding: "10px 14px",
                  background: "transparent",
                  border: "1px solid #ef444440",
                  borderRadius: 8,
                  color: "#ef4444",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          color: "var(--text-3)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--text)" }}>{children}</div>
    </div>
  );
}
