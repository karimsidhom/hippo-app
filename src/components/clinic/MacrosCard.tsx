"use client";

// Hippo Clinic — Macros management card.
//
// Sits on /clinic/settings. Lets the clinician add / edit / remove
// dot-phrases. Triggers are normalised lowercase and persisted via the
// useMacros hook (localStorage). Voice expansion + textarea expansion
// pick up the new entries the moment they're saved.

import { useState } from "react";
import { Plus, Trash2, Save, X, Sparkles } from "lucide-react";
import { useMacros, type Macro } from "@/hooks/useMacros";

export function MacrosCard() {
  const { macros, hydrated, upsert, remove } = useMacros();
  const [editing, setEditing] = useState<Macro | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  if (!hydrated) return null;

  return (
    <>
      <div className="section-title">Macros (dot-phrases)</div>
      <div className="st-card" style={{ marginBottom: 14, padding: 14 }}>
        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 10 }}>
          Type <code style={{ background: "var(--surface)", padding: "1px 4px", borderRadius: 3, fontSize: 11 }}>.bph</code> + space to expand into your saved phrasing. While recording,
          say <em>"period bph"</em> or <em>"dot bph"</em> and Hippo will swap it in for you.
        </div>

        {macros.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text-3)", padding: 12, border: "1px dashed var(--border-mid)", borderRadius: "var(--rs)" }}>
            No macros yet. Add one to get started.
          </div>
        )}

        {macros.map((m) => (
          <div key={m.trigger} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: 10, borderTop: "1px solid var(--border)",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                <code style={{ background: "var(--surface)", padding: "1px 5px", borderRadius: 3, color: "var(--primary-hi)" }}>
                  .{m.trigger}
                </code>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {m.expansion}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="chip press" onClick={() => setEditing(m)}>Edit</button>
              <button className="chip press" onClick={() => remove(m.trigger)} style={{ color: "var(--danger)" }}>
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button
            className="st-btn st-btn-secondary st-btn-sm press"
            onClick={() => setNewOpen(true)}
            style={{ width: "auto", display: "inline-flex" }}
          >
            <Plus size={12} /> Add macro
          </button>
        </div>
      </div>

      {(editing || newOpen) && (
        <MacroEditor
          initial={editing ?? null}
          onClose={() => { setEditing(null); setNewOpen(false); }}
          onSave={(m) => { upsert(m); setEditing(null); setNewOpen(false); }}
        />
      )}
    </>
  );
}

function MacroEditor({
  initial, onSave, onClose,
}: {
  initial: Macro | null;
  onSave: (m: Macro) => void;
  onClose: () => void;
}) {
  const [trigger, setTrigger] = useState(initial?.trigger ?? "");
  const [expansion, setExpansion] = useState(initial?.expansion ?? "");
  const [error, setError] = useState<string | null>(null);

  function validateAndSave() {
    const t = trigger.trim().toLowerCase();
    if (!/^[a-z0-9_-]{1,40}$/.test(t)) {
      setError("Trigger must be 1–40 chars: lowercase letters, digits, underscore, or hyphen.");
      return;
    }
    if (expansion.trim().length === 0) {
      setError("Expansion can't be empty.");
      return;
    }
    onSave({ trigger: t, expansion: expansion.trim() });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(6px)", zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="sheet-handle" />
        <div className="section-title">Macro</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "4px 0 14px" }}>
          {initial ? `Edit .${initial.trigger}` : "New macro"}
        </h3>

        <label className="form-label">Trigger (without the leading dot)</label>
        <input
          className="st-input"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          placeholder="bph"
          maxLength={40}
          disabled={!!initial}
        />

        <label className="form-label" style={{ marginTop: 12 }}>Expansion</label>
        <textarea
          className="st-input"
          value={expansion}
          onChange={(e) => setExpansion(e.target.value)}
          rows={6}
          style={{ resize: "vertical", lineHeight: 1.5 }}
          placeholder="Patient with BPH on tamsulosin 0.4 mg daily..."
        />

        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <Sparkles size={10} /> Voice trigger: "period {trigger || "bph"}" or "dot {trigger || "bph"}"
        </div>

        {error && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button className="st-btn st-btn-secondary press" onClick={onClose}>
            <X size={14} /> Cancel
          </button>
          <button className="st-btn st-btn-primary press-key" onClick={validateAndSave}>
            <Save size={14} /> Save macro
          </button>
        </div>
      </div>
    </div>
  );
}
