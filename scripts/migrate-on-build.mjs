#!/usr/bin/env node
// ---------------------------------------------------------------------------
// migrate-on-build.mjs
//
// Runs `prisma migrate deploy` if DATABASE_URL is configured. Skips with a
// loud warning if the variable is missing — that way local `npm run build`
// without a prod DB still works, and Vercel preview deploys without a
// connected DB don't fall over either.
//
// To enable migrate-on-build for a Vercel project: add DATABASE_URL to
// the Build environment (Project → Settings → Environment Variables →
// "Build" scope, not just "Runtime") and re-deploy. The next build will
// run `migrate deploy` before `next build`, applying any pending Prisma
// migrations to the target DB before the lambdas spin up.
//
// Failure to migrate is loud: if DATABASE_URL is set but the migration
// errors, the build exits with a non-zero code and Vercel marks the
// deploy as Error — exactly the behaviour we want for schema drift.
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process';

const url = process.env.DATABASE_URL;

if (!url) {
  console.warn(
    '[hippo:migrate-on-build] DATABASE_URL not set — skipping `prisma migrate deploy`. ' +
      'This is fine locally; on Vercel, add DATABASE_URL to the Build env to apply ' +
      'pending migrations automatically on each deploy.',
  );
  process.exit(0);
}

console.log('[hippo:migrate-on-build] DATABASE_URL detected → running prisma migrate deploy');

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  console.error('[hippo:migrate-on-build] migrate deploy failed — failing build.');
  process.exit(result.status ?? 1);
}

console.log('[hippo:migrate-on-build] migrate deploy succeeded.');
