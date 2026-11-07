import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireClinicAuth, loadOwnedEncounter } from "@/lib/clinic/access";
import { logClinicAudit } from "@/lib/clinic/audit";
import { buildClinicPdf } from "@/lib/clinic/pdf";

// GET /api/clinic/encounters/[id]/export?kind=letter|note|instructions
// Returns a PDF (application/pdf) with a clinician-must-verify watermark.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireClinicAuth();
  if (error) return error;
  const { id: encounterId } = await ctxArg.params;
  const { encounter, error: aclError } = await loadOwnedEncounter(encounterId, ctx.user.id);
  if (aclError) return aclError;

  const url = new URL(req.url);
  const kindRaw = url.searchParams.get("kind");
  const kind: "letter" | "note" | "instructions" =
    kindRaw === "note" ? "note" : kindRaw === "instructions" ? "instructions" : "letter";

  const [note, patient] = await Promise.all([
    db.clinicNote.findFirst({ where: { encounterId } }),
    encounter.patientId ? db.clinicPatient.findUnique({ where: { id: encounter.patientId } }) : Promise.resolve(null),
  ]);
  if (!note) {
    return NextResponse.json({ error: "No note exists yet — generate one first." }, { status: 409 });
  }

  let body: string;
  if (kind === "letter") {
    body = note.letter ?? "";
    if (!body.trim()) {
      return NextResponse.json({ error: "Letter has not been generated for this note." }, { status: 409 });
    }
  } else if (kind === "instructions") {
    body = note.patientInstructions ?? "";
    if (!body.trim()) {
      return NextResponse.json({ error: "Patient instructions have not been generated." }, { status: 409 });
    }
  } else {
    const p = note.paragraphs as { p1: string; p2: string; p3: string; p4: string };
    body = [p.p1, p.p2, p.p3, p.p4].filter(Boolean).join("\n\n");
    if (encounter.signatureText) {
      body += `\n\nSincerely,\n\n${encounter.signatureText}`;
    }
  }

  const buffer = await buildClinicPdf({
    clinicianName: ctx.clinician.fullName,
    clinicianRole: ctx.clinician.role,
    clinicianSpecialty: ctx.clinician.specialty,
    institutionLine: encounter.institutionLabel ?? undefined,
    patientName: patient ? `${patient.preferredName ?? patient.givenName} ${patient.familyName}` : undefined,
    encounterDate: encounter.encounterDate,
    visitReason: encounter.visitReason ?? undefined,
    body,
    variant: kind,
  });

  // Persist an export record for the audit trail.
  await db.clinicExport.create({
    data: {
      encounterId,
      ownerUserId: ctx.user.id,
      kind: kind === "letter" ? "letter" : kind === "instructions" ? "patient-instructions" : "clinic-note",
      format: "pdf",
    },
  });
  logClinicAudit({
    userId: ctx.user.id,
    action: "clinic.note.export",
    entityId: encounterId,
    metadata: { kind, format: "pdf" },
    req,
  });

  const filenameStub =
    patient
      ? `${patient.familyName}-${patient.givenName}-${kind}`
      : `clinic-${kind}`;

  // Copy into a fresh ArrayBuffer so the type is unambiguously
  // `ArrayBuffer` (not `ArrayBufferLike`) — Node's Buffer is backed by a
  // shared pool and TypeScript flags the SharedArrayBuffer possibility.
  const ab = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(ab).set(buffer);
  const blob = new Blob([ab], { type: "application/pdf" });
  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sanitize(filenameStub)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function sanitize(s: string): string {
  return s.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120) || "clinic-export";
}
