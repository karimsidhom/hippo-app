// Hippo Clinic — Module-specific legal acceptance.
//
// We piggy-back on the existing LegalAcceptance table (used for EULA,
// terms, privacy, PHIA, acceptable-use across all Hippo apps) and add
// one more policyKey: "clinic-scribe-acknowledgement".
//
// The acceptance text covers the three things a clinician must
// acknowledge before using an AI scribe in clinical care:
//
//   1. The clinician remains responsible for the accuracy of every note.
//   2. AI may misinterpret, omit, or fabricate — clinician review is
//      mandatory before finalising.
//   3. Patient consent must be captured before ambient or dictated
//      capture begins.
//
// We re-prompt the user when the version bumps. The current version is
// the date of last material change.

import { db } from "@/lib/db";

export const CLINIC_POLICY_KEY = "clinic-scribe-acknowledgement";
export const CLINIC_POLICY_VERSION = "2026-05-02";
export const CLINIC_POLICY_TEXT = `
Hippo Clinic — Clinician acknowledgement (v${CLINIC_POLICY_VERSION})

By using Hippo Clinic you confirm that:

1. You are a licensed clinician practising in a jurisdiction where AI-assisted
   clinical documentation is permitted.
2. You will REVIEW every AI-drafted note before finalising it. The AI may
   misinterpret speech, miss details, or generate plausible-sounding content
   that is wrong. You are the medical author of record.
3. You will obtain and document patient consent before capturing audio for
   ambient or dictated notes, in accordance with your local privacy law
   (PHIA / PHIPA / HIPAA / equivalent).
4. You will not enter information about a patient who has declined the AI
   scribe into the recorder.
5. Hippo Clinic is a documentation aid only. It does not provide medical
   advice, diagnoses, or treatment decisions. You retain full clinical
   responsibility.
6. You are responsible for the accuracy of any billing codes you submit. Codes
   suggested by Hippo are matched against the fee schedule you have loaded
   for your province; verify each one against the official manual before
   submitting.
`.trim();

export async function hasAcceptedClinicPolicy(userId: string): Promise<boolean> {
  const row = await db.legalAcceptance.findFirst({
    where: {
      userId,
      policyKey: CLINIC_POLICY_KEY,
      version: CLINIC_POLICY_VERSION,
    },
    select: { id: true },
  });
  return Boolean(row);
}

export interface AcceptInput {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordClinicAcceptance(input: AcceptInput): Promise<void> {
  await db.legalAcceptance.upsert({
    where: {
      userId_policyKey_version: {
        userId: input.userId,
        policyKey: CLINIC_POLICY_KEY,
        version: CLINIC_POLICY_VERSION,
      },
    },
    update: { acceptedAt: new Date() },
    create: {
      userId: input.userId,
      policyKey: CLINIC_POLICY_KEY,
      version: CLINIC_POLICY_VERSION,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
