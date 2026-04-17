// Sentry — browser runtime init. Called automatically by Next.js 15+ on
// initial client hydration. Keeps the DSN check local so we don't ship
// a big bundle of Sentry code to users who haven't activated it yet.
//
// See sentry.server.config.ts for the rationale and the no-PII policy.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Lower than server — client errors are noisier (ad blockers, stray
    // extensions, browser-specific quirks). We can raise if visibility
    // becomes a problem.
    tracesSampleRate: 0.2,
    // Capture replays of sessions that errored so we can see what the
    // user was doing when a bug hit.
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    // Ignore Safari extension noise + random third-party script errors
    // that we can't fix anyway.
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications.",
      /Non-Error promise rejection captured/,
      /top\.GLOBALS/,
    ],
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
      /^safari-web-extension:\/\//i,
    ],
  });
}

// Next.js 15+ expects this export for router-transition instrumentation.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
