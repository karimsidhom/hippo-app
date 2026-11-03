# Program hub and case logging implementation plan

> **For agentic workers:** Use the existing architecture and API review handoffs; implement the three independent scopes below, then review the integrated result.

**Goal:** Restore the phone logging anchor, simplify the case sheet, and add a program hub with shared calendar, documents and member management.

**Architecture:** Keep the existing shell, tokens, typography and case-save behavior. Extract member management once for the existing sheet and new hub. Add member-authorized, server-only document storage routes and an unapplied Prisma migration.

**Tech stack:** Existing Next.js 16, React, Prisma, Supabase Storage and Vitest dependencies.

**Spec:** User's A/B/C implementation specification in this session.

## Global constraints

- Preserve the Codex sidebar, light/dark tokens, Geist, `--fs-*`, primary buttons and lucide icons; no emoji.
- Do not edit HippoIntro, HippoMark, theme files, program authorization logic, PD meeting code or existing API routes.
- Do not install packages, use the network, commit, push, deploy or apply migrations.
- Preserve all case fields, defaults, validation and save/SMSNA/OPRS/EPA behavior.

## Review focus

- Phone keyboard and safe areas: picker header/search and case Save remain reachable.
- Portal stacking: picker is above case sheet and case sheet is above install banner.
- Program routing: redirect only after successful checks establish no pending requests/invitations.
- Document isolation: all operations verify membership and document/program identity; deletion verifies uploader or manager.
- Storage failures: compensate a failed row create and retain the row when object deletion fails.

## Tasks

- [x] A/B: Restore five-column dock center anchor and remove phone-header Log; reorganize case form and portal picker with local component CSS and viewport sizing.
- [x] C frontend: Add optional calendar scope; extract member body/handlers; build hub, upcoming list and documents UI; link cards and safely redirect single-program members.
- [x] C backend: Add model/back-relations and exact SQL migration; test upload validation/filenames; add list/upload/download/delete routes using the agreed API contract.
- [x] Integration: Review diffs, authorization, error handling, existing flows and unchanged protected files; address findings.
- [x] Verification: Run `npx prisma generate`, `npx tsc --noEmit -p .`, `npx vitest run`, then the specified demo-environment `npx next build --webpack`. All passed on the final implementation; 181 tests across 14 files.

## Document contract

`GET /api/programs/:id/documents` returns `{ documents }`; POST returns `{ document }` with status 201. Each document exposes `id`, `programId`, `uploadedById`, `title`, `fileName`, `mimeType`, `sizeBytes`, ISO `createdAt`, `uploadedBy: { name } | null`, and server-computed `canDelete`. Keep `storagePath` server-only. DELETE returns `{ success: true }`; errors return `{ error }`. Download redirects with status 302 to a signed URL valid for 60 seconds.

## Review outcomes and limits

- Code and static UX reviews approved after correcting retained program state, preserving a director's create-program entry point, and compacting keyboard-height overlays.
- QuickAdd specialty now follows the profile with the existing urology fallback; manual selection and SMSNA behavior remain intact.
- Coming up uses the next 365 days because the existing events API caps each query at 366 days.
- Storage operations are covered by mocked route tests; no live database/storage integration or migration execution occurred.
- Browser host unavailable: screenshots, real iOS keyboard behavior, console and Core Web Vitals could not be measured.
- Concurrent external changes in the root layout, HippoIntro and AuthContext were preserved untouched by this task.
