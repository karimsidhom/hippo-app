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

// Sentry wrapper — only applied when SENTRY_AUTH_TOKEN is set (server-side
// build-time var). Without the token, @sentry/nextjs falls back to runtime-
// only init (still works for error capture, just skips source-map upload).
// The runtime DSN is NEXT_PUBLIC_SENTRY_DSN; without it, Sentry is a no-op.
let finalConfig = nextConfig;
try {
  const { withSentryConfig } = require("@sentry/nextjs");
  finalConfig = withSentryConfig(nextConfig, {
    silent: true,
    // Org + project are set via env in Vercel once the user activates Sentry.
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    // Hide the Sentry CLI banner in build logs.
    widenClientFileUpload: true,
    disableLogger: true,
    // Don't fail the build if upload fails (e.g. DSN not yet set).
    errorHandler: (err) => {
      console.warn("[sentry-next-config] upload skipped:", err.message);
    },
  });
} catch {
  // @sentry/nextjs not installed — safe no-op.
}

module.exports = finalConfig;
