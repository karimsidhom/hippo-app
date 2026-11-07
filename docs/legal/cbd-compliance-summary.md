---
title: RCPSC Competence-by-Design (CBD) Compliance Summary
version: 1.0
effectiveDate: 2026-05-08
status: Active
appliesTo: Royal College accreditation reviewers
---

# CBD Compliance Summary — Hippo

This document maps Hippo's features to the assessment infrastructure
the Royal College of Physicians and Surgeons of Canada (RCPSC)
expects under its Competence-by-Design (CBD) model. It exists so an
accreditation reviewer (or a programme director preparing for one)
can verify Hippo supports each pillar.

## 1. The four CBD stages

CBD organises residency into four stages:

| Code | Stage |
|---|---|
| TD | Transition to Discipline |
| F | Foundations of Discipline |
| COD | Core of Discipline |
| TTP | Transition to Practice |

Hippo represents each stage with stage-specific EPAs in
`src/lib/epa/data.ts`. For Urology specifically, the library
contains:

- TD1–TD4 (4 EPAs)
- F1–F8 (8 EPAs)
- C1–C21 (21 EPAs)
- TTP1–TTP6 (6 EPAs)

= 39 EPAs covering the full RCPSC Urology CBD lifecycle.

Other surgical specialties (General Surgery, Orthopaedics, OB/GYN,
ENT, Plastics, Cardiothoracic, Vascular, Neurosurgery, Pediatric
Surgery) have partial libraries shipped; full coverage rolls out per
specialty as the user base demands.

## 2. EPA observation lifecycle

The CBD lifecycle is: *resident performs case → resident requests
observation → assessor observes → assessor entrusts → resident
reflects → CC reviews aggregate*. Hippo implements every step:

| Step | Hippo surface |
|---|---|
| Resident performs case | `/cases` quick-add or dictation flow |
| Auto-suggest matching EPAs | Post-save modal calls `/api/epa/ai-suggest` (Gemini-backed) |
| Resident requests observation | `EpaObservation` row written to DB; routed via in-app, email (token link), or SMS |
| Attending observes | `/log` (in-app) or `/review/:token` (no Hippo account required) |
| Entrustment scoring | RCPSC O-Score 1–5 + per-CanMEDS-role rating |
| Achievement | `EpaAchievementLevel` (NOT_ACHIEVED / ACHIEVED) per RCPSC |
| Resident reflects | Free-text reflection on the case + on the observation |
| Programme aggregate | `/pd-dashboard` for the PD; `/cc-reviews/:id` for the CC |

## 3. Stage progression

Hippo doesn't *enforce* stage transitions automatically — that's a CC
decision. But it surfaces the data the CC needs:

- Per-stage EPA completion percentage on the resident dashboard
- Cohort-level stage-progression heatmap on the PD dashboard
- Snapshot at CC meeting time captured in `CCReview.snapshot` for
  reproducibility
- CC decision (`PROMOTE` / `CONTINUE` / `ON_WATCH` / `REMEDIATION` /
  `PROBATION` / `GRADUATE` / `WITHDRAW`) logged with rationale and
  optional dissent

## 4. Multi-source feedback (MSF)

MSF (360°) collection is on the roadmap (Q3 2026). Until shipped,
programmes can:

- Use Hippo for case-logging + EPA + CC workflow
- Use a separate MSF tool (most programmes already do)
- Pass MSF aggregate into the `CCReview.snapshot` JSON for the CC's
  scrubbing dashboard via the API

Programmes that need MSF on day one should plan a hybrid deployment
for the first quarter and migrate when MSF is GA.

## 5. Accreditation evidence

Specific items the Royal College's accreditation reviewers ask about,
and where Hippo holds them:

| Reviewer asks | Hippo answer |
|---|---|
| "Show me a resident's complete observation trail." | `/profile` (resident) or `/pd-dashboard/:userId` (PD) — exports JSON + PDF |
| "Show me the CC meeting record for resident X in Q3 2026." | `/cc-reviews/:id` — printable, signed by chair |
| "How does your tool prevent retroactive editing of an EPA after sign-off?" | `EpaObservation` rows post-`SIGNED` are immutable except via a documented amend-and-supersede flow that preserves the original via `AuditLog` |
| "How are residents notified of EPA expectations per stage?" | Stage-specific dashboard section + onboarding tour |
| "How are residents protected from confidentiality breaches in pearls and the community?" | Per-post PHI scrub, plus the entire `/social` surface excludes any free-text patient reference |

## 6. Rotation block scheduling

CBD assumes case logging is *block-attributed* — every observation is
tied to a specific rotation. Hippo supports this via the `Rotation` +
`RotationAssignment` schema (added 2026-05-07). Cases and EPAs
auto-attribute to the rotation that was active on their date. The
`/rotations` page lets each resident see their timeline + per-block
case count + per-block EPA count.

## 7. Data retention

CBD assessment records carry a 25-year retention requirement (RCPSC
guideline). Hippo retains all `EpaObservation` records — including
those for users who have since deleted their account — for 25 years
under the redaction policy described in the PIA (resident name
replaced, programme record otherwise intact).

## 8. Differences from Entrada

For programmes considering migration from Entrada to Hippo:

- **Hippo treats the resident as the source of truth** for their case
  log. Programmes see aggregates; they cannot edit a resident's
  individual case without an audit-logged amend-and-supersede.
- **Hippo's AI EPA matching auto-suggests** a list of EPAs at case
  save time. Entrada requires manual selection. Residents using
  Hippo log ~3× more EPAs per case in early pilot data.
- **Hippo includes a dictation engine and billing-code support**
  that Entrada does not. These are workflow improvements, not CBD
  compliance items.
- **Hippo's CC workflow** is built into the same product as the case
  log; Entrada CC review typically requires a separate export to
  Excel + spreadsheet review. Hippo's snapshot-at-meeting approach
  preserves the data state for CBD audit.

## 9. Open items

The following CBD-relevant features are tracked publicly:

- Multi-source feedback (Q3 2026)
- Faculty-development EPAs (Q4 2026)
- SAML / OIDC SSO with Manitoba IDM and other IdPs (Q3 2026)
- Full RCPSC EPA libraries for all surgical specialties (rolling)

A programme can deploy Hippo today for case-logging, EPA
observation, rotation scheduling, CC workflow, and dashboarding —
the MSF gap is the only missing CBD pillar that requires a
side-system in the interim.

## Approval

| Role | Name | Date |
|---|---|---|
| Hippo CBD Lead | Karim Sidhom | 2026-05-08 |
| RCPSC accreditation reviewer | _Reserved_ | _TBD_ |
