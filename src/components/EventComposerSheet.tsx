"use client";

import { useEffect, useState } from "react";
import { X, CalendarDays, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// EventComposerSheet
//
// Bottom-sheet modal for creating a new ProgramEvent. Opened from the
// ProgramCalendar widget's "+ Add event" button, and also when the user taps
// a day cell and presses the add button.
// ---------------------------------------------------------------------------

interface ProgramSummary {
  id: string;
  name: string;
}

interface EventComposerSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  programs: ProgramSummary[];
  prefillDate?: Date | null;
}

const EVENT_TYPES = [
  { value: "GENERAL", label: "General" },
  { value: "VACATION", label: "Vacation" },
  { value: "MEETING", label: "Meeting" },
  { value: "CONFERENCE", label: "Conference" },
  { value: "ROUNDS", label: "Rounds" },
  { value: "SOCIAL", label: "Social" },
  { value: "DOCUMENT", label: "Document / Link" },
];

const RECURRENCE_OPTIONS = [
  { value: "NONE", label: "Does not repeat" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Every 2 weeks" },
  { value: "MONTHLY", label: "Monthly" },
];

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeInput(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function EventComposerSheet({
  open,
  onClose,
  onCreated,
  programs,
  prefillDate,
}: EventComposerSheetProps) {
  const [programId, setProgramId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("GENERAL");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [recurrence, setRecurrence] = useState("NONE");
  const [recurrenceUntil, setRecurrenceUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Reset form on open, but prefill date if given
      const d = prefillDate ?? new Date();
      setTitle("");
      setDescription("");
      setType("GENERAL");
      setAllDay(false);
      setLocation("");
      setUrl("");
      setRecurrence("NONE");
      setRecurrenceUntil("");
      setStartDate(toDateInput(d));
      setStartTime(toTimeInput(d));
      setEndDate(toDateInput(d));
      const endD = new Date(d);
      endD.setHours(endD.getHours() + 1);
      setEndTime(toTimeInput(endD));
      setError(null);
      if (!programId && programs.length > 0) setProgramId(programs[0].id);
    }
  }, [open, prefillDate, programs, programId]);

  // Reset programId default when programs list changes
  useEffect(() => {
    if (!programId && programs.length > 0) setProgramId(programs[0].id);
  }, [programs, programId]);

  if (!open) return null;

  const handleSave = async () => {
    if (saving) return;
    setError(null);
    if (!programId) {
      setError("Pick a program.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!startDate) {
      setError("Start date is required.");
      return;
    }

    const startAt = allDay
      ? new Date(`${startDate}T00:00:00`)
      : new Date(`${startDate}T${startTime}`);
    const endAt = !endDate
      ? null
      : allDay
        ? new Date(`${endDate}T23:59:59`)
        : new Date(`${endDate}T${endTime}`);

    if (endAt && endAt < startAt) {
      setError("End must be after start.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/programs/events", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          programId,
          title: title.trim(),
          description: description.trim() || null,
          type,
          startAt: startAt.toISOString(),
          endAt: endAt?.toISOString() ?? null,
          allDay,
          location: location.trim() || null,
          url: url.trim() || null,
          recurrence,
          recurrenceUntil:
            recurrence !== "NONE" && recurrenceUntil
              ? new Date(`${recurrenceUntil}T23:59:59`).toISOString()
              : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Create failed (${res.status})`);
      }
      onCreated();
    } catch (err) {
      console.error("Event create failed", err);
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarDays size={16} style={{ color: "var(--text-2)" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
              New event
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
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflow: "auto", flex: 1 }}>
          {/* Program (if >1) */}
          {programs.length > 1 && (
            <Field label="Program">
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                style={selectStyle}
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grand Rounds, John's vacation, Journal club"
              maxLength={200}
              style={inputStyle}
            />
          </Field>

          <Field label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={selectStyle}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <span>Start</span>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: "var(--text-3)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                  />
                  All day
                </label>
              </span>
            }
          >
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate || endDate < e.target.value) setEndDate(e.target.value);
                }}
                style={{ ...inputStyle, flex: 2 }}
              />
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              )}
            </div>
          </Field>

          <Field label="End (optional)">
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                style={{ ...inputStyle, flex: 2 }}
              />
              {!allDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              )}
            </div>
          </Field>

          <Field label="Location (optional)">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. OR 3, Lecture Hall A, Virtual"
              maxLength={200}
              style={inputStyle}
            />
          </Field>

          <Field label="Link / URL (optional)">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://zoom.us/j/... or Google Doc link"
              style={inputStyle}
            />
          </Field>

          <Field label="Repeats">
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              style={selectStyle}
            >
              {RECURRENCE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>

          {recurrence !== "NONE" && (
            <Field label="Repeat until (optional)">
              <input
                type="date"
                value={recurrenceUntil}
                onChange={(e) => setRecurrenceUntil(e.target.value)}
                min={startDate}
                style={inputStyle}
              />
            </Field>
          )}

          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Notes, agenda, details..."
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>

          {error && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 12px",
                background: "#ef444410",
                border: "1px solid #ef444430",
                borderRadius: 6,
                fontSize: 12,
                color: "#ef4444",
              }}
            >
              {error}
            </div>
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: saving ? "var(--muted)" : "var(--primary)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? "wait" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? "Creating..." : "Create event"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared field wrapper ───────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
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
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text)",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};
