"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Download, X, Trash2, FileText, Copy, Check, Edit3, Save, RotateCcw, Sliders, Sparkles, AlertTriangle, MessageSquare, MessagesSquare, Plus, Printer } from "lucide-react";
import { DebriefSheet } from "@/components/DebriefSheet";
import { PaywallModal } from "@/components/PaywallModal";
import { QuickAddModal } from "@/components/cases/QuickAddModal";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { parseStoredReflection } from "@/lib/debrief/types";
import { useCases } from "@/hooks/useCases";
import { CaseLog } from "@/lib/types";
// NOTE: import directly from the operative builder + learn module rather
// than the @/lib/dictation barrel. The barrel re-exports the revision
// engine (revise.ts → llm.ts) which has no business in a client bundle.
// Going direct keeps the client graph small and avoids hydration surprises.
import { generateDictation, resolveServiceFromCase } from "@/lib/dictation/operative";
import { useDictationPreferences } from "@/lib/dictation/use-preferences";
// Note: dictation quality assessment was removed from the UI but the engine
// is preserved in @/lib/dictation/quality for internal use by the LLM
// polish step's safety net (see src/lib/dictation/revise.ts).
import { applyUserCorrection } from "@/lib/dictation/style/learn";
import { BillingOverlayPanel } from "@/components/dictation/BillingOverlayPanel";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { filterLedgerCases, getLedgerRoleOptions, getLedgerYearOptions, summarizeLedgerCases } from "@/lib/case-ledger";

const APPROACHES = ["All", "Open", "Laparoscopic", "Robotic", "Endoscopic", "Percutaneous", "Hybrid", "Other"];

function approachDot(approach: string): string {
  const m: Record<string, string> = {
    ROBOTIC: "#0EA5E9", LAPAROSCOPIC: "#38BDF8", OPEN: "#F59E0B",
    ENDOSCOPIC: "#64748B", HYBRID: "#10B981", PERCUTANEOUS: "#F97316",
    Robotic: "#0EA5E9", Laparoscopic: "#38BDF8", Open: "#F59E0B",
    Endoscopic: "#64748B", Hybrid: "#10B981", Percutaneous: "#F97316",
  };
  return m[approach] ?? "#334155";
}

/** 54 → "54m"; 186 → "3h 06m". Tabular figures keep the column aligned. */
function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, "0")}m`;
}

const AUTONOMY_LABELS: Record<string, string> = {
  OBSERVER: "Observer", ASSISTANT: "Assistant",
  SUPERVISOR_PRESENT: "Supervisor Present", INDEPENDENT: "Independent", TEACHING: "Teaching",
};
const OUTCOME_LABELS: Record<string, string> = {
  UNCOMPLICATED: "Uncomplicated", MINOR_COMPLICATION: "Minor Complication",
  MAJOR_COMPLICATION: "Major Complication", REOPERATION: "Reoperation",
  DEATH: "Death", UNKNOWN: "Unknown",
};
const APPROACH_LABELS: Record<string, string> = {
  OPEN: "Open", LAPAROSCOPIC: "Laparoscopic", ROBOTIC: "Robotic",
  ENDOSCOPIC: "Endoscopic", HYBRID: "Hybrid", PERCUTANEOUS: "Percutaneous", OTHER: "Other",
};

/**
 * Hippo Pulse: start a case discussion. Only the procedure and the diagnosis
 * category travel, never the date, site, attending or anything about the
 * patient; Pulse checks the post for identifiers again before it goes up.
 */
function pulseCaseUrl(c: CaseLog): string {
  const q = new URLSearchParams({ type: "case", procedure: c.procedureName ?? "", dx: c.diagnosisCategory ?? "" });
  return `https://pulse.hippomedicine.com/compose?${q.toString()}`;
}

function Sheet({
  c, onClose, onDelete, onDebrief, onDictate,
}: {
  c: CaseLog;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDebrief: (c: CaseLog) => void;
  onDictate: (c: CaseLog) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dialogRef = useDialogFocus<HTMLDivElement>();

  // Escape closes. A sheet you can't dismiss from the keyboard is a sheet
  // that fails the first accessibility pass.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rail = approachDot(c.surgicalApproach);
  const date = new Date(c.caseDate);

  // The figures that belong above the fold: how long, how hard, how much of
  // it was yours. Robotic cases add console and docking time.
  const figures: [string, string][] = [
    ...(c.operativeDurationMinutes
      ? [["OR time", formatDuration(c.operativeDurationMinutes)] as [string, string]]
      : []),
    ...(c.consoleTimeMinutes
      ? [["Console", formatDuration(c.consoleTimeMinutes)] as [string, string]]
      : []),
    ...(c.dockingTimeMinutes
      ? [["Docking", formatDuration(c.dockingTimeMinutes)] as [string, string]]
      : []),
  ];

  // Everything else, as a definition list. Empty values are dropped rather
  // than rendered as blank rows.
  const facts: [string, string | null | undefined][] = [
    ["Role",         c.role],
    ["Autonomy",     AUTONOMY_LABELS[c.autonomyLevel] ?? c.autonomyLevel],
    ["Approach",     APPROACH_LABELS[c.surgicalApproach] ?? c.surgicalApproach],
    ["Specialty",    c.specialtyName ?? c.specialtyId],
    ["Diagnosis",    c.diagnosisCategory],
    ["Outcome",      OUTCOME_LABELS[c.outcomeCategory] ?? c.outcomeCategory],
    ["Complication", c.complicationCategory === "NONE" ? null : c.complicationCategory],
    ["Attending",    c.attendingLabel],
    ["Site",         c.institutionSite],
  ];

  const prose: [string, string | null][] = [
    ["Notes",      c.notes],
    ["Reflection", parseStoredReflection(c.reflection).freeform],
  ];

  return (
    <div className="case-sheet-scrim" onClick={onClose}>
      <div
        className="case-sheet"
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={c.procedureName}
        onClick={e => e.stopPropagation()}
      >
        {/* Hairline of approach colour across the top — the same signal the
            row rail carries, so the sheet reads as that row expanded. */}
        <div className="case-sheet__rail" style={{ background: rail }} />

        <header className="case-sheet__head">
          <div style={{ minWidth: 0 }}>
            <h2 className="case-sheet__title">{c.procedureName}</h2>
            <div className="case-sheet__sub">
              {date.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              {c.institutionSite ? ` · ${c.institutionSite}` : ""}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </header>

        <div className="case-sheet__body">
          {(figures.length > 0 || c.difficultyScore) && (
            <div className="case-sheet__figures">
              {figures.map(([k, v]) => (
                <div className="case-sheet__figure" key={k}>
                  <div className="case-sheet__figure-value">{v}</div>
                  <div className="case-sheet__figure-label">{k}</div>
                </div>
              ))}
              <div className="case-sheet__figure">
                <div className="case-sheet__figure-value">
                  <span className="pip-meter" aria-label={`Difficulty ${c.difficultyScore} of 5`}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <i key={n} data-on={n <= c.difficultyScore} />
                    ))}
                  </span>
                </div>
                <div className="case-sheet__figure-label">Difficulty</div>
              </div>
            </div>
          )}

          <dl className="case-sheet__facts">
            {facts.filter(([, v]) => v != null && v !== "").map(([k, v]) => (
              <div className="case-sheet__fact" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          {prose.filter(([, v]) => v).map(([k, v]) => (
            <section className="case-sheet__prose" key={k}>
              <h3>{k}</h3>
              <p>{v}</p>
            </section>
          ))}

          {c.tags.length > 0 && (
            <div className="case-sheet__tags">
              {c.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          )}
        </div>

        <footer className="case-sheet__foot">
          {/* These three are the ONLY route to debrief and dictation on a
              phone — the row actions are pointer-only by design. */}
          <button className="case-sheet__action" onClick={() => onDebrief(c)}>
            <MessageSquare size={14} strokeWidth={1.7} />
            <span>Debrief</span>
          </button>
          <button className="case-sheet__action" onClick={() => onDictate(c)}>
            <FileText size={14} strokeWidth={1.7} />
            <span>Dictation</span>
          </button>
          <a className="case-sheet__action" href={pulseCaseUrl(c)} target="_blank" rel="noopener noreferrer">
            <MessagesSquare size={14} strokeWidth={1.7} />
            <span>Discuss on Pulse</span>
          </a>

          <div className="case-sheet__foot-spacer" />

          {!confirmDelete ? (
            <button
              className="case-sheet__action case-sheet__action--danger"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete case"
            >
              <Trash2 size={14} strokeWidth={1.7} />
            </button>
          ) : (
            <div className="case-sheet__confirm">
              <button className="case-sheet__action" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button
                className="case-sheet__action case-sheet__action--destroy"
                onClick={() => { onDelete(c.id); onClose(); }}
              >
                Delete case
              </button>
            </div>
          )}
          {confirmDelete && <p className="case-sheet__notice" role="status">Delete this case from your logbook? This cannot be undone.</p>}
        </footer>
      </div>
    </div>
  );
}


function DictationSheet({ c, onClose }: { c: CaseLog; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const { preferences } = useDictationPreferences();
  // Guard the generator so a malformed case can never crash the whole
  // page tree. Falls back to a bracketed placeholder the user can edit.
  const draft = useMemo(() => {
    try {
      return generateDictation(c, preferences);
    } catch (err) {
      console.error("generateDictation failed for case", c?.id, err);
      return `[Unable to generate dictation for this case — ${
        err instanceof Error ? err.message : "unknown error"
      }]`;
    }
  }, [c, preferences]);
  const [value, setValue] = useState(draft);
  const [editing, setEditing] = useState(false);

  // Dictation quality assessment is no longer surfaced in the UI; the
  // polish-step safety net inside reviseDictation() still uses it
  // internally to detect summarisation regressions.

  // Claude Opus 4.6 polish — server route holds the API key.
  const [polishing, setPolishing] = useState(false);
  const [polishError, setPolishError] = useState<string | null>(null);
  // Snapshot of the pre-polish text so the user can revert if they don't
  // like the rewrite. When null, the current value is the original draft.
  const [prePolish, setPrePolish] = useState<string | null>(null);
  // True once Claude actually returned a polished note (not the deterministic
  // fallback). Drives the "AI-polished — verify before signing" banner.
  const [polishedByClaude, setPolishedByClaude] = useState(false);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  // Reset the editor whenever the underlying case changes so a freshly-opened
  // sheet always starts on the newest draft.
  useEffect(() => {
    setValue(draft);
    setEditing(false);
    setPrePolish(null);
    setPolishedByClaude(false);
    setFallbackUsed(false);
    setPolishError(null);
  }, [draft]);

  const dirty = value !== draft;

  const handlePolish = async () => {
    if (polishing) return;
    setPolishing(true);
    setPolishError(null);
    const snapshot = value;
    try {
      const res = await fetch("/api/dictation/revise", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rough: value,
          service: resolveServiceFromCase(c),
          length: "full",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Polish failed (${res.status})`);
      }
      const json = (await res.json()) as {
        text: string;
        engine: "claude-opus-4-6" | "deterministic-fallback";
        warnings?: string[];
      };
      setPrePolish(snapshot);
      setValue(json.text);
      setPolishedByClaude(json.engine === "claude-opus-4-6");
      setFallbackUsed(json.engine === "deterministic-fallback");
      if (json.engine === "deterministic-fallback") {
        setPolishError(
          json.warnings?.[0] ?? "AI polish unavailable — showing style-adjusted draft.",
        );
      }
    } catch (err) {
      console.error("Polish failed", err);
      setPolishError(err instanceof Error ? err.message : "Polish failed");
    } finally {
      setPolishing(false);
    }
  };

  const handleUndoPolish = () => {
    if (prePolish === null) return;
    setValue(prePolish);
    setPrePolish(null);
    setPolishedByClaude(false);
    setFallbackUsed(false);
    setPolishError(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAndLearn = () => {
    if (!dirty) return;
    try {
      applyUserCorrection({
        noteType: "operative",
        service: resolveServiceFromCase(c),
        draft,
        corrected: value,
      });
      setSaved(true);
      setEditing(false);
      // Polishing is "committed" once we learn from it — drop the revert snapshot.
      setPrePolish(null);
      setPolishedByClaude(false);
      setFallbackUsed(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save correction", err);
    }
  };

  const handleRevert = () => {
    setValue(draft);
    setEditing(false);
    setPrePolish(null);
    setPolishedByClaude(false);
    setFallbackUsed(false);
    setPolishError(null);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
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
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px 14px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={14} style={{ color: "var(--primary)" }} />
              Operative Dictation
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span>{c.procedureName} &mdash; {new Date(c.caseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              {/*
                Quality-status pill removed per user request — the new
                template registry guarantees every templated procedure
                produces a complete operative note, and the prose-builder
                fallback is itself textbook-grade. The "missing critical
                details" banner was a leftover from an older era of the
                engine and was creating noise rather than signal.
              */}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px",
                  background: "var(--glass-mid)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: 6,
                  color: "var(--primary-hi)",
                  fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <Edit3 size={12} /> Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveAndLearn}
                  disabled={!dirty}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px",
                    background: saved ? "rgba(16,185,129,0.12)" : (dirty ? "rgba(14,165,233,0.12)" : "var(--glass-mid)"),
                    border: `1px solid ${saved ? "rgba(16,185,129,0.28)" : (dirty ? "rgba(14,165,233,0.28)" : "var(--border-glass)")}`,
                    borderRadius: 6,
                    color: saved ? "var(--success)" : (dirty ? "var(--primary-hi)" : "var(--muted)"),
                    fontSize: 11, fontWeight: 600,
                    cursor: dirty ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    opacity: dirty || saved ? 1 : 0.55,
                  }}
                >
                  {saved ? <><Check size={12} /> Learned</> : <><Save size={12} /> Save &amp; Learn</>}
                </button>
                <button
                  onClick={handleRevert}
                  disabled={!dirty}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px",
                    background: "var(--glass-mid)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: 6,
                    color: "var(--text-3)",
                    fontSize: 11, fontWeight: 600,
                    cursor: dirty ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    opacity: dirty ? 1 : 0.55,
                  }}
                >
                  <RotateCcw size={12} /> Revert
                </button>
              </>
            )}
            {/* Polish (Claude Opus 4.6) */}
            {prePolish !== null && polishedByClaude && !polishing ? (
              <button
                onClick={handleUndoPolish}
                title="Revert to the pre-polish draft"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px",
                  background: "var(--glass-mid)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: 6,
                  color: "var(--text-3)",
                  fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <RotateCcw size={12} /> Undo polish
              </button>
            ) : (
              <button
                onClick={handlePolish}
                disabled={polishing || !value.trim()}
                title="Polish with Claude Opus 4.6, pinned to your style profile"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px",
                  background: polishing
                    ? "var(--primary-glow)"
                    : "var(--primary-dim)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: 6,
                  color: polishing ? "var(--text-3)" : "var(--primary-hi)",
                  fontSize: 11, fontWeight: 600,
                  cursor: polishing || !value.trim() ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: polishing || !value.trim() ? 0.7 : 1,
                  transition: "all .15s",
                }}
              >
                <Sparkles size={12} />
                {polishing ? "Polishing…" : "Polish"}
              </button>
            )}

            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px",
                background: copied ? "rgba(16,185,129,0.1)" : "var(--glass-mid)",
                border: `1px solid ${copied ? "rgba(16,185,129,0.25)" : "var(--border-glass)"}`,
                borderRadius: 6,
                color: copied ? "var(--success)" : "var(--primary-hi)",
                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                transition: "all .15s",
              }}
            >
              {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "var(--text-3)" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* AI polish banner */}
        {polishedByClaude && prePolish !== null && (
          <div style={{
            padding: "8px 20px",
            background: "var(--primary-dim)",
            borderBottom: "1px solid var(--border-glass)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}>
            <Sparkles size={12} style={{ color: "var(--primary-hi)", flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "#e9d5ff", flex: 1, lineHeight: 1.5 }}>
              <strong style={{ color: "#f5f3ff" }}>AI-polished draft.</strong>{" "}
              Review every line before signing — verify all facts, numbers, and findings match the case.
            </div>
          </div>
        )}
        {polishError && !polishedByClaude && (
          <div style={{
            padding: "8px 20px",
            background: "rgba(239,68,68,0.08)",
            borderBottom: "1px solid rgba(239,68,68,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}>
            <AlertTriangle size={12} style={{ color: "#f87171", flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "#fecaca", flex: 1, lineHeight: 1.5 }}>
              {polishError}
            </div>
            <button
              onClick={() => setPolishError(null)}
              style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: "#fecaca" }}
            >
              <X size={12} />
            </button>
          </div>
        )}
        {fallbackUsed && (
          <div style={{
            padding: "8px 20px",
            background: "rgba(245,158,11,0.08)",
            borderBottom: "1px solid rgba(245,158,11,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}>
            <AlertTriangle size={12} style={{ color: "#fbbf24", flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "#fde68a", flex: 1, lineHeight: 1.5 }}>
              AI polish unavailable — applied your saved style rules locally instead.
            </div>
          </div>
        )}

        {/* Manitoba Billing Overlay */}
        <BillingOverlayPanel caseLog={c} />

        {/* Body */}
        <div style={{
          overflowY: "auto",
          flex: 1,
          padding: "16px 20px",
        }}>
          {editing ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              spellCheck={false}
              style={{
                width: "100%",
                minHeight: "55vh",
                fontFamily: "'Geist Mono', monospace",
                fontSize: 12,
                lineHeight: 1.7,
                color: "var(--text)",
                background: "var(--glass-lo)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 12,
                resize: "vertical",
                outline: "none",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            />
          ) : (
            <pre
              onDoubleClick={() => setEditing(true)}
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: 12,
                lineHeight: 1.7,
                color: "var(--text)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
                cursor: "text",
              }}
              title="Double-click to edit"
            >
              {value}
            </pre>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: "10px 20px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", flex: 1 }}>
            {editing
              ? "Edit freely. Save & Learn teaches the style profile from your changes."
              : "Copy and paste into your dictation system, or click Edit to refine and teach."}
          </div>
          <Link
            href="/settings/dictation"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "var(--text-3)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            title="Adjust dictation style preferences"
          >
            <Sliders size={11} />
            Style
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CasesPage() {
  const { cases, deleteCase, updateCase } = useCases();
  const [search, setSearch]         = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [approach, setApproach]     = useState("All");
  const [role, setRole]             = useState("All");
  const [year, setYear]             = useState("All");
  const [expanded, setExpanded]     = useState<CaseLog | null>(null);
  const [dictation, setDictation]   = useState<CaseLog | null>(null);
  const [debrief, setDebrief]       = useState<CaseLog | null>(null);
  const [exporting, setExporting]   = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [pdfPaywall, setPdfPaywall] = useState(false);
  const { isPro } = useSubscription();
  // Case notes link back here as /cases?case=<id>; open that case's sheet,
  // but only for the signed-in owner's own record.
  const { user } = useAuth();
  const openedLinkedCase = useRef<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("case");
    if (!id || openedLinkedCase.current === id) return;
    const ownCase = cases.find(entry => entry.id === id && entry.userId === user?.id);
    if (ownCase) { openedLinkedCase.current = id; setExpanded(ownCase); }
  }, [cases, user?.id]);

  const years = useMemo(() => getLedgerYearOptions(cases), [cases]);
  const roles = useMemo(() => getLedgerRoleOptions(cases), [cases]);
  const filtered = useMemo(() => filterLedgerCases(cases, { search, approach, role, year }), [cases, search, approach, role, year]);

  const hasFilters = approach !== "All" || role !== "All";
  const isRefined = hasFilters || year !== "All" || !!search.trim();
  const clearFilters = () => { setSearch(""); setApproach("All"); setRole("All"); setYear("All"); };

  // ── Masthead aggregates ────────────────────────────────────────────────
  // Three figures only. A logbook answers "how much, how long, how much of
  // it was mine" — anything past that belongs on Stats.
  const summary = useMemo(() => summarizeLedgerCases(filtered), [filtered]);

  // ── Month grouping ─────────────────────────────────────────────────────
  // `filtered` is already sorted newest-first, so Map insertion order gives
  // the groups in the right order for free.
  const groups = useMemo(() => {
    const byMonth = new Map<string, CaseLog[]>();
    for (const c of filtered) {
      const d   = new Date(c.caseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const bucket = byMonth.get(key);
      if (bucket) bucket.push(c);
      else byMonth.set(key, [c]);
    }
    return [...byMonth.entries()].map(([key, items]) => {
      const d = new Date(items[0].caseDate);
      return {
        key,
        month:   d.toLocaleDateString("en-CA", { month: "long" }),
        year:    d.getFullYear(),
        items,
        minutes: items.reduce((t, c) => t + (c.operativeDurationMinutes ?? 0), 0),
      };
    });
  }, [filtered]);

  const thisYear = new Date().getFullYear();

  if (cases.length === 0) {
    return (
      <div className="case-ledger">
        <div className="ledger-head">
          <div><p className="ledger-eyebrow">Your operative record</p><h1 className="ledger-title">Cases</h1></div>
        </div>
        <div className="ledger-empty">
          <div className="ledger-empty__title">Your logbook starts empty.</div>
          <div className="ledger-empty__text">
            Log a case the day you do it — a minute in the lounge beats an hour
            reconstructing a month from memory.
          </div>
          <ul className="ledger-empty__list">
            <li>Quick-add captures procedure, role, and approach in about ten seconds.</li>
            <li>OR times build your learning curve for each procedure.</li>
            <li>Autonomy level is what turns a list into evidence of progression.</li>
          </ul>
          <button
            onClick={() => setQuickAddOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              marginTop: 6,
              padding: "10px 16px",
              background: "var(--primary-solid)", color: "#fff",
              border: "none", borderRadius: "var(--r)",
              fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              letterSpacing: "-.005em",
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Log your first case
          </button>
        </div>
        <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      </div>
    );
  }

  return (
    <div className="case-ledger">
      {/* ── Masthead ───────────────────────────────────────────────────── */}
      <div className="ledger-head">
        <div>
          <p className="ledger-eyebrow">Your operative record</p>
          <h1 className="ledger-title">Cases</h1>
          <p className="ledger-description">Every case. A clearer picture of your progress.</p>
        </div>
        <div className="ledger-tools">
          <button
            className="icon-btn"
            title="Open the printable logbook in a new tab"
            aria-label="Open printable logbook"
            onClick={() => {
              if (!isPro) { setPdfPaywall(true); return; }
              window.open("/cases/logbook-print", "_blank", "noopener,noreferrer");
            }}
          >
            <Printer size={15} strokeWidth={1.6} />
          </button>
          <button
            className="icon-btn"
            disabled={exporting}
            title="Export every case to .xlsx"
            aria-label="Export to xlsx"
            style={exporting ? { opacity: 0.5, cursor: "wait" } : undefined}
            onClick={async () => {
              setExporting(true);
              setExportError(null);
              try {
                const res = await fetch('/api/export', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                if (!res.ok) throw new Error('Export failed');
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Hippo-Export-${new Date().toISOString().slice(0, 10)}.xlsx`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch { setExportError('Export failed. Your cases are unchanged. Please try again.'); }
              finally { setExporting(false); }
            }}
          >
            <Download size={15} strokeWidth={1.6} />
          </button>
          <button className="ledger-primary ledger-primary--desktop" onClick={() => setQuickAddOpen(true)}><Plus size={15} /> Log a case</button>
        </div>
      </div>

      {exportError && <p className="ledger-error" role="alert">{exportError}</p>}

      {/* ── Aggregate strip ────────────────────────────────────────────── */}
      <div className="ledger-summary">
        <div className="ledger-stat">
          <div className="ledger-stat__value">{summary.count.toLocaleString()}</div>
          <div className="ledger-stat__label">{isRefined ? "Matching cases" : "Cases logged"}</div>
        </div>
        <div className="ledger-stat">
          <div className="ledger-stat__value">{summary.hours.toLocaleString(undefined, { maximumFractionDigits: 1 })}<small>h</small></div>
          <div className="ledger-stat__label">In the OR</div>
        </div>
        <div className="ledger-stat">
          <div className="ledger-stat__value">{summary.independentRate}<small>%</small></div>
          <div className="ledger-stat__label" title="Cases logged as independent or teaching">Independent / teaching</div>
        </div>
      </div>

      <PaywallModal
        open={pdfPaywall}
        onClose={() => setPdfPaywall(false)}
        feature="logbookPdf"
        headline="Download your logbook as a PDF"
        body="One branded, PHIA-safe document — ready for fellowship applications, job interviews, or end-of-year reviews."
      />

      {/* ── Sticky toolbar: search · years · filters ───────────────────── */}
      <div className="ledger-toolbar">
        <div className="ledger-search">
          <Search size={14} strokeWidth={1.8} />
          <input
            placeholder="Search procedures"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search procedures"
          />
          {search && (
            <button
              className="ledger-search__clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {years.length > 1 && (
          <div className="seg" role="group" aria-label="Filter by year">
            {years.map(y => (
              <button
                key={y}
                aria-pressed={year === y}
                data-selected={year === y}
                className="seg__item"
                onClick={() => setYear(y)}
              >
                {y === "All" ? "All" : y === String(thisYear) ? "This year" : y}
              </button>
            ))}
          </div>
        )}

        <button
          className="filter-toggle"
          data-on={filterOpen || hasFilters}
          aria-label="Filter cases"
          aria-controls="case-filters"
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <Sliders size={13} strokeWidth={1.8} />
          <span className="filter-toggle__label">Filters</span>
          {hasFilters && <span className="filter-toggle__dot" />}
        </button>
      </div>

      {/* ── Filter drawer ──────────────────────────────────────────────── */}
      {filterOpen && <div id="case-filters" className="filter-drawer" data-open="true">
        <div className="filter-drawer__inner">
          <div className="filter-drawer__body">
            <div className="form-label">Approach</div>
            <div className="chip-group" style={{ marginBottom: 14 }}>
              {APPROACHES.map(a => (
                <button key={a} aria-pressed={approach === a} className={`chip${approach === a ? " selected" : ""}`} onClick={() => setApproach(a)}>{a}</button>
              ))}
            </div>
            <div className="form-label">Role</div>
            <div className="chip-group">
              {roles.map(r => (
                <button key={r} aria-pressed={role === r} className={`chip${role === r ? " selected" : ""}`} onClick={() => setRole(r)}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      </div>}

      <div className="ledger-results">
        <span role="status" aria-live="polite">{isRefined ? `${filtered.length} of ${cases.length} cases` : "All cases"} · Newest first</span>
        {isRefined && <button className="ledger-reset" onClick={clearFilters}><X size={12} /> Clear filters</button>}
      </div>

      {/* ── The ledger ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="ledger-empty">
          <div className="ledger-empty__title">Nothing matches that.</div>
          <div className="ledger-empty__text">
            {search
              ? <>No procedure in your log contains &ldquo;{search}&rdquo;.</>
              : "No case matches the current filters."}
          </div>
          <button
            onClick={clearFilters}
            style={{
              marginTop: 4, padding: "8px 14px",
              background: "var(--surface2)", color: "var(--text)",
              border: "1px solid var(--border-mid)", borderRadius: "var(--r)",
              fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Clear filters
          </button>
        </div>
      ) : groups.map(g => (
        <section className="case-group" key={g.key}>
          <header className="case-group__head">
            <div className="case-group__month">
              {g.month}{g.year !== thisYear && <i>{g.year}</i>}
            </div>
            <div className="case-group__agg">
              {g.items.length} {g.items.length === 1 ? "case" : "cases"}
              {g.minutes > 0 && ` · ${formatDuration(g.minutes)}`}
            </div>
          </header>

          {g.items.map(c => {
            const rail      = approachDot(c.surgicalApproach);
            const hasDebrief = parseStoredReflection(c.reflection).structured !== null;
            const d         = new Date(c.caseDate);
            return (
              <div className="case-row" key={c.id}>
                <span className="case-row__rail" style={{ color: rail }} />

                <div className="case-row__body">
                  <button
                    className="case-row__open"
                    onClick={() => setExpanded(c)}
                    aria-label={`Open ${c.procedureName}`}
                  >
                    <span className="case-row__title">{c.procedureName}</span>
                    <span className="case-row__meta">
                      <b>{c.role}</b>
                      <s>·</s>
                      <span>{APPROACH_LABELS[c.surgicalApproach] ?? c.surgicalApproach}</span>
                    </span>
                  </button>
                </div>

                <div className="case-row__tail">
                  {c.operativeDurationMinutes ? <span className="case-row__duration">{formatDuration(c.operativeDurationMinutes)}</span> : null}
                  <span className="case-row__date">
                    {d.toLocaleDateString("en-CA", { weekday: "short" })} {d.getDate()}
                  </span>
                  <span className="case-row__actions">
                    <button
                      className="icon-btn"
                      data-on={hasDebrief}
                      onClick={(e) => { e.stopPropagation(); setDebrief(c); }}
                      title={hasDebrief ? "Edit debrief" : "Add debrief"}
                      aria-label={hasDebrief ? "Edit debrief" : "Add debrief"}
                    >
                      <MessageSquare size={14} strokeWidth={1.7} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={(e) => { e.stopPropagation(); setDictation(c); }}
                      title="Generate dictation"
                      aria-label="Generate dictation"
                    >
                      <FileText size={14} strokeWidth={1.7} />
                    </button>
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      ))}

      {expanded && (
        <Sheet
          c={expanded}
          onClose={() => setExpanded(null)}
          onDelete={(id) => { deleteCase(id); setExpanded(null); }}
          onDebrief={(cs) => { setExpanded(null); setDebrief(cs); }}
          onDictate={(cs) => { setExpanded(null); setDictation(cs); }}
        />
      )}

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />


      {dictation && (
        <DictationSheet
          c={dictation}
          onClose={() => setDictation(null)}
        />
      )}

      {/* Debrief sheet — closed when `debrief` is null. The sheet reads the
          case's reflection on open, so new debriefs and edits of existing
          ones share the same component. On save, mirror the new reflection
          into the cached CaseLog so the row's icon updates immediately. */}
      <DebriefSheet
        open={debrief !== null}
        caseLog={debrief}
        onClose={() => setDebrief(null)}
        onSaved={(saved) => {
          if (debrief) {
            updateCase(debrief.id, { reflection: JSON.stringify(saved) });
          }
        }}
      />
    </div>
  );
}
