"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, Inbox, Stethoscope, Clock, AlertTriangle } from "lucide-react";

const ENTRUSTMENT_LABELS: Record<number, string> = {
  1: "Had to do",
  2: "Talk through",
  3: "Prompted",
  4: "Just in case",
  5: "Independent",
};
const ENTRUSTMENT_COLORS: Record<number, string> = {
  1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#22c55e", 5: "#10b981",
};

interface LinkedCase {
  id: string;
  procedureName: string;
  caseDate: string;
  surgicalApproach: string;
  notes?: string | null;
  reflection?: string | null;
}
interface Resident {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}
interface Observation {
  id: string;
  epaId: string;
  epaTitle: string;
  observationDate: string;
  setting: string | null;
  complexity: string | null;
  entrustmentScore: number | null;
  achievement: string;
  observationNotes: string | null;
  strengthsNotes: string | null;
  improvementNotes: string | null;
  safetyConcern: boolean;
  professionalismConcern: boolean;
  concernDetails: string | null;
  status: string;
  signedByName: string | null;
  signedAt: string | null;
  returnedReason: string | null;
  user: Resident;
  caseLog: LinkedCase | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function InboxPage() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Observation[]>([]);
  const [recent, setRecent] = useState<Observation[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [returnReasonFor, setReturnReasonFor] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attending/inbox");
      const data = await res.json();
      setPending(data.pending ?? []);
      setRecent(data.recent ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(
    id: string,
    action: "sign" | "return",
    payload?: {
      reason?: string;
      entrustmentScore?: number;
      achievement?: "NOT_ACHIEVED" | "ACHIEVED";
      strengthsNotes?: string;
      improvementNotes?: string;
      safetyConcern?: boolean;
      professionalismConcern?: boolean;
      concernDetails?: string;
    },
  ) {
    setSubmitting(id);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "return") {
        body.returnedReason = payload?.reason ?? "";
      } else if (payload) {
        if (payload.entrustmentScore !== undefined) body.entrustmentScore = payload.entrustmentScore;
        if (payload.achievement !== undefined) body.achievement = payload.achievement;
        if (payload.strengthsNotes) body.strengthsNotes = payload.strengthsNotes;
        if (payload.improvementNotes) body.improvementNotes = payload.improvementNotes;
        if (payload.safetyConcern !== undefined) body.safetyConcern = payload.safetyConcern;
        if (payload.professionalismConcern !== undefined) body.professionalismConcern = payload.professionalismConcern;
        if (payload.concernDetails) body.concernDetails = payload.concernDetails;
      }
      const res = await fetch(`/api/attending/observations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      setExpanded(null);
      setReturnReasonFor(null);
      setReturnReason("");
      await load();
    } catch (err) {
      alert("Action failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <Inbox size={20} style={{ color: "var(--text)" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-.3px" }}>Sign-Offs</h1>
        {pending.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px",
            background: "var(--primary, #3b82f6)", color: "#fff", borderRadius: 99,
          }}>
            {pending.length} pending
          </span>
        )}
      </div>

      <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 24 }}>
        EPAs your residents have sent to you for sign-off. Open any one to review the
        resident&apos;s self-assessment, adjust the entrustment score if needed, and sign.
      </p>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>Loading…</div>
      ) : pending.length === 0 && recent.length === 0 ? (
        <div style={{
          padding: 60, textAlign: "center",
          border: "1px dashed var(--border-mid)",
          borderRadius: 10, color: "var(--text-3)",
        }}>
          <Inbox size={28} style={{ opacity: .4, marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)", marginBottom: 4 }}>
            Nothing waiting for you
          </div>
          <div style={{ fontSize: 12 }}>
            When a resident sends you an EPA for sign-off, it appears here.
          </div>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "1px", color: "var(--text-3)", marginBottom: 12,
              }}>
                Pending ({pending.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pending.map(obs => (
                  <ObservationCard
                    key={obs.id}
                    obs={obs}
                    isExpanded={expanded === obs.id}
                    onToggle={() => setExpanded(expanded === obs.id ? null : obs.id)}
                    isSubmitting={submitting === obs.id}
                    onSign={(payload) => act(obs.id, "sign", payload)}
                    onReturnRequest={() => { setReturnReasonFor(obs.id); setReturnReason(""); }}
                    returnOpen={returnReasonFor === obs.id}
                    returnReason={returnReason}
                    onReturnReasonChange={setReturnReason}
                    onReturnSubmit={() => act(obs.id, "return", { reason: returnReason })}
                    onReturnCancel={() => { setReturnReasonFor(null); setReturnReason(""); }}
                  />
                ))}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section>
              <div style={{
                fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "1px", color: "var(--text-3)", marginBottom: 12,
              }}>
                Recently signed
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {recent.map(obs => (
                  <div key={obs.id} style={{
                    padding: "10px 14px",
                    background: "var(--bg-1)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between",
                    fontSize: 13,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3,
                        fontFamily: "'Geist Mono', monospace",
                        background: obs.status === "SIGNED" ? "rgba(34,197,94,.15)" : "rgba(245,158,11,.15)",
                        color: obs.status === "SIGNED" ? "#22c55e" : "#f59e0b",
                      }}>
                        {obs.status === "SIGNED" ? "Signed" : "Returned"}
                      </span>
                      <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{obs.epaId}</span>
                      <span style={{ color: "var(--text-3)" }}>·</span>
                      <span style={{ color: "var(--text-2)", minWidth: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {obs.user.name || obs.user.email}
                      </span>
                    </div>
                    <span style={{ color: "var(--text-3)", fontSize: 11, flexShrink: 0 }}>
                      {formatDate(obs.signedAt || obs.observationDate)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

interface SignPayload {
  entrustmentScore?: number;
  achievement?: "NOT_ACHIEVED" | "ACHIEVED";
  strengthsNotes?: string;
  improvementNotes?: string;
  safetyConcern?: boolean;
  professionalismConcern?: boolean;
  concernDetails?: string;
}

interface CardProps {
  obs: Observation;
  isExpanded: boolean;
  onToggle: () => void;
  isSubmitting: boolean;
  onSign: (payload: SignPayload) => void;
  onReturnRequest: () => void;
  returnOpen: boolean;
  returnReason: string;
  onReturnReasonChange: (v: string) => void;
  onReturnSubmit: () => void;
  onReturnCancel: () => void;
}

function ObservationCard({
  obs, isExpanded, onToggle, isSubmitting,
  onSign, onReturnRequest, returnOpen, returnReason,
  onReturnReasonChange, onReturnSubmit, onReturnCancel,
}: CardProps) {
  // Attending's editable grading — defaults to resident's self-assessment.
  const [score, setScore] = useState<number | null>(obs.entrustmentScore ?? null);
  const [achievement, setAchievement] = useState<"NOT_ACHIEVED" | "ACHIEVED">(
    (obs.achievement as "NOT_ACHIEVED" | "ACHIEVED") ?? "ACHIEVED",
  );
  const [strengths, setStrengths] = useState(obs.strengthsNotes ?? "");
  const [improvements, setImprovements] = useState(obs.improvementNotes ?? "");
  const [safety, setSafety] = useState(obs.safetyConcern);
  const [professionalism, setProfessionalism] = useState(obs.professionalismConcern);
  const [concernDetails, setConcernDetails] = useState(obs.concernDetails ?? "");

  const handleSign = () => {
    onSign({
      entrustmentScore: score ?? undefined,
      achievement,
      strengthsNotes: strengths.trim() || undefined,
      improvementNotes: improvements.trim() || undefined,
      safetyConcern: safety,
      professionalismConcern: professionalism,
      concernDetails: (safety || professionalism) && concernDetails.trim()
        ? concernDetails.trim() : undefined,
    });
  };

  return (
    <div style={{
      background: "var(--bg-1)",
      border: "1px solid var(--border-mid)",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", padding: "14px 16px",
          background: "none", border: "none",
          textAlign: "left", cursor: "pointer",
          color: "var(--text)", fontFamily: "inherit",
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "rgba(59,130,246,.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#3b82f6", flexShrink: 0,
        }}>
          <Stethoscope size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 3,
              background: "rgba(14,165,233,.12)", color: "#0ea5e9",
              fontFamily: "'Geist Mono', monospace",
            }}>
              {obs.epaId}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {obs.epaTitle}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            {obs.user.name || obs.user.email}
            {obs.caseLog ? ` · ${obs.caseLog.procedureName}` : ""}
            {" · "}
            <Clock size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />
            {formatDate(obs.observationDate)}
          </div>
        </div>
        {obs.entrustmentScore && (
          <div style={{
            fontSize: 11, color: "var(--text-3)",
            fontFamily: "'Geist Mono', monospace", flexShrink: 0,
          }}>
            Self: {obs.entrustmentScore}/5
          </div>
        )}
      </button>

      {isExpanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border)" }}>
          {/* ── Resident's submission (read-only) ─────────────────────── */}
          <div style={{ paddingTop: 14 }}>
            <SectionHeader>Resident's submission</SectionHeader>
            <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
              {obs.caseLog && (
                <Row label="Case">
                  {obs.caseLog.procedureName} · {obs.caseLog.surgicalApproach}
                  {" · "}{formatDate(obs.caseLog.caseDate)}
                </Row>
              )}
              {obs.setting && <Row label="Setting">{obs.setting}</Row>}
              {obs.complexity && <Row label="Complexity">{obs.complexity}</Row>}
              {obs.entrustmentScore && (
                <Row label="Self-assessment">
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: ENTRUSTMENT_COLORS[obs.entrustmentScore],
                    background: `${ENTRUSTMENT_COLORS[obs.entrustmentScore]}15`,
                    padding: "2px 8px", borderRadius: 4,
                    fontFamily: "'Geist Mono', monospace",
                  }}>
                    O-{obs.entrustmentScore} · {ENTRUSTMENT_LABELS[obs.entrustmentScore]}
                  </span>
                </Row>
              )}
              {obs.observationNotes && (
                <Row label="Notes">
                  <span style={{ whiteSpace: "pre-wrap" }}>{obs.observationNotes}</span>
                </Row>
              )}
            </div>
          </div>

          {/* ── Attending's assessment (editable) ─────────────────────── */}
          {!returnOpen && (
            <div style={{ marginTop: 18 }}>
              <SectionHeader>Your assessment</SectionHeader>

              {/* O-score selector */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel>Entrustment score (O-score)</FieldLabel>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const selected = score === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setScore(n)}
                        style={{
                          flex: 1, minWidth: 84,
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: selected
                            ? `1px solid ${ENTRUSTMENT_COLORS[n]}`
                            : "1px solid var(--border-mid)",
                          background: selected
                            ? `${ENTRUSTMENT_COLORS[n]}20`
                            : "var(--surface2)",
                          color: selected ? ENTRUSTMENT_COLORS[n] : "var(--text-2)",
                          fontSize: 11, fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{n}</span>
                        <span style={{ fontSize: 10, opacity: .85 }}>{ENTRUSTMENT_LABELS[n]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Achievement */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel>Achievement</FieldLabel>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["ACHIEVED", "NOT_ACHIEVED"] as const).map(val => {
                    const selected = achievement === val;
                    const color = val === "ACHIEVED" ? "#10b981" : "#94a3b8";
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAchievement(val)}
                        style={{
                          flex: 1,
                          padding: "8px 12px", borderRadius: 6,
                          border: selected ? `1px solid ${color}` : "1px solid var(--border-mid)",
                          background: selected ? `${color}20` : "var(--surface2)",
                          color: selected ? color : "var(--text-2)",
                          fontSize: 12, fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        {val === "ACHIEVED" ? "Achieved" : "Not yet"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Strengths */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel>Strengths <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span></FieldLabel>
                <textarea
                  value={strengths}
                  onChange={e => setStrengths(e.target.value)}
                  rows={2}
                  placeholder="What did the resident do well?"
                  style={TEXTAREA_STYLE}
                />
              </div>

              {/* Improvements */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel>For improvement <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span></FieldLabel>
                <textarea
                  value={improvements}
                  onChange={e => setImprovements(e.target.value)}
                  rows={2}
                  placeholder="What could be better next time?"
                  style={TEXTAREA_STYLE}
                />
              </div>

              {/* Concerns */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel>Flag a concern <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span></FieldLabel>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <label style={CHECKBOX_LABEL}>
                    <input type="checkbox" checked={safety} onChange={e => setSafety(e.target.checked)} />
                    <AlertTriangle size={12} style={{ color: "#f59e0b" }} />
                    Patient safety
                  </label>
                  <label style={CHECKBOX_LABEL}>
                    <input type="checkbox" checked={professionalism} onChange={e => setProfessionalism(e.target.checked)} />
                    <AlertTriangle size={12} style={{ color: "#f59e0b" }} />
                    Professionalism
                  </label>
                </div>
                {(safety || professionalism) && (
                  <textarea
                    value={concernDetails}
                    onChange={e => setConcernDetails(e.target.value)}
                    rows={2}
                    placeholder="Please describe the concern (required when flagging)."
                    style={TEXTAREA_STYLE}
                  />
                )}
              </div>
            </div>
          )}

          {returnOpen ? (
            <div style={{ marginTop: 14 }}>
              <textarea
                placeholder="Why are you returning this? (shared with the resident)"
                value={returnReason}
                onChange={e => onReturnReasonChange(e.target.value)}
                rows={3}
                style={{
                  width: "100%", padding: "8px 10px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border-mid)",
                  borderRadius: 6, color: "var(--text)",
                  fontSize: 13, fontFamily: "inherit", resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                <button onClick={onReturnCancel} style={BTN_SECONDARY}>Cancel</button>
                <button
                  disabled={!returnReason.trim() || isSubmitting}
                  onClick={onReturnSubmit}
                  style={{
                    ...BTN_PRIMARY,
                    background: "#f59e0b",
                    opacity: !returnReason.trim() || isSubmitting ? .6 : 1,
                  }}
                >
                  {isSubmitting ? "Returning…" : "Send back to resident"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
              <button onClick={onReturnRequest} style={BTN_SECONDARY} disabled={isSubmitting}>
                <RotateCcw size={13} /> Return
              </button>
              <button
                onClick={handleSign}
                style={{
                  ...BTN_PRIMARY,
                  opacity: (!score || ((safety || professionalism) && !concernDetails.trim()) || isSubmitting) ? .6 : 1,
                }}
                disabled={!score || ((safety || professionalism) && !concernDetails.trim()) || isSubmitting}
                title={!score ? "Select an entrustment score to sign" : undefined}
              >
                <CheckCircle2 size={14} />
                {isSubmitting ? "Signing…" : "Sign off"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10, alignItems: "start" }}>
      <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", paddingTop: 2 }}>{label}</span>
      <span style={{ color: "var(--text-2)", lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "1px", color: "var(--text-3)", marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: "var(--text-2)", marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

const TEXTAREA_STYLE: React.CSSProperties = {
  width: "100%", padding: "8px 10px",
  background: "var(--surface2)",
  border: "1px solid var(--border-mid)",
  borderRadius: 6, color: "var(--text)",
  fontSize: 13, fontFamily: "inherit", resize: "vertical",
};

const CHECKBOX_LABEL: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "6px 10px",
  background: "var(--surface2)",
  border: "1px solid var(--border-mid)",
  borderRadius: 6,
  fontSize: 12, color: "var(--text-2)", cursor: "pointer",
};

const BTN_PRIMARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px",
  background: "var(--primary, #3b82f6)",
  color: "#fff", border: "none", borderRadius: 6,
  fontSize: 13, fontWeight: 600, cursor: "pointer",
  fontFamily: "inherit",
};
const BTN_SECONDARY: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px",
  background: "var(--surface2)",
  color: "var(--text-2)",
  border: "1px solid var(--border-mid)",
  borderRadius: 6,
  fontSize: 13, fontWeight: 500, cursor: "pointer",
  fontFamily: "inherit",
};
