"use client";

// Hippo Clinic — Encounter detail / live workspace.
//
// Live two-pane on desktop, single-pane stack on mobile:
//   - Recording controls (or typed transcript area).
//   - Live transcript.
//   - 4-paragraph note editor.
//   - Generate / Finalize controls.
//
// Realtime: subscribes to clinic_transcripts and clinic_notes via the
// LiveTranscript and NoteEditor components.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Sparkles, FileSignature, AlertTriangle, RefreshCcw, Trash2, Copy, Loader2, Download,
} from "lucide-react";
import { Recorder } from "@/components/clinic/Recorder";
import { LiveTranscript } from "@/components/clinic/LiveTranscript";
import { NoteEditor } from "@/components/clinic/NoteEditor";
import { ConsentSheet } from "@/components/clinic/ConsentSheet";
import { StatusPill } from "@/components/clinic/StatusPill";
import { BillingSuggestions } from "@/components/clinic/BillingSuggestions";
import { NOTE_TYPE_LABELS } from "@/lib/clinic/templates";
import type { ClinicConsentMode, ClinicInputMode, ClinicNoteStatus } from "@/lib/clinic/types";

interface EncounterDetail {
  encounter: {
    id: string;
    noteType: string;
    inputMode: ClinicInputMode;
    templateKey: string | null;
    visitReason: string | null;
    status: ClinicNoteStatus;
    consentMode: ClinicConsentMode | null;
    failureReason: string | null;
    finalizedAt: string | null;
    signatureText: string | null;
    durationSeconds: number;
  };
  patient: { id: string; givenName: string; familyName: string; preferredName?: string | null } | null;
  transcripts: Array<{
    id: string; startMs: number; endMs: number; text: string; speaker: string | null;
    source: string; provenance: string; isFinal: boolean; createdAt: string;
  }>;
  note: {
    id: string;
    paragraphs: { p1: string; p2: string; p3: string; p4: string };
    letter: string | null;
    patientInstructions: string | null;
    shortSummary: string | null;
    uncertainSpans?: Array<{ section: string; start: number; end: number; reason: string }> | null;
    inferredFlags?: Record<string, boolean> | null;
  } | null;
  followUps: Array<{ id: string; kind: string; title: string; detail: string | null; intervalLabel: string | null; status: string }>;
}

export default function EncounterPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [data, setData] = useState<EncounterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [typedDraft, setTypedDraft] = useState("");
  const [savingTyped, setSavingTyped] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinic/encounters/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as EncounterDetail;
      setData(j);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  // Soft poll every 6s as a belt-and-suspenders backup to realtime — covers
  // the case where the desktop is open but the realtime channel was killed
  // by a sleeping tab.
  useEffect(() => {
    const t = setInterval(refresh, 6000);
    return () => clearInterval(t);
  }, [refresh]);

  const isFinalized = data?.encounter.status === "FINALIZED";

  async function generate() {
    if (!data) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/encounters/${id}/generate`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function saveTyped() {
    if (!typedDraft.trim()) return;
    setSavingTyped(true);
    try {
      await fetch(`/api/clinic/encounters/${id}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startMs: 0,
          endMs: 0,
          text: typedDraft.trim(),
          source: "manual",
          provenance: "said",
        }),
      });
      setTypedDraft("");
      await refresh();
    } finally {
      setSavingTyped(false);
    }
  }

  async function deleteEncounter() {
    if (!confirm("Delete this encounter and its transcript? Drafts only — finalized notes can't be deleted here.")) return;
    const res = await fetch(`/api/clinic/encounters/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/clinic");
  }

  async function finalize() {
    if (!signature.trim()) return;
    setFinalizing(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/encounters/${id}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureText: signature.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFinalizing(false);
    }
  }

  function copyFullNote() {
    if (!data?.note) return;
    const p = data.note.paragraphs;
    const sig = data.encounter.signatureText ?? "";
    const text = [p.p1, p.p2, p.p3, p.p4, sig].filter(Boolean).join("\n\n");
    void navigator.clipboard.writeText(text);
  }

  const recorderDisabled = useMemo(() => {
    return data?.encounter.consentMode === "DECLINED" || isFinalized;
  }, [data, isFinalized]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <Loader2 size={20} className="spin" />
        <style>{`.spin { animation: spin 1s linear infinite; }`}</style>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-title">Couldn't load encounter</div>
        <div className="empty-text">{error ?? "Try again."}</div>
        <Link href="/clinic" className="st-btn st-btn-secondary st-btn-sm" style={{ marginTop: 12, display: "inline-flex" }}>Back</Link>
      </div>
    );
  }

  const e = data.encounter;
  const patientLabel = data.patient
    ? `${data.patient.preferredName || data.patient.givenName} ${data.patient.familyName}`
    : "Unassigned patient";

  return (
    <div style={{ paddingTop: 4, animation: "fadeIn .3s ease forwards", paddingBottom: 24 }}>
      <Link href="/clinic" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-3)", textDecoration: "none", marginBottom: 12 }}>
        <ArrowLeft size={12} /> Clinic
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 14 }}>
        <div>
          <div className="section-title">{NOTE_TYPE_LABELS[e.noteType] || e.noteType}</div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "2px 0 4px", letterSpacing: "-0.3px" }}>
            {patientLabel}
          </h1>
          {e.visitReason && <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>{e.visitReason}</p>}
        </div>
        <StatusPill status={e.status} pulsing />
      </div>

      {e.status === "FAILED" && e.failureReason && (
        <div className="st-card" style={{ borderLeft: "2px solid var(--danger)", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <AlertTriangle size={14} color="var(--danger)" style={{ marginTop: 2 }} />
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--text)" }}>Generation failed.</strong> Your transcript is preserved.
              <div style={{ marginTop: 4 }}>{e.failureReason}</div>
              <button className="st-btn st-btn-primary st-btn-sm press-key" style={{ marginTop: 8, display: "inline-flex", width: "auto" }} onClick={generate} disabled={generating}>
                <RefreshCcw size={12} /> Retry generation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capture surface */}
      {!isFinalized && (
        <section style={{ marginBottom: 22 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Capture</div>
          {e.inputMode === "AMBIENT" || e.inputMode === "DICTATION" ? (
            <Recorder
              encounterId={id}
              disabled={recorderDisabled}
              onStop={() => { void refresh(); }}
              onChunkUploaded={() => { void refresh(); }}
            />
          ) : (
            <div>
              <textarea
                className="st-input"
                rows={8}
                value={typedDraft}
                onChange={(ev) => setTypedDraft(ev.target.value)}
                placeholder={
                  e.inputMode === "PASTED"
                    ? "Paste a referral letter, prior note, or transcript here…"
                    : "Type the encounter — what was said, what you did, what you're planning."
                }
                style={{ resize: "vertical", lineHeight: 1.55 }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button className="st-btn st-btn-primary st-btn-sm press-key" style={{ width: "auto" }} disabled={savingTyped || !typedDraft.trim()} onClick={saveTyped}>
                  Save to transcript
                </button>
              </div>
            </div>
          )}
          {!data.encounter.consentMode && (e.inputMode === "AMBIENT" || e.inputMode === "DICTATION") && (
            <div style={{ marginTop: 8 }}>
              <button className="st-btn st-btn-secondary st-btn-sm press" style={{ width: "auto" }} onClick={() => setConsentOpen(true)}>
                Capture consent
              </button>
            </div>
          )}
        </section>
      )}

      {/* Transcript */}
      <section style={{ marginBottom: 22 }}>
        <div className="section-title" style={{ marginBottom: 8 }}>Transcript</div>
        <LiveTranscript encounterId={id} initial={data.transcripts} />
      </section>

      {/* Generate / Note */}
      <section style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div className="section-title" style={{ margin: 0 }}>Note</div>
          {!isFinalized && (
            <div style={{ display: "flex", gap: 6 }}>
              {data.note && (
                <>
                  <button className="chip press" onClick={copyFullNote} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Copy size={11} /> Copy
                  </button>
                  <a
                    className="chip press"
                    href={`/api/clinic/encounters/${id}/export?kind=note`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                  >
                    <Download size={11} /> Note PDF
                  </a>
                  {data.note.letter && (
                    <a
                      className="chip press"
                      href={`/api/clinic/encounters/${id}/export?kind=letter`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                    >
                      <Download size={11} /> Letter PDF
                    </a>
                  )}
                  {data.note.patientInstructions && (
                    <a
                      className="chip press"
                      href={`/api/clinic/encounters/${id}/export?kind=instructions`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                    >
                      <Download size={11} /> Patient PDF
                    </a>
                  )}
                </>
              )}
              <button
                className="st-btn st-btn-primary st-btn-sm press-key"
                style={{ width: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}
                disabled={generating || data.transcripts.length === 0}
                onClick={generate}
              >
                {generating ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />}
                {data.note ? "Regenerate full note" : "Generate note"}
              </button>
            </div>
          )}
        </div>
        <NoteEditor encounterId={id} initialNote={data.note} isFinalized={isFinalized} />
      </section>

      {/* Billing suggestions (only when enabled in settings) */}
      <BillingSuggestions encounterId={id} hasNote={Boolean(data.note)} />

      {/* Follow-ups */}
      {data.followUps.length > 0 && (
        <section style={{ marginBottom: 22 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Extracted follow-ups</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.followUps.map((t) => (
              <div key={t.id} className="st-card" style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {t.kind}{t.intervalLabel ? ` · ${t.intervalLabel}` : ""}
                  </div>
                  {t.detail && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>{t.detail}</div>}
                </div>
                <span className="badge badge-warning">{t.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Finalize */}
      {!isFinalized && data.note && (
        <section style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Finalize & sign</div>
          <div className="st-card">
            <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 12px", lineHeight: 1.5 }}>
              You confirm the note is accurate and reflects this encounter. Finalized notes are version-locked and audit-logged.
            </p>
            <input
              className="st-input"
              placeholder="Type your full name to sign"
              value={signature}
              onChange={(ev) => setSignature(ev.target.value)}
              maxLength={200}
            />
            <button
              className="st-btn st-btn-primary press-key"
              disabled={finalizing || signature.trim().length < 2}
              onClick={finalize}
              style={{ marginTop: 10 }}
            >
              {finalizing ? <Loader2 size={14} className="spin" /> : <FileSignature size={14} />}
              Finalize note
            </button>
          </div>
        </section>
      )}

      {isFinalized && (
        <div className="st-card" style={{ borderLeft: "2px solid var(--success)" }}>
          <div style={{ fontSize: 12, color: "var(--text-2)" }}>
            Finalized {e.finalizedAt && new Date(e.finalizedAt).toLocaleString()} ·
            signed: <strong style={{ color: "var(--text)" }}>{e.signatureText ?? "—"}</strong>
          </div>
        </div>
      )}

      {error && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 12 }}>{error}</div>}

      {!isFinalized && (
        <div style={{ marginTop: 30, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <button className="st-btn st-btn-danger press" onClick={deleteEncounter} style={{ width: "auto", display: "inline-flex" }}>
            <Trash2 size={12} /> Delete draft
          </button>
        </div>
      )}

      {consentOpen && (
        <ConsentSheet
          encounterId={id}
          initialMode={data.encounter.consentMode}
          onCaptured={() => { void refresh(); }}
          onClose={() => setConsentOpen(false)}
        />
      )}
    </div>
  );
}
