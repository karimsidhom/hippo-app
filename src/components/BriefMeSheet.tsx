"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  Target,
  Layers,
  Activity,
  Flag,
  History,
  ArrowRight,
} from "lucide-react";
import type { BriefResult, CaseBrief } from "@/lib/brief/types";

// ---------------------------------------------------------------------------
// BriefMeSheet
//
// Bottom-sheet modal that takes the resident's freeform description of an
// upcoming case ("lap chole tomorrow with Chen") and, on submit, POSTs to
// /api/brief/generate and renders the structured CaseBrief that comes back.
//
// Two visual states:
//   1. Input — a textarea with a submit button
//   2. Result — the rendered brief, with a "New brief" button to reset
// ---------------------------------------------------------------------------

interface BriefMeSheetProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fill the text input and optionally auto-submit. Used when coming
   *  from a scheduled case card that already has procedure + attending. */
  prefill?: string;
}

export function BriefMeSheet({ open, onClose, prefill }: BriefMeSheetProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BriefResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset all state whenever the sheet is opened, and focus the textarea
  // so the user can start typing immediately. If a prefill value was
  // provided (e.g. from a scheduled case card), seed the input.
  useEffect(() => {
    if (!open) return;
    setInput(prefill ?? "");
    setResult(null);
    setError(null);
    setLoading(false);
    // Next frame so the element is mounted before we focus it.
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [open, prefill]);

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brief/generate", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Brief failed (${res.status})`);
      }
      const json = (await res.json()) as BriefResult;
      setResult(json);
    } catch (err) {
      console.error("Brief failed", err);
      setError(err instanceof Error ? err.message : "Brief failed");
    } finally {
      setLoading(false);
    }
  };

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
              <Sparkles size={14} style={{ color: "#c4b5fd" }} />
              Pre-Op Brief
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              {result
                ? "Generated from your case history"
                : "Tell me what you're about to do — I'll pull your history"}
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
          {!result ? (
            <InputView
              value={input}
              onChange={setInput}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
              textareaRef={textareaRef}
            />
          ) : (
            <BriefView
              brief={result.brief}
              warnings={result.warnings}
              onReset={() => {
                setResult(null);
                setInput("");
                requestAnimationFrame(() => textareaRef.current?.focus());
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Input view ------------------------------------------------------

interface InputViewProps {
  value: string;
  onChange: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

function InputView({
  value,
  onChange,
  loading,
  error,
  onSubmit,
  textareaRef,
}: InputViewProps) {
  return (
    <div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        placeholder="e.g. lap chole tomorrow 7am with Dr. Chen"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={3}
        style={{
          width: "100%",
          fontFamily: "inherit",
          fontSize: 14,
          lineHeight: 1.5,
          color: "var(--text)",
          background: "var(--glass-lo)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 12,
          resize: "vertical",
          outline: "none",
          marginBottom: 12,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
          ⌘↵ to generate
        </div>
        <button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
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
            cursor: loading || !value.trim() ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: !value.trim() && !loading ? 0.5 : 1,
          }}
        >
          <Sparkles size={12} />
          {loading ? "Thinking…" : "Generate brief"}
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

// ---------- Brief view ------------------------------------------------------

interface BriefViewProps {
  brief: CaseBrief;
  warnings?: string[];
  onReset: () => void;
}

function BriefView({ brief, warnings, onReset }: BriefViewProps) {
  const {
    context,
    keySteps,
    anatomy,
    redFlags,
    history,
    focusForThisCase,
  } = brief;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Procedure heading */}
      <div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-.5px",
          }}
        >
          {context.procedure}
        </div>
        {(context.attending || context.when) && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              marginTop: 4,
              display: "flex",
              gap: 8,
            }}
          >
            {context.when && <span>{context.when}</span>}
            {context.when && context.attending && (
              <span style={{ color: "var(--muted)" }}>·</span>
            )}
            {context.attending && <span>{context.attending}</span>}
          </div>
        )}
      </div>

      {warnings && warnings.length > 0 && (
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
          <span>{warnings[0]}</span>
        </div>
      )}

      {/* Focus for this case — the most important section, put it first */}
      {focusForThisCase.length > 0 && (
        <Section icon={<Target size={12} />} label="Focus for this case">
          <ol
            style={{
              margin: 0,
              paddingLeft: 18,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {focusForThisCase.map((item, i) => (
              <li
                key={i}
                style={{
                  fontSize: 13,
                  color: "var(--text)",
                  lineHeight: 1.5,
                }}
              >
                {item}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Your history */}
      <Section icon={<History size={12} />} label="Your history">
        <div
          style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, marginBottom: history.patterns.length > 0 ? 8 : 0 }}
        >
          {history.summary}
        </div>
        {history.patterns.length > 0 && (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {history.patterns.map((p, i) => (
              <li
                key={i}
                style={{
                  fontSize: 12,
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    marginTop: 2,
                    color:
                      p.kind === "strength"
                        ? "var(--success)"
                        : p.kind === "weakness"
                          ? "#fca5a5"
                          : "var(--text-3)",
                  }}
                >
                  {p.kind === "strength" ? (
                    <CheckCircle2 size={11} />
                  ) : p.kind === "weakness" ? (
                    <AlertTriangle size={11} />
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: "var(--text-3)",
                        marginLeft: 3,
                        marginTop: 4,
                      }}
                    />
                  )}
                </span>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        )}
        {history.lastReflection && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 10px",
              borderLeft: "2px solid var(--border-mid)",
              background: "var(--glass-lo)",
              fontSize: 11,
              color: "var(--text-2)",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            &ldquo;{history.lastReflection}&rdquo;
          </div>
        )}
      </Section>

      {/* Key steps */}
      {keySteps.length > 0 && (
        <Section icon={<Layers size={12} />} label="Key steps">
          <ol
            style={{
              margin: 0,
              paddingLeft: 18,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {keySteps.map((s, i) => (
              <li
                key={i}
                style={{
                  fontSize: 12,
                  color: "var(--text)",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontWeight: 500 }}>{s.step}</span>
                {s.note && (
                  <span style={{ color: "var(--text-3)" }}> — {s.note}</span>
                )}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Anatomy */}
      {anatomy.length > 0 && (
        <Section icon={<Activity size={12} />} label="Anatomy">
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {anatomy.map((a, i) => (
              <li
                key={i}
                style={{
                  fontSize: 12,
                  color: "var(--text-2)",
                  lineHeight: 1.5,
                  paddingLeft: 10,
                  borderLeft: "1px solid var(--border)",
                }}
              >
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Red flags */}
      {redFlags.length > 0 && (
        <Section icon={<Flag size={12} />} label="Red flags">
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {redFlags.map((r, i) => (
              <li
                key={i}
                style={{
                  fontSize: 12,
                  color: "var(--text-2)",
                  lineHeight: 1.5,
                  paddingLeft: 10,
                  borderLeft: "1px solid rgba(220,38,38,0.4)",
                }}
              >
                {r}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Reset */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 12,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={onReset}
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
          New brief
        </button>
      </div>
    </div>
  );
}

// ---------- Small helpers ---------------------------------------------------

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
          fontSize: 10,
          fontWeight: 600,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        <span style={{ color: "var(--text-2)" }}>{icon}</span>
        {label}
      </div>
      {children}
    </section>
  );
}
