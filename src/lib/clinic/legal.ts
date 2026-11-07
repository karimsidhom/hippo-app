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
// Bumped 2026-05-03: added explicit SOC 2 honesty + compliance posture.
export const CLINIC_POLICY_VERSION = "2026-05-03";
export const CLINIC_POLICY_TEXT = `
Hippo Clinic — Clinician acknowledgement (v${CLINIC_POLICY_VERSION})

You must accept this each time the version changes. Reach out to support
if any item below is unclear.

CLINICIAN RESPONSIBILITIES
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
7. You will not paste another patient's PHI into a note that is in another
   patient's encounter, and you will not use Hippo Clinic outside the scope
   of your licensed practice.

COMPLIANCE POSTURE — what we ARE and ARE NOT today
- We use a Postgres database (Supabase) with Row-Level Security so every
  patient row is owner-only. The database provider is SOC 2 Type 2
  attested at the platform level. **The current Hippo Clinic Supabase
  PROJECT does not yet have its own SOC 2 Type 2 attestation.** Treat
  this app as appropriate for early-adopter / pilot use, not for whole-
  practice production until that attestation is in place.
- We use AI providers under written zero-retention / no-training terms
  (currently Groq for note generation and Whisper transcription). No
  patient data is used to train models.
- We log every action (audit logs) and we keep a tamper-evident note-
  version history. The audit log is open to you in Settings.
- We have NOT signed Business Associate Agreements for HIPAA-covered
  US workflows yet. Use of Hippo Clinic in the US is at the clinician's
  judgement; if you require a BAA, contact support before clinical use.

DATA HANDLING
- Audio is sliced into chunks, transcribed, then deleted from server
  storage by default. You can opt to retain audio per-encounter for
  medico-legal defence — see encounter settings.
- Patient PHI is never used outside Hippo Clinic. We do not share PHI
  into community / social features of any other Hippo product.

NO MEDICAL ADVICE
Hippo Clinic does not practise medicine. Outputs are drafts. The clinician
is the sole decision-maker for clinical care.
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
