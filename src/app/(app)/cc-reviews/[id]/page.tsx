"use client";

// ---------------------------------------------------------------------------
// /cc-reviews/[id] — single-resident scrubbing dashboard.
//
// What the CC member sees:
//   • Resident snapshot at meeting time (cases / EPA totals / signed-pct)
//   • Recent signed observations
//   • A multi-author note thread (every CC member can add notes; only
//     the original author can delete their own)
//   • Decision picker + chair summary; finalising locks the review
// ---------------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Lock,
  MessageSquarePlus,
  Trash2,
  AlertTriangle,
  Gavel,
} from "lucide-react";

interface Snapshot {
  capturedAt?: string;
  caseCount?: number;
  epaTotal?: number;
  epaSigned?: number;
  epaPending?: number;
  epaCompletionPct?: number;
  recentSignedObservations?: Array<{
    id: string;
    epaId: string;
    epaTitle: string;
    achievement: string;
    entrustmentScore: number | null;
    signedAt: string | null;
    assessorName: string;
  }>;
}

interface Note {
  id: string;
  body: string;
  category: string | null;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
}

type Decision =
  | "PROMOTE"
  | "CONTINUE"
  | "ON_WATCH"
  | "REMEDIATION"
  | "PROBATION"
  | "GRADUATE"
  | "WITHDRAW";

interface Review {
  id: string;
  programId: string;
  meetingDate: string;
  cycleLabel: string | null;
  status: "IN_PROGRESS" | "FINALISED" | "ARCHIVED";
  decision: Decision | null;
  decisionRationale: string | null;
  chairSummary: string | null;
  dissent: string | null;
  finalisedAt: string | null;
  resident: { id: string; name: string | null; email: string; image: string | null };
  finalisedBy?: { id: string; name: string | null } | null;
  createdBy: { id: string; name: string | null };
  snapshot: Snapshot | null;
  notes: Note[];
}

const DECISION_OPTIONS: { value: Decision; label: string; tone: string }[] = [
  { value: "PROMOTE", label: "Promote", tone: "#34d399" },
  { value: "CONTINUE", label: "Continue", tone: "#0ea5e9" },
  { value: "ON_WATCH", label: "On Watch", tone: "#fbbf24" },
  { value: "REMEDIATION", label: "Remediation", tone: "#f97316" },
  { value: "PROBATION", label: "Probation", tone: "#ef4444" },
  { value: "GRADUATE", label: "Graduate", tone: "#a78bfa" },
  { value: "WITHDRAW", label: "Withdraw", tone: "#94a3b8" },
];

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function CCReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingPatch, setSavingPatch] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/cc-reviews/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setReview(json.review as Review);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load review");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function patchReview(data: Partial<Review> & { status?: Review["status"] }) {
    if (!review) return;
    setSavingPatch(true);
    setError(null);
    try {
      const res = await fetch(`/api/cc-reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingPatch(false);
    }
  }

  async function addNote() {
    if (!noteDraft.trim()) return;
    setSavingNote(true);
    setError(null);
    try {
      const res = await fetch(`/api/cc-reviews/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteDraft.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setNoteDraft("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save note");
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteNote(noteId: string) {
    if (!confirm("Remove this note?")) return;
    try {
      const res = await fetch(
        `/api/cc-reviews/${id}/notes?noteId=${noteId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove note");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, display: "flex", justifyContent: "center", color: "var(--text-3)" }}>
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  if (!review) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "var(--text-2)", fontSize: 13 }}>{error ?? "Review not found"}</p>
        <Link href="/cc-reviews" style={{ color: "var(--primary)", fontSize: 13 }}>
          ← Back to reviews
        </Link>
      </div>
    );
  }

  const locked = review.status === "FINALISED" || review.status === "ARCHIVED";
  const snap = review.snapshot ?? {};

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      {/* Top bar */}
      <button
        onClick={() => router.push("/cc-reviews")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: "var(--text-3)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginBottom: 14,
          fontFamily: "inherit",
        }}
      >
        <ArrowLeft size={12} />
        Back to reviews
      </button>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            {review.cycleLabel ?? "CC Review"} · {fmtDate(review.meetingDate)}
          </div>
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
            <Gavel size={18} color="var(--primary)" />
            {review.resident.name ?? review.resident.email}
          </h1>
        </div>
        {locked ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 99,
              background: "rgba(16,185,129,0.1)",
              color: "#34d399",
              border: "1px solid rgba(16,185,129,0.3)",
            }}
          >
            <Lock size={12} />
            Finalised
          </span>
        ) : (
          <button
            onClick={() => patchReview({ status: "FINALISED" })}
            disabled={savingPatch || !review.decision}
            title={
              !review.decision
                ? "Pick a decision before finalising"
                : "Finalise this review"
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              background: review.decision
                ? "linear-gradient(135deg, var(--primary-hi), var(--primary-lo))"
                : "var(--surface)",
              color: review.decision ? "#fff" : "var(--text-3)",
              border: review.decision ? "none" : "1px solid var(--border)",
              borderRadius: 10,
              cursor: !review.decision || savingPatch ? "not-allowed" : "pointer",
              opacity: !review.decision || savingPatch ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            <CheckCircle2 size={13} />
            Finalise
          </button>
        )}
      </div>

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
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>{error}</div>
        </div>
      )}

      {/* Snapshot strip */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 10,
          }}
        >
          Snapshot at meeting time
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 10,
          }}
        >
          <SnapshotCell label="Cases" value={snap.caseCount ?? 0} />
          <SnapshotCell
            label="EPA completion"
            value={`${snap.epaCompletionPct ?? 0}%`}
          />
          <SnapshotCell label="Signed" value={snap.epaSigned ?? 0} />
          <SnapshotCell label="Pending" value={snap.epaPending ?? 0} />
          <SnapshotCell label="Total EPAs" value={snap.epaTotal ?? 0} />
        </div>
        {snap.recentSignedObservations && snap.recentSignedObservations.length > 0 && (
          <>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "14px 0 6px",
              }}
            >
              Recent signed observations
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
              {snap.recentSignedObservations.map((o) => (
                <li
                  key={o.id}
                  style={{
                    fontSize: 12,
                    color: "var(--text-2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <strong style={{ color: "var(--text)" }}>{o.epaId}</strong>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o.epaTitle}
                  </span>
                  {typeof o.entrustmentScore === "number" && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        fontFamily: "'Geist Mono', monospace",
                      }}
                    >
                      {o.entrustmentScore}/5
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                    {o.assessorName}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Decision picker */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 10,
          }}
        >
          Committee decision
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {DECISION_OPTIONS.map((d) => {
            const active = review.decision === d.value;
            return (
              <button
                key={d.value}
                onClick={() => !locked && patchReview({ decision: d.value })}
                disabled={locked || savingPatch}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 99,
                  border: `1px solid ${active ? d.tone : "var(--border)"}`,
                  background: active ? `${d.tone}22` : "var(--surface2)",
                  color: active ? d.tone : "var(--text-3)",
                  cursor: locked ? "not-allowed" : "pointer",
                  opacity: locked && !active ? 0.5 : 1,
                  fontFamily: "inherit",
                }}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={review.chairSummary ?? ""}
          onChange={(e) => setReview({ ...review, chairSummary: e.target.value })}
          onBlur={(e) => !locked && patchReview({ chairSummary: e.target.value })}
          disabled={locked}
          placeholder="Chair summary — written before finalising. Visible to the resident after finalisation."
          rows={3}
          className="st-input"
          style={{ resize: "vertical", marginBottom: 8 }}
        />
        <textarea
          value={review.dissent ?? ""}
          onChange={(e) => setReview({ ...review, dissent: e.target.value })}
          onBlur={(e) => !locked && patchReview({ dissent: e.target.value })}
          disabled={locked}
          placeholder="Dissent (optional) — names + reasons of any committee members who disagreed."
          rows={2}
          className="st-input"
          style={{ resize: "vertical" }}
        />
      </section>

      {/* Notes thread */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 10,
          }}
        >
          Committee notes ({review.notes.length})
        </div>

        <div style={{ display: "grid", gap: 10, marginBottom: locked ? 0 : 14 }}>
          {review.notes.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>
              No notes yet. Members of this program can add notes here during the meeting.
            </p>
          ) : (
            review.notes.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "10px 12px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {n.author.name ?? "Member"}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                    {fmtDateTime(n.createdAt)}
                  </span>
                  <button
                    onClick={() => deleteNote(n.id)}
                    aria-label="Delete note"
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      color: "var(--text-3)",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-2)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.5,
                  }}
                >
                  {n.body}
                </div>
              </div>
            ))
          )}
        </div>

        {!locked && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add a note for the committee…"
              rows={2}
              className="st-input"
              style={{ resize: "vertical", flex: 1 }}
            />
            <button
              onClick={addNote}
              disabled={!noteDraft.trim() || savingNote}
              className="press-soft"
              style={{
                padding: "9px 14px",
                fontSize: 12,
                fontWeight: 600,
                background: "var(--primary)",
                color: "#fff",
                border: "1px solid var(--primary)",
                borderRadius: 10,
                cursor: !noteDraft.trim() ? "not-allowed" : "pointer",
                opacity: !noteDraft.trim() || savingNote ? 0.6 : 1,
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {savingNote ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <MessageSquarePlus size={12} />
              )}
              Add
            </button>
          </div>
        )}
      </section>

      {locked && review.finalisedAt && (
        <p
          style={{
            fontSize: 11,
            color: "var(--text-3)",
            marginTop: 14,
            textAlign: "center",
          }}
        >
          <ClipboardCheck size={11} style={{ display: "inline-block", marginRight: 4 }} />
          Finalised by {review.finalisedBy?.name ?? "the chair"} on{" "}
          {fmtDateTime(review.finalisedAt)}
        </p>
      )}
    </div>
  );
}

function SnapshotCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "8px 10px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text)",
          fontFamily: "'Geist Mono', monospace",
        }}
      >
        {value}
      </div>
    </div>
  );
}
