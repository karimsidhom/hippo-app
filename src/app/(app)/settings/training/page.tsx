"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

/**
 * Training dates. The residency start date anchors the autonomy slope
 * (ordinal autonomy against months of training). Without it a resident's
 * cases cannot be placed on a training timeline and they are excluded from
 * any program-level slope, so the page says so plainly.
 */
export default function TrainingDatesPage() {
  const [start, setStart] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.profile?.residencyStartDate ?? j?.residencyStartDate ?? null;
        if (d) setStart(new Date(d).toISOString().slice(0, 10));
      })
      .catch(() => {});
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ residencyStartDate: start || null }),
    });
    setBusy(false);
    setMsg(r.ok ? "Saved." : "Could not save.");
  }

  const input: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "inherit", fontSize: 14 };
  const button: React.CSSProperties = { padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "inherit", fontSize: 14, cursor: "pointer" };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 64px" }}>
      <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, opacity: 0.8 }}>
        <ArrowLeft size={14} /> Settings
      </Link>
      <h1 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, margin: "14px 0 6px" }}>
        <CalendarDays size={20} strokeWidth={1.75} /> Training dates
      </h1>
      <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.55, margin: "0 0 20px" }}>
        The first day of your residency anchors your autonomy slope: how quickly your logged cases move
        from observer to independent, measured against months of training. It is also what lets your
        program see its cohort&apos;s slope, if you have opted in to benchmarking. Without it, your log
        cannot be placed on a training timeline and you are left out of that number.
      </p>
      <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
        <label style={{ fontSize: 12, opacity: 0.75, display: "block", marginBottom: 6 }}>Residency start date (PGY-1, day one)</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={input} />
          <button type="button" onClick={save} disabled={busy} style={button}>Save</button>
        </div>
        {msg && <p style={{ fontSize: 13, marginTop: 10, opacity: 0.85 }}>{msg}</p>}
      </section>
    </div>
  );
}
