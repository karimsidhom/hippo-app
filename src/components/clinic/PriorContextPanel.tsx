"use client";

// Hippo Clinic — Prior context paste.
//
// Lets the clinician paste a prior consult, referral letter, or report
// as BACKGROUND for today's note. Stored on encounter.metadata so no
// schema migration is needed. The /generate route reads it back at note-
// generation time and the prompt frames it as reference-only.

import { useEffect, useState } from "react";
import { ClipboardPaste, Trash2, Save, Loader2, Check, FileText } from "lucide-react";

const MAX_CHARS = 16_000;

export function PriorContextPanel({
  encounterId,
  isFinalized,
}: {
  encounterId: string;
  isFinalized: boolean;
}) {
  const [text, setText] = useState("");
  const [hasContext, setHasContext] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/clinic/encounters/${encounterId}/prior-context`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: { priorContext: string | null }) => {
        if (j.priorContext) {
          setText(j.priorContext);
          setHasContext(true);
          setOpen(true);
        }
      })
      .catch(() => { /* silent — section just stays collapsed */ });
  }, [encounterId]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/encounters/${encounterId}/prior-context`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priorContext: text.trim() || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setHasContext(text.trim().length > 0);
      setSavedAt(Date.now());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function clearAll() {
    if (!confirm("Remove the saved prior context for this encounter?")) return;
    setText("");
    await fetch(`/api/clinic/encounters/${encounterId}/prior-context`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priorContext: null }),
    });
    setHasContext(false);
  }

  if (isFinalized) {
    // Finalized notes don't accept new context. Show what was used (if any)
    // so the audit story is intact, but read-only.
    if (!hasContext) return null;
    return (
      <section style={{ marginBottom: 22 }}>
        <div className="section-title" style={{ marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <FileText size={11} /> Prior context (used for generation)
        </div>
        <div className="st-card" style={{ padding: 12, maxHeight: 200, overflowY: "auto", fontSize: 12, color: "var(--text-2)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
          {text}
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div className="section-title" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <FileText size={11} /> Prior context
          {hasContext && <span className="badge badge-primary" style={{ marginLeft: 6 }}>saved</span>}
        </div>
        <button type="button" className="chip press" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : hasContext ? "Edit" : "Paste"}
        </button>
      </div>

      {!open && !hasContext && (
        <div className="st-card" style={{ padding: 10, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
          Paste a prior consult, referral, or report. The AI will use it as background for today's
          note — it won't copy old findings into the new note.
        </div>
      )}

      {open && (
        <div className="st-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8, lineHeight: 1.5 }}>
            <ClipboardPaste size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Pasted text becomes BACKGROUND for the AI. Today's transcript still drives the note;
            this just helps the model understand "what's the patient's story so far".
          </div>
          <textarea
            className="st-input"
            value={text}
            onChange={(e) => {
              const v = e.target.value;
              setText(v.length > MAX_CHARS ? v.slice(0, MAX_CHARS) : v);
            }}
            rows={8}
            maxLength={MAX_CHARS}
            placeholder={`Paste a prior consult letter, lab report, imaging report, or referral here…`}
            style={{ resize: "vertical", lineHeight: 1.5, fontSize: 12 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 10, color: "var(--text-3)" }}>
            <span>{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars</span>
            <span>Stored encrypted at rest, owner-only.</span>
          </div>
          {error && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}>{error}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 12 }}>
            {hasContext && (
              <button type="button" className="st-btn st-btn-secondary st-btn-sm press" onClick={clearAll} disabled={saving} style={{ width: "auto", display: "inline-flex" }}>
                <Trash2 size={12} /> Remove
              </button>
            )}
            {savedAt && Date.now() - savedAt < 4000 && (
              <span style={{ fontSize: 11, color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Check size={12} /> Saved
              </span>
            )}
            <button
              type="button"
              className="st-btn st-btn-primary st-btn-sm press-key"
              onClick={save}
              disabled={saving}
              style={{ width: "auto", display: "inline-flex" }}
            >
              {saving ? <Loader2 size={12} className="spin" /> : <Save size={12} />}
              Save context
            </button>
          </div>
        </div>
      )}
      <style>{`.spin { animation: spin 1s linear infinite; }`}</style>
    </section>
  );
}
