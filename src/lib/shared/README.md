# `src/lib/shared` — cross-platform code

Code in this directory is **imported by both the Next.js web app and the
Expo mobile app** (see `mobile/metro.config.js` — it watches this folder).

Rules for what belongs here:

1. **Pure TypeScript only.** No `next/*`, no `react-dom`, no
   `next-auth`, no Prisma client, no server-only imports (`@/lib/db`,
   `next/headers`, `fs`, `crypto` on Node only).
2. **No React.** UI primitives live in each platform's own directory
   (web: `src/components/ui/`, mobile: `mobile/src/components/`).
3. **Zod schemas, enums, small pure functions, domain types.** These
   are the shareable bits. The schemas are the single source of truth
   for "what does a valid case-log request look like" — both platforms
   must agree or the API rejects the request.

When a Zod schema is used in an API route, import it from here rather
than declaring it inline, so the mobile app sees the same validation.

Phase 2 (later): promote to a proper pnpm-workspaces monorepo with
`apps/web/`, `apps/mobile/`, `packages/shared/`. Until then, Metro's
`watchFolders` handles the cross-app import without a publish step.
