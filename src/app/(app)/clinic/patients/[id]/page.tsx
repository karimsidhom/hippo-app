// Hippo Clinic — Patient detail. Longitudinal summary across encounters
// with inline edit. Server component fetches the patient + encounters and
// hands them to the client header for the edit modal.

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { StatusPill } from "@/components/clinic/StatusPill";
import { NOTE_TYPE_LABELS } from "@/lib/clinic/templates";
import type { ClinicNoteStatus } from "@/lib/clinic/types";
import { PatientHeader } from "./header";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth.error) redirect("/login");
  await ensureDbUser(auth.user);

  const patient = await db.clinicPatient.findUnique({
    where: { id },
    include: {
      encounters: {
        orderBy: { encounterDate: "desc" },
        take: 50,
      },
    },
  });
  if (!patient || patient.ownerUserId !== auth.user.id) notFound();

  const finalizedIds = patient.encounters.filter((e) => e.status === "FINALIZED").map((e) => e.id);
  const summaries = finalizedIds.length
    ? await db.clinicNote.findMany({
        where: { encounterId: { in: finalizedIds } },
        select: { encounterId: true, shortSummary: true },
      })
    : [];
  const summaryByEncounter = new Map(summaries.map((s) => [s.encounterId, s.shortSummary]));

  return (
    <div style={{ paddingTop: 4, animation: "fadeIn .3s ease forwards" }}>
      <Link href="/clinic/patients" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-3)", textDecoration: "none", marginBottom: 12 }}>
        <ArrowLeft size={12} /> Patients
      </Link>

      <PatientHeader
        initial={{
          id: patient.id,
          givenName: patient.givenName,
          familyName: patient.familyName,
          preferredName: patient.preferredName,
          pronouns: patient.pronouns,
          dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toISOString() : null,
          sex: patient.sex,
          contactPhone: patient.contactPhone,
          contactEmail: patient.contactEmail,
          externalId: patient.externalId,
          institutionLabel: patient.institutionLabel,
          notes: patient.notes,
          isTemporary: patient.isTemporary,
        }}
      />

      <div className="section-title" style={{ marginTop: 12 }}>Encounters</div>
      {patient.encounters.length === 0 ? (
        <div className="empty-state"><div className="empty-text">No encounters yet.</div></div>
      ) : (
        patient.encounters.map((e) => (
          <Link key={e.id} href={`/clinic/encounters/${e.id}`} className="case-card" style={{ textDecoration: "none" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="case-proc">{NOTE_TYPE_LABELS[e.noteType] || e.noteType}</div>
              <div className="case-meta">
                {e.visitReason && <span style={{ color: "var(--text-3)" }}>{e.visitReason}</span>}
                {summaryByEncounter.get(e.id) && (
                  <span style={{ color: "var(--text-2)" }}>{summaryByEncounter.get(e.id)}</span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <div className="case-date">{e.encounterDate.toLocaleDateString()}</div>
              <StatusPill status={e.status as ClinicNoteStatus} />
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
