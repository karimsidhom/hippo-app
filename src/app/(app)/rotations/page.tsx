"use client";

// ---------------------------------------------------------------------------
// /rotations — block scheduling page (resident view).
//
// Shows the resident's own rotation timeline as a vertical card stack. Each
// card carries the rotation name, the block date range, and the cases /
// EPAs the resident accumulated during that block. Tappable cards filter
// the user's case log to that block on the cases page.
//
// Adding a new assignment is a single inline form at the top — pick the
// rotation (from the list of rotations programs they're a member of has
// defined), pick start + end dates, save. The server immediately
// re-attributes any existing CaseLog / EpaObservation rows so historical
// data folds in cleanly.
// ---------------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Layers,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface Rotation {
  id: string;
  programId: string;
  name: string;
  shortName: string | null;
  specialty: string | null;
  category: string;
  colour: string | null;
}

interface Assignment {
  id: string;
  rotationId: string;
  rotationName: string;
  rotationColour: string | null;
  shortName: string | null;
  blockLabel: string | null;
  startDate: string;
  endDate: string;
  caseCount: number;
  observationCount: number;
  notes: string | null;
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const blockSpan = (a: Assignment): string => {
  const ms = new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
  const days = Math.max(1, Math.round(ms / 86_400_000));
  if (days < 14) return `${days} days`;
  return `${Math.round(days / 7)} weeks`;
};

const today = () => new Date();

const isActive = (a: Assignment) => {
  const now = today();
  return new Date(a.startDate) <= now && new Date(a.endDate) >= now;
};

export default function RotationsPage() {
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── New-assignment form state ─────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [formRotation, setFormRotation] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formBlockLabel, setFormBlockLabel] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/rotations");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRotations(json.rotations as Rotation[]);
      setAssignments(json.assignments as Assignment[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rotations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAdd() {
    if (!formRotation || !formStart || !formEnd) {
      setError("Pick a rotation, start, and end date.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/rotations/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rotationId: formRotation,
          startDate: formStart,
          endDate: formEnd,
          blockLabel: formBlockLabel || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setFormRotation("");
      setFormStart("");
      setFormEnd("");
      setFormBlockLabel("");
      setFormOpen(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add assignment");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this rotation assignment? Cases and EPAs from this block will stay logged but will no longer be attributed to it.")) {
      return;
    }
    try {
      const res = await fetch(`/api/rotations/assignments?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove assignment");
    }
  }

  const sorted = [...assignments].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  const active = sorted.filter(isActive);
  const upcoming = sorted.filter((a) => new Date(a.startDate) > today());
  const past = sorted.filter((a) => new Date(a.endDate) < today());

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.4px",
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Layers size={18} color="var(--primary)" />
            Rotations
          </h1>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-3)",
              marginTop: 2,
            }}
          >
            Block scheduling — every case + EPA attributes to the rotation that was active on its date.
          </div>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: formOpen ? "var(--surface)" : "var(--primary)",
            color: formOpen ? "var(--text-2)" : "#fff",
            border: formOpen ? "1px solid var(--border)" : "1px solid var(--primary)",
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all .15s",
          }}
        >
          <Plus size={13} />
          {formOpen ? "Cancel" : "Add assignment"}
        </button>
      </div>

      {/* ── Add assignment form ───────────────────────────────────────── */}
      {formOpen && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 18,
          }}
        >
          {rotations.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
              No rotations have been defined yet. Ask your program coordinator
              (or whoever set up your program in Hippo) to add the rotations
              your residency uses, then come back here to assign yourself to
              a block.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <label style={labelStyle}>Rotation</label>
                <select
                  value={formRotation}
                  onChange={(e) => setFormRotation(e.target.value)}
                  className="st-input"
                >
                  <option value="">— Select a rotation —</option>
                  {rotations.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.shortName ? `(${r.shortName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Start date</label>
                  <input
                    type="date"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="st-input"
                  />
                </div>
                <div>
                  <label style={labelStyle}>End date</label>
                  <input
                    type="date"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="st-input"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Block label (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Block 7 / PGY-3 Q2"
                  value={formBlockLabel}
                  onChange={(e) => setFormBlockLabel(e.target.value)}
                  className="st-input"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="press-soft"
                style={{
                  marginTop: 4,
                  background: "linear-gradient(135deg, var(--primary-hi), var(--primary-lo))",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: adding ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: adding ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  width: "100%",
                  boxShadow: "0 4px 24px -4px rgba(14,165,233,0.35)",
                }}
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : null}
                {adding ? "Saving…" : "Save assignment"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Error banner ──────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: "10px 14px",
            marginBottom: 14,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10,
            fontSize: 13,
            color: "#fca5a5",
            lineHeight: 1.5,
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>{error}</div>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: "none",
              color: "rgba(252,165,165,0.7)",
              fontSize: 16,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Loading / empty state ─────────────────────────────────────── */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 60,
            color: "var(--text-3)",
          }}
        >
          <Loader2 size={16} className="animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div
          style={{
            padding: 28,
            textAlign: "center",
            background: "var(--surface)",
            border: "1px dashed var(--border-mid)",
            borderRadius: 12,
            fontSize: 13,
            color: "var(--text-2)",
            lineHeight: 1.6,
          }}
        >
          <CalendarDays size={20} color="var(--text-3)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            No rotation assignments yet.
          </div>
          <div>
            Add your current block above so every case and EPA you log
            attributes to the right rotation.
          </div>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <Section title="Active block">
              {active.map((a) => (
                <AssignmentCard key={a.id} a={a} active onDelete={handleDelete} />
              ))}
            </Section>
          )}
          {upcoming.length > 0 && (
            <Section title="Upcoming">
              {upcoming.map((a) => (
                <AssignmentCard key={a.id} a={a} onDelete={handleDelete} />
              ))}
            </Section>
          )}
          {past.length > 0 && (
            <Section title="Past blocks">
              {past.map((a) => (
                <AssignmentCard key={a.id} a={a} past onDelete={handleDelete} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 500,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gap: 10 }}>{children}</div>
    </section>
  );
}

function AssignmentCard({
  a,
  active,
  past,
  onDelete,
}: {
  a: Assignment;
  active?: boolean;
  past?: boolean;
  onDelete: (id: string) => void;
}) {
  const colour = a.rotationColour ?? "var(--primary)";

  return (
    <div
      style={{
        position: "relative",
        background: active ? "rgba(14,165,233,0.04)" : "var(--surface)",
        border: `1px solid ${active ? "rgba(14,165,233,0.3)" : "var(--border)"}`,
        borderRadius: 12,
        padding: 14,
        opacity: past ? 0.85 : 1,
        transition: "all .15s",
      }}
    >
      {/* Colour band on the left edge */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: -1,
          top: 8,
          bottom: 8,
          width: 3,
          borderRadius: 4,
          background: colour,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
          paddingLeft: 4,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 3,
              letterSpacing: "-0.2px",
            }}
          >
            {a.rotationName}
            {a.blockLabel && (
              <span
                style={{
                  marginLeft: 6,
                  padding: "2px 7px",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--text-2)",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 99,
                }}
              >
                {a.blockLabel}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>
            {fmtDate(a.startDate)} → {fmtDate(a.endDate)} · {blockSpan(a)}
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-2)" }}>
            <span>
              <strong style={{ color: "var(--text)" }}>{a.caseCount}</strong>{" "}
              {a.caseCount === 1 ? "case" : "cases"}
            </span>
            <span>
              <strong style={{ color: "var(--text)" }}>{a.observationCount}</strong>{" "}
              EPA{a.observationCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <Link
            href={`/cases?rotationAssignment=${a.id}`}
            aria-label="View cases on this block"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--text-2)",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              textDecoration: "none",
              gap: 4,
            }}
          >
            View
            <ArrowRight size={11} />
          </Link>
          <button
            onClick={() => onDelete(a.id)}
            aria-label="Remove assignment"
            style={{
              padding: "5px 8px",
              fontSize: 11,
              color: "var(--text-3)",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
