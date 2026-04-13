"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { HippoMark } from "@/components/HippoMark";
import { Check, RotateCcw, AlertTriangle, Shield } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Observation {
  id: string;
  epaId: string;
  epaTitle: string;
  specialtySlug: string;
  trainingSystem: string;
  observationDate: string;
  setting?: string;
  complexity?: string;
  assessorName: string;
  assessorRole?: string;
  achievement?: string;
  entrustmentScore?: number;
  canmedsRatings?: { roleId: string; roleTitle: string; rating: number | null }[];
  observationNotes?: string;
  strengthsNotes?: string;
  improvementNotes?: string;
  safetyConcern?: boolean;
  professionalismConcern?: boolean;
  concernDetails?: string;
  status: string;
  caseLog?: {
    id: string;
    procedureName: string;
    caseDate: string;
    surgicalApproach: string;
  };
}

interface Notification {
  id: string;
  recipientEmail: string;
  recipientName: string;
  viewedAt: string | null;
  respondedAt: string | null;
}

const ENTRUSTMENT_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "I had to do", color: "#ef4444" },
  2: { label: "I had to talk them through", color: "#f97316" },
  3: { label: "I had to prompt from time to time", color: "#eab308" },
  4: { label: "I needed to be there just in case", color: "#22c55e" },
  5: { label: "I did not need to be there", color: "#16a34a" },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [observation, setObservation] = useState<Observation | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  // Attending's review state
  const [entrustmentOverride, setEntrustmentOverride] = useState<number | null>(null);
  const [strengthsNotes, setStrengthsNotes] = useState("");
  const [improvementNotes, setImprovementNotes] = useState("");
  const [safetyConcern, setSafetyConcern] = useState(false);
  const [professionalismConcern, setProfessionalismConcern] = useState(false);
  const [concernDetails, setConcernDetails] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [doneAction, setDoneAction] = useState<"sign" | "return">("sign");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/epa/review/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error ?? "Review not found");
        }
        return res.json();
      })
      .then((data) => {
        setObservation(data.observation);
        setNotification(data.notification);
        // Pre-fill attending's notes if observation has them
        if (data.observation?.strengthsNotes) setStrengthsNotes(data.observation.strengthsNotes);
        if (data.observation?.improvementNotes) setImprovementNotes(data.observation.improvementNotes);
        if (data.observation?.entrustmentScore) setEntrustmentOverride(data.observation.entrustmentScore);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSign = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/epa/review/${token}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "sign",
          signedByName: notification?.recipientName || "Attending",
          ...(entrustmentOverride ? { entrustmentScore: entrustmentOverride } : {}),
          ...(strengthsNotes ? { strengthsNotes } : {}),
          ...(improvementNotes ? { improvementNotes } : {}),
          safetyConcern,
          professionalismConcern,
          ...(concernDetails ? { concernDetails } : {}),
        }),
      });
      if (!res.ok) throw new Error("Sign-off failed");
      setDone(true);
      setDoneAction("sign");
    } catch {
      setError("Failed to sign off. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/epa/review/${token}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "return",
          returnedReason: returnReason || "Please review and resubmit.",
        }),
      });
      if (!res.ok) throw new Error("Return failed");
      setDone(true);
      setDoneAction("return");
    } catch {
      setError("Failed to return observation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Already responded
  const alreadyResponded = notification?.respondedAt != null;

  // ── Render ──

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0e1520",
      color: "#e2e8f0",
      fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "24px 20px 60px",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 32,
          paddingTop: 12,
        }}>
          <HippoMark size={24} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.4px" }}>Hippo</span>
          <span style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>EPA Review</span>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.1)",
              borderTop: "2px solid #2563eb",
              animation: "spin .7s linear infinite",
              margin: "0 auto 12px",
            }} />
            <p style={{ fontSize: 13, color: "#64748b" }}>Loading observation...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#141c28",
            borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.2)",
          }}>
            <AlertTriangle size={28} style={{ color: "#f87171", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, color: "#f87171", fontWeight: 600 }}>{error}</p>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
              This review link may have expired or already been used.
            </p>
          </div>
        )}

        {/* Done */}
        {done && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#141c28",
            borderRadius: 12,
            border: `1px solid ${doneAction === "sign" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
          }}>
            {doneAction === "sign" ? (
              <>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "rgba(16,185,129,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <Check size={24} style={{ color: "#10b981" }} />
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>Signed Off</p>
                <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>
                  Thank you for reviewing this EPA observation. The resident has been notified.
                </p>
              </>
            ) : (
              <>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "rgba(245,158,11,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <RotateCcw size={24} style={{ color: "#f59e0b" }} />
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>Returned for Revision</p>
                <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>
                  The resident will revise and resubmit this observation.
                </p>
              </>
            )}
          </div>
        )}

        {/* Already responded */}
        {alreadyResponded && !done && !loading && !error && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#141c28",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <Check size={28} style={{ color: "#64748b", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, color: "#94a3b8", fontWeight: 600 }}>
              This review has already been completed.
            </p>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
              Status: <strong style={{ color: "#e2e8f0" }}>{observation?.status}</strong>
            </p>
          </div>
        )}

        {/* Main review form */}
        {observation && !loading && !error && !done && !alreadyResponded && (
          <>
            {/* EPA header card */}
            <div style={{
              background: "#141c28",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "#0ea5e9",
                  background: "rgba(14,165,233,0.12)",
                  padding: "3px 8px", borderRadius: 4,
                  fontFamily: "'Geist Mono', monospace",
                }}>
                  {observation.epaId}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{observation.epaTitle}</span>
              </div>

              {observation.caseLog && (
                <div style={{
                  background: "#0e1520",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 10,
                }}>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>
                    <strong style={{ color: "#e2e8f0" }}>Procedure:</strong> {observation.caseLog.procedureName}
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                    <strong style={{ color: "#e2e8f0" }}>Date:</strong>{" "}
                    {new Date(observation.caseLog.caseDate).toLocaleDateString("en-CA", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </div>
                  {observation.caseLog.surgicalApproach && (
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                      <strong style={{ color: "#e2e8f0" }}>Approach:</strong>{" "}
                      {observation.caseLog.surgicalApproach.replace(/_/g, " ")}
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize: 12, color: "#64748b" }}>
                Assessed by: <strong style={{ color: "#94a3b8" }}>{observation.assessorName}</strong>
                {observation.assessorRole && ` (${observation.assessorRole})`}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Date: {new Date(observation.observationDate).toLocaleDateString("en-CA")}
                {observation.setting && ` | Setting: ${observation.setting}`}
                {observation.complexity && ` | Complexity: ${observation.complexity}`}
              </div>
            </div>

            {/* Resident's self-assessment summary */}
            {observation.entrustmentScore && (
              <div style={{
                background: "#141c28",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  Resident&apos;s Entrustment Self-Assessment
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const e = ENTRUSTMENT_LABELS[n];
                    const isSelected = observation.entrustmentScore === n;
                    return (
                      <div
                        key={n}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          background: isSelected ? `${e.color}18` : "transparent",
                          border: `1px solid ${isSelected ? `${e.color}40` : "rgba(255,255,255,0.06)"}`,
                          color: isSelected ? e.color : "#475569",
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {n}. {e.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resident's notes */}
            {(observation.observationNotes || observation.strengthsNotes || observation.improvementNotes) && (
              <div style={{
                background: "#141c28",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  Resident&apos;s Notes
                </div>
                {observation.observationNotes && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 2 }}>Comments</div>
                    <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>{observation.observationNotes}</p>
                  </div>
                )}
                {observation.strengthsNotes && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginBottom: 2 }}>Continue (Strengths)</div>
                    <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>{observation.strengthsNotes}</p>
                  </div>
                )}
                {observation.improvementNotes && (
                  <div>
                    <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginBottom: 2 }}>Consider (Areas for Improvement)</div>
                    <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>{observation.improvementNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* CanMEDS ratings if present */}
            {observation.canmedsRatings && observation.canmedsRatings.length > 0 && (
              <div style={{
                background: "#141c28",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  CanMEDS Milestone Ratings
                </div>
                {observation.canmedsRatings.map((r) => (
                  <div key={r.roleId} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "6px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.roleTitle}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: r.rating ? "#e2e8f0" : "#475569",
                      fontFamily: "'Geist Mono', monospace",
                    }}>
                      {r.rating ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Safety/professionalism flags */}
            {(observation.safetyConcern || observation.professionalismConcern) && (
              <div style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Shield size={14} style={{ color: "#f87171" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#f87171" }}>Flagged Concerns</span>
                </div>
                {observation.safetyConcern && (
                  <div style={{ fontSize: 12, color: "#fca5a5", marginBottom: 4 }}>Safety concern flagged by resident</div>
                )}
                {observation.professionalismConcern && (
                  <div style={{ fontSize: 12, color: "#fca5a5" }}>Professionalism concern flagged by resident</div>
                )}
                {observation.concernDetails && (
                  <p style={{ fontSize: 12, color: "#fca5a5", marginTop: 8, lineHeight: 1.5 }}>{observation.concernDetails}</p>
                )}
              </div>
            )}

            {/* ── Attending's review section ── */}
            <div style={{
              background: "#141c28",
              border: "1px solid rgba(37,99,235,0.25)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>
                Your Assessment
              </div>

              {/* Entrustment override */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 8 }}>
                  Entrustment / O-Score (optional override)
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const e = ENTRUSTMENT_LABELS[n];
                    const isSelected = entrustmentOverride === n;
                    return (
                      <button
                        key={n}
                        onClick={() => setEntrustmentOverride(isSelected ? null : n)}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: 6,
                          fontSize: 16,
                          fontWeight: 700,
                          border: `1px solid ${isSelected ? `${e.color}60` : "rgba(255,255,255,0.08)"}`,
                          background: isSelected ? `${e.color}18` : "transparent",
                          color: isSelected ? e.color : "#475569",
                          cursor: "pointer",
                          fontFamily: "'Geist Mono', monospace",
                          transition: "all .15s",
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                {entrustmentOverride && (
                  <p style={{ fontSize: 11, color: ENTRUSTMENT_LABELS[entrustmentOverride].color, marginTop: 6 }}>
                    {ENTRUSTMENT_LABELS[entrustmentOverride].label}
                  </p>
                )}
              </div>

              {/* Feedback */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#10b981", display: "block", marginBottom: 4 }}>
                  Continue (Strengths)
                </label>
                <textarea
                  value={strengthsNotes}
                  onChange={(e) => setStrengthsNotes(e.target.value)}
                  placeholder="What did the resident do well?"
                  rows={2}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#0e1520",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    color: "#e2e8f0",
                    fontSize: 13, padding: "8px 10px",
                    resize: "vertical", outline: "none",
                    fontFamily: "inherit", lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", display: "block", marginBottom: 4 }}>
                  Consider (Areas for Improvement)
                </label>
                <textarea
                  value={improvementNotes}
                  onChange={(e) => setImprovementNotes(e.target.value)}
                  placeholder="What should the resident work on?"
                  rows={2}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#0e1520",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    color: "#e2e8f0",
                    fontSize: 13, padding: "8px 10px",
                    resize: "vertical", outline: "none",
                    fontFamily: "inherit", lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Safety/professionalism */}
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#94a3b8" }}>
                  <input type="checkbox" checked={safetyConcern} onChange={(e) => setSafetyConcern(e.target.checked)}
                    style={{ accentColor: "#ef4444" }} />
                  Safety concern
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#94a3b8" }}>
                  <input type="checkbox" checked={professionalismConcern} onChange={(e) => setProfessionalismConcern(e.target.checked)}
                    style={{ accentColor: "#ef4444" }} />
                  Professionalism concern
                </label>
              </div>

              {(safetyConcern || professionalismConcern) && (
                <textarea
                  value={concernDetails}
                  onChange={(e) => setConcernDetails(e.target.value)}
                  placeholder="Please describe the concern..."
                  rows={2}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 6,
                    color: "#fca5a5",
                    fontSize: 13, padding: "8px 10px",
                    resize: "vertical", outline: "none",
                    fontFamily: "inherit", lineHeight: 1.5,
                    marginBottom: 14,
                  }}
                />
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button
                onClick={handleSign}
                disabled={submitting}
                style={{
                  flex: 2,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "14px 20px",
                  background: submitting ? "rgba(37,99,235,0.3)" : "#2563eb",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 14, fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all .15s",
                }}
              >
                {submitting ? (
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid #fff", animation: "spin .7s linear infinite" }} />
                ) : (
                  <Check size={16} />
                )}
                {submitting ? "Signing..." : "Sign Off"}
              </button>

              <button
                onClick={() => setShowReturn(!showReturn)}
                style={{
                  flex: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "14px 16px",
                  background: "transparent",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 10,
                  color: "#f59e0b",
                  fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all .15s",
                }}
              >
                <RotateCcw size={14} />
                Return
              </button>
            </div>

            {/* Return reason */}
            {showReturn && (
              <div style={{
                background: "#141c28",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", display: "block", marginBottom: 6 }}>
                  Reason for returning (optional)
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g., Please add more detail about the steps you performed..."
                  rows={2}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#0e1520",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    color: "#e2e8f0",
                    fontSize: 13, padding: "8px 10px",
                    resize: "vertical", outline: "none",
                    fontFamily: "inherit", lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                />
                <button
                  onClick={handleReturn}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: 8,
                    color: "#f59e0b",
                    fontSize: 13, fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {submitting ? "Returning..." : "Return for Revision"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
