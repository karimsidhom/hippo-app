"use client";

// Dictate once, derive everything.
//
// Paste (or dictate) the operative note; the server parses it with the rule
// engine in lib/dictation/derive-case (no LLM, nothing stored) and returns a
// case-form prefill plus the sentence behind every derived field. The
// resident reviews the evidence, applies it, and the normal form takes over.

import { useState } from "react";
import { FileText, Check, AlertTriangle, Loader2 } from "lucide-react";
import { VoiceTextarea } from "@/components/VoiceTextarea";
import type { DerivedCase } from "@/lib/dictation/derive-case";

export interface DerivePrefill {
  procedureName: string;
  procedureDefinitionId?: string;
  procedureCategory?: string;
  specialtyId?: string;
  surgicalApproach: string;
  role: "PRIMARY" | "ASSIST" | "OBSERVER" | "TEACHING";
  autonomyLevel: string;
  attendingLabel?: string;
  operativeDurationMinutes?: number;
  conversionOccurred: boolean;
  complicationCategory: string;
  outcomeCategory: string;
}

interface Props {
  specialty?: string | null;
  onApply: (prefill: DerivePrefill, derived: DerivedCase) => void;
}

const FIELD_LABEL: Record<string, string> = {
  procedure: "Procedure",
  approach: "Approach",
  role: "Role",
  autonomyLevel: "Autonomy",
  attendingLabel: "Attending",
  operativeDurationMinutes: "Operative time",
};

export function DeriveFromNote({ specialty, onApply }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ derived: DerivedCase; prefill: DerivePrefill } | null>(null);
  const [applied, setApplied] = useState(false);

  async function derive() {
    const trimmed = text.trim();
    if (trimmed.length < 20 || busy) return;
    setBusy(true);
    setError(null);
    setApplied(false);
    try {
      const res = await fetch("/api/dictation/derive", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: trimmed, specialty: specialty ?? undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Derive failed (${res.status})`);
      setResult(json as { derived: DerivedCase; prefill: DerivePrefill });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not derive a case from this note");
    } finally {
      setBusy(false);
    }
  }

  function apply() {
    if (!result) return;
    onApply(result.prefill, result.derived);
    setApplied(true);
  }

  const d = result?.derived;
  const evidence: Array<{ key: string; value: string; phrase: string; confidence: number }> = [];
  if (d) {
    const pairs: Array<[string, { value: string; phrase: string; confidence: number } | null]> = [
      ["procedure", d.procedure],
      ["approach", d.approach],
      ["role", d.role],
      ["autonomyLevel", d.autonomyLevel],
      ["attendingLabel", d.attendingLabel],
      ["operativeDurationMinutes", d.operativeDurationMinutes ? { ...d.operativeDurationMinutes, value: `${d.operativeDurationMinutes.minutes} min` } : null],
    ];
    for (const [key, ev] of pairs) if (ev) evidence.push({ key, value: ev.value, phrase: ev.phrase, confidence: ev.confidence });
  }

  return (
    <div
      style={{
        padding: "14px 16px",
        background: applied ? "rgba(16,185,129,0.06)" : "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(16,185,129,0.05))",
        border: `1px solid ${applied ? "rgba(16,185,129,0.25)" : "rgba(59,130,246,0.22)"}`,
        borderRadius: 10,
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 12, fontWeight: 600, color: applied ? "var(--success)" : "#93c5fd" }}>
        {applied ? <><Check size={13} /> Form filled from the operative note</> : <><FileText size={13} /> Derive from an operative note</>}
      </div>
      <VoiceTextarea
        value={text}
        onChange={setText}
        placeholder="Paste or dictate the operative note. The procedure, approach, who did what, the attending, operative time, conversion and complications are pulled out, with the sentence behind each one."
        disabled={busy}
        rows={4}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            derive();
          }
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 12 }}>
        <div style={{ fontSize: 10, color: "var(--text-3)" }}>Nothing is stored; the note stays on this screen. No patient identifiers.</div>
        <button
          type="button"
          onClick={derive}
          disabled={busy || text.trim().length < 20}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-mid)] bg-[var(--surface2)] text-[var(--text)] disabled:opacity-50"
        >
          {busy ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Loader2 size={12} className="animate-spin" /> Reading</span> : "Derive case"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--danger, #f87171)", display: "flex", gap: 6, alignItems: "center" }}>
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {d && (
        <div style={{ marginTop: 12 }}>
          {evidence.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>Nothing recognisable in that text. Try the full operative note.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {evidence.map((e) => (
                <div key={e.key} className="st-card" style={{ padding: "8px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "var(--text-3)" }}>{FIELD_LABEL[e.key] ?? e.key}</span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{e.value.replace(/_/g, " ")}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3, fontStyle: "italic" }}>
                    &ldquo;{e.phrase}&rdquo;{e.confidence < 0.6 ? " (low confidence, check it)" : ""}
                  </div>
                </div>
              ))}
              {d.suggestedEntrustment && (
                <div className="st-card" style={{ padding: "8px 10px", fontSize: 12 }}>
                  <span style={{ color: "var(--text-3)" }}>Suggested entrustment </span>
                  <span style={{ fontWeight: 600 }}>{d.suggestedEntrustment.score} of 5, {d.suggestedEntrustment.label}</span>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3, fontStyle: "italic" }}>&ldquo;{d.suggestedEntrustment.phrase}&rdquo;</div>
                </div>
              )}
              {(d.conversionOccurred || d.complicationCategory !== "NONE") && (
                <div style={{ fontSize: 11, color: "var(--warning, #fbbf24)", display: "flex", gap: 6, alignItems: "center" }}>
                  <AlertTriangle size={11} />
                  {d.conversionOccurred ? "Conversion to open noted. " : ""}
                  {d.complicationCategory !== "NONE" ? `Complication category ${d.complicationCategory.replace(/_/g, " ").toLowerCase()}.` : ""}
                </div>
              )}
              {d.warnings.map((w) => (
                <div key={w} style={{ fontSize: 11, color: "var(--text-3)", display: "flex", gap: 6, alignItems: "center" }}>
                  <AlertTriangle size={11} /> {w}
                </div>
              ))}
            </div>
          )}
          {evidence.length > 0 && !applied && (
            <button
              type="button"
              onClick={apply}
              className="mt-3 w-full py-2 rounded-lg text-sm font-semibold bg-[var(--primary)] text-white"
            >
              Fill the form with these
            </button>
          )}
        </div>
      )}
    </div>
  );
}
