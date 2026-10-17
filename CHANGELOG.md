# Changelog

## 2026-10-16: Hippo ID, Phase 1 (PR #34, deployment dpl_Efmwz9FwKJf2Er2LUXKMSPDoB8Vq)

One sign-in across the Hippo Suite. Spec: hippo-handover/docs/superpowers/specs/2026-10-16-hippo-id-design.md

- **Session on the parent domain.** The Supabase cookie is written on `.hippomedicine.com` by the server client, the browser client and `src/proxy.ts`, so a sign-in here opens Handover, Research and Study signed in, and a sign-out in any of them signs out here. localhost and previews keep host-only cookies.
- **One-time migration** in `src/proxy.ts`: an existing host-only session moves to the parent domain on the first visit after deploy (marker cookie `hippo-id`); duplicate or mixed cookie sets are cleaned by keeping the session that expires last; every exit (redirects, JSON 401s) keeps cookies Supabase refreshed.
- **Shared profile.** `src/lib/hub-profile.ts` mirrors the Cases identity into `hub_profiles` (name without honorific, specialty, program, level, country, photo) after PATCH /api/profile, photo upload and removal, and register. A hub failure is logged as `[hippo:hub]` and never fails the Cases save. `hub_profiles` was created and backfilled for all 42 accounts through the Supabase MCP; Prisma's schema is untouched.
- **HippoDock** beside Settings on the dashboard: the four suite apps, your photo or initials, and an inbox slot for Phase 2 that shows nothing yet.
- `src/lib/hippo-id.ts` and `src/components/HippoDock.tsx` are byte-identical to the Handover copies, where their 30 tests run.
