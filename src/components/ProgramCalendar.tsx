"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users2,
  Palmtree,
  MessageSquare,
  Link2,
  FileText,
  Video,
  Presentation,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { EventComposerSheet } from "./EventComposerSheet";
import { EventDetailSheet } from "./EventDetailSheet";

// ---------------------------------------------------------------------------
// ProgramCalendar
//
// Shared calendar widget for the dashboard. Visible only to users who belong
// to at least one Program. Shows:
//   • a compact month-grid with dots for days that have events
//   • an upcoming-events list (next 14 days) below the grid
//   • a "+ Add event" button that opens the composer sheet
//
// If the user is not in any program, nothing renders — the "Create program"
// CTA lives on the dedicated /programs page.
// ---------------------------------------------------------------------------

interface ProgramSummary {
  id: string;
  name: string;
  institution: string | null;
  specialty: string | null;
}

export interface CalendarEvent {
  id: string;
  programId: string;
  programName: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  url: string | null;
  type: string;
  recurrence: string;
  recurrenceUntil: string | null;
  createdById: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  isRecurringInstance: boolean;
  originalStartAt: string;
}

interface EventsResponse {
  events: CalendarEvent[];
  programs: ProgramSummary[];
}

const TYPE_META: Record<
  string,
  { label: string; color: string; bg: string; icon: LucideIcon }
> = {
  GENERAL: { label: "Event", color: "#64748b", bg: "#64748b20", icon: CalendarDays },
  VACATION: { label: "Vacation", color: "#10B981", bg: "#10B98120", icon: Palmtree },
  MEETING: { label: "Meeting", color: "#0EA5E9", bg: "#0EA5E920", icon: Users2 },
  CONFERENCE: { label: "Conference", color: "#8B5CF6", bg: "#8B5CF620", icon: Presentation },
  ROUNDS: { label: "Rounds", color: "#F59E0B", bg: "#F59E0B20", icon: MessageSquare },
  SOCIAL: { label: "Social", color: "#EC4899", bg: "#EC489920", icon: Users2 },
  DOCUMENT: { label: "Document", color: "#38BDF8", bg: "#38BDF820", icon: FileText },
};

function eventTypeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.GENERAL;
}

function formatEventTime(evt: CalendarEvent): string {
  if (evt.allDay) return "All day";
  const start = new Date(evt.startAt);
  const startStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (!evt.endAt) return startStr;
  const end = new Date(evt.endAt);
  const endStr = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${startStr} – ${endStr}`;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function ProgramCalendar() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerPrefillDate, setComposerPrefillDate] = useState<Date | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  const loadEvents = useCallback(async () => {
    // Fetch a wide enough window: start of the viewed month through 45 days
    // past end-of-month, so we get "upcoming" items for the next ~6 weeks
    // regardless of where we're scrolled.
    const from = startOfMonth(viewMonth);
    const to = new Date(endOfMonth(viewMonth).getTime() + 45 * 86400_000);

    try {
      const res = await fetch(
        `/api/programs/events?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as EventsResponse;
      setEvents(data.events ?? []);
      setPrograms(data.programs ?? []);
    } catch {
      // silent fail — widget just stays empty
    } finally {
      setLoading(false);
    }
  }, [viewMonth]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Group events by date key for the mini-calendar dots
  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = dateKey(new Date(e.startAt));
      const arr = m.get(k) ?? [];
      arr.push(e);
      m.set(k, arr);
    }
    return m;
  }, [events]);

  // Upcoming events list (next 14 days from today)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 14 * 86400_000);
    return events
      .filter((e) => {
        const d = new Date(e.startAt);
        return d >= new Date(now.getTime() - 12 * 3600_000) && d <= cutoff;
      })
      .slice(0, 20);
  }, [events]);

  // Events on the selected day (only shown when user clicks a day)
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const k = dateKey(selectedDay);
    return eventsByDay.get(k) ?? [];
  }, [selectedDay, eventsByDay]);

  if (loading) return null;

  // No programs → don't render this widget. The /programs page handles onboarding.
  if (programs.length === 0) return null;

  const today = new Date();
  const todayKey = dateKey(today);

  // Build month grid
  const firstDay = startOfMonth(viewMonth);
  const lastDay = endOfMonth(viewMonth);
  const startPadding = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < startPadding; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <section style={{ marginBottom: 28 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CalendarDays size={12} />
            Program Calendar
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/programs"
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              Manage <ArrowUpRight size={10} />
            </Link>
            <button
              onClick={() => {
                setComposerPrefillDate(selectedDay ?? new Date());
                setComposerOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Plus size={11} />
              Add event
            </button>
          </div>
        </div>

        {/* Program name chip(s) */}
        {programs.length > 0 && (
          <div style={{ marginBottom: 10, fontSize: 11, color: "var(--text-3)" }}>
            {programs.length === 1
              ? programs[0].name
              : `${programs.length} programs`}
          </div>
        )}

        {/* Month grid */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 12,
            background: "var(--surface2)",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <button
              onClick={() => {
                const prev = new Date(viewMonth);
                prev.setMonth(prev.getMonth() - 1);
                setViewMonth(prev);
                setSelectedDay(null);
              }}
              aria-label="Previous month"
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.2px",
              }}
            >
              {monthLabel}
            </div>
            <button
              onClick={() => {
                const next = new Date(viewMonth);
                next.setMonth(next.getMonth() + 1);
                setViewMonth(next);
                setSelectedDay(null);
              }}
              aria-label="Next month"
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 2,
              marginBottom: 4,
            }}
          >
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div
                key={i}
                style={{
                  fontSize: 9,
                  color: "var(--text-3)",
                  textAlign: "center",
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 2,
            }}
          >
            {cells.map((d, i) => {
              if (!d) {
                return <div key={i} style={{ height: 32 }} />;
              }
              const k = dateKey(d);
              const hasEvents = eventsByDay.has(k);
              const dayEvents = eventsByDay.get(k) ?? [];
              const isToday = k === todayKey;
              const isSelected =
                selectedDay && dateKey(selectedDay) === k;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(d)}
                  style={{
                    height: 32,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    border: "none",
                    background: isSelected
                      ? "var(--primary)"
                      : isToday
                        ? "rgba(14,165,233,0.1)"
                        : "transparent",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: isSelected
                      ? "#fff"
                      : isToday
                        ? "var(--primary)"
                        : "var(--text)",
                    fontSize: 12,
                    fontFamily: "'Geist Mono', monospace",
                    fontWeight: isToday ? 700 : 500,
                    padding: 0,
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{ lineHeight: 1 }}>{d.getDate()}</span>
                  {hasEvents && (
                    <div style={{ display: "flex", gap: 2 }}>
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: isSelected
                              ? "#fff"
                              : eventTypeMeta(e.type).color,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day events */}
        {selectedDay && selectedDayEvents.length > 0 && (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
              background: "var(--surface2)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              {selectedDay.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
            {selectedDayEvents.map((e) => (
              <EventRow
                key={`${e.id}-${e.startAt}`}
                event={e}
                onClick={() => setDetailEvent(e)}
              />
            ))}
          </div>
        )}

        {/* Upcoming list */}
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Upcoming (next 14 days)
          </div>
          {upcomingEvents.length === 0 ? (
            <div
              style={{
                padding: "20px 12px",
                border: "1px dashed var(--border-mid)",
                borderRadius: 8,
                textAlign: "center",
                fontSize: 12,
                color: "var(--text-3)",
              }}
            >
              No upcoming events. Tap + Add event to create one.
            </div>
          ) : (
            upcomingEvents.map((e) => (
              <EventRow
                key={`${e.id}-${e.startAt}`}
                event={e}
                showDate
                onClick={() => setDetailEvent(e)}
              />
            ))
          )}
        </div>
      </section>

      <EventComposerSheet
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onCreated={() => {
          setComposerOpen(false);
          loadEvents();
        }}
        programs={programs}
        prefillDate={composerPrefillDate}
      />

      <EventDetailSheet
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onChanged={() => {
          setDetailEvent(null);
          loadEvents();
        }}
      />
    </>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function EventRow({
  event,
  showDate,
  onClick,
}: {
  event: CalendarEvent;
  showDate?: boolean;
  onClick: () => void;
}) {
  const meta = eventTypeMeta(event.type);
  const Icon = meta.icon;
  const hasLink = event.url && event.url.trim().length > 0;
  const isZoom = hasLink && /zoom\.us/i.test(event.url ?? "");

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        background: "transparent",
        border: "none",
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: meta.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: meta.color,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Icon size={13} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
              minWidth: 0,
            }}
          >
            {event.title}
          </span>
          {showDate && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                fontFamily: "'Geist Mono', monospace",
                flexShrink: 0,
              }}
            >
              {new Date(event.startAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 2,
            fontSize: 11,
            color: "var(--text-3)",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span>{formatEventTime(event)}</span>
          {event.programName && (
            <>
              <span style={{ color: "var(--muted)" }}>·</span>
              <span>{event.programName}</span>
            </>
          )}
          {hasLink && (
            <>
              <span style={{ color: "var(--muted)" }}>·</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                  color: isZoom ? "#2563eb" : "var(--primary)",
                }}
              >
                {isZoom ? <Video size={10} /> : <Link2 size={10} />}
                {isZoom ? "Zoom" : "Link"}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
