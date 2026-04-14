"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, Inbox, Stethoscope, Clock } from "lucide-react";

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

  async function act(id: string, action: "sign" | "return", reason?: string) {
    setSubmitting(id);
    try {
      const res = await fetch(`/api/attending/observations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "return" ? { returnedReason: reason ?? "" } : {}),
        }),
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
                    onSign={() => act(obs.id, "sign")}
                    onReturnRequest={() => { setReturnReasonFor(obs.id); setReturnReason(""); }}
                    returnOpen={returnReasonFor === obs.id}
                    returnReason={returnReason}
                    onReturnReasonChange={setReturnReason}
                    onReturnSubmit={() => act(obs.id, "return", returnReason)}
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

interface CardProps {
  obs: Observation;
  isExpanded: boolean;
  onToggle: () => void;
  isSubmitting: boolean;
  onSign: () => void;
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
          <div style={{ paddingTop: 14, display: "grid", gap: 12, fontSize: 13 }}>
            {obs.caseLog && (
              <Row label="Case">
                {obs.caseLog.procedureName} · {obs.caseLog.surgicalApproach}
                {" · "}{formatDate(obs.caseLog.caseDate)}
              </Row>
            )}
            {obs.setting && <Row label="Setting">{obs.setting}</Row>}
            {obs.complexity && <Row label="Complexity">{obs.complexity}</Row>}
            {obs.observationNotes && (
              <Row label="Notes">
                <span style={{ whiteSpace: "pre-wrap" }}>{obs.observationNotes}</span>
              </Row>
            )}
            {obs.strengthsNotes && (
              <Row label="Strengths (resident)">
                <span style={{ whiteSpace: "pre-wrap" }}>{obs.strengthsNotes}</span>
              </Row>
            )}
            {obs.improvementNotes && (
              <Row label="For improvement">
                <span style={{ whiteSpace: "pre-wrap" }}>{obs.improvementNotes}</span>
              </Row>
            )}
            {(obs.safetyConcern || obs.professionalismConcern) && (
              <Row label="Flagged">
                <span style={{ color: "#f59e0b" }}>
                  {[obs.safetyConcern && "safety", obs.professionalismConcern && "professionalism"]
                    .filter(Boolean).join(", ")}
                  {obs.concernDetails ? ` — ${obs.concernDetails}` : ""}
                </span>
              </Row>
            )}
          </div>

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
              <button onClick={onSign} style={BTN_PRIMARY} disabled={isSubmitting}>
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
