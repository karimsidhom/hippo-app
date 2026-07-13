"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

type Referral = { url: string; clicks: number; signups: number };

export default function ShareHippoPage() {
  const [referral, setReferral] = useState<Referral | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/growth/referral").then((response) => response.ok ? response.json() : null).then(setReferral).catch(() => setReferral(null));
  }, []);

  const shareText = "I use Hippo to log surgical cases and track my training. It is free for residents and fellows.";
  async function copy() {
    if (!referral) return;
    await navigator.clipboard.writeText(`${shareText}\n\n${referral.url}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  async function share() {
    if (!referral) return;
    if (navigator.share) await navigator.share({ title: "Hippo for residents", text: shareText, url: referral.url });
    else await copy();
  }

  return <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 90px" }}>
    <p style={{ margin: 0, color: "var(--primary)", fontSize: 11, fontWeight: 750, textTransform: "uppercase", letterSpacing: 0 }}>Residents keep Hippo growing</p>
    <h1 style={{ margin: "12px 0 14px", color: "var(--text)", fontSize: 36, lineHeight: 1.05, letterSpacing: 0 }}>Invite your co-residents.</h1>
    <p style={{ color: "var(--text-2)", fontSize: 17, lineHeight: 1.7, maxWidth: 650 }}>Share your personal link with residents and fellows who would benefit from a better case log. Their account stays free, and no invitation email is sent by Hippo.</p>

    <section style={{ borderTop: "1px solid var(--border-mid)", borderBottom: "1px solid var(--border-mid)", marginTop: 36, padding: "28px 0" }}>
      <label htmlFor="referral-link" style={{ display: "block", color: "var(--text-3)", fontSize: 11, fontWeight: 650, textTransform: "uppercase", marginBottom: 9 }}>Your referral link</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input id="referral-link" value={referral?.url || "Preparing your link…"} readOnly style={{ minWidth: 0, flex: "1 1 360px", border: "1px solid var(--border-mid)", borderRadius: 6, background: "var(--surface)", color: "var(--text-1)", padding: "12px 13px", fontSize: 14 }} />
        <button type="button" onClick={copy} disabled={!referral} title="Copy invitation" style={{ width: 44, height: 44, border: "1px solid var(--border-mid)", borderRadius: 6, background: "var(--surface2)", color: "var(--text-1)", display: "grid", placeItems: "center", cursor: "pointer" }}>{copied ? <Check size={18} /> : <Copy size={18} />}</button>
        <button type="button" onClick={share} disabled={!referral} style={{ minHeight: 44, border: 0, borderRadius: 6, background: "var(--primary)", color: "white", padding: "0 16px", fontWeight: 750, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}><Share2 size={17} /> Share</button>
      </div>
    </section>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", borderLeft: "1px solid var(--border-mid)", marginTop: 30 }}>
      <div style={{ padding: 20, borderTop: "1px solid var(--border-mid)", borderRight: "1px solid var(--border-mid)", borderBottom: "1px solid var(--border-mid)" }}><strong style={{ display: "block", color: "var(--text)", fontSize: 28 }}>{referral?.clicks ?? 0}</strong><span style={{ color: "var(--text-3)", fontSize: 12 }}>Link visits</span></div>
      <div style={{ padding: 20, borderTop: "1px solid var(--border-mid)", borderRight: "1px solid var(--border-mid)", borderBottom: "1px solid var(--border-mid)" }}><strong style={{ display: "block", color: "var(--text)", fontSize: 28 }}>{referral?.signups ?? 0}</strong><span style={{ color: "var(--text-3)", fontSize: 12 }}>Residents joined</span></div>
    </div>
  </main>;
}
