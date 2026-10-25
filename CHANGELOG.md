# Changelog

## 2026-10-19: Checks on every pull request, first case-log tests

- **CI.** `.github/workflows/ci.yml` runs on every pull request: `npm ci`, Prisma client, `npm run typecheck`, `npm test`, `npm run build`. Placeholder env values only; no real key is given to CI. Free private-repo Actions minutes.
- **First tests** (`tests/case-log.test.ts`, vitest, 12 tests) run the real route handlers with an in-memory fake database: creating a case (saved to the signed-in user, schema defaults, 400 on bad input, 401 signed out, feed event only when public), editing (whitelist, date conversion, owner cannot be changed, 404 on someone else's case) and the Excel export (sheets, every case, year filter, other users' cases excluded, attending, site and MRN never reach the file).
- New scripts: `npm run typecheck`, `npm test`.

## 2026-10-16: Hippo Link, Phase 2 (Handover to Cases)

Cases you flag in Handover land here ready to log. Spec: hippo-handover/docs/superpowers/specs/2026-10-16-hippo-link-design.md

- **Inbox badge.** The dashboard polls `GET /api/link/inbox` on load and every 60 s while visible; HippoDock shows the count and an Inbox row, and one quiet line under the header says how many cases from Handover are waiting.
- **/inbox** now opens for everyone: a From Handover section comes first, with a card per case (procedure, date, attending, site, "From Handover, 2h ago") and Log or Dismiss. The EPA sign-off inbox below it is unchanged and still for attendings, PDs and staff; residents see a teaching empty state instead of the lock screen.
- **Prefilled log form.** `/log?handoff=<id>` (the Log button and Handover's deep link) fills procedure, date, role, attending, site and diagnosis. The procedure is fuzzy matched (names and aliases, shorthand, typos) against the procedure list the picker uses, with the raw Handover text shown under it. `procedure_definitions` has no rows in production, so the match runs on the static procedure library, which is what the form saves from. A banner says to check each field; saving goes through the normal case path, and only a save with a real case id marks the handoff consumed.
- **Sign-in keeps the link.** The proxy now carries the query string in `?next=` and the login sends you to `next` (same-site paths only, `src/lib/safe-next.ts`) instead of always to the dashboard.
- **API:** `GET /api/link/inbox`, `GET` and `PATCH /api/link/handoffs/[id]`, read and written as the signed-in user so row level security keeps users apart (`src/lib/link/server.ts`). Every payload passes the shared whitelist again on the way to the browser.
- `src/lib/hub-link.ts` and the updated `src/components/HippoDock.tsx` are byte-identical to the Handover copies, where the tests run (50 new, 308 total).

## 2026-10-16: Hippo ID, Phase 1 (PR #34, deployment dpl_Efmwz9FwKJf2Er2LUXKMSPDoB8Vq)

One sign-in across the Hippo Suite. Spec: hippo-handover/docs/superpowers/specs/2026-10-16-hippo-id-design.md

- **Session on the parent domain.** The Supabase cookie is written on `.hippomedicine.com` by the server client, the browser client and `src/proxy.ts`, so a sign-in here opens Handover, Research and Study signed in, and a sign-out in any of them signs out here. localhost and previews keep host-only cookies.
- **One-time migration** in `src/proxy.ts`: an existing host-only session moves to the parent domain on the first visit after deploy (marker cookie `hippo-id`); duplicate or mixed cookie sets are cleaned by keeping the session that expires last; every exit (redirects, JSON 401s) keeps cookies Supabase refreshed.
- **Shared profile.** `src/lib/hub-profile.ts` mirrors the Cases identity into `hub_profiles` (name without honorific, specialty, program, level, country, photo) after PATCH /api/profile, photo upload and removal, and register. A hub failure is logged as `[hippo:hub]` and never fails the Cases save. `hub_profiles` was created and backfilled for all 42 accounts through the Supabase MCP; Prisma's schema is untouched.
- **HippoDock** beside Settings on the dashboard: the four suite apps, your photo or initials, and an inbox slot for Phase 2 that shows nothing yet.
- `src/lib/hippo-id.ts` and `src/components/HippoDock.tsx` are byte-identical to the Handover copies, where their 30 tests run.
