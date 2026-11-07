// Sentry — server-side runtime init.
//
// Loaded once per Node.js process via instrumentation.ts. Captures
// unhandled errors in route handlers, server components, and server
// actions. Browser-side errors are captured separately via
// instrumentation-client.ts so we can tune sample rates independently.
//
// Activation: Sentry is a no-op until NEXT_PUBLIC_SENTRY_DSN is set in
// Vercel env. Until you sign up for a Sentry project and add the DSN,
// nothing is reported — which is the correct default while we're
// pre-launch. See docs/sentry-setup.md for the 5-minute activation steps.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Low-traffic beta → 100% trace sample. When users scale up, drop to 0.1.
    tracesSampleRate: 1.0,
    // Never send PII — PHIA risk. We scrub cookies + explicit PII fields.
    sendDefaultPii: false,
    // Tag the environment so prod vs preview are filterable in Sentry UI.
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    // Filter out benign client-abort noise (user navigated away mid-request).
    beforeSend(event, hint) {
      const err = hint.originalException as Error | undefined;
      if (err?.name === "AbortError") return null;
      return event;
    },
  });
}
