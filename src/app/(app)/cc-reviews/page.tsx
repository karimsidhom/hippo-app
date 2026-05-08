"use client";

// ---------------------------------------------------------------------------
// /cc-reviews — Competence Committee dashboard (program owners only).
//
// Lists every CC review in the program with newest first. Owners can open
// a review to land on the per-resident scrubbing page, or open a new
// review for a resident at an upcoming meeting date.
// ---------------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gavel,
  Loader2,
  Plus,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface Program {
  id: string;
  name: string;
  myRole: "OWNER" | "MEMBER";
}
interface ProgramDetailMember {
  user: { id: string; name: string | null; email: string };
}
interface Resident {
  id: string;
  name: string | null;
  email: string;
  trainingYearLabel?: string | null;
}
interface Review {
  id: string;
  meetingDate: string;
  cycleLabel: string | null;
  status: "IN_PROGRESS" | "FINALISED" | "ARCHIVED";
  decision: string | null;
  resident: { id: string; name: string | null; email: string; image: string | null };
  finalisedBy?: { id: string; name: string | null } | null;
  _count: { notes: number };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const STATUS_STYLES: Record<Review["status"], { label: string; cls: string }> = {
  IN_PROGRESS: {
    label: "In progress",
    cls: "bg-[rgba(245,158,11,0.1)] text-[#fbbf24] border border-[rgba(245,158,11,0.3)]",
  },
  FINALISED: {
    label: "Finalised",
    cls: "bg-[rgba(16,185,129,0.1)] text-[#34d399] border border-[rgba(16,185,129,0.3)]",
  },
  ARCHIVED: {
    label: "Archived",
    cls: "bg-[var(--surface2)] text-[var(--text-3)] border border-[var(--border)]",
  },
};

const DECISION_LABELS: Record<string, string> = {
  PROMOTE: "Promote",
  CONTINUE: "Continue",
  ON_WATCH: "On Watch",
  REMEDIATION: "Remediation",
  PROBATION: "Probation",
  GRADUATE: "Graduate",
  WITHDRAW: "Withdraw",
};

export default function CCReviewsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [formResidentId, setFormResidentId] = useState("");
  const [formMeetingDate, setFormMeetingDate] = useState("");
  const [formCycleLabel, setFormCycleLabel] = useState("");

  // Bootstrap — pull programs the user owns + the most recent reviews.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/programs");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const owned = (json.programs ?? []).filter(
          (p: Program) => p.myRole === "OWNER",
        );
        setPrograms(owned);
        if (owned[0]) setActiveProgramId(owned[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load programs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshReviews = useCallback(async () => {
    if (!activeProgramId) return;
    try {
      const res = await fetch(`/api/cc-reviews?programId=${activeProgramId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setReviews(json.reviews as Review[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reviews");
    }
  }, [activeProgramId]);

  const refreshResidents = useCallback(async () => {
    if (!activeProgramId) return;
    try {
      const res = await fetch(`/api/programs/${activeProgramId}`);
      if (res.ok) {
        const json = await res.json();
        const members = (json.members ?? []) as ProgramDetailMember[];
        setResidents(
          members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
          })),
        );
      }
    } catch {
      /* non-blocking */
    }
  }, [activeProgramId]);

  useEffect(() => {
    refreshReviews();
    refreshResidents();
  }, [refreshReviews, refreshResidents]);

  async function handleCreate() {
    if (!activeProgramId || !formResidentId || !formMeetingDate) {
      setError("Pick a resident and meeting date.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/cc-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: activeProgramId,
          residentId: formResidentId,
          meetingDate: formMeetingDate,
          cycleLabel: formCycleLabel || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      router.push(`/cc-reviews/${json.review.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create review");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, display: "flex", justifyContent: "center", color: "var(--text-3)" }}>
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div style={{ padding: 24, color: "var(--text-2)" }}>
        <h1 style={{ fontSize: 20, color: "var(--text)", margin: "0 0 6px" }}>
          Competence Committee
        </h1>
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          You aren't an owner of a Hippo program yet. CC reviews are
          available to program owners. Set up your program from{" "}
          <Link href="/programs" style={{ color: "var(--primary)" }}>
            /programs
          </Link>{" "}
          to start.
        </p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
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
            <Gavel size={18} color="var(--primary)" />
            Competence Committee
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            Quarterly reviews — open one per resident per CC meeting.
          </div>
        </div>
        <button
          onClick={() => setComposerOpen((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: composerOpen ? "var(--surface)" : "var(--primary)",
            color: composerOpen ? "var(--text-2)" : "#fff",
            border: composerOpen ? "1px solid var(--border)" : "1px solid var(--primary)",
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Plus size={13} />
          {composerOpen ? "Cancel" : "Open new review"}
        </button>
      </div>

      {programs.length > 1 && (
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Program</label>
          <select
            value={activeProgramId ?? ""}
            onChange={(e) => setActiveProgramId(e.target.value)}
            className="st-input"
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {composerOpen && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 18,
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <label style={labelStyle}>Resident</label>
              <select
                value={formResidentId}
                onChange={(e) => setFormResidentId(e.target.value)}
                className="st-input"
              >
                <option value="">— Select a resident —</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name ?? r.email}{" "}
                    {r.trainingYearLabel ? `· ${r.trainingYearLabel}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Meeting date</label>
                <input
                  type="date"
                  value={formMeetingDate}
                  onChange={(e) => setFormMeetingDate(e.target.value)}
                  className="st-input"
                />
              </div>
              <div>
                <label style={labelStyle}>Cycle label (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 2026 / Mid-PGY3"
                  value={formCycleLabel}
                  onChange={(e) => setFormCycleLabel(e.target.value)}
                  className="st-input"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
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
                cursor: creating ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: creating ? 0.6 : 1,
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: "0 4px 24px -4px rgba(14,165,233,0.35)",
              }}
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : null}
              {creating ? "Creating…" : "Open review"}
            </button>
          </div>
        </div>
      )}

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
        </div>
      )}

      {reviews.length === 0 ? (
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
          <ShieldCheck size={20} color="var(--text-3)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            No CC reviews yet
          </div>
          <div>Open a review for any resident at the top of the page.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {reviews.map((r) => {
            const status = STATUS_STYLES[r.status];
            return (
              <Link
                key={r.id}
                href={`/cc-reviews/${r.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: 14,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  textDecoration: "none",
                  color: "var(--text)",
                  transition: "all .15s",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text)",
                      letterSpacing: "-0.2px",
                      marginBottom: 2,
                    }}
                  >
                    {r.resident.name ?? r.resident.email}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {r.cycleLabel ? `${r.cycleLabel} · ` : ""}
                    {fmtDate(r.meetingDate)} · {r._count.notes} notes
                    {r.decision ? ` · ${DECISION_LABELS[r.decision] ?? r.decision}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className={status.cls}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      borderRadius: 99,
                      padding: "3px 8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {status.label}
                  </span>
                  <ArrowRight size={14} color="var(--text-3)" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 500,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};
