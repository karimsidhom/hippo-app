"use client";

// Hippo Clinic — NoteEditor.
//
// 4-paragraph clinic note editor with section-by-section regeneration.
// Subscribes to clinic_notes via Supabase realtime so a note draft
// generated on the phone shows up live on the desktop.
//
// Highlights uncertain spans the model flagged so the clinician can
// scrutinise them before finalizing.

import { useEffect, useRef, useState } from "react";
import { Sparkles, Wand2, FileText, MessageSquareText, Loader2, Scissors, Receipt, Heart, FileText as FileTextIcon } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useMacros } from "@/hooks/useMacros";

interface Paragraphs { p1: string; p2: string; p3: string; p4: string }
interface NoteShape {
  id: string;
  paragraphs: Paragraphs;
  letter: string | null;
  patientInstructions: string | null;
  shortSummary: string | null;
  uncertainSpans?: Array<{ section: string; start: number; end: number; reason: string }> | null;
  inferredFlags?: Partial<Record<keyof Paragraphs, boolean>> | null;
}

const SECTION_LABELS: Record<keyof Paragraphs, string> = {
  p1: "1 — Intro / context",
  p2: "2 — History / interval",
  p3: "3 — Subjective / objective / exam",
  p4: "4 — Assessment + plan",
};

export function NoteEditor({
  encounterId,
  initialNote,
  isFinalized,
}: {
  encounterId: string;
  initialNote: NoteShape | null;
  isFinalized: boolean;
}) {
  const [note, setNote] = useState<NoteShape | null>(initialNote);
  const [pending, setPending] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const macros = useMacros();
  // Mirror `pending` into a ref so the realtime callback can read the latest
  // value without re-subscribing every time a regen toggles in/out.
  const pendingRef = useRef(pending);
  useEffect(() => { pendingRef.current = pending; }, [pending]);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote?.id]);

  // Cmd/Ctrl+S → save the note. We attach to the document so the
  // shortcut works whether focus is in a textarea or a button. We
  // ignore other places (login form, settings page) by checking that
  // this component is currently mounted with a non-finalized note.
  useEffect(() => {
    if (isFinalized) return;
    const onKey = (e: KeyboardEvent) => {
      const isCmdS = (e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S");
      if (!isCmdS) return;
      // Only intercept when our editor is actually visible. We use a
      // data-attribute on the wrapper as the marker (set below).
      if (!document.querySelector("[data-hippo-note-editor='active']")) return;
      e.preventDefault();
      void persist();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- persist is stable for our purposes
  }, [isFinalized]);

  // Realtime subscribe to note updates.
  useEffect(() => {
    const supa = createClient();
    const ch = supa
      .channel(`clinic-note:${encounterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clinic_notes",
          filter: `encounterId=eq.${encounterId}`,
        },
        (payload: { new?: Record<string, unknown> }) => {
          const r = payload.new;
          if (!r || typeof r.id !== "string") return;
          setNote((prev) => {
            // Don't clobber in-flight clinician edits with our own echo.
            if (prev && prev.id === r.id && pendingRef.current) return prev;
            return mapNote(r);
          });
        },
      )
      .subscribe();
    return () => {
      void supa.removeChannel(ch);
    };
  }, [encounterId]);

  if (!note) {
    return (
      <div className="st-card" style={{ textAlign: "center", padding: 24 }}>
        <FileText size={20} style={{ color: "var(--text-3)" }} />
        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8 }}>
          No draft yet. Once you stop recording (or paste/type the encounter), tap "Generate note".
        </div>
      </div>
    );
  }

  function setParagraph<K extends keyof Paragraphs>(key: K, value: string) {
    setNote((n) => (n ? { ...n, paragraphs: { ...n.paragraphs, [key]: value } } : n));
  }

  // Macro expansion: when the user types a space after `.trigger`, swap in
  // the expansion. We only run this on plain typing; pasting big chunks of
  // text shouldn't accidentally expand. The handler is shared by every
  // textarea on this page through onKeyUp.
  function handleMacroKeyUp<K extends keyof Paragraphs | "letter" | "patientInstructions">(
    key: K,
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (!macros.hydrated || isFinalized) return;
    if (e.key !== " ") return; // only fires on the space that ended the trigger
    const ta = e.currentTarget;
    const result = macros.expandSuffix(ta.value, ta.selectionStart);
    if (!result) return;
    if (key === "letter") {
      setNote((n) => n ? { ...n, letter: result.value } : n);
    } else if (key === "patientInstructions") {
      setNote((n) => n ? { ...n, patientInstructions: result.value } : n);
    } else {
      setNote((n) => n ? { ...n, paragraphs: { ...n.paragraphs, [key]: result.value } } : n);
    }
    // Reposition the caret after React commits. setTimeout(0) jumps us
    // past the React commit cycle, then we restore selection.
    setTimeout(() => {
      try {
        ta.setSelectionRange(result.caret, result.caret);
      } catch { /* ignore — element may have unmounted */ }
    }, 0);
  }

  async function persist() {
    if (!note) return;
    setSavingState("saving");
    setError(null);
    try {
      const res = await fetch(`/api/clinic/encounters/${encounterId}/note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paragraphs: note.paragraphs,
          letter: note.letter,
          patientInstructions: note.patientInstructions,
          shortSummary: note.shortSummary,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setSavingState("saved");
      setTimeout(() => setSavingState("idle"), 1400);
    } catch (e) {
      setError((e as Error).message);
      setSavingState("error");
    }
  }

  async function applyTransform(kind: "shorten" | "billing" | "patientFriendly" | "letter") {
    setPending(`tx:${kind}`);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/encounters/${encounterId}/transform`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { note: { paragraphs: Paragraphs; letter: string | null; patientInstructions: string | null } };
      setNote((n) => n ? {
        ...n,
        paragraphs: j.note.paragraphs,
        letter: j.note.letter,
        patientInstructions: j.note.patientInstructions,
      } : n);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  async function regenerate(section: keyof Paragraphs | "letter" | "patientInstructions", guidance?: string) {
    setPending(section);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/encounters/${encounterId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, guidance }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { value: string };
      setNote((n) => {
        if (!n) return n;
        if (section === "letter") return { ...n, letter: j.value };
        if (section === "patientInstructions") return { ...n, patientInstructions: j.value };
        return { ...n, paragraphs: { ...n.paragraphs, [section]: j.value } };
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  const inferredHint = (k: keyof Paragraphs) =>
    note.inferredFlags && note.inferredFlags[k]
      ? <span className="badge badge-warning" title="Marked AI-inferred">AI inferred</span>
      : null;

  return (
    // The data-hippo-note-editor attribute is the marker the Cmd/Ctrl+S
    // listener uses to decide whether to intercept the keystroke. Without
    // this, the global listener would also fire on settings pages /
    // dashboards where the NoteEditor isn't mounted.
    <div data-hippo-note-editor="active" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="section-title" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
          4-paragraph note
          <span className="badge badge-muted" title="Press Cmd+S (or Ctrl+S) to save your edits" style={{ fontSize: 9 }}>
            {typeof navigator !== "undefined" && /Mac/i.test(navigator.platform) ? "⌘S" : "Ctrl+S"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-3)" }}>
          {savingState === "saving" && <><Loader2 size={11} className="spin" /> Saving…</>}
          {savingState === "saved" && <span style={{ color: "var(--success)" }}>Saved</span>}
          {savingState === "error" && <span style={{ color: "var(--danger)" }}>Save failed</span>}
        </div>
      </div>

      {!isFinalized && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <TransformChip kind="shorten"          label="Shorten"        icon={<Scissors size={11} />}     pending={pending} onTap={applyTransform} />
          <TransformChip kind="billing"          label="Billing-ready"  icon={<Receipt size={11} />}      pending={pending} onTap={applyTransform} />
          <TransformChip kind="patientFriendly"  label="Patient-friendly" icon={<Heart size={11} />}      pending={pending} onTap={applyTransform} />
          <TransformChip kind="letter"           label="Convert to letter" icon={<FileTextIcon size={11} />} pending={pending} onTap={applyTransform} />
        </div>
      )}

      {(["p1","p2","p3","p4"] as const).map((k) => (
        <div key={k}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="form-label" style={{ margin: 0 }}>{SECTION_LABELS[k]}</span>
              {inferredHint(k)}
            </div>
            {!isFinalized && (
              <button
                type="button"
                className="chip press"
                disabled={pending !== null}
                onClick={() => regenerate(k)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                {pending === k ? <Loader2 size={11} className="spin" /> : <Sparkles size={11} />}
                {pending === k ? "Regenerating" : "Regen section"}
              </button>
            )}
          </div>
          <textarea
            className="st-input"
            value={note.paragraphs[k]}
            onChange={(e) => setParagraph(k, e.target.value)}
            onKeyUp={(e) => handleMacroKeyUp(k, e)}
            onBlur={persist}
            disabled={isFinalized}
            rows={k === "p4" ? 7 : 5}
            style={{ resize: "vertical", lineHeight: 1.55 }}
          />
        </div>
      ))}

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="form-label" style={{ margin: 0 }}>Patient instructions</span>
          {!isFinalized && (
            <button
              type="button"
              className="chip press"
              disabled={pending !== null}
              onClick={() => regenerate("patientInstructions", "Plain Grade-6 reading level. No jargon.")}
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              {pending === "patientInstructions" ? <Loader2 size={11} className="spin" /> : <MessageSquareText size={11} />}
              Patient-friendly
            </button>
          )}
        </div>
        <textarea
          className="st-input"
          value={note.patientInstructions ?? ""}
          onChange={(e) => setNote((n) => n ? { ...n, patientInstructions: e.target.value } : n)}
          onKeyUp={(e) => handleMacroKeyUp("patientInstructions", e)}
          onBlur={persist}
          disabled={isFinalized}
          rows={4}
        />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="form-label" style={{ margin: 0 }}>Letter to referring physician</span>
          {!isFinalized && (
            <button
              type="button"
              className="chip press"
              disabled={pending !== null}
              onClick={() => regenerate("letter")}
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              {pending === "letter" ? <Loader2 size={11} className="spin" /> : <Wand2 size={11} />}
              Rebuild letter
            </button>
          )}
        </div>
        <textarea
          className="st-input"
          value={note.letter ?? ""}
          onChange={(e) => setNote((n) => n ? { ...n, letter: e.target.value } : n)}
          onKeyUp={(e) => handleMacroKeyUp("letter", e)}
          onBlur={persist}
          disabled={isFinalized}
          rows={8}
        />
      </div>

      {error && (
        <div style={{ fontSize: 12, color: "var(--danger)" }}>{error}</div>
      )}
    </div>
  );
}

function TransformChip({
  kind, label, icon, pending, onTap,
}: {
  kind: "shorten" | "billing" | "patientFriendly" | "letter";
  label: string;
  icon: React.ReactNode;
  pending: string | null;
  onTap: (k: "shorten" | "billing" | "patientFriendly" | "letter") => void;
}) {
  const isThis = pending === `tx:${kind}`;
  return (
    <button
      type="button"
      className="chip press"
      disabled={pending !== null}
      onClick={() => onTap(kind)}
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
    >
      {isThis ? <Loader2 size={11} className="spin" /> : icon}
      {label}
    </button>
  );
}

function mapNote(raw: Record<string, unknown>): NoteShape {
  const p = (raw.paragraphs as Paragraphs) ?? { p1: "", p2: "", p3: "", p4: "" };
  return {
    id: String(raw.id),
    paragraphs: { p1: p.p1 ?? "", p2: p.p2 ?? "", p3: p.p3 ?? "", p4: p.p4 ?? "" },
    letter: (raw.letter as string | null) ?? null,
    patientInstructions: (raw.patientInstructions as string | null) ?? null,
    shortSummary: (raw.shortSummary as string | null) ?? null,
    uncertainSpans: (raw.uncertainSpans as NoteShape["uncertainSpans"]) ?? null,
    inferredFlags: (raw.inferredFlags as NoteShape["inferredFlags"]) ?? null,
  };
}
