import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { AuthProvider } from "@/context/AuthContext";

// All pages require runtime auth — never prerender statically
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Hippo — Strava for Surgeons",
    template: "%s | Hippo",
  },
  description:
    "Hippo is the premier surgical case logging platform for residents, fellows, and staff surgeons. Track your operative volume, learning curves, milestones, and benchmarks — with full PHIA/HIPAA privacy compliance.",
  keywords: [
    "surgical case log",
    "surgery tracker",
    "resident case log",
    "operative log",
    "RCSPC",
    "urology",
    "surgical training",
    "milestone tracking",
  ],
  authors: [{ name: "Hippo" }],
  creator: "Hippo",
  publisher: "Hippo",
  robots: {
    index: false, // Private medical app — don't index
    follow: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9] antialiased">
        <AuthProvider>
          <SubscriptionProvider>
            <div id="app-root">{children}</div>
            <div id="portal-root" />
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
