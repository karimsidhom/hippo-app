"use client";

// Route-level error boundary for the signed-in app. Keeps the app shell
// (sidebar / bottom nav) on screen and offers a retry, instead of the
// whole-page global-error fallback.

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function AppError({
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
    <div style={{
      minHeight: "50dvh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 0",
    }}>
      <div style={{
        maxWidth: 420, width: "100%", textAlign: "center",
        background: "var(--surface)", border: "1px solid var(--border-mid)",
        borderRadius: 10, padding: "28px 24px",
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>
          Something went wrong on this page
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5, margin: "0 0 20px" }}>
          Your logged cases are not affected. Try again, or head back home.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => reset()}
            style={{
              minHeight: 44, padding: "0 18px", borderRadius: 8, border: "none",
              background: "var(--primary)", color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            style={{
              minHeight: 44, padding: "0 18px", borderRadius: 8,
              border: "1px solid var(--border-mid)", background: "var(--surface2)",
              color: "var(--text)", fontSize: 14, fontWeight: 600, textDecoration: "none",
              display: "inline-flex", alignItems: "center",
            }}
          >
            Home
          </Link>
        </div>
        {error.digest && (
          <p style={{ fontSize: 11, color: "var(--text-3)", margin: "16px 0 0", fontFamily: "'Geist Mono', monospace" }}>
            Ref {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
