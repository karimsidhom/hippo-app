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
  const initialReason = search.get("reason") ?? "";

  const [patient, setPatient] = useState<PickedPatient | null>(null);
  /**
   * Anything the clinician typed in the patient field but didn't formally
   * pick. We use this as a frictionless quick-label: type "Mrs Jones",
   * "MRN 12345", "12" or even nothing, and Start still works. If non-empty
   * at submit time we silently spin up a temporary patient with that label
   * — no extra tap, no "Create temporary patient" dance.
   */
  const [quickName, setQuickName] = useState("");
  const [noteType, setNoteType] = useState<ClinicNoteType>("NEW_CONSULT");
  const [templateKey, setTemplateKey] = useState<string>("general.new-consult");
  const [visitReason, setVisitReason] = useState(initialReason);
  const [inputMode, setInputMode] = useState<ClinicInputMode>(initialMode);
  const [consentCaptured, setConsentCaptured] = useState<ClinicConsentMode | null>(null);
  const [consentText, setConsentText] = useState<string | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTemplates = BUILTIN_CLINIC_TEMPLATES.filter(
    (t) => t.noteType === noteType || t.noteType === "CUSTOM",
  );

  // Consent is recommended for AMBIENT/DICTATION but no longer a hard
  // gate on the new-note page — the clinician can capture (or update)
  // it on the encounter detail page, which talks to a real encounter
  // row instead of the "pending" sentinel. This keeps the new-note
  // flow frictionless: type a name (or nothing), tap Start.
  const consentRequired = inputMode === "AMBIENT" || inputMode === "DICTATION";
  const canStart = true;

  async function start() {
    setCreating(true);
    setError(null);
    try {
      // Frictionless quick-label: if no patient has been formally
      // selected but the clinician typed something in the patient field,
      // create a temporary patient inline with that label. Failures are
      // non-blocking — we still create the encounter without a patient.
      let patientIdToUse: string | null = patient?.id ?? null;
      const trimmedQuick = quickName.trim();
      if (!patientIdToUse && trimmedQuick) {
        try {
          const parts = trimmedQuick.split(/\s+/);
          const givenName = parts.slice(0, -1).join(" ") || parts[0] || trimmedQuick;
          const familyName = parts.length > 1 ? parts[parts.length - 1] : "";
          const pres = await fetch("/api/clinic/patients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              givenName: givenName || trimmedQuick,
              familyName: familyName || "—",
              isTemporary: true,
            }),
          });
          if (pres.ok) {
            const pj = (await pres.json()) as { patient?: { id: string } };
            if (pj.patient?.id) patientIdToUse = pj.patient.id;
          }
        } catch { /* non-blocking */ }
      }

      // Create the encounter shell. Everything except inputMode is
      // optional server-side — the wizard mirrors that on the client so
      // the clinician can fire "Start recording" with just defaults.
      const res = await fetch("/api/clinic/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientIdToUse,
          noteType,
          inputMode,
          templateKey: templateKey || undefined,
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
            text: (consentText && consentText.trim()) || "Captured at the start of the encounter.",
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

      <Step title="Patient (optional)" done={!!patient || quickName.trim().length > 0}>
        <PatientPicker
          selected={patient}
          onSelect={(p) => { setPatient(p); if (p) setQuickName(""); }}
          onQueryChange={setQuickName}
          placeholder="Name, MRN, or any label — leave blank if you want"
        />
      </Step>

      <Step title="Visit type (optional)" done>
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

        <label className="form-label" style={{ marginTop: 12 }}>Template (optional)</label>
        <select className="st-input" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
          <option value="">No template — let the AI choose the structure</option>
          {filteredTemplates.map((t) => (
            <option key={t.key} value={t.key}>{t.specialty} — {t.name}</option>
          ))}
        </select>

        <label className="form-label" style={{ marginTop: 12 }}>Reason for visit (optional)</label>
        <input
          className="st-input"
          placeholder="Anything you want — or leave blank"
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

      <Step title="Patient consent (optional)" done={consentCaptured !== null}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 12, color: "var(--text-2)" }}>
            {consentCaptured
              ? <>Captured: <strong style={{ color: "var(--text)" }}>{consentCaptured}</strong></>
              : consentRequired
              ? "You can capture this here or on the next screen."
              : "Recommended for the audit trail — capture here or later."}
          </div>
          <button className="st-btn st-btn-secondary st-btn-sm press" onClick={() => setConsentOpen(true)}>
            {consentCaptured ? "Edit" : "Capture"}
          </button>
        </div>
        {consentOpen && (
          <ConsentSheet
            encounterId="pending"
            deferSave
            initialMode={consentCaptured}
            initialText={consentText}
            onCaptured={(m, t) => { setConsentCaptured(m); setConsentText(t); }}
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
