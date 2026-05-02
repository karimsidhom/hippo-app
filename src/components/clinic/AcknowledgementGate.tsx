"use client";

// Hippo Clinic — first-use acknowledgement gate.
//
// Mounts on every clinic page. Polls /api/clinic/acknowledge once on
// mount; if the user hasn't accepted the current version of the
// clinician acknowledgement, an unfocusable modal blocks further use
// until they do. Acceptance writes a LegalAcceptance row through
// /api/clinic/acknowledge for the audit trail.
//
// We render the policy text from the server response so updating
// CLINIC_POLICY_VERSION in lib/clinic/legal.ts re-prompts everyone.

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface AckPayload {
  policyKey: string;
  version: string;
  text: string;
  accepted: boolean;
}

export function AcknowledgementGate() {
  const [data, setData] = useState<AckPayload | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fail-closed: if we cannot determine whether the user has accepted the
  // current policy version, we BLOCK access rather than assume acceptance.
  // PHIA / PHIPA / HIPAA do not allow click-wrap acceptance to be skipped
  // because the network was flaky at boot.
  const [fetchFailed, setFetchFailed] = useState(false);

  const loadAck = () => {
    setFetchFailed(false);
    fetch("/api/clinic/acknowledge")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: AckPayload) => setData(j))
      .catch(() => { setFetchFailed(true); });
  };
  useEffect(loadAck, []);

  async function accept() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/clinic/acknowledge", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((d) => d ? { ...d, accepted: true } : d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Fail-closed retry surface — shown when the ack-status fetch failed.
  if (fetchFailed) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Hippo Clinic — connection required"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.7)",
          backdropFilter: "blur(8px)",
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div className="sheet" style={{ maxWidth: 460, padding: 24 }}>
          <div className="section-title">Connection required</div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "4px 0 12px" }}>
            Couldn&apos;t verify your acknowledgement
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
            Hippo Clinic must confirm that you have accepted the current scribe acknowledgement
            before clinical use. Please re-establish your connection and try again.
          </p>
          <button className="st-btn st-btn-primary press-key" onClick={loadAck} style={{ marginTop: 18 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.accepted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hippo Clinic acknowledgement"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        backdropFilter: "blur(8px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="sheet"
        style={{
          maxWidth: 560,
          maxHeight: "82vh",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <div className="section-title">Hippo Clinic</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "4px 0 16px", letterSpacing: "-0.3px" }}>
          Before you start using the AI scribe
        </h2>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 12,
            color: "var(--text-2)",
            lineHeight: 1.6,
            margin: 0,
            fontFamily: "inherit",
            background: "var(--surface)",
            border: "1px solid var(--border-mid)",
            borderRadius: "var(--rs)",
            padding: 14,
            maxHeight: "50vh",
            overflowY: "auto",
          }}
        >
          {data.text}
        </pre>

        {error && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 12 }}>{error}</div>}

        <button
          className="st-btn st-btn-primary press-key"
          onClick={accept}
          disabled={submitting}
          style={{ marginTop: 18 }}
        >
          {submitting ? <Loader2 size={14} className="spin" /> : null}
          I acknowledge — version {data.version}
        </button>
        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 8, textAlign: "center" }}>
          Recorded with timestamp + IP + user-agent for the audit trail.
        </div>
      </div>
    </div>
  );
}
