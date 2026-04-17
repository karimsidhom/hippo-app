// Sentry — edge runtime init (middleware + edge API routes).
//
// Middleware runs in the edge runtime on Vercel, which is a separate
// init context from the Node server. Without this file, middleware
// errors never reach Sentry even when the server config is working.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  });
}
