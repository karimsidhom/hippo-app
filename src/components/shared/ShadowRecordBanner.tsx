"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { Shield } from "lucide-react";

/**
 * First-use disclosure. Tells the user that Hippo is not their program's
 * official training record unless their program has explicitly adopted it.
 * Blocks interaction with the app until acknowledged. Acknowledgment is
 * recorded to Profile.acknowledgedShadowRecordAt and to the audit log.
 */
export function ShadowRecordBanner() {
  const { profile } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [dismissedLocally, setDismissedLocally] = useState(false);

  // Reset local dismissal if user changes
  useEffect(() => { setDismissedLocally(false); }, [profile?.id]);

  if (!profile) return null;
  const acknowledged = Boolean(
    (profile as unknown as { acknowledgedShadowRecordAt?: string | null }).acknowledgedShadowRecordAt,
  );
  if (acknowledged || dismissedLocally) return null;

  async function accept() {
    setSubmitting(true);
    try {
      await fetch("/api/account/consent", { method: "POST" });
      setDismissedLocally(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,.75)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: "fadeIn .3s ease forwards",
      }}
    >
      <div style={{
        background: "var(--bg-1)",
        border: "1px solid var(--border-mid)",
        borderRadius: 14,
        maxWidth: 520, width: "100%",
        padding: 28,
        color: "var(--text)",
        fontFamily: "'Geist', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(59,130,246,.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#3b82f6",
          }}>
            <Shield size={18} />
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: "-.2px" }}>
            Before you start — a note on records
          </h2>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-2)", margin: "0 0 10px" }}>
          Hippo is a <strong>personal training companion</strong>. It is <strong>not</strong> your program&apos;s official case log,
          evaluation system, or accreditation record unless your program has explicitly adopted Hippo
          as its record of truth in writing.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-2)", margin: "0 0 10px" }}>
          You remain responsible for keeping your official log in your program&apos;s LMS
          (Elentra, MedHub, New Innovations, one45, Entrada, etc.). Attending sign-offs in
          Hippo are a personal record, not a regulatory evaluation.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-2)", margin: "0 0 18px" }}>
          <strong>Do not enter patient identifiers</strong> (names, MRNs, dates of birth) in any field.
          See our <Link href="/legal/privacy" style={A}>Privacy Policy</Link>, <Link href="/legal/terms" style={A}>Terms</Link>,
          and <Link href="/legal/security" style={A}>Security</Link> page for full detail.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={accept}
            disabled={submitting}
            style={{
              padding: "10px 18px",
              background: "var(--primary, #3b82f6)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13, fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? .7 : 1,
              fontFamily: "inherit",
            }}
          >
            {submitting ? "Saving…" : "I understand — continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

const A: React.CSSProperties = { color: "#3b82f6", textDecoration: "none" };
