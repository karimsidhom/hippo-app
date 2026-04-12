"use client";

import { useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { VoiceTextarea } from "@/components/VoiceTextarea";
import type {
  DebriefParseResult,
  StructuredDebrief,
} from "@/lib/debrief/types";
import { parseStoredReflection } from "@/lib/debrief/types";

// ---------------------------------------------------------------------------
// DebriefSheet
//
// Post-op reflection capture flow:
//
//   1. Resident opens the sheet from a case row.
//   2. Records the debrief in one big voice/text input, answering three
//      prompts in any order: "what went well / do differently / work on".
//   3. Taps "Parse" → server calls Claude, returns the structured fields.
//   4. Reviews and edits the three fields inline.
//   5. Taps "Save debrief" → server writes back to CaseLog.reflection.
//
// The component is also the editor for existing debriefs — pass a case
// whose reflection already contains a StructuredDebrief and the sheet
// opens directly in the edit view.
// ---------------------------------------------------------------------------

interface CaseLike {
  id: string;
  procedureName: string;
  caseDate: string | Date;
  reflection?: string | null;
}

interface DebriefSheetProps {
  caseLog: CaseLike | null;
  open: boolean;
  onClose: () => void;
  /** Called after a successful save so the parent can refresh cached data. */
  onSaved?: (debrief: StructuredDebrief) => void;
}

type Phase = "input" | "review";

export function DebriefSheet({
  caseLog,
  open,
  onClose,
  onSaved,
}: DebriefSheetProps) {
  const [raw, setRaw] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [debrief, setDebrief] = useState<StructuredDebrief>({
    v: 2,
    wentWell: "",
    doBetter: "",
    workOn: "",
  });

  // When the sheet opens (or the underlying case changes), initialize state.
  // If the case already has a structured debrief, open directly in review
  // mode so the user can edit. Otherwise start in input mode.
  useEffect(() => {
    if (!open || !caseLog) return;
    const parsed = parseStoredReflection(caseLog.reflection);
    setError(null);
    setWarning(null);
    setLoading(false);
    setSaving(false);
    if (parsed.structured) {
      setDebrief(parsed.structured);
      setRaw(parsed.structured.raw ?? "");
      setPhase("review");
    } else {
      setDebrief({ v: 2, wentWell: "", doBetter: "", workOn: "" });
      setRaw(parsed.freeform ?? "");
      setPhase("input");
    }
  }, [open, caseLog]);

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !caseLog) return null;

  const handleParse = async () => {
    const trimmed = raw.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const res = await fetch("/api/debrief", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: caseLog.id, raw: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Parse failed (${res.status})`);
      }
      const json = (await res.json()) as DebriefParseResult;
      setDebrief(json.debrief);
      if (json.engine === "unavailable" && json.warnings?.[0]) {
        setWarning(json.warnings[0]);
      }
      setPhase("review");
    } catch (err) {
      console.error("Debrief parse failed", err);
      setError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!debrief.wentWell && !debrief.doBetter && !debrief.workOn) {
      setError("Add at least one field before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/debrief", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caseId: caseLog.id,
          debrief: { ...debrief, raw },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Save failed (${res.status})`);
      }
      const json = (await res.json()) as {
        ok: true;
        debrief: StructuredDebrief;
      };
      onSaved?.(json.debrief);
      onClose();
    } catch (err) {
      console.error("Debrief save failed", err);
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const dateLabel =
    typeof caseLog.caseDate === "string"
      ? new Date(caseLog.caseDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : caseLog.caseDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
      }}
      onClick={onClose}
    >
      <div
        className="glass-elevated"
        style={{
          background: "var(--surface)",
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUp .25s cubic-bezier(.16,1,.3,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px 14px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MessageSquare size={14} style={{ color: "#c4b5fd" }} />
              Post-Op Debrief
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {caseLog.procedureName} — {dateLabel}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "var(--glass-mid)",
              border: "1px solid var(--border-glass)",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px" }}>
          {phase === "input" ? (
            <InputPhase
              raw={raw}
              setRaw={setRaw}
              onParse={handleParse}
              loading={loading}
              error={error}
            />
          ) : (
            <ReviewPhase
              debrief={debrief}
              setDebrief={setDebrief}
              warning={warning}
              error={error}
              saving={saving}
              onSave={handleSave}
              onBack={() => setPhase("input")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Input phase -----------------------------------------------------

interface InputPhaseProps {
  raw: string;
  setRaw: (v: string) => void;
  onParse: () => void;
  loading: boolean;
  error: string | null;
}

function InputPhase({
  raw,
  setRaw,
  onParse,
  loading,
  error,
}: InputPhaseProps) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-3)",
          marginBottom: 10,
          lineHeight: 1.6,
        }}
      >
        Tap the mic and speak, or type — answer all three in any order:
        <span
          style={{
            display: "block",
            marginTop: 6,
            color: "var(--text-2)",
            fontWeight: 500,
          }}
        >
          What went well? What would you do differently? What to work on?
        </span>
      </div>

      <VoiceTextarea
        value={raw}
        onChange={setRaw}
        placeholder="e.g. Cystic artery clipped cleanly. Next time grab the fundus higher. Work on 2-handed dissection."
        disabled={loading}
        rows={6}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onParse();
          }
        }}
      />

      <div
        style={{
          marginTop: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
          ⌘↵ to parse
        </div>
        <button
          onClick={onParse}
          disabled={loading || !raw.trim()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: loading
              ? "rgba(168,85,247,0.16)"
              : "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(59,130,246,0.18))",
            border: "1px solid rgba(168,85,247,0.4)",
            borderRadius: 8,
            color: loading ? "var(--muted)" : "#c4b5fd",
            fontSize: 12,
            fontWeight: 600,
            cursor: loading || !raw.trim() ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: !raw.trim() && !loading ? 0.5 : 1,
          }}
        >
          <Sparkles size={12} />
          {loading ? "Parsing…" : "Parse debrief"}
          {!loading && <ArrowRight size={12} />}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 6,
            background: "rgba(220,38,38,0.1)",
            border: "1px solid rgba(220,38,38,0.3)",
            fontSize: 11,
            color: "#fca5a5",
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ lineHeight: 1.5 }}>{error}</span>
        </div>
      )}
    </div>
  );
}

// ---------- Review phase ----------------------------------------------------

interface ReviewPhaseProps {
  debrief: StructuredDebrief;
  setDebrief: (d: StructuredDebrief) => void;
  warning: string | null;
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
}

function ReviewPhase({
  debrief,
  setDebrief,
  warning,
  error,
  saving,
  onSave,
  onBack,
}: ReviewPhaseProps) {
  const update = (field: keyof StructuredDebrief, value: string) => {
    setDebrief({ ...debrief, [field]: value });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {warning && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            fontSize: 11,
            color: "#fde68a",
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            lineHeight: 1.5,
          }}
        >
          <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{warning}</span>
        </div>
      )}

      <DebriefField
        label="What went well"
        value={debrief.wentWell}
        onChange={(v) => update("wentWell", v)}
      />
      <DebriefField
        label="What to do differently"
        value={debrief.doBetter}
        onChange={(v) => update("doBetter", v)}
      />
      <DebriefField
        label="What to work on"
        value={debrief.workOn}
        onChange={(v) => update("workOn", v)}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid var(--border)",
          paddingTop: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            fontSize: 11,
            color: "var(--muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontFamily: "inherit",
          }}
        >
          Back to dictation
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: saving
              ? "rgba(16,185,129,0.12)"
              : "rgba(16,185,129,0.14)",
            border: "1px solid rgba(16,185,129,0.35)",
            borderRadius: 8,
            color: "var(--success)",
            fontSize: 12,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          <CheckCircle2 size={12} />
          {saving ? "Saving…" : "Save debrief"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            background: "rgba(220,38,38,0.1)",
            border: "1px solid rgba(220,38,38,0.3)",
            fontSize: 11,
            color: "#fca5a5",
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ lineHeight: 1.5 }}>{error}</span>
        </div>
      )}
    </div>
  );
}

function DebriefField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="(empty)"
        style={{
          width: "100%",
          fontFamily: "inherit",
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--text)",
          background: "var(--glass-lo)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 10,
          resize: "vertical",
          outline: "none",
        }}
      />
    </div>
  );
}
