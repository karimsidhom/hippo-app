"use client";

// Hippo Clinic — PatientEditSheet.
//
// Modal form for editing patient demographics and metadata. Saves are
// audited through the existing /api/clinic/patients/[id] route.

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface PatientShape {
  id: string;
  givenName: string;
  familyName: string;
  preferredName?: string | null;
  pronouns?: string | null;
  dateOfBirth?: string | null;
  sex?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  externalId?: string | null;
  institutionLabel?: string | null;
  notes?: string | null;
  isTemporary?: boolean;
}

export function PatientEditSheet({
  patient,
  onClose,
  onSaved,
}: {
  patient: PatientShape;
  onClose: () => void;
  onSaved: (next: PatientShape) => void;
}) {
  const [givenName, setGivenName] = useState(patient.givenName);
  const [familyName, setFamilyName] = useState(patient.familyName);
  const [preferredName, setPreferredName] = useState(patient.preferredName ?? "");
  const [pronouns, setPronouns] = useState(patient.pronouns ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "",
  );
  const [sex, setSex] = useState(patient.sex ?? "");
  const [contactPhone, setContactPhone] = useState(patient.contactPhone ?? "");
  const [contactEmail, setContactEmail] = useState(patient.contactEmail ?? "");
  const [externalId, setExternalId] = useState(patient.externalId ?? "");
  const [institutionLabel, setInstitutionLabel] = useState(patient.institutionLabel ?? "");
  const [notes, setNotes] = useState(patient.notes ?? "");
  const [isTemporary, setIsTemporary] = useState(Boolean(patient.isTemporary));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          givenName: givenName.trim(),
          familyName: familyName.trim(),
          preferredName: preferredName.trim() || undefined,
          pronouns: pronouns.trim() || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
          sex: sex.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || null,
          externalId: externalId.trim() || null,
          institutionLabel: institutionLabel.trim() || null,
          notes: notes.trim() || null,
          isTemporary,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { patient: PatientShape };
      onSaved(j.patient);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(6px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="sheet-handle" />
        <div className="section-title">Patient details</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "4px 0 14px" }}>
          Edit patient
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Field label="Given name *">
            <input className="st-input" value={givenName} onChange={(e) => setGivenName(e.target.value)} maxLength={120} />
          </Field>
          <Field label="Family name *">
            <input className="st-input" value={familyName} onChange={(e) => setFamilyName(e.target.value)} maxLength={120} />
          </Field>
          <Field label="Preferred name">
            <input className="st-input" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} maxLength={120} />
          </Field>
          <Field label="Pronouns">
            <input className="st-input" value={pronouns} onChange={(e) => setPronouns(e.target.value)} maxLength={40} />
          </Field>
          <Field label="Date of birth">
            <input type="date" className="st-input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </Field>
          <Field label="Sex / gender">
            <input className="st-input" value={sex} onChange={(e) => setSex(e.target.value)} maxLength={20} />
          </Field>
          <Field label="Phone">
            <input className="st-input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} maxLength={40} />
          </Field>
          <Field label="Email">
            <input type="email" className="st-input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={200} />
          </Field>
          <Field label="External / chart ID">
            <input className="st-input" value={externalId} onChange={(e) => setExternalId(e.target.value)} maxLength={200} />
          </Field>
          <Field label="Institution / clinic">
            <input className="st-input" value={institutionLabel} onChange={(e) => setInstitutionLabel(e.target.value)} maxLength={200} />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            className="st-input"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            style={{ resize: "vertical" }}
          />
        </Field>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <input
            type="checkbox"
            checked={isTemporary}
            onChange={(e) => setIsTemporary(e.target.checked)}
            style={{ accentColor: "var(--primary)" }}
          />
          <span style={{ fontSize: 12, color: "var(--text-2)" }}>
            Temporary record (created mid-encounter, needs full info still)
          </span>
        </label>

        {error && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button className="st-btn st-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="st-btn st-btn-primary press-key"
            onClick={save}
            disabled={saving || !givenName.trim() || !familyName.trim()}
          >
            {saving ? <Loader2 size={14} className="spin" /> : null}
            Save patient
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 10, gridColumn: "auto" }}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
