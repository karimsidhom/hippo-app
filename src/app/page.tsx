"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Root Page — Auth router + loading state

   Shows a refined loading state with the PrecisionMark while determining
   where to send the user (login / onboarding / dashboard).
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PrecisionMark } from "@/components/PrecisionMark";

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
    <div
      style={{
        minHeight: "100vh",
        background: "#060d13",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <div style={{ animation: "oe-fadeIn 0.4s cubic-bezier(.16,1,.3,1) both" }}>
        <PrecisionMark size={64} />
      </div>

      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#E2E8F0",
            letterSpacing: "-0.5px",
            margin: 0,
            animation: "oe-fadeInUp 0.4s cubic-bezier(.16,1,.3,1) 0.1s both",
          }}
        >
          Hippo
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#475569",
            marginTop: 8,
            animation: "oe-fadeInUp 0.3s cubic-bezier(.16,1,.3,1) 0.2s both",
          }}
        >
          Loading your dashboard\u2026
        </p>
      </div>

      {/* Minimal spinner */}
      <div
        style={{
          width: 20,
          height: 20,
          border: "2px solid rgba(14,165,233,0.1)",
          borderTopColor: "#0EA5E9",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
