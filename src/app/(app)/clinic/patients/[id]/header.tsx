"use client";

// Patient header — renders the demographics block and exposes an Edit
// button that opens the PatientEditSheet. Local state holds the edited
// patient so the rest of the page (encounter list) re-fetches naturally
// on next navigation.

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PatientEditSheet } from "@/components/clinic/PatientEditSheet";

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

export function PatientHeader({ initial }: { initial: PatientShape }) {
  const [patient, setPatient] = useState<PatientShape>(initial);
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  async function deletePatient() {
    if (!confirm(`Delete ${patient.givenName} ${patient.familyName}? Encounters remain but become unassigned.`)) return;
    const res = await fetch(`/api/clinic/patients/${patient.id}`, { method: "DELETE" });
    if (res.ok) router.push("/clinic/patients");
  }

  return (
    <div>
      <div className="section-title">Patient</div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "2px 0", letterSpacing: "-0.4px" }}>
            {patient.preferredName || patient.givenName} {patient.familyName}
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>
            {patient.dateOfBirth && new Date(patient.dateOfBirth).toLocaleDateString()}
            {patient.sex && ` · ${patient.sex}`}
            {patient.pronouns && ` · ${patient.pronouns}`}
            {patient.isTemporary && <span className="badge badge-muted" style={{ marginLeft: 6 }}>Temporary</span>}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {patient.contactPhone && <>📞 {patient.contactPhone}{"  "}</>}
            {patient.contactEmail && <>✉️ {patient.contactEmail}{"  "}</>}
            {patient.externalId && <>ID: {patient.externalId}</>}
          </div>
          {patient.institutionLabel && (
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Site: {patient.institutionLabel}</div>
          )}
          {patient.notes && (
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 8, lineHeight: 1.5, maxWidth: 480 }}>
              {patient.notes}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="st-btn st-btn-secondary st-btn-sm press" onClick={() => setEditing(true)} style={{ width: "auto" }}>
            <Pencil size={11} /> Edit
          </button>
          <button className="st-btn st-btn-danger st-btn-sm press" onClick={deletePatient} style={{ width: "auto" }}>
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {editing && (
        <PatientEditSheet
          patient={patient}
          onClose={() => setEditing(false)}
          onSaved={(next) => setPatient(next)}
        />
      )}
    </div>
  );
}
