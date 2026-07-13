"use client";

import { usePathname } from "next/navigation";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { InstallCapture } from "@/components/pwa/InstallCapture";

const PUBLIC_MARKETING_ROUTES = new Set(["/", "/pricing", "/program-demo"]);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC_MARKETING_ROUTES.has(pathname) || pathname.startsWith("/institutional-agreement/")) return children;

  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <InstallCapture />
          {children}
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
