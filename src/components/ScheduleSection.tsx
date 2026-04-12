"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  X,
  Calendar,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { VoiceTextarea } from "@/components/VoiceTextarea";

// ---------------------------------------------------------------------------
// ScheduleSection
//
// Dashboard section showing this week's upcoming (and recently past) scheduled
// cases, with a compact inline form to add new ones. Each card flips from
// "Brief" to "Debrief" depending on whether scheduledAt is in the past.
//
// Data is fetched directly from /api/schedule rather than lifted through
// context — the schedule is a small, transient dataset that's only
// relevant on the dashboard, not worth a global provider.
// ---------------------------------------------------------------------------

interface ScheduledCase {
  id: string;
  procedureName: string;
  attendingLabel: string | null;
  scheduledAt: string;
  status: string;
  notes: string | null;
  caseLogId: string | null;
}

interface ScheduleSectionProps {
  onBrief: (procedureName: string, attending?: string, when?: string) => void;
  onDebrief: (scheduledCase: ScheduledCase) => void;
}

export function ScheduleSection({ onBrief, onDebrief }: ScheduleSectionProps) {
  const [items, setItems] = useState<ScheduledCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule?status=all", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as ScheduledCase[];
      // Only show this week's items: 7 days back → 7 days forward.
      const now = Date.now();
      const weekAgo = now - 7 * 86400_000;
      const weekAhead = now + 7 * 86400_000;
      setItems(
        data.filter((d) => {
          const t = new Date(d.scheduledAt).getTime();
          return t >= weekAgo && t <= weekAhead && d.status !== "cancelled";
        }),
      );
    } catch {
      // Silently degrade — the section just won't show.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/schedule/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => {});
  };

  if (loading) return null;
  if (items.length === 0 && !showAdd) {
    return (
      <section style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div
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
            <Calendar size={11} /> This Week
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "16px",
            background: "var(--glass-lo)",
            border: "1px dashed var(--border-mid)",
            borderRadius: 10,
            color: "var(--text-3)",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 500,
            transition: "border-color .15s, color .15s",
          }}
        >
          <Plus size={14} /> Add your OR cases for the week
        </button>
      </section>
    );
  }

  const now = new Date();

  return (
    <section style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div
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
          <Calendar size={11} /> This Week
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: "var(--text-3)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: 0,
          }}
        >
          {showAdd ? (
            <>
              <X size={11} /> Cancel
            </>
          ) : (
            <>
              <Plus size={11} /> Add
            </>
          )}
        </button>
      </div>

      {showAdd && (
        <AddForm
          onAdded={() => {
            load();
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => {
          const dt = new Date(item.scheduledAt);
          const isPast = dt < now;
          const isDone = item.status === "done";
          const dayLabel = dt.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const timeLabel = dt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });

          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 12px",
                background: isDone
                  ? "rgba(16,185,129,0.06)"
                  : isPast
                    ? "rgba(245,158,11,0.06)"
                    : "var(--glass-lo)",
                border: `1px solid ${
                  isDone
                    ? "rgba(16,185,129,0.2)"
                    : isPast
                      ? "rgba(245,158,11,0.2)"
                      : "var(--border)"
                }`,
                borderRadius: 8,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.procedureName}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    marginTop: 2,
                    display: "flex",
                    gap: 6,
                  }}
                >
                  <span>{dayLabel}</span>
                  <span style={{ color: "var(--muted)" }}>·</span>
                  <span>{timeLabel}</span>
                  {item.attendingLabel && (
                    <>
                      <span style={{ color: "var(--muted)" }}>·</span>
                      <span>{item.attendingLabel}</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {isDone ? (
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--success)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Done
                  </div>
                ) : isPast ? (
                  <button
                    onClick={() => onDebrief(item)}
                    title="Debrief this case"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      background: "rgba(245,158,11,0.12)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      borderRadius: 6,
                      color: "#fde68a",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <MessageSquare size={10} /> Debrief
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      onBrief(
                        item.procedureName,
                        item.attendingLabel ?? undefined,
                        `${dayLabel} ${timeLabel}`,
                      )
                    }
                    title="Generate pre-op brief"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      background:
                        "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.12))",
                      border: "1px solid rgba(168,85,247,0.3)",
                      borderRadius: 6,
                      color: "#c4b5fd",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <Sparkles size={10} /> Brief
                    <ChevronRight size={10} />
                  </button>
                )}
                {!isDone && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Remove"
                    style={{
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-3)",
                      borderRadius: 4,
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Inline add form -------------------------------------------------

function AddForm({
  onAdded,
  onClose,
}: {
  onAdded: () => void;
  onClose: () => void;
}) {
  const [dictation, setDictation] = useState("");
  const [parsing, setParsing] = useState(false);

  // Manual fields — populated by voice parse or typed directly.
  const [procedureName, setProcedureName] = useState("");
  const [attendingLabel, setAttendingLabel] = useState("");
  const [date, setDate] = useState(
    () => new Date(Date.now() + 86400_000).toISOString().slice(0, 10),
  );
  const [time, setTime] = useState("07:00");
  const [showManual, setShowManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVoiceParse = async () => {
    const trimmed = dictation.trim();
    if (!trimmed || parsing) return;
    setParsing(true);
    setError(null);
    try {
      // Reuse the voice-log parser — it extracts procedure, attending, date.
      const res = await fetch("/api/voice-log", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Parse failed (${res.status})`);
      }
      const json = (await res.json()) as {
        fields: {
          procedureName?: string;
          attendingLabel?: string;
          caseDate?: string;
        };
      };
      const f = json.fields;
      if (f.procedureName) setProcedureName(f.procedureName);
      if (f.attendingLabel) setAttendingLabel(f.attendingLabel);
      if (f.caseDate) {
        const d = new Date(f.caseDate);
        if (!Number.isNaN(d.getTime())) {
          setDate(d.toISOString().slice(0, 10));
          const h = String(d.getHours()).padStart(2, "0");
          const m = String(d.getMinutes()).padStart(2, "0");
          if (h !== "00" || m !== "00") setTime(`${h}:${m}`);
        }
      }
      setShowManual(true);
    } catch (err) {
      console.error("Schedule voice parse failed", err);
      setError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    const name = procedureName.trim();
    if (!name) {
      setError("Procedure name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const res = await fetch("/api/schedule", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          procedureName: name,
          attendingLabel: attendingLabel.trim() || null,
          scheduledAt,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Save failed (${res.status})`);
      }
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--glass-lo)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        marginBottom: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Voice / text input */}
      <VoiceTextarea
        value={dictation}
        onChange={setDictation}
        placeholder='e.g. "lap chole tomorrow 7am with Dr. Chen"'
        disabled={parsing || saving}
        rows={2}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleVoiceParse();
          }
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 10, color: "var(--text-3)" }}>
          ⌘↵ to parse
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleVoiceParse}
            disabled={parsing || !dictation.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              background: parsing
                ? "rgba(168,85,247,0.16)"
                : "linear-gradient(135deg, rgba(168,85,247,0.16), rgba(59,130,246,0.16))",
              border: "1px solid rgba(168,85,247,0.35)",
              borderRadius: 6,
              color: parsing ? "var(--muted)" : "#c4b5fd",
              fontSize: 11,
              fontWeight: 600,
              cursor:
                parsing || !dictation.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: !dictation.trim() && !parsing ? 0.5 : 1,
            }}
          >
            <Sparkles size={11} />
            {parsing ? "Parsing…" : "Parse & fill"}
          </button>
          <button
            onClick={() => setShowManual(!showManual)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 10px",
              background: "var(--glass-mid)",
              border: "1px solid var(--border-glass)",
              borderRadius: 6,
              color: "var(--text-3)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {showManual ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            Manual
          </button>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-3)",
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Manual fields — always shown after voice parse, toggleable otherwise */}
      {showManual && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="Procedure name *"
              style={{
                flex: 2,
                fontSize: 13,
                color: "var(--text)",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "6px 8px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <input
              type="text"
              value={attendingLabel}
              onChange={(e) => setAttendingLabel(e.target.value)}
              placeholder="Attending"
              style={{
                flex: 1,
                fontSize: 13,
                color: "var(--text)",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "6px 8px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                flex: 1,
                fontSize: 13,
                color: "var(--text)",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "6px 8px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{
                width: 100,
                fontSize: 13,
                color: "var(--text)",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "6px 8px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSave}
              disabled={saving || !procedureName.trim()}
              style={{
                padding: "6px 14px",
                background: "rgba(16,185,129,0.14)",
                border: "1px solid rgba(16,185,129,0.35)",
                borderRadius: 6,
                color: "var(--success)",
                fontSize: 12,
                fontWeight: 600,
                cursor:
                  saving || !procedureName.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {saving ? "…" : "Add"}
            </button>
          </div>
        </>
      )}

      {error && (
        <div style={{ fontSize: 11, color: "#fca5a5" }}>{error}</div>
      )}
    </div>
  );
}
