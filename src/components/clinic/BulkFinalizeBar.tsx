"use client";

// Hippo Clinic — Bulk finalize bar.
//
// Renders on the dashboard when the user has multiple encounters in
// NEEDS_REVIEW status. Clinician selects with checkboxes, types one
// signature, all selected notes are finalised in one batch with audit
// rows created per-encounter.

import { useState } from "react";
import { CheckSquare, Square, FileSignature, Loader2, X } from "lucide-react";

interface UnsignedEncounter {
  id: string;
  noteType: string;
  patient: { givenName: string; familyName: string } | null;
  visitReason?: string | null;
}

interface Props {
  encounters: UnsignedEncounter[];
  /** Called after the bulk finalize completes so the parent can refetch. */
  onComplete: () => void;
}

export function BulkFinalizeBar({ encounters, onComplete }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{ id: string; ok: boolean; error?: string }> | null>(null);

  if (encounters.length === 0) return null;

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function selectAll() { setSelected(new Set(encounters.map((e) => e.id))); }
  function clearAll() { setSelected(new Set()); }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/clinic/encounters/bulk-finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encounterIds: Array.from(selected),
          signatureText: signature.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { results: typeof results; finalisedCount: number; failedCount: number };
      setResults(j.results);
      // Drop successful ones from the selection so the user sees what's left.
      setSelected(new Set((j.results ?? []).filter((r) => !r.ok).map((r) => r.id)));
      onComplete();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div className="section-title" style={{ margin: 0 }}>Bulk finalize</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="chip press" onClick={selected.size === encounters.length ? clearAll : selectAll}>
            {selected.size === encounters.length ? "Clear all" : "Select all"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {encounters.map((e) => {
          const isSel = selected.has(e.id);
          const result = results?.find((r) => r.id === e.id);
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => toggle(e.id)}
              className="press"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                background: isSel ? "var(--primary-dim)" : "transparent",
                border: `1px solid ${isSel ? "var(--border-glow)" : "var(--border-mid)"}`,
                borderRadius: "var(--rs)",
                color: "var(--text)",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              {isSel ? <CheckSquare size={14} color="var(--primary)" /> : <Square size={14} color="var(--text-3)" />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {e.patient ? `${e.patient.givenName} ${e.patient.familyName}` : "Unassigned"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {e.noteType.replace(/_/g, " ").toLowerCase()}{e.visitReason ? ` · ${e.visitReason}` : ""}
                </div>
              </div>
              {result && !result.ok && (
                <span className="badge badge-danger" title={result.error}>
                  failed
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected.size > 0 && !open && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button
            type="button"
            className="st-btn st-btn-primary press-key"
            onClick={() => setOpen(true)}
            style={{ width: "auto", display: "inline-flex" }}
          >
            <FileSignature size={14} /> Finalize {selected.size} note{selected.size === 1 ? "" : "s"}
          </button>
        </div>
      )}

      {open && (
        <div className="st-card" style={{ marginTop: 10, padding: 14 }}>
          <div className="form-label">Type your name to sign all {selected.size} notes</div>
          <input
            className="st-input"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            maxLength={200}
            placeholder="Dr. Karim Sidhom"
          />
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5 }}>
            One signature, applied to every selected note. Each finalize creates its own
            version snapshot and audit row — same guarantees as signing them one by one.
          </div>
          {error && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "flex-end" }}>
            <button type="button" className="st-btn st-btn-secondary st-btn-sm press" onClick={() => setOpen(false)} disabled={submitting} style={{ width: "auto" }}>
              <X size={12} /> Cancel
            </button>
            <button
              type="button"
              className="st-btn st-btn-primary st-btn-sm press-key"
              disabled={submitting || signature.trim().length < 2}
              onClick={submit}
              style={{ width: "auto", display: "inline-flex" }}
            >
              {submitting ? <Loader2 size={12} className="spin" /> : <FileSignature size={12} />}
              Sign {selected.size}
            </button>
          </div>
          {results && (
            <div style={{ marginTop: 10, fontSize: 12 }}>
              <strong style={{ color: "var(--success)" }}>{results.filter((r) => r.ok).length} signed</strong>
              {results.some((r) => !r.ok) && (
                <span style={{ color: "var(--danger)", marginLeft: 6 }}>
                  · {results.filter((r) => !r.ok).length} failed
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
