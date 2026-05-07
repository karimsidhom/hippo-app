"use client";

// Next.js 13+ App Router global error boundary.
//
// This file MUST be a client component and MUST exist alongside the root
// layout to catch React render errors that escape the rest of the app's
// boundaries. Without it, Sentry can't see App Router render exceptions
// (per @sentry/nextjs guidance — emits a build-time warning otherwise).
//
// Behaviour:
//   1. Capture the error to Sentry the moment this component mounts.
//   2. Render a quiet, branded fallback that matches the rest of the
//      Hippo dark canvas — no white-flash error screen.
//   3. Offer a "Try again" button that re-renders the route via
//      Next's reset() callback.

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          background: "#060d13",
          color: "#E2E8F0",
          fontFamily:
            "'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          minHeight: "100dvh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            textAlign: "center",
            background: "rgba(14,165,233,0.015)",
            border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: 20,
            padding: "32px 28px",
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.4px",
              margin: "0 0 10px",
            }}
          >
            Something broke.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(226,232,240,0.55)",
              lineHeight: 1.55,
              margin: "0 0 20px",
            }}
          >
            Hippo hit an unexpected error. Our team has been notified.
            You can usually recover by trying again.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 11,
                color: "rgba(226,232,240,0.3)",
                fontFamily: "'Geist Mono', monospace",
                margin: "0 0 20px",
              }}
            >
              ref: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "12px 22px",
              background:
                "linear-gradient(135deg, #38bdf8, #0284c7)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 24px -4px rgba(14,165,233,0.35)",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
