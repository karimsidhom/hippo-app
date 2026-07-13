"use client";

import { usePathname } from "next/navigation";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { InstallCapture } from "@/components/pwa/InstallCapture";
import { GrowthCapture } from "@/components/marketing/GrowthCapture";

const PUBLIC_MARKETING_ROUTES = new Set(["/", "/pricing", "/program-demo", "/pilot", "/insights", "/surgical-case-log", "/epa-tracking", "/residency-program-dashboard", "/accreditation-reporting"]);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const capture = <GrowthCapture />;
  if (PUBLIC_MARKETING_ROUTES.has(pathname) || pathname.startsWith("/insights/") || pathname.startsWith("/institutional-agreement/")) return <>{capture}{children}</>;

  return (
    <>{capture}<ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <InstallCapture />
          {children}
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider></>
  );
}
