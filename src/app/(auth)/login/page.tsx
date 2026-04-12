"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Login — Opening Experience v2

   The Hippo mark is the hero. The animation builds atmosphere AROUND it:
   teal glow blooms, fine contour rings trace, then the mark emerges with
   refined scale + fade. Wordmark and tagline follow. Cross-dissolve to
   the login form.

   Phase 1 "splash":  Full-screen overlay — glow, rings, mark entrance.
   Phase 2 "fading":  Cross-dissolve to login form.
   Phase 3 "done":    Splash unmounted, form interactive.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { HippoMark } from "@/components/HippoMark";

const TEAL = "#0EA5E9";
const EASE = "cubic-bezier(.16,1,.3,1)";

// ── Hooks ─────────────────────────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useFirstVisit(): boolean {
  const [first, setFirst] = useState(false);
  useEffect(() => {
    const key = "hippo-splash-v2";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      setFirst(true);
    }
  }, []);
  return first;
}

// ── Shared styles ─────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 500,
  color: "rgba(255,255,255,0.25)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
};

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(12,18,25,0.8)",
    border: `1px solid ${focused ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.06)"}`,
    color: "#E2E8F0",
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
    marginBottom: 16,
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focused ? "0 0 0 3px rgba(14,165,233,0.06)" : "none",
  };
}

// ── Contour rings SVG (surrounds the mark) ────────────────────────────────

function ContourRings({ animate }: { animate: boolean }) {
  const r1 = 58, c1 = 2 * Math.PI * r1;
  const r2 = 76, c2 = 2 * Math.PI * r2;
  const r3 = 92, c3 = 2 * Math.PI * r3;

  const v1 = c1 * 0.7;
  const v2 = c2 * 0.5;
  const v3 = c3 * 0.35;

  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
    >
      <defs>
        <radialGradient id="splash-glow" cx="50%" cy="50%" r="45%">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.12" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient glow behind rings */}
      <circle
        cx="100" cy="100" r="85"
        fill="url(#splash-glow)"
        style={animate ? {
          opacity: 0,
          animation: `oe-fadeIn 1.4s ease-out 0.1s forwards`,
        } : {}}
      />

      {/* Inner ring — tight around the mark */}
      <circle
        cx="100" cy="100" r={r1}
        stroke={TEAL}
        strokeOpacity="0.15"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeDasharray={`${v1} ${c1 - v1}`}
        transform="rotate(-90 100 100)"
        style={animate ? {
          strokeDashoffset: v1,
          animation: `oe-draw 1.4s ease-out 0.2s forwards`,
        } : { strokeDashoffset: 0 }}
      />

      {/* Middle ring */}
      <circle
        cx="100" cy="100" r={r2}
        stroke={TEAL}
        strokeOpacity="0.08"
        strokeWidth="0.6"
        strokeLinecap="round"
        strokeDasharray={`${v2} ${c2 - v2}`}
        transform="rotate(45 100 100)"
        style={animate ? {
          strokeDashoffset: v2,
          animation: `oe-draw 1.6s ease-out 0.4s forwards`,
        } : { strokeDashoffset: 0 }}
      />

      {/* Outer ring — widest, most subtle */}
      <circle
        cx="100" cy="100" r={r3}
        stroke={TEAL}
        strokeOpacity="0.05"
        strokeWidth="0.4"
        strokeLinecap="round"
        strokeDasharray={`${v3} ${c3 - v3}`}
        transform="rotate(160 100 100)"
        style={animate ? {
          strokeDashoffset: v3,
          animation: `oe-draw 1.8s ease-out 0.6s forwards`,
        } : { strokeDashoffset: 0 }}
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

type SplashPhase = "splash" | "fading" | "done";

export default function LoginPage() {
  const { login } = useAuth();
  const reducedMotion = usePrefersReducedMotion();
  const firstVisit = useFirstVisit();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  const [splashPhase, setSplashPhase] = useState<SplashPhase>("done");

  useEffect(() => {
    if (reducedMotion) return;
    if (firstVisit) setSplashPhase("splash");
  }, [firstVisit, reducedMotion]);

  useEffect(() => {
    if (splashPhase === "splash") {
      const t = setTimeout(() => setSplashPhase("fading"), 2400);
      return () => clearTimeout(t);
    }
    if (splashPhase === "fading") {
      const t = setTimeout(() => setSplashPhase("done"), 900);
      return () => clearTimeout(t);
    }
  }, [splashPhase]);

  const showSplash = splashPhase !== "done";
  const showContent = splashPhase !== "splash";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setLoading(true);
    const result = await login(email.trim(), password);
    if (result.ok) {
      setAuthSuccess(true);
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  const [btnHover, setBtnHover] = useState(false);
  const [btnActive, setBtnActive] = useState(false);

  return (
    <>
      {/* ═══ SPLASH OVERLAY ═══════════════════════════════════════════ */}
      {showSplash && (
        <div
          className="oe-motion"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#060d13",
            animation: splashPhase === "fading"
              ? `oe-splashExit 0.9s ease-out forwards`
              : undefined,
            pointerEvents: splashPhase === "fading" ? "none" : "auto",
          }}
        >
          {/* Large background glow */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(14,165,233,0.06) 0%, rgba(14,165,233,0.02) 40%, transparent 70%)",
            animation: `oe-glowBloom 1.8s ${EASE} 0s both`,
          }} />

          {/* Mark + rings composition */}
          <div style={{ position: "relative", width: 200, height: 200 }}>
            {/* Contour rings (behind the mark) */}
            <ContourRings animate />

            {/* Hippo mark — the hero, big and visible */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: `oe-markEntrance 1s ${EASE} 0.3s both`,
            }}>
              <HippoMark size={80} />
            </div>
          </div>

          {/* Wordmark */}
          <h1 style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#E2E8F0",
            letterSpacing: "-0.8px",
            margin: "24px 0 0",
            animation: `oe-fadeInUp 0.6s ${EASE} 0.9s both`,
          }}>
            Hippo
          </h1>

          {/* Tagline */}
          <p style={{
            fontSize: 14,
            color: TEAL,
            letterSpacing: "0.04em",
            margin: "8px 0 0",
            opacity: 0.6,
            animation: `oe-fadeInUp 0.5s ${EASE} 1.2s both`,
          }}>
            Track mastery. Share growth.
          </p>
        </div>
      )}

      {/* ═══ LOGIN CONTENT ════════════════════════════════════════════ */}
      {showContent && (
        <div style={{
          width: "100%",
          maxWidth: 400,
          animation: authSuccess
            ? `oe-exitUp 0.4s ${EASE} forwards`
            : `oe-fadeInUp 0.6s ${EASE} 0.1s both`,
        }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}>
              <HippoMark size={44} />
              <span style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#E2E8F0",
                letterSpacing: "-0.6px",
              }}>
                Hippo
              </span>
            </div>
            <p style={{
              fontSize: 13,
              color: TEAL,
              margin: 0,
              opacity: 0.6,
              letterSpacing: "0.02em",
              fontStyle: "italic",
            }}>
              Track mastery. Share growth.
            </p>
          </div>

          {/* Divider */}
          <div style={{
            width: 48,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(14,165,233,0.15), transparent)`,
            margin: "0 auto 28px",
          }} />

          {/* Glass form */}
          <div style={{
            background: "rgba(14,165,233,0.015)",
            border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: 20,
            padding: "28px 24px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Top edge highlight */}
            <div style={{
              position: "absolute",
              top: 0, left: "15%", right: "15%",
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
            }} />

            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#fca5a5",
                  marginBottom: 16,
                  animation: `oe-fadeInUp 0.3s ${EASE} both`,
                }}>
                  {error}
                </div>
              )}

              <label style={labelStyle}>Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@hospital.ca"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                style={inputStyle(focused === "email")}
              />

              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  style={{
                    ...inputStyle(focused === "password"),
                    paddingRight: 44,
                    marginBottom: 20,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: 14,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "rgba(255,255,255,0.2)",
                    transition: "color 0.15s",
                  }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="oe-btn-shimmer"
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => { setBtnHover(false); setBtnActive(false); }}
                onMouseDown={() => setBtnActive(true)}
                onMouseUp={() => setBtnActive(false)}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: `linear-gradient(135deg, ${TEAL}, #0284C7)`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: loading ? 0.6 : 1,
                  transition: `opacity 0.15s, transform 0.12s ${EASE}, box-shadow 0.2s`,
                  boxShadow: btnHover && !loading
                    ? "0 4px 32px -4px rgba(14,165,233,0.45), inset 0 1px 0 rgba(255,255,255,0.1)"
                    : "0 4px 24px -4px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
                  transform: btnActive ? "scale(0.98)" : "scale(1)",
                  letterSpacing: "0.01em",
                }}
              >
                {loading ? "Signing in\u2026" : "Sign In"}
              </button>
            </form>
          </div>

          <p style={{
            textAlign: "center",
            fontSize: 14,
            color: "rgba(255,255,255,0.3)",
            marginTop: 24,
          }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: TEAL, textDecoration: "none", fontWeight: 500 }}>
              Create one
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
