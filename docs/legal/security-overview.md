---
title: Security Overview
version: 1.0
effectiveDate: 2026-05-08
status: Active
---

# Hippo — Security Overview

Plain-language summary of how Hippo is designed, what's encrypted,
how access is controlled, and what we do when something goes wrong.

## Identity & access

- **Authentication**: Supabase Auth (email + password, magic links,
  optional OAuth). Sessions are short-lived (1 h access token, 7 d
  refresh) with rotating refresh tokens.
- **Password policy**: 12+ characters, breached-password check via
  Supabase + HaveIBeenPwned, no maximum length, common-pattern
  rejection.
- **MFA**: TOTP supported. Hippo can require MFA at the institution
  level on request — not currently mandatory because it raises the
  switching cost from Entrada / paper logbooks beyond what residents
  will accept on day one.
- **Session timeout**: 30 min idle on shared / hospital workstations
  (configurable per-institution).
- **SSO** (planned for Q3 2026): SAML 2.0 + OIDC via Supabase Auth
  providers, integrating with university IdPs (Microsoft Entra,
  Okta, Manitoba IDM). Tracked in roadmap; not in current release.

## Data at rest

- **Database**: PostgreSQL on Supabase. AES-256 encryption at rest
  (Supabase-managed). Backups encrypted, retained 7 days
  (point-in-time recovery available on Pro+).
- **Object storage**: Supabase Storage (avatars only). AES-256 at
  rest. Public-read bucket; only the user can write to their own
  path (`{userId}/...`).
- **Secrets**: Vercel environment variables, encrypted at rest.
  Service-role keys, AI API keys, Sentry DSN never reach the
  browser. Rotated quarterly.
- **Logs**: Sentry (errors, scrubbed of PII), Vercel runtime logs
  (15 d retention), Supabase logs (7 d). No raw user-content lines
  ever logged.

## Data in transit

- TLS 1.3 enforced on every endpoint. HSTS preload-list inclusion
  pending (HSTS header active with `max-age=63072000;
  includeSubDomains; preload`).
- Supabase ↔ Hippo: TLS, mutual cert validation.
- Hippo ↔ AI providers: TLS, signed bearer tokens, no API key in
  query string.

## Row-level security (RLS)

Every user-data table in Hippo has Postgres RLS enabled. The
authoritative migration:

```
prisma/migrations/20260414010000_add_rls_baseline/migration.sql
prisma/migrations/20260418010000_rls_for_notifications/migration.sql
prisma/migrations/20260507000000_rotations_and_cc_reviews/migration.sql
```

Every policy keys to `auth.uid()` from the JWT and prevents read/write
of another user's rows. The Hippo backend bypasses RLS only via the
service-role key, which is held in Vercel's encrypted env. **An
exfiltrated anon key cannot read another user's data** — RLS still
applies because the anon key carries no `sub` claim.

For programme-scoped data (CC reviews, rotations, programme events),
RLS additionally checks `ProgramMember` membership.

## Audit trail

Every mutation that affects user data writes a row to `AuditLog`.
Captured fields: `userId`, `action`, `entityType`, `entityId`,
`changes` (JSON), `ipAddress`, `userAgent`, `timestamp`. The log is:

- Append-only (no `UPDATE` or `DELETE` SQL exposed to the app).
- Retained 7 years.
- Visible to the user (their own audit log is at `/settings/audit-log`).
- Visible to programme directors (their cohort's actions, scoped via RLS).

## PHI / PII handling

Hippo's signature design choice: the schema does not include patient
identifier fields (no MRN, PHIN, name, DOB, address, image). The
input pipeline forbids them via pattern detection in
`src/lib/case-import/pii.ts`. See `phia-attestation.md` for the
detailed verification path.

User PI (name, email, photo) is treated as standard PIPEDA-class
personal information and managed as documented in the PIA.

## Sub-processors

Listed and DPA-bound in the PIA. The same list applies here. Each
sub-processor is monitored quarterly for SOC 2 / ISO 27001 status
and notified breaches.

## Vulnerability management

- **Dependencies**: GitHub Dependabot enabled on every push;
  patch-level CVE alerts auto-PR'd.
- **CI**: typecheck (`tsc --noEmit`) and full Next build run on every
  PR. The build fails closed.
- **Static analysis**: ESLint + Next's built-in TypeScript checker.
- **Penetration test**: External assessor annually. Most recent
  report available under NDA.
- **Bug bounty**: in scope at hippomedicine.com/security; Hippo
  responds to disclosures within 24 h.

## Incident response

| Severity | Definition | Response time |
|---|---|---|
| P0 | Active data exfiltration or downtime > 30 min | 30 min ack, 2 h public update |
| P1 | Suspected unauthorised access, no confirmed exfil | 4 h ack, 24 h post-mortem |
| P2 | Vulnerability disclosure, no active exploit | 24 h ack, patched within 7 d |
| P3 | Hardening item / minor bug | Next sprint |

Confirmed breaches involving user PI are reported:

1. To the affected user(s) within 72 h via in-app and email.
2. To the relevant provincial commissioner per PIPEDA breach-reporting
   requirements (≥ 30 d retention of breach record).
3. To the deploying institution's privacy officer within 72 h.

## Offboarding

When a user deletes their account:
- All owned rows are cascade-deleted from the database within 30 d.
- Object-storage avatars are deleted within 30 d.
- AuditLog entries are *retained* for the 7-year legal evidence period
  but anonymised (user ID replaced with a hash).
- Programme-level EPA records the resident's attendings signed off on
  are retained for the 25-year Royal College assessment-record period
  (the user is informed at deletion). Resident's name is replaced with
  `[redacted by user request]` in those records.

When an institution offboards entirely, all programme-scoped data
(rotations, CC reviews, programme events) is exported as JSON + CSV
and delivered to the institution within 30 d of formal request.
After delivery, the data is purged from Hippo within an additional
30 d.

## Compliance roadmap

- **SOC 2 Type I** — target Q3 2026
- **SOC 2 Type II** — target Q4 2026
- **ISO 27001** — target 2027
- **Canadian Supabase region as default** — available on request now;
  default for new institutional deployments from Q3 2026
- **HIPAA BAA template** — available now on request; standardised in
  Q3 2026

## Contact

Security disclosures: `security@hippomedicine.com`
PGP key: published at hippomedicine.com/security
Privacy officer: Karim Sidhom (founder)
