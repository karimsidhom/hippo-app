"use client";

// Hippo Clinic — Safety panel.
//
// Sits between the note editor and the finalize section. Combines:
//   - Critical-finding alerts (LLM detects missing actions)
//   - Drug-interaction alerts (RxNorm)
//   - Allergy cross-check
//   - Note quality score (heuristic, client-side)
//
// Non-blocking: clinicians can override and finalize anyway. Every override
// is captured by the existing audit log.

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Loader2, Pill, Heart, AlertCircle } from "lucide-react";

interface SafetyAlert {
  id: string;
  severity: "critical" | "warning";
  category: "missing-action" | "drug-interaction" | "allergy" | "uncertainty";
  title: string;
  detail: string;
  section?: "p1" | "p2" | "p3" | "p4";
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
  note: NoteShape | null;
  /** Pull the note type so the quality heuristic can be type-aware
   *  (NEW_CONSULT expects an exam, FOLLOW_UP doesn't, POST_OP expects POD). */
  noteType?: string;
}

export function SafetyPanel({ encounterId, hasNote, isFinalized, note, noteType }: Props) {
  const [alerts, setAlerts] = useState<SafetyAlert[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  // Quality score is computed client-side — pure heuristic, no LLM call.
  // Audit finding M5: long notes (5000+ words) hit ~30 regexes from
  // looksLikeMedicine on every keystroke. Deferring the value lets React
  // 18 schedule the recomputation as a low-priority transition so typing
  // never blocks waiting for the score. The displayed score lags the
  // source-of-truth by a frame on slower devices — cheaper than a
  // worker for the size of notes we expect.
  const deferredNote = useDeferredValue(note);
  const quality = useMemo(
    () => (deferredNote ? computeQualityScore(deferredNote, noteType) : null),
    [deferredNote, noteType],
  );

  async function runCheck() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clinic/encounters/${encounterId}/safety`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as { alerts: SafetyAlert[] };
      setAlerts(j.alerts);
    } catch {
      setAlerts([{
        id: "fetch-fail",
        severity: "warning",
        category: "uncertainty",
        title: "Couldn’t reach safety check",
        detail: "Network error. Re-run before finalizing if you depend on the safety net.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (!hasNote || isFinalized) return null;

  const visible = (alerts ?? []).filter((a) => !acknowledged.has(a.id));
  const criticalCount = visible.filter((a) => a.severity === "critical").length;
  const warningCount = visible.filter((a) => a.severity === "warning").length;
  const allClear = alerts !== null && visible.length === 0;

  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div className="section-title" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ShieldCheck size={11} /> Pre-finalize safety
        </div>
        <button
          type="button"
          className="chip press"
          onClick={runCheck}
          disabled={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          {loading ? <Loader2 size={11} className="spin" /> : <ShieldCheck size={11} />}
          {alerts === null ? "Run check" : "Re-run"}
        </button>
      </div>

      {/* Quality badge */}
      {quality && (
        <div className="st-card" style={{ marginBottom: 8, padding: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 999,
            background: quality.score >= 80 ? "rgba(16,185,129,.10)" : quality.score >= 60 ? "rgba(245,158,11,.10)" : "rgba(239,68,68,.10)",
            color:      quality.score >= 80 ? "var(--success)"      : quality.score >= 60 ? "var(--warning)"      : "var(--danger)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums",
          }}>
            {quality.score}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
              Note quality {quality.score}/100
            </div>
            {quality.issues.length > 0 ? (
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, lineHeight: 1.5 }}>
                {quality.issues.join(" · ")}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                All structural checks pass.
              </div>
            )}
          </div>
        </div>
      )}

      {alerts === null && !loading && (
        <div className="st-card" style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
          Tap <strong style={{ color: "var(--text-2)" }}>Run check</strong> to scan for missing actions, drug
          interactions (via RxNorm), and allergy conflicts. Non-blocking — you can finalize even
          with warnings open; we log every override.
        </div>
      )}

      {alerts !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {allClear ? (
            <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={11} /> No safety issues found
            </span>
          ) : (
            <>
              {criticalCount > 0 && (
                <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <ShieldAlert size={11} /> {criticalCount} critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <AlertTriangle size={11} /> {warningCount} warning{warningCount === 1 ? "" : "s"}
                </span>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((a) => (
          <article
            key={a.id}
            className="st-card"
            style={{
              padding: 12,
              borderLeft: `2px solid ${a.severity === "critical" ? "var(--danger)" : "var(--warning)"}`,
              animation: "fadeIn .2s ease forwards",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <CategoryIcon category={a.category} severity={a.severity} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{a.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, lineHeight: 1.5 }}>
                  {a.detail}
                </div>
                {a.section && (
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Found in: {a.section}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="chip press"
                onClick={() => setAcknowledged((s) => new Set(s).add(a.id))}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, alignSelf: "flex-start" }}
              >
                Acknowledge
              </button>
            </div>
          </article>
        ))}
      </div>

      {alerts !== null && criticalCount > 0 && (
        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 8, textAlign: "center" }}>
          You can override and finalize — every override is audit-logged.
        </div>
      )}
    </section>
  );
}

function CategoryIcon({ category, severity }: { category: SafetyAlert["category"]; severity: SafetyAlert["severity"] }) {
  const color = severity === "critical" ? "var(--danger)" : "var(--warning)";
  if (category === "drug-interaction") return <Pill size={14} color={color} style={{ marginTop: 2 }} />;
  if (category === "allergy")          return <Heart size={14} color={color} style={{ marginTop: 2 }} />;
  if (category === "missing-action")   return <ShieldAlert size={14} color={color} style={{ marginTop: 2 }} />;
  return <AlertCircle size={14} color={color} style={{ marginTop: 2 }} />;
}

interface QualityResult { score: number; issues: string[] }

// Common drug-name suffixes/stems used in real INN nomenclature. A token
// that looks med-shaped but matches NONE of these is suspicious. We only
// use this as a soft signal — many corner cases (insulin, T4, etc) won't
// match. The score never deducts more than a few points for this.
const REAL_DRUG_STEMS = [
  // Cardiovascular
  /olol\b/i, /sartan\b/i, /pril\b/i, /statin\b/i, /dipine\b/i, /dronate\b/i,
  // Antibiotics
  /cillin\b/i, /mycin\b/i, /floxacin\b/i, /azole\b/i, /cycline\b/i, /penem\b/i,
  // PPIs / acid suppression
  /prazole\b/i, /tidine\b/i,
  // Mental health
  /pram\b/i, /tine\b/i, /pine\b/i, /azepam\b/i, /zolam\b/i,
  // Diabetes
  /formin\b/i, /gliflozin\b/i, /glutide\b/i, /azide\b/i, /gliptin\b/i,
  // Urology / male
  /sterolone?\b/i, /finasteride\b/i, /dutasteride\b/i, /tamsulosin\b/i,
  /alfuzosin\b/i, /silodosin\b/i, /tadalafil\b/i, /sildenafil\b/i,
  // Pain / anti-inflammatory
  /codone\b/i, /morphine\b/i, /fentanyl\b/i, /acen\b/i, /profen\b/i, /coxib\b/i,
  // Biologics / oncology
  /mab\b/i, /nib\b/i, /tinib\b/i, /cept\b/i,
  // Common short names
  /\b(metformin|lisinopril|atorvastatin|amlodipine|metoprolol|aspirin|tylenol|paracetamol|ibuprofen|warfarin|apixaban|rivaroxaban|clopidogrel|insulin|levothyroxine|prednisone|gabapentin|amoxicillin|ciprofloxacin|tamsulosin|finasteride|dutasteride|silodosin|alfuzosin|tadalafil|sildenafil|bcg|gemcitabine|mitomycin|enzalutamide|abiraterone)\b/i,
];
function looksLikeMedicine(token: string): boolean {
  return REAL_DRUG_STEMS.some((re) => re.test(token));
}

// Detect "medication-like mentions" — a `name dose unit` triplet (e.g.
// "tamsulosin 0.4 mg daily"). We only check the NAMES from these triplets
// against the real-drug pattern. Free-prose mentions of generic words
// like "medication" don't get scored.
function findCandidateMedNames(text: string): string[] {
  const out: string[] = [];
  // dose-bearing pattern: word with 4-20 letters preceded/followed by a number+unit
  const re = /\b([A-Za-z][A-Za-z\-]{3,20})\s+(?=\d)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(m[1]);
    if (out.length > 20) break;
  }
  return out;
}

/**
 * Heuristic quality score, all client-side. Note-type aware so a
 * follow-up isn't penalised for missing an exam, and a post-op note isn't
 * penalised for missing an HPI it doesn't need.
 *
 * Conservative on deductions — clinicians edit notes constantly, the
 * score should never become a nag.
 */
function computeQualityScore(note: NoteShape, noteType?: string): QualityResult {
  const issues: string[] = [];
  let score = 100;

  const len = (s: string | null | undefined) => (s ?? "").trim().length;
  const allText = note.paragraphs.p1 + "\n" + note.paragraphs.p2 + "\n" + note.paragraphs.p3 + "\n" + note.paragraphs.p4;

  // ── Paragraph length checks ────────────────────────────────────────────
  // Each paragraph deserves real content. Skip the exam check on note
  // types that legitimately don't include an exam.
  if (len(note.paragraphs.p1) < 30) { score -= 12; issues.push("p1 thin"); }
  if (len(note.paragraphs.p2) < 30) { score -= 12; issues.push("p2 thin"); }
  // Exam expectation depends on note type.
  const expectsExam = noteType === "NEW_CONSULT" || noteType === "POST_OP" || noteType === "FOLLOW_UP";
  const examMissing = !/exam(?:ination)?\s*[:\-]/i.test(allText) && !/on examination/i.test(allText);
  if (len(note.paragraphs.p3) < 30) {
    score -= 12;
    issues.push("p3 thin");
  } else if (expectsExam && examMissing) {
    // Soft nudge when an exam was expected but isn't visible. We don't
    // want a false positive when the clinician genuinely didn't examine
    // (the AI should have written "Examination not performed today").
    score -= 6;
    issues.push("exam not detected");
  }
  if (len(note.paragraphs.p4) < 50) { score -= 18; issues.push("plan thin"); }

  // ── Note-type specific checks ──────────────────────────────────────────
  if (noteType === "FOLLOW_UP" && !/(since last visit|interval|prior visit)/i.test(allText)) {
    score -= 4;
    issues.push("interval history not framed");
  }
  if (noteType === "POST_OP" && !/(post[-\s]?op|pod\s*\d|post[-\s]?operative)/i.test(allText)) {
    score -= 4;
    issues.push("POD / post-op framing missing");
  }
  if (noteType === "RESULTS_REVIEW" && !/(result|biopsy|pathology|imaging|lab)/i.test(allText)) {
    score -= 4;
    issues.push("results not anchored");
  }

  // ── Letter / patient instructions ──────────────────────────────────────
  if (len(note.letter) < 80) { score -= 8; issues.push("no letter"); }
  if (len(note.patientInstructions) < 40) { score -= 8; issues.push("no patient instructions"); }

  // ── Plan must contain at least one concrete action verb ────────────────
  // "we will / order / refer / start / continue / hold / book / schedule"
  // Any of those = a real plan. Note-types that don't need a plan (none
  // really, but skip the check on RESULTS_REVIEW where it's optional).
  if (noteType !== "RESULTS_REVIEW" && len(note.paragraphs.p4) >= 50) {
    const planVerb = /\b(will|order|refer|start|continue|hold|stop|book|schedule|arrange|repeat|trial|begin|titrate)\b/i;
    if (!planVerb.test(note.paragraphs.p4)) {
      score -= 6;
      issues.push("plan lacks concrete action");
    }
  }

  // ── AI-isms ────────────────────────────────────────────────────────────
  const filler = /(it'?s important to note|i'?d like to highlight|in conclusion|overall, the patient|as an ai|please note that)/i;
  if (filler.test(allText)) {
    score -= 6;
    issues.push("AI-ish phrasing");
  }

  // ── Unresolved uncertainty markers ─────────────────────────────────────
  if (/\[\[UNCERTAIN/.test(allText)) {
    score -= 10;
    issues.push("unresolved uncertainty markers");
  }

  // ── Med-name plausibility ──────────────────────────────────────────────
  // Look for `WORD <number> mg/kg/...` patterns; if a candidate doesn't
  // match any real drug stem, soft-flag. Cap the deduction so a single
  // typo doesn't tank the score.
  const candidates = findCandidateMedNames(allText);
  const suspicious = candidates.filter((c) => !looksLikeMedicine(c));
  if (suspicious.length > 0) {
    const deduction = Math.min(8, suspicious.length * 2);
    score -= deduction;
    issues.push(`med name${suspicious.length > 1 ? "s" : ""} look off (${suspicious.slice(0, 3).join(", ")})`);
  }

  // ── Sign-off present? ──────────────────────────────────────────────────
  // The 4-paragraph template ends with "Sincerely, [Name], MD" — if the
  // signature block is gone, that's a meaningful gap.
  if (!/sincerely,?/i.test(note.paragraphs.p4)) {
    score -= 4;
    issues.push("sign-off missing from p4");
  }

  return { score: Math.max(0, score), issues };
}
