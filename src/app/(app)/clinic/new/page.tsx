"use client";

// Hippo Clinic — New Note flow.
//
// Single-page wizard:
//   1. Patient (search + temporary).
//   2. Note type + template.
//   3. Consent capture.
//   4. Input mode — Ambient / Dictation / Typed / Pasted.
//   Then we POST to /api/clinic/encounters and navigate to the encounter
//   detail page where recording / editing happens.

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mic, FileSignature, FilePlus, ClipboardPaste, ChevronRight, Check,
} from "lucide-react";
import { PatientPicker } from "@/components/clinic/PatientPicker";
import { ConsentSheet } from "@/components/clinic/ConsentSheet";
import { BUILTIN_CLINIC_TEMPLATES, NOTE_TYPE_LABELS } from "@/lib/clinic/templates";
import type { ClinicConsentMode, ClinicInputMode, ClinicNoteType } from "@/lib/clinic/types";

interface PickedPatient { id: string; givenName: string; familyName: string; preferredName?: string | null; isTemporary: boolean }

function NewClinicNoteInner() {
  const router = useRouter();
  const search = useSearchParams();
  const initialMode = (search.get("mode") as ClinicInputMode | null) ?? "AMBIENT";

  const [patient, setPatient] = useState<PickedPatient | null>(null);
  const [noteType, setNoteType] = useState<ClinicNoteType>("NEW_CONSULT");
  const [templateKey, setTemplateKey] = useState<string>("general.new-consult");
  const [visitReason, setVisitReason] = useState("");
  const [inputMode, setInputMode] = useState<ClinicInputMode>(initialMode);
  const [consentCaptured, setConsentCaptured] = useState<ClinicConsentMode | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTemplates = BUILTIN_CLINIC_TEMPLATES.filter(
    (t) => t.noteType === noteType || t.noteType === "CUSTOM",
  );

  // Consent is REQUIRED for AMBIENT and DICTATION; optional for TYPED/PASTED.
  const consentRequired = inputMode === "AMBIENT" || inputMode === "DICTATION";
  const canStart = !consentRequired || consentCaptured !== null;

  async function start() {
    setCreating(true);
    setError(null);
    try {
      // Create the encounter shell first…
      const res = await fetch("/api/clinic/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient?.id ?? null,
          noteType,
          inputMode,
          templateKey,
          visitReason: visitReason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { encounter: { id: string } };

      // …then capture consent on the new encounter if the user already
      // selected one. We hold consent server-side for audit even when not
      // strictly required, because PHIA wants the trail.
      if (consentCaptured) {
        await fetch(`/api/clinic/encounters/${j.encounter.id}/consent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: consentCaptured,
            text: "Captured at the start of the encounter.",
          }),
        }).catch(() => {});
      }

      router.push(`/clinic/encounters/${j.encounter.id}`);
    } catch (e) {
      setError((e as Error).message);
      setCreating(false);
    }
  }

  return (
    <div style={{ paddingTop: 4, animation: "fadeIn .3s ease forwards" }}>
      <div style={{ marginBottom: 18 }}>
        <div className="section-title">New encounter</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "2px 0 4px", letterSpacing: "-0.3px" }}>
          Start a clinic note
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>
          Pick the patient, the visit type, and how you want to capture this encounter.
        </p>
      </div>

      <Step title="Patient" done={!!patient}>
        <PatientPicker selected={patient} onSelect={setPatient} />
      </Step>

      <Step title="Visit type" done>
        <select
          className="st-input"
          value={noteType}
          onChange={(e) => {
            const t = e.target.value as ClinicNoteType;
            setNoteType(t);
            const fallback = BUILTIN_CLINIC_TEMPLATES.find((tpl) => tpl.noteType === t);
            if (fallback) setTemplateKey(fallback.key);
          }}
        >
          {Object.entries(NOTE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <label className="form-label" style={{ marginTop: 12 }}>Template</label>
        <select className="st-input" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
          {filteredTemplates.length === 0 && <option value="">No matching templates</option>}
          {filteredTemplates.map((t) => (
            <option key={t.key} value={t.key}>{t.specialty} — {t.name}</option>
          ))}
        </select>

        <label className="form-label" style={{ marginTop: 12 }}>Reason for visit</label>
        <input
          className="st-input"
          placeholder="e.g. Elevated PSA, BPH follow-up, results review"
          value={visitReason}
          onChange={(e) => setVisitReason(e.target.value)}
          maxLength={200}
        />
      </Step>

      <Step title="How are you capturing this?" done>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <ModeTile selected={inputMode === "AMBIENT"}   onSelect={() => setInputMode("AMBIENT")}   icon={<Mic size={18} />}            label="Ambient"   sub="Record the visit, AI drafts the note." />
          <ModeTile selected={inputMode === "DICTATION"} onSelect={() => setInputMode("DICTATION")} icon={<FileSignature size={18} />}  label="Dictate"   sub="Speak the note out loud." />
          <ModeTile selected={inputMode === "TYPED"}     onSelect={() => setInputMode("TYPED")}     icon={<FilePlus size={18} />}       label="Type"      sub="Write or paste a transcript yourself." />
          <ModeTile selected={inputMode === "PASTED"}    onSelect={() => setInputMode("PASTED")}    icon={<ClipboardPaste size={18} />} label="Paste"     sub="Paste a referral or prior note." />
        </div>
      </Step>

      <Step title="Patient consent" done={consentCaptured !== null} required={consentRequired}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 12, color: "var(--text-2)" }}>
            {consentCaptured
              ? <>Captured: <strong style={{ color: "var(--text)" }}>{consentCaptured}</strong></>
              : consentRequired
              ? "Required for ambient or dictated capture."
              : "Optional but recommended for the audit trail."}
          </div>
          <button className="st-btn st-btn-secondary st-btn-sm press" onClick={() => setConsentOpen(true)}>
            {consentCaptured ? "Edit" : "Capture"}
          </button>
        </div>
        {consentOpen && (
          <ConsentSheet
            encounterId="pending"
            initialMode={consentCaptured}
            onCaptured={(m) => setConsentCaptured(m)}
            onClose={() => setConsentOpen(false)}
          />
        )}
      </Step>

      {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>}

      <button
        className="st-btn st-btn-primary press-key"
        disabled={!canStart || creating}
        onClick={start}
        style={{ marginTop: 8 }}
      >
        {creating
          ? "Creating…"
          : inputMode === "AMBIENT"
          ? "Start recording"
          : inputMode === "DICTATION"
          ? "Start dictation"
          : "Open encounter"}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function Step({ title, done, required, children }: { title: string; done?: boolean; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          width: 18, height: 18, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: done ? "var(--primary-dim)" : "transparent",
          border: `1px solid ${done ? "var(--border-glow)" : "var(--border-mid)"}`,
          color: done ? "var(--primary-hi)" : "var(--text-3)",
        }}>
          {done ? <Check size={11} strokeWidth={2.5} /> : <span style={{ fontSize: 9, fontWeight: 700 }}>·</span>}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
          {title}
          {required && !done && <span style={{ color: "var(--danger)", marginLeft: 4 }}>*</span>}
        </span>
      </div>
      <div style={{ paddingLeft: 26 }}>{children}</div>
    </div>
  );
}

function ModeTile({
  selected, onSelect, icon, label, sub,
}: { selected: boolean; onSelect: () => void; icon: React.ReactNode; label: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="press"
      style={{
        textAlign: "left",
        padding: 12,
        background: selected ? "var(--primary-dim)" : "var(--glass)",
        border: `1px solid ${selected ? "var(--border-glow)" : "var(--border-mid)"}`,
        borderRadius: "var(--r)",
        color: "var(--text)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          width: 28, height: 28, borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: selected ? "var(--primary)" : "var(--surface)",
          color: selected ? "#fff" : "var(--primary-hi)",
          border: `1px solid ${selected ? "var(--primary)" : "var(--border-glow)"}`,
        }}>{icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>{sub}</div>
    </button>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NewClinicNoteInner />
    </Suspense>
  );
}
