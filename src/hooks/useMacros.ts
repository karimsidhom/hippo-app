"use client";

// Hippo Clinic — Dot-phrase / macro store.
//
// localStorage-backed (per-device) so we don't need a schema migration.
// Each macro is `{ trigger, expansion }` — trigger is the typed token
// after a `.` prefix (e.g. `bph` → user types `.bph ` → expands).
// Voice path also recognises `period bph`/`dot bph` and expands the
// same way.
//
// Triggers are normalised to lowercase, alphanumeric + underscore.
// Cap length so a malformed macro can't break the regex.

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hippo.clinic.macros.v1";

export interface Macro {
  trigger: string;     // lowercase, no leading dot
  expansion: string;
}

export interface MacrosApi {
  macros: Macro[];
  hydrated: boolean;
  upsert: (m: Macro) => void;
  remove: (trigger: string) => void;
  byTrigger: (trigger: string) => Macro | undefined;
  /**
   * Replace a `.trigger ` suffix in a textarea's value with the macro
   * expansion. Returns the new value + new caret position. If no macro
   * matches, returns null so the caller can fall through.
   */
  expandSuffix: (value: string, caret: number) => { value: string; caret: number } | null;
  /**
   * Voice-recognition path — replace "period bph"/"dot bph" inside a
   * spoken transcript chunk.
   */
  expandVoice: (text: string) => string;
}

const DEFAULT_MACROS: Macro[] = [
  // A small starter set so a brand-new clinician sees the feature work.
  // They're harmless examples — clinician edits to taste.
  { trigger: "normal-exam", expansion: "Examination: alert, in no acute distress. Cardiovascular: regular rate and rhythm. Respiratory: clear bilaterally. Abdomen: soft, non-tender. No focal neurological deficits." },
  { trigger: "med-rec", expansion: "Medication reconciliation completed. Patient's home medications were reviewed and confirmed at today's visit." },
  { trigger: "no-redflags", expansion: "Red flags discussed: no fevers, no weight loss, no night sweats, no haematuria, no severe pain. Patient instructed to seek urgent care if any of these develop." },
];

export function useMacros(): MacrosApi {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .map((m: unknown) => sanitize(m))
            .filter((m): m is Macro => Boolean(m));
          setMacros(cleaned.length > 0 ? cleaned : DEFAULT_MACROS);
        } else {
          setMacros(DEFAULT_MACROS);
        }
      } else {
        setMacros(DEFAULT_MACROS);
      }
    } catch {
      setMacros(DEFAULT_MACROS);
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: Macro[]) => {
    setMacros(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const upsert = useCallback((m: Macro) => {
    const cleaned = sanitize(m);
    if (!cleaned) return;
    setMacros((prev) => {
      const idx = prev.findIndex((p) => p.trigger === cleaned.trigger);
      const next = idx >= 0 ? [...prev.slice(0, idx), cleaned, ...prev.slice(idx + 1)] : [...prev, cleaned];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const remove = useCallback((trigger: string) => {
    setMacros((prev) => {
      const next = prev.filter((p) => p.trigger !== trigger.toLowerCase());
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const byTrigger = useCallback(
    (trigger: string) => macros.find((m) => m.trigger === trigger.toLowerCase()),
    [macros],
  );

  const expandSuffix = useCallback((value: string, caret: number) => {
    // Expand `.trigger ` → expansion when the user just typed a space.
    // Audit finding M6: previous version had a brittle "+1 if leading
    // space" caret correction that broke when the leading whitespace
    // was a tab or newline (which are also \s). We now CAPTURE the
    // leading whitespace separately so we can compute its real length
    // and skip exactly that many chars when building the replace range.
    const before = value.slice(0, caret);
    const m = before.match(/(?:^|(\s))\.([a-z0-9_-]{1,40}) $/i);
    if (!m) return null;
    const leadingWs = m[1] ?? ""; // tab / space / newline / "" if at start of string
    const trigger = m[2];
    const macro = byTrigger(trigger);
    if (!macro) return null;
    // m[0] includes the leading whitespace if any; subtract its length so
    // `start` lands on the dot itself, not the whitespace before it.
    const start = caret - m[0].length + leadingWs.length;
    const replacement = macro.expansion + " ";
    const nextValue = value.slice(0, start) + replacement + value.slice(caret);
    return { value: nextValue, caret: start + replacement.length };
  }, [byTrigger]);

  // Precompile voice-expansion patterns once per macro list — the
  // recorder calls expandVoice on every final SR segment, so we don't
  // want to allocate two RegExp objects per macro per invocation
  // (audit finding L1).
  const compiledVoicePatterns = useMemo(
    () =>
      macros.map((m) => ({
        expansion: m.expansion,
        patterns: [
          new RegExp(`\\b(?:period|dot|macro)\\s+${escapeRe(m.trigger)}\\b`, "gi"),
          new RegExp(`\\b(?:period|dot|macro)\\s+${escapeRe(m.trigger.replace(/-/g, " "))}\\b`, "gi"),
        ],
      })),
    [macros],
  );

  const expandVoice = useCallback((text: string) => {
    // Recognise spoken triggers: "period bph", "dot bph", "macro bph".
    // Word-boundary the trigger so "bph" doesn't match "bph syndrome".
    let out = text;
    for (const m of compiledVoicePatterns) {
      for (const re of m.patterns) out = out.replace(re, m.expansion);
    }
    return out;
  }, [compiledVoicePatterns]);

  return { macros: hydrated ? macros : [], hydrated, upsert, remove, byTrigger, expandSuffix, expandVoice };

  // Persist helper kept inline for clarity; setting setMacros + writing
  // localStorage in one wrapper avoids stale-state bugs.
  void persist;
}

function sanitize(raw: unknown): Macro | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { trigger?: unknown; expansion?: unknown };
  const t = typeof r.trigger === "string" ? r.trigger.trim().toLowerCase() : "";
  const e = typeof r.expansion === "string" ? r.expansion.trim() : "";
  // Triggers: lowercase alphanumeric, hyphen, underscore. 1–40 chars.
  if (!/^[a-z0-9_-]{1,40}$/.test(t)) return null;
  if (e.length === 0 || e.length > 4000) return null;
  return { trigger: t, expansion: e };
}
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
