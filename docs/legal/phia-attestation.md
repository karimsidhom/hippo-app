---
title: PHIA Attestation (Manitoba — Personal Health Information Act)
version: 1.0
effectiveDate: 2026-05-08
status: Active
appliesTo: Manitoba deployments
---

# PHIA Attestation — Hippo

## Summary statement

**Hippo does not collect, use, store, or disclose Personal Health
Information ("PHI") as defined in section 1(1) of the Manitoba
Personal Health Information Act (PHIA).** Therefore, Hippo is not a
"trustee" within the meaning of section 1(1) PHIA and does not handle
information that triggers the trustee duties at sections 17–62.

This attestation explains the design choices that make that statement
true and how the Manitoba Office of the Ombudsman can independently
verify it.

## Why Hippo isn't a PHIA trustee

PHIA defines Personal Health Information as information about an
identifiable individual that relates to their health, health care, or
the payment for health care. Two ingredients must both be present:
**identifiability** and **health relevance**.

Hippo's case-log content is health-relevant. It is not identifiable.
Specifically, the schema and validation pipeline forbid storing any
of the section 1(1) "personal identifiers":

- **Patient name** — never collected. Free-text fields are
  pattern-screened for two-word capitalised tokens and refuse to save.
- **Manitoba PHIN** — pattern-detected (9 digits) and refused.
- **Health card / OHIP / etc. numbers** — pattern-detected and refused.
- **Date of birth** — never collected. Patient age stored as a six-bin
  enum (`UNDER_18`, `AGE_18_30`, `AGE_31_45`, `AGE_46_60`, `AGE_61_75`,
  `OVER_75`, `UNKNOWN`).
- **Address / postal code** — never collected.
- **Photographic image of the patient** — refused at upload.
- **Encoded identifier** (MRN) — pattern-detected and refused.

The case log captures procedure, role, autonomy, attending **label**
(name of the supervising staff surgeon, who is the user's *colleague*,
not the patient), operative duration, complication category, and the
resident's free-text reflection. None of these, individually or in
aggregate, can re-identify a patient.

## What Hippo does collect

Hippo collects personal information **about its users** (residents,
fellows, attendings, programme staff): name, email, profile photo,
training year, institution, plus the case-log content the user
authors. PIPEDA and the Manitoba Personal Information Protection
and Identity Theft Prevention Act (PIPITPA) apply to this data.
Hippo is a PIPEDA-compliant custodian of user PI; see the
companion PIA in this folder.

## Verification path for the PHIA office

The following steps give an investigator the concrete evidence:

1. **Schema review** — open `prisma/schema.prisma` in the Hippo repo.
   The `CaseLog` model has no fields named `patientName`,
   `patientMRN`, `patientPHIN`, `dateOfBirth`, `address`, `postalCode`,
   or `photo`. The `patientAgeBin` field is an enum, not a date.

2. **Input validation** — see `src/lib/case-import/pii.ts`
   (PII pattern detector) and the case-form components in
   `src/components/cases/`. Both run the same regex set:
   - Name (two capitalised words ≥ 3 chars)
   - 9-digit PHIN
   - 10-digit OHIP / similar
   - DOB patterns
   - 6-digit Canadian postal codes
   Any match raises a hard-stop error before the form will submit.

3. **AI provider scrubbing** — every outbound LLM call passes through
   the same PII detector, plus a structural prompt-injection scrubber
   in `src/lib/clinic/prompts.ts::scrubPriorContextForPrompt`. No
   provider receives raw clinical narrative without the scrub.

4. **Database row-level security** — see migration
   `prisma/migrations/20260414010000_add_rls_baseline/migration.sql`.
   Every user-data table has RLS enabled and policies require
   `auth.uid() = userId` for read/write. A stolen anonymous key
   cannot read another user's data.

5. **Audit trail** — every change to a user's data is logged to the
   `AuditLog` table (`prisma/schema.prisma`). The audit log is
   append-only and 25-year-retained.

## What if a resident violates the input rules?

Despite the auto-screen, a resident could still attempt to enter PHI
in a free-text field by, for example, abbreviating a patient's name to
escape the regex. Hippo's response:

- The on-save scan repeats at the server, not just the client.
- A successful malicious bypass is treated as a security incident.
  The resident receives a written warning; the data is purged within
  24 h.
- The institution's privacy officer is notified within 72 h per PHIA's
  general breach reporting expectations, even though the data may not
  legally qualify as a PHIA breach (since Hippo isn't a trustee).

## Sub-processors

All sub-processors listed in the PIA (Vercel, Supabase, Groq,
Gemini, OpenAI, Sentry, PostHog, Resend) receive only **user**
personal information and **case-level metadata** as defined above.
None receive PHI.

If the deploying Manitoba institution requires that **all** data —
including user PI — remain in Canada, Hippo can be redeployed with
a Canadian Supabase region (`ca-central-1`) on request. Vercel
serverless functions remain US-based but process data in transit
without persistent storage.

## Approval

| Role | Name | Date |
|---|---|---|
| Hippo Privacy Officer | Karim Sidhom | 2026-05-08 |
| Manitoba institutional privacy lead | _TBD_ | _TBD_ |

This attestation is a contractual statement. Material change to the
schema or input pipeline triggers a re-attestation.
