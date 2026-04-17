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

module.exports = nextConfig;
