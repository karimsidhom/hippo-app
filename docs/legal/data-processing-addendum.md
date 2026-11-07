---
title: Data Processing Addendum (DPA) — Template
version: 1.0
effectiveDate: 2026-05-08
status: Active template
---

# Data Processing Addendum

This Data Processing Addendum ("DPA") forms part of the agreement
between **the Customer** (the institution deploying Hippo) and
**Hippo Medicine Ltd.** ("Hippo") for the provision of the Hippo
case-logging and Competence-by-Design platform (the "Service").

## 1. Definitions

- **Personal Information** has the meaning given to it in the
  Personal Information Protection and Electronic Documents Act
  (PIPEDA) and equivalent provincial legislation, plus any
  health-information legislation applicable to the Customer
  (e.g. PHIA in Manitoba, PHIPA in Ontario).
- **User Personal Information** means Personal Information of the
  Customer's residents, fellows, attendings, and programme staff
  collected by Hippo to deliver the Service.
- **Case-Level Metadata** means the procedure-, role-, and
  rotation-level data that residents log in the Service. Case-Level
  Metadata is, by design, **not Personal Health Information** about
  patients (see the PHIA Attestation in this folder).
- **Sub-processor** means a third party engaged by Hippo to assist in
  delivering the Service.

## 2. Roles

For User Personal Information:
- The Customer is the **controller** when using the Service in their
  programme; Hippo is the **processor**.

For Case-Level Metadata:
- The User (resident, fellow) is the data subject and the author.
  The User retains full ownership and control: export, edit, delete
  at will. The Customer is not the controller of an individual
  resident's case log; the resident is.
- For programme-scoped derivatives (cohort dashboards, EPA totals
  surfaced to the PD), the Customer is co-controller within the
  privacy expectations the resident agrees to at programme join.

## 3. Subject matter, duration, nature, and purpose of processing

- **Subject matter**: providing the Service.
- **Duration**: the term of the Customer's agreement with Hippo, plus
  the legally-mandated retention windows defined in the PIA.
- **Nature**: storage, retrieval, computation, AI-assisted
  suggestion (EPA matching, dictation drafting, billing-code lookup),
  email notification.
- **Purpose**: enabling residents to log cases, track competency,
  collect attending sign-offs, and supporting programmes in their
  Royal College CBD obligations.

## 4. Hippo's obligations

Hippo will:

1. Process Personal Information only on the documented instructions
   of the Customer, including with regard to transfers (see §7).
2. Ensure that authorised personnel are bound by appropriate
   confidentiality obligations.
3. Implement appropriate technical and organisational measures to
   ensure security, including those listed in the Security Overview
   in this folder.
4. Engage Sub-processors only with the Customer's prior consent (a
   list is maintained in the PIA; updates require ≥ 30 d notice).
5. Assist the Customer in fulfilling its obligations to data
   subjects (access, correction, deletion) by providing the
   necessary export and deletion tooling within the Service.
6. Notify the Customer without undue delay (and within 72 h at the
   latest) on becoming aware of a Personal Information breach.
7. On termination, return or delete all Personal Information at the
   Customer's election, subject to the legal-retention exceptions
   defined in the PIA.
8. Make available all information necessary to demonstrate
   compliance, and allow audits / inspections by the Customer or an
   auditor mandated by the Customer (≥ 30 d notice; reasonable
   business hours; once per 12-month period absent a security
   incident).

## 5. Customer's obligations

The Customer will:

1. Issue lawful and proportionate processing instructions.
2. Ensure that the Customer's own legal basis for collecting User
   Personal Information is in place before users are invited to the
   Service.
3. Ensure users have read and accepted Hippo's Acceptable Use Policy
   and Privacy Policy at signup.
4. Promptly inform Hippo of any data subject request that requires
   action on the Service side.

## 6. Security measures

The technical and organisational measures Hippo implements are
documented in `security-overview.md` in this folder, and incorporated
into this DPA by reference. The measures include encryption at rest
and in transit, RLS, audit logging, dependency monitoring, annual
penetration testing, and 72-hour breach notification.

## 7. Data location and cross-border transfers

Default Hippo deployments use US-based sub-processors. Where the
Customer's jurisdiction restricts cross-border transfers, Hippo
will, on request and with at least 30 days' notice, deploy the
Customer's data to a Canadian sub-processor region (Supabase
`ca-central-1`). Vercel serverless processing remains US-based but
without persistent storage.

For US-based processing, Hippo and its sub-processors rely on:
- Standard contractual clauses (where the Customer is in the EEA / UK)
- The Customer's informed consent under PIPEDA s. 7(2)(a) (where the
  Customer is in Canada)

## 8. Sub-processors

Hippo's current Sub-processors are listed in the PIA. The Customer
may object to any new Sub-processor in writing within 30 days of
notice. If the parties cannot resolve the objection, the Customer
may terminate the affected Service component without penalty.

## 9. Audit rights

The Customer may, at its own expense and on at least 30 days' notice,
audit Hippo's compliance with this DPA once per 12-month period,
unless a confirmed Personal Information breach has occurred (in which
case audit rights are immediate). Hippo will cooperate in good
faith. Audit reports must be marked confidential and used solely for
the purpose of confirming compliance.

## 10. Liability

This DPA is subject to the limitation of liability provisions of the
Master Service Agreement between the parties.

## 11. Governing law

This DPA is governed by the laws of the Province of Manitoba and the
applicable federal laws of Canada, unless the parties' Master Service
Agreement specifies another jurisdiction, in which case the MSA's
choice of law applies.

## 12. Order of precedence

If there is a conflict between this DPA and the Master Service
Agreement, this DPA takes precedence on matters of Personal
Information processing.

---

**Signed:**

For Hippo Medicine Ltd.

Name: ______________________________
Title: _____________________________
Date: ______________________________

For the Customer

Name: ______________________________
Title: _____________________________
Date: ______________________________
