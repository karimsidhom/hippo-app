"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Target } from "lucide-react";
import type { TargetProgress, TargetMatchType } from "@/lib/projections";
import { STATUS_LABEL } from "@/lib/projections";

type Suggestion = { label: string; matchType: TargetMatchType; matchValue: string | null };
type Payload = {
  gated: boolean;
  graduationDate: string | null;
  targets: TargetProgress[];
  suggestions: Suggestion[];
};

const MATCH_LABEL: Record<TargetMatchType, string> = {
  TOTAL: "All cases",
  INDEPENDENT: "Independent or teaching cases",
  CATEGORY: "Procedure category",
  PROCEDURE: "Procedure name contains",
};

function toInputDate(d: string | null): string {
  if (!d) return "";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? "" : x.toISOString().slice(0, 10);
}

export default function TargetsSettingsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [grad, setGrad] = useState("");
  const [form, setForm] = useState<{ label: string; matchType: TargetMatchType; matchValue: string; target: string; dueDate: string }>({
    label: "",
    matchType: "CATEGORY",
    matchValue: "",
    target: "",
    dueDate: "",
  });

  const load = useCallback(async () => {
    const r = await fetch("/api/targets");
    if (!r.ok) {
      setMsg("Could not load targets.");
      return;
    }
    const j: Payload = await r.json();
    setData(j);
    setGrad(toInputDate(j.graduationDate));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveGraduation() {
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graduationDate: grad || null }),
    });
    setBusy(false);
    setMsg(r.ok ? "Graduation date saved." : "Could not save the date.");
    if (r.ok) load();
  }

  async function addTarget(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.label,
        matchType: form.matchType,
        matchValue: form.matchValue || null,
        target: Number(form.target),
        dueDate: form.dueDate || null,
      }),
    });
    setBusy(false);
    if (r.ok) {
      setForm({ label: "", matchType: "CATEGORY", matchValue: "", target: "", dueDate: "" });
      load();
    } else {
      const j = await r.json().catch(() => ({}));
      setMsg(j.error ?? "Could not add the target.");
    }
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/targets?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setBusy(false);
    load();
  }

  function useSuggestion(s: Suggestion) {
    setForm((f) => ({ ...f, label: s.label, matchType: s.matchType, matchValue: s.matchValue ?? "" }));
  }

  const input: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "inherit",
    fontSize: 14,
  };
  const label: React.CSSProperties = { fontSize: 12, opacity: 0.75, display: "block", marginBottom: 6 };
  const button: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "inherit",
    fontSize: 14,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 64px" }}>
      <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, opacity: 0.8 }}>
        <ArrowLeft size={14} /> Settings
      </Link>
      <h1 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, margin: "14px 0 6px" }}>
        <Target size={20} strokeWidth={1.75} /> Case targets and on-track projections
      </h1>
      <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.55, margin: "0 0 20px" }}>
        Enter the case minimums your program or college holds you to. Hippo measures your pace over the last six
        months and projects where it lands you by the due date. The numbers are your program&apos;s; Hippo does not
        invent them.
      </p>

      {data?.gated && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <strong>On-track projections are a Pro feature.</strong>
          <p style={{ fontSize: 13, opacity: 0.8, margin: "6px 0 10px" }}>
            Pro residents see every target on the dashboard with pace and projection.
          </p>
          <Link href="/upgrade" style={{ ...button, textDecoration: "none" }}>
            See Pro
          </Link>
        </div>
      )}

      <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <label style={label}>Expected graduation date (default due date for every target)</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="date" value={grad} onChange={(e) => setGrad(e.target.value)} style={input} />
          <button type="button" onClick={saveGraduation} disabled={busy || data?.gated} style={button}>
            Save
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Your targets</h2>
        {data && data.targets.length === 0 && (
          <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>No targets yet. Add one below.</p>
        )}
        <div style={{ display: "grid", gap: 10 }}>
          {data?.targets.map((t) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "start", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {MATCH_LABEL[t.matchType]}
                  {t.matchValue ? `: ${t.matchValue}` : ""} · {t.current}/{t.target} · {STATUS_LABEL[t.status]}
                  {t.projected !== null && ` · pace ${t.ratePerMonth}/mo, projected ${t.projected}`}
                  {t.neededPerMonth !== null && t.status !== "on_track" && t.status !== "done" && ` · need ${t.neededPerMonth}/mo`}
                </div>
              </div>
              <button type="button" onClick={() => remove(t.id)} disabled={busy} style={button} aria-label={`Delete ${t.label}`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Add a target</h2>
        {data && data.suggestions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {data.suggestions.map((s) => (
              <button key={`${s.matchType}:${s.matchValue ?? ""}`} type="button" onClick={() => useSuggestion(s)} style={{ ...button, padding: "6px 10px", fontSize: 12 }}>
                {s.label}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={addTarget} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={label}>Label</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Endourology cases" required style={input} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={label}>Counts</label>
              <select value={form.matchType} onChange={(e) => setForm({ ...form, matchType: e.target.value as TargetMatchType })} style={input}>
                {(Object.keys(MATCH_LABEL) as TargetMatchType[]).map((k) => (
                  <option key={k} value={k}>{MATCH_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>{form.matchType === "PROCEDURE" ? "Name contains" : "Category"}</label>
              <input
                value={form.matchValue}
                onChange={(e) => setForm({ ...form, matchValue: e.target.value })}
                disabled={form.matchType === "TOTAL" || form.matchType === "INDEPENDENT"}
                placeholder={form.matchType === "PROCEDURE" ? "prostatectomy" : "Endourology"}
                style={input}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={label}>Target number</label>
              <input type="number" min={1} max={100000} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} required style={input} />
            </div>
            <div>
              <label style={label}>Due date (optional, defaults to graduation)</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={input} />
            </div>
          </div>
          <div>
            <button type="submit" disabled={busy || data?.gated} style={button}>
              <Plus size={14} /> Add target
            </button>
          </div>
        </form>
        {msg && <p style={{ fontSize: 13, marginTop: 10, opacity: 0.85 }}>{msg}</p>}
      </section>
    </div>
  );
}
