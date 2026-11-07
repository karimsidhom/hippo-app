// Next.js runtime instrumentation — loads once per Node process on cold start.
// This is where server-side telemetry hooks are initialised (Sentry, OTel,
// custom loggers). Next picks this file up automatically if it sits at the
// project root or src/ root.
//
// We branch on the runtime flag because Sentry init differs between the
// Node server process and the edge runtime (middleware). Importing the wrong
// config in the wrong runtime throws at build time.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures server-side request errors so they reach Sentry with the full
// request context (URL, method, user-agent). Without this hook, errors
// thrown in route handlers log to Vercel but never reach Sentry.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
