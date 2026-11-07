// Hippo Clinic — audit log helpers.
//
// We piggy-back on the existing global AuditLog table for cross-module
// activity (sign-in, profile change), and we keep AI-specific telemetry on
// `clinic_ai_audit_logs`. This file is the seam: every API route that
// touches a clinic encounter calls one of these helpers so we never forget.

import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type ClinicAuditAction =
  | "clinic.encounter.create"
  | "clinic.encounter.update"
  | "clinic.encounter.delete"
  | "clinic.encounter.finalize"
  | "clinic.consent.capture"
  | "clinic.note.generate"
  | "clinic.note.regenerate"
  | "clinic.note.transform"
  | "clinic.note.edit"
  | "clinic.note.export"
  | "clinic.transcript.append"
  | "clinic.audio.upload"
  | "clinic.audio.purge"
  | "clinic.followup.update"
  | "clinic.patient.create"
  | "clinic.patient.update"
  | "clinic.patient.delete";

interface ClinicAuditInput {
  userId: string | null;
  action: ClinicAuditAction;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  req?: Request;
}

/**
 * Record a clinic-level event in the global AuditLog. Fire-and-forget;
 * failures are swallowed so audit never breaks the parent request.
 */
export function logClinicAudit(input: ClinicAuditInput): void {
  // The global AuditLog uses a tighter enum for `action`. We pass our string
  // through metadata.specificAction so we don't have to widen the global
  // enum every time we add a clinic event.
  void logAudit({
    userId: input.userId,
    // The global helper only knows generic actions; we encode our specific
    // clinic action in metadata. The action field is set to the closest
    // generic match for cross-module dashboards.
    action: mapToGenericAction(input.action),
    entityType: "CaseLog", // closest entity type — the global enum doesn't include clinic yet
    entityId: input.entityId ?? null,
    before: input.before,
    after: input.after,
    metadata: { ...input.metadata, clinicAction: input.action, module: "clinic" },
    req: input.req,
  });
}

function mapToGenericAction(a: ClinicAuditAction):
  | "case.create" | "case.update" | "case.delete" | "profile.update" | "audit.correction" {
  switch (a) {
    case "clinic.encounter.create":
    case "clinic.patient.create":
      return "case.create";
    case "clinic.encounter.delete":
    case "clinic.patient.delete":
      return "case.delete";
    default:
      return "case.update";
  }
}

interface AiAuditInput {
  encounterId: string;
  ownerUserId: string;
  action: "transcribe" | "generate-note" | "regenerate-section" | "shorten" | "letter" | "patient-friendly" | "billing" | "extract-followups";
  model?: string;
  promptHash?: string;
  inputCharCount?: number;
  outputCharCount?: number;
  ok?: boolean;
  errorMessage?: string;
  durationMs?: number;
}

/** Append a row to clinic_ai_audit_logs. Never throws. */
export async function logClinicAi(input: AiAuditInput): Promise<void> {
  try {
    await db.clinicAiAuditLog.create({
      data: {
        encounterId: input.encounterId,
        ownerUserId: input.ownerUserId,
        action: input.action,
        model: input.model ?? null,
        promptHash: input.promptHash ?? null,
        inputCharCount: input.inputCharCount ?? 0,
        outputCharCount: input.outputCharCount ?? 0,
        ok: input.ok ?? true,
        errorMessage: input.errorMessage ?? null,
        durationMs: input.durationMs ?? null,
      },
    });
  } catch (err) {
    // Never break the parent route on audit failure.
    console.error("[clinic.audit.ai] failed:", err);
  }
}
