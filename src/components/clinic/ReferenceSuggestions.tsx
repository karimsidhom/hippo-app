"use client";

// Hippo Clinic — Reference suggestions panel.
//
// Renders below the note editor when the clinician has the references
// add-on turned on. Each suggestion shows:
//   - The verbatim claim from the note
//   - A one-sentence augmentation in a LIGHT RED font (the "what you
//     could add") — the user explicitly asked for this colour
//   - The supporting references (PubMed papers + specialty guidelines)
//   - Accept (appends the augmentation to the matching paragraph) / Dismiss
//
// Nothing auto-loads into the note. The clinician is always the author.

import { useEffect, useState } from "react";
import { BookOpen, Check, X, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { useReferenceSettings } from "@/hooks/useReferenceSettings";
import { useAuth } from "@/context/AuthContext";

// Per-(user, encounter) persisted dismissals. localStorage-only —
// survives page reloads on the same device but doesn't follow the user
// to a different device (which is fine for "I already saw and dismissed
// this suggestion"). Audit finding M1: keying by encounter alone leaks
// across users on a shared workstation. We now namespace by userId
// derived from /api/auth/me so two clinicians on the same browser don't
// see each other's dismissals.
const DISMISS_PREFIX = "hippo.clinic.refs.dismissed:";
function dismissKey(userId: string | null, encounterId: string): string {
  return `${DISMISS_PREFIX}${userId ?? "anon"}:${encounterId}`;
}
function readDismissed(userId: string | null, encounterId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(dismissKey(userId, encounterId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
  } catch { return new Set(); }
}
function writeDismissed(userId: string | null, encounterId: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(dismissKey(userId, encounterId), JSON.stringify(Array.from(ids)));
  } catch { /* quota */ }
}

interface PubmedArticle {
  pmid: string;
  title: string;
  journal: string;
  firstAuthor: string;
  year: string;
  url: string;
}
interface GuidelineEntry {
  id: string;
  title: string;
  organization: string;
  region: string;
  specialty: string;
  year: number;
  url: string;
}
interface ReferenceSuggestion {
  id: string;
  section: "p1" | "p2" | "p3" | "p4" | "letter" | "patientInstructions";
  claim: string;
  augmentation: string;
  pubmed: PubmedArticle[];
  guidelines: GuidelineEntry[];
}

interface NoteShape {
  paragraphs: { p1: string; p2: string; p3: string; p4: string };
  letter: string | null;
  patientInstructions: string | null;
}

interface Props {
  encounterId: string;
  hasNote: boolean;
  isFinalized: boolean;
  /** Called when the clinician accepts a suggestion. The parent applies
      the change to the note (so the editor stays the source of truth). */
  onAccept: (section: ReferenceSuggestion["section"], augmentation: string) => Promise<void> | void;
  /** Used to detect when the note changed enough to warrant re-running. */
  noteFingerprint: string;
}

export function ReferenceSuggestions({ encounterId, hasNote, isFinalized, onAccept, noteFingerprint }: Props) {
  const { enabled, regions, hydrated } = useReferenceSettings();
  const auth = useAuth() as unknown as { user: { id: string } | null };
  const userId = auth?.user?.id ?? null;
  const [suggestions, setSuggestions] = useState<ReferenceSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [accepting, setAccepting] = useState<string | null>(null);
  const [lastFingerprint, setLastFingerprint] = useState<string>("");

  // Hydrate persisted dismissals on mount or when the user/encounter changes.
  useEffect(() => {
    setDismissed(readDismissed(userId, encounterId));
  }, [userId, encounterId]);

  // Helper that always persists alongside in-memory updates.
  function dismiss(id: string) {
    setDismissed((d) => {
      const next = new Set(d).add(id);
      writeDismissed(userId, encounterId, next);
      return next;
    });
  }

  async function fetchSuggestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/encounters/${encounterId}/references`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regions }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { suggestions: ReferenceSuggestion[] };
      setSuggestions(j.suggestions);
      setLastFingerprint(noteFingerprint);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // When the note changes meaningfully, drop the cached suggestion list
  // so the user can re-scan if they want — but KEEP dismissals because
  // re-running the scan often re-surfaces the same claim ID, and a
  // persisted dismissal should still suppress it.
  useEffect(() => {
    if (lastFingerprint && lastFingerprint !== noteFingerprint) {
      setSuggestions(null);
    }
  }, [noteFingerprint, lastFingerprint]);

  if (!hydrated) return null;
  if (!enabled || !hasNote || isFinalized) return null;

  const visible = (suggestions ?? []).filter((s) => !dismissed.has(s.id));

  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div className="section-title" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <BookOpen size={11} /> References
        </div>
        <button
          type="button"
          className="chip press"
          onClick={fetchSuggestions}
          disabled={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          {loading ? <Loader2 size={11} className="spin" /> : <BookOpen size={11} />}
          {suggestions === null ? "Suggest references" : "Re-scan"}
        </button>
      </div>

      {error && (
        <div className="st-card" style={{ borderLeft: "2px solid var(--danger)", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertCircle size={13} color="var(--danger)" style={{ marginTop: 2 }} />
          <div style={{ fontSize: 12, color: "var(--text-2)" }}>{error}</div>
        </div>
      )}

      {suggestions === null && !loading && !error && (
        <div className="st-card" style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
          Tap <strong style={{ color: "var(--text-2)" }}>Suggest references</strong> to scan this note for
          claims that PubMed or a specialty guideline could back. Suggestions
          appear here in light red — they never modify the note unless you accept.
        </div>
      )}

      {suggestions !== null && visible.length === 0 && !loading && (
        <div className="st-card" style={{ fontSize: 12, color: "var(--text-3)" }}>
          No high-signal claims in this note that we could match against
          PubMed / guidelines. Try regenerating with more clinical reasoning.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((s) => (
          <article
            key={s.id}
            className="st-card"
            style={{
              borderLeft: "2px solid var(--primary)",
              padding: 12,
              animation: "fadeIn .25s ease forwards",
            }}
          >
            {/* Section + verbatim claim */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span className="badge badge-muted" style={{ textTransform: "uppercase", letterSpacing: ".08em" }}>
                {sectionLabel(s.section)}
              </span>
            </div>
            <blockquote
              style={{
                margin: 0,
                paddingLeft: 10,
                borderLeft: "1px solid var(--border-mid)",
                fontSize: 12,
                color: "var(--text-2)",
                lineHeight: 1.5,
              }}
            >
              {s.claim}
            </blockquote>

            {/* Augmentation (LIGHT RED) */}
            {s.augmentation && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  lineHeight: 1.55,
                  // Light red — distinct from var(--danger) which is alarm red.
                  // Uses the clinic primary scope so the same component looks
                  // sane on the teal-themed Hippo Log if ever embedded there.
                  color: "#FCA5A5",
                  background: "rgba(220,38,38,0.04)",
                  border: "1px dashed rgba(220,38,38,0.18)",
                  borderRadius: "var(--rs)",
                  padding: "8px 10px",
                  fontStyle: "italic",
                }}
              >
                <span style={{ fontWeight: 600, marginRight: 4 }}>Suggested:</span>
                {s.augmentation}
              </div>
            )}

            {/* References */}
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
              {s.guidelines.map((g) => (
                <a
                  key={g.id}
                  href={g.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ fontSize: 11, color: "var(--primary-hi)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <ExternalLink size={10} />
                  <strong>{g.organization} {g.region} {g.year}.</strong>
                  <span style={{ color: "var(--text-3)" }}>{g.title}</span>
                </a>
              ))}
              {s.pubmed.map((p) => (
                <a
                  key={p.pmid}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ fontSize: 11, color: "var(--primary-hi)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <ExternalLink size={10} />
                  <span style={{ color: "var(--text-2)" }}>{p.firstAuthor}{p.firstAuthor ? " et al. " : ""}{p.title}</span>
                  <span style={{ color: "var(--text-3)" }}>· {p.journal} {p.year} · PMID {p.pmid}</span>
                </a>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="chip press"
                onClick={() => dismiss(s.id)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <X size={11} /> Dismiss
              </button>
              {s.augmentation && (
                <button
                  type="button"
                  className="chip press"
                  disabled={accepting !== null}
                  onClick={async () => {
                    setAccepting(s.id);
                    try {
                      await onAccept(s.section, s.augmentation);
                      dismiss(s.id);
                    } finally {
                      setAccepting(null);
                    }
                  }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: "var(--primary-dim)",
                    borderColor: "var(--border-glow)",
                    color: "var(--primary-hi)",
                  }}
                >
                  {accepting === s.id ? <Loader2 size={11} className="spin" /> : <Check size={11} />}
                  Accept
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function sectionLabel(s: ReferenceSuggestion["section"]): string {
  switch (s) {
    case "p1": return "intro / context";
    case "p2": return "history";
    case "p3": return "exam / objective";
    case "p4": return "assessment + plan";
    case "letter": return "letter";
    case "patientInstructions": return "patient instructions";
  }
}

// Helper for parents: build a fingerprint string the panel watches for
// changes so it can re-prompt for re-scanning when the note evolves.
export function noteFingerprint(note: NoteShape): string {
  return `${note.paragraphs.p1.length}|${note.paragraphs.p2.length}|${note.paragraphs.p3.length}|${note.paragraphs.p4.length}|${(note.letter ?? "").length}|${(note.patientInstructions ?? "").length}`;
}
