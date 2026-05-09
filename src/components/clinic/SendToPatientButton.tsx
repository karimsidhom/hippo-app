"use client";

// Hippo Clinic — Send instructions to patient.
//
// Surfaces only after finalize. The clinician confirms the email address
// (defaulting to the patient record's contactEmail if present), then we
// POST the existing /send-instructions endpoint that wraps Resend.
//
// We deliberately do NOT auto-send on finalize. Auto-send removes the
// clinician's last-second sanity check on the recipient address — and
// "wrong email" is the most common cause of an inadvertent PHI leak.

import { useState } from "react";
import { Mail, Loader2, Check } from "lucide-react";

export function SendToPatientButton({
  encounterId,
  defaultEmail,
}: {
  encounterId: string;
  defaultEmail?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/encounters/${encounterId}/send-instructions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "email", to: email.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setSent(true);
      setTimeout(() => setOpen(false), 1400);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      {!open ? (
        <button
          type="button"
          className="st-btn st-btn-secondary press"
          onClick={() => setOpen(true)}
          style={{ display: "inline-flex", width: "auto" }}
        >
          <Mail size={14} /> Send instructions to patient
        </button>
      ) : (
        <div className="st-card" style={{ padding: 14 }}>
          <div className="form-label">Patient email</div>
          <input
            type="email"
            className="st-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="patient@example.com"
            autoFocus
            disabled={sending || sent}
          />
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, lineHeight: 1.5 }}>
            We'll email the patient instructions only — no diagnoses, no codes, nothing the
            clinician didn't finalize. The clinician's email is set as the reply-to so the
            patient can respond directly.
          </div>
          {error && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <button className="st-btn st-btn-secondary st-btn-sm press" onClick={() => setOpen(false)} disabled={sending}>
              Cancel
            </button>
            <button
              className="st-btn st-btn-primary st-btn-sm press-key"
              onClick={send}
              disabled={sending || sent || !/^.+@.+\..+$/.test(email)}
              style={{ width: "auto" }}
            >
              {sent ? <><Check size={12} /> Sent</> : sending ? <><Loader2 size={12} className="spin" /> Sending</> : <><Mail size={12} /> Send</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
