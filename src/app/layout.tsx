import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeBootstrapScript } from "@/context/ThemeContext";
import { AppProviders } from "@/components/AppProviders";

// All pages require runtime auth — never prerender statically
export const dynamic = "force-dynamic";

// Module-aware metadata: when NEXT_PUBLIC_DEFAULT_MODULE=clinic, every
// icon, splash, manifest, title, and description swaps to the Hippo
// Clinic identity. The teal Hippo Log identity is the default for all
// other deployments. Both sets of assets ship in /public so a new
// deployment can flip this with a single env var.
const isClinic = process.env.NEXT_PUBLIC_DEFAULT_MODULE === "clinic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://hippomedicine.com"),
  title: isClinic
    ? { default: "Hippo Clinic — AI Clinic Scribe", template: "%s | Hippo Clinic" }
    : { default: "Hippo — Strava for Surgeons", template: "%s | Hippo" },
  description: isClinic
    ? "Hippo Clinic is an outpatient AI scribe for clinicians — ambient or dictated capture, structured clinic notes, follow-up tracking, PHIA/HIPAA-aware."
    : "Hippo is the premier surgical case logging platform for residents, fellows, and staff surgeons. Track your operative volume, learning curves, milestones, and benchmarks — with full PHIA/HIPAA privacy compliance.",
  keywords: isClinic
    ? ["clinic scribe","ai scribe","ambient scribe","clinic note","outpatient documentation","ehr","urology","family medicine","internal medicine"]
    : ["surgical case log","surgery tracker","resident case log","operative log","RCSPC","urology","surgical training","milestone tracking"],
  authors: [{ name: "Hippo" }],
  creator: "Hippo",
  publisher: "Hippo",
  robots: {
    index: false,
    follow: false,
  },
  icons: isClinic
    ? {
        icon: [
          { url: "/clinic/favicon.ico", rel: "icon" },
          { url: "/clinic/favicon-16.png", sizes: "16x16", type: "image/png" },
          { url: "/clinic/favicon-32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: [
          { url: "/clinic/apple-touch-icon.png", sizes: "180x180" },
          { url: "/clinic/icons/icon-152.png", sizes: "152x152" },
          { url: "/clinic/icons/icon-120.png", sizes: "120x120" },
        ],
      }
    : {
        icon: [
          { url: "/favicon.ico", rel: "icon" },
          { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
          { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: [
          { url: "/apple-touch-icon.png", sizes: "180x180" },
          { url: "/icons/icon-152.png", sizes: "152x152" },
          { url: "/icons/icon-120.png", sizes: "120x120" },
        ],
      },
  manifest: isClinic ? "/manifest-clinic.json" : "/manifest.json",
  // iOS Safari honours these via the legacy apple-mobile-web-app-* meta
  // set (still required in 2026 even though the PWA manifest's display
  // field covers most platforms — iOS is perpetually one spec behind).
  appleWebApp: {
    capable: true,
    title: "Hippo",
    statusBarStyle: "black-translucent",
    startupImage: [
      // Width, height, media query for each Apple device. iOS picks the
      // closest match via the media attribute on <link rel="apple-touch-
      // startup-image">. Without these, launch shows a white flash.
      { url: "/splash/apple-splash-1290-2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-1206-2622.png", media: "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-1179-2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-1170-2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-1125-2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-828-1792.png",  media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash/apple-splash-750-1334.png",  media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash/apple-splash-1668-2388.png", media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash/apple-splash-2048-2732.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
    ],
  },
  // Opt this medical app into mobile-web-app mode on non-Apple platforms
  // (Chrome on Android uses this header).
  other: {
    "mobile-web-app-capable": "yes",
    "application-name": "Hippo",
    "format-detection": "telephone=no",
  },
};

// NOTE: We intentionally do NOT set `maximumScale` or `userScalable: false`.
// Pinch-to-zoom is a WCAG accessibility requirement, and several residents
// reviewing this app will be using it one-handed in scrub areas. The iOS
// input-zoom bug is solved at the `<Input>` level (16px min font-size), not
// by locking the viewport. `viewportFit: "cover"` lets us paint under the
// iPhone notch/home-indicator and then inset content with env(safe-area-*).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Two theme colours so iOS Safari status bar matches both light + dark
  // modes once we add a light theme. For now both map to the same dark
  // canvas — harmless, forwards-compatible.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Whole-deployment Hippo Clinic mode. When NEXT_PUBLIC_DEFAULT_MODULE is
  // set to "clinic" (e.g. on the v0-heidi-clone Vercel project), we tag the
  // <html> root with data-module="clinic" so the red theme + red Hippo logo
  // gradient apply on EVERY page — login, onboarding, splash, and clinic
  // routes alike. Other deployments leave the var unset and stay teal.
  const moduleScope = process.env.NEXT_PUBLIC_DEFAULT_MODULE === "clinic" ? "clinic" : undefined;
  return (
    <html lang="en" className="dark" suppressHydrationWarning data-module={moduleScope}>
      <head>
        {/* Sync the user's stored theme onto <html> BEFORE React hydrates.
            Without this, ThemeProvider's useEffect would mutate <html> after
            the first paint, producing a tree-level mismatch (React error
            #418) and a one-frame flash of the wrong theme. The script is a
            single self-invoking function — see ThemeBootstrapScript in
            src/context/ThemeContext.tsx. */}
        <ThemeBootstrapScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className="min-h-screen antialiased"
        suppressHydrationWarning
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        <AppProviders>
          <div id="app-root">{children}</div>
          <div id="portal-root" />
        </AppProviders>
      </body>
    </html>
  );
}
