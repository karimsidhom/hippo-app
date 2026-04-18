/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Small hardening win — no "X-Powered-By: Next.js" header on responses.
  poweredByHeader: false,
  images: {
    // Migrated from the deprecated `images.domains` array to
    // `remotePatterns` so next 16 stops warning on every build.
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.vercel.app"],
    },
  },
};

let finalConfig = nextConfig;

// ── Serwist (PWA service worker) ────────────────────────────────────────
// Feature-flagged via NEXT_PUBLIC_PWA_DISABLED — set to "true" on any
// deploy where we want to kill the service worker globally (rare, but
// the escape hatch matters: a broken SW can effectively brick returning
// users because browsers trust the cached shell over network refreshes).
// Default: PWA enabled in production builds, disabled in dev to avoid
// confusing "my changes aren't showing up" debugging sessions.
const pwaEnabled =
  process.env.NEXT_PUBLIC_PWA_DISABLED !== "true" &&
  process.env.NODE_ENV === "production";

try {
  if (pwaEnabled) {
    const withSerwist = require("@serwist/next").default;
    finalConfig = withSerwist({
      swSrc: "src/app/sw.ts",
      swDest: "public/sw.js",
      // Generate sourcemaps for the SW so Sentry can symbolicate runtime
      // errors inside the worker. Small file, worth it.
      disable: !pwaEnabled,
      // Tell Serwist which routes to precache beyond the auto-detected
      // static assets. The /offline fallback must be precached so it's
      // available even on the very first offline request.
      additionalPrecacheEntries: [{ url: "/offline", revision: null }],
      // Let Serwist auto-reload clients on SW activation. A bad cache
      // combined with manual reload usually means the user is stuck on
      // a broken shell until they force-quit.
      reloadOnOnline: true,
    })(nextConfig);
  }
} catch (err) {
  console.warn("[next.config] Serwist wrap skipped:", err && err.message);
}

// Sentry wrapper — only applied when SENTRY_AUTH_TOKEN is set (server-side
// build-time var). Without the token, @sentry/nextjs falls back to runtime-
// only init (still works for error capture, just skips source-map upload).
// The runtime DSN is NEXT_PUBLIC_SENTRY_DSN; without it, Sentry is a no-op.
try {
  const { withSentryConfig } = require("@sentry/nextjs");
  finalConfig = withSentryConfig(finalConfig, {
    silent: true,
    // Org + project are set via env in Vercel once Sentry is activated.
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    widenClientFileUpload: true,
    // Don't fail the build if source-map upload fails (e.g. DSN not yet set).
    errorHandler: (err) => {
      console.warn("[sentry-next-config] upload skipped:", err.message);
    },
  });
} catch {
  // @sentry/nextjs not installed — safe no-op.
}

module.exports = finalConfig;
