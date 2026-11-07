"use client";

// Hippo Clinic — ConsentSheet.
//
// Modal capture of the patient's consent state. Three positive paths
// (verbal, written, not required) and one declined path. If declined,
// the recorder is disabled and the encounter is forced to TYPED mode.

import { useState } from "react";
import type { ClinicConsentMode } from "@/lib/clinic/types";

const DEFAULT_TEXT =
  "I have explained that an AI scribe will record this visit to help draft the clinical note. The clinician remains responsible for the accuracy of the record. The patient has had the opportunity to ask questions and may opt out at any time.";

export function ConsentSheet({
  encounterId,
  initialMode,
  initialText,
  deferSave,
  onCaptured,
  onClose,
}: {
  encounterId: string;
  initialMode?: ClinicConsentMode | null;
  initialText?: string | null;
  /**
   * When true, the sheet does NOT hit the consent API. Instead it returns
   * the captured mode + text via `onCaptured`, and the caller is
   * responsible for persisting it. Used by the New Note wizard before
   * an encounter row exists in the DB — without this, the wizard
   * POSTs to /api/clinic/encounters/pending/consent and gets a 404
   * "Not found" because the encounter hasn't been created yet.
   */
  deferSave?: boolean;
  /** Receives both the mode AND the wording, so callers can persist later. */
  onCaptured: (mode: ClinicConsentMode, text: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ClinicConsentMode>(initialMode ?? "VERBAL");
  const [text, setText] = useState<string>(initialText && initialText.trim() ? initialText : DEFAULT_TEXT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      // Local-capture path: the encounter doesn't exist yet (e.g. the
      // New Note wizard). Hand the captured values back to the caller
      // and let them persist after the encounter is created.
      // We also auto-detect the "pending" / empty sentinel so callers
      // that forget to pass deferSave still get the right behaviour
      // instead of a 404.
      if (deferSave || !encounterId || encounterId === "pending") {
        onCaptured(mode, text);
        onClose();
        return;
      }
      const res = await fetch(`/api/clinic/encounters/${encounterId}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text }),
      });
      if (!res.ok) {
        // 404 on consent should never block the clinician — they may
        // be on a stale bundle that's still pointing at an old encounter
        // id, or the route returned 404 because the encounter row hasn't
        // committed yet. Fall back to a local capture so they can keep
        // moving; the encounter detail page re-saves consent on its
        // own refresh path.
        if (res.status === 404) {
          onCaptured(mode, text);
          onClose();
          return;
        }
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      onCaptured(mode, text);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(6px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520 }}
      >
        <div className="sheet-handle" />
        <div className="section-title">Patient consent</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "4px 0 14px" }}>
          Capture how this patient consented
        </h3>

        <div className="chip-group" style={{ marginBottom: 14 }}>
          <Chip selected={mode === "VERBAL"}        onClick={() => setMode("VERBAL")}        label="Verbal" />
          <Chip selected={mode === "WRITTEN"}       onClick={() => setMode("WRITTEN")}       label="Written" />
          <Chip selected={mode === "NOT_REQUIRED"}  onClick={() => setMode("NOT_REQUIRED")}  label="Not required" />
          <Chip selected={mode === "DECLINED"}      onClick={() => setMode("DECLINED")}      label="Declined" tone="danger" />
        </div>

        <label className="form-label">Wording shown / said</label>
        <textarea
          className="st-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          style={{ resize: "vertical", minHeight: 100 }}
        />

        {mode === "DECLINED" && (
          <div className="st-card" style={{ marginTop: 12, borderLeft: "2px solid var(--danger)" }}>
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
              The recorder will be disabled. You can still type or paste a note manually for this encounter.
            </div>
          </div>
        )}

        {error && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button className="st-btn st-btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="st-btn st-btn-primary press-key" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save consent"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ selected, onClick, label, tone }: { selected: boolean; onClick: () => void; label: string; tone?: "danger" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip ${selected ? "selected" : ""}`}
      style={tone === "danger" && selected ? { background: "rgba(239,68,68,.1)", color: "#F87171", borderColor: "rgba(239,68,68,.3)" } : undefined}
    >
      {label}
    </button>
  );
}
