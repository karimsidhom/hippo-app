/* ═══════════════════════════════════════════════════════════════════════════
   Auth Layout — Premium surgical environment

   Three ambient depth layers create subtle parallax:
     1. Central radial glow (teal, barely visible)
     2. Floating contour arcs at different radii, drifting slowly
     3. Content centered above all layers

   The background persists across login/signup, creating continuity.
   When the splash overlay fades, these layers are revealed underneath.
   ═══════════════════════════════════════════════════════════════════════════ */

import { CopyrightFooter } from "@/components/shared/CopyrightFooter";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#060d13",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        overflow: "hidden",
        fontFamily:
          "'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      {/* ── Ambient depth layers ─────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        {/* Central radial glow — TUNABLE: opacity 0.025, size 700 */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            width: 700,
            height: 700,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(ellipse, rgba(14,165,233,0.025) 0%, transparent 70%)",
          }}
        />

        {/* Floating contour arcs — three depth planes */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className="oe-motion"
          style={{
            position: "absolute",
            inset: "-10%",
            width: "120%",
            height: "120%",
          }}
        >
          {/* Layer 1 (far) — TUNABLE: r=28, opacity 0.018, 28s drift */}
          <circle
            cx="50"
            cy="32"
            r="28"
            fill="none"
            stroke="rgba(14,165,233,0.018)"
            strokeWidth="0.15"
            strokeDasharray="50 125.93"
            style={{ animation: "oe-bgDrift1 28s ease-in-out infinite" }}
          />
          {/* Layer 2 (mid) — TUNABLE: r=35, opacity 0.013, 34s drift */}
          <circle
            cx="62"
            cy="65"
            r="35"
            fill="none"
            stroke="rgba(14,165,233,0.013)"
            strokeWidth="0.12"
            strokeDasharray="70 149.91"
            style={{ animation: "oe-bgDrift2 34s ease-in-out infinite" }}
          />
          {/* Layer 3 (near) — TUNABLE: r=20, opacity 0.02, 24s drift */}
          <circle
            cx="35"
            cy="52"
            r="20"
            fill="none"
            stroke="rgba(14,165,233,0.02)"
            strokeWidth="0.15"
            strokeDasharray="35 90.66"
            style={{ animation: "oe-bgDrift3 24s ease-in-out infinite" }}
          />
        </svg>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {children}
      </div>

      {/* ── Copyright / legal links ──────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "max(8px, env(safe-area-inset-bottom))",
          zIndex: 2,
          pointerEvents: "auto",
        }}
      >
        <CopyrightFooter />
      </div>
    </div>
  );
}
