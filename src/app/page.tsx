"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RootPage() {
  const router = useRouter();
  const { user, loading, onboardingDone } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!onboardingDone) {
      router.replace("/onboarding");
      return;
    }

    router.replace("/dashboard");
  }, [user, loading, onboardingDone, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-blue flex items-center justify-center shadow-glow-blue">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M8 24 L16 4 L24 24"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 18 L22 18"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="24" cy="24" r="4" fill="#10b981" />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Hippo</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Loading your dashboard...</p>
        </div>

        {/* Spinner */}
        <div className="w-6 h-6 border-2 border-[#1e2130] border-t-[#2563eb] rounded-full animate-spin" />
      </div>
    </div>
  );
}
