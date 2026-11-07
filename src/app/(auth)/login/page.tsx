"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Login — Opening Experience v3 "Surfacing"

   First visit of a browser session: the Hippo mark rises out of a real
   night lake exactly where the clip's ripple starts, the contour rings
   draw in, the name fades up, then the mark glides into this page's own
   header mark while the lake blurs and dims and the form fades up with a
   small stagger. About 3.5 s; tap or Escape skips; reduced motion never
   sees it. See src/components/SurfacingSplash.tsx.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { HippoMark } from "@/components/HippoMark";
import { SurfacingSplash } from "@/components/SurfacingSplash";

const TEAL = "var(--auth-link)";
const EASE = "cubic-bezier(.16,1,.3,1)";

// ── Surfacing splash wiring ───────────────────────────────────────────────

const SPLASH_KEY = "hippo-splash-v3";
const SPLASH_ATTR = "data-surfacing-splash";

// Measured from the water master (see _design/hippo-surfacing-v3/final/NOTES.md):
// the ripple centre as a fraction of the clip frame's height, and when the
// ripple begins in the clip.
const WATER = {
  src: "/splash/surfacing/water.mp4",
  poster: "/splash/surfacing/poster.jpg",
  width: 720,
  height: 1280,
  waterlineFrac: 0.555,
  rippleStartMs: 280,
};

// Runs inline before first paint: when the splash will play this session,
// hold the dark canvas and keep the sign-in page hidden until the overlay
// mounts, so no flash of the form (or the light theme) shows under it.
const SPLASH_DECIDE = `(function(){try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(sessionStorage.getItem('${SPLASH_KEY}')==='1')return;sessionStorage.setItem('${SPLASH_KEY}','1');document.documentElement.setAttribute('${SPLASH_ATTR}','');}catch(e){}})();`;

const SPLASH_CSS = `
[${SPLASH_ATTR}] body{background:#060d13}
[${SPLASH_ATTR}] .auth-shell{visibility:hidden}
`;

// ── Shared styles ─────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-2)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
};

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "var(--surface)",
    border: `1px solid ${focused ? "rgba(14,165,233,0.4)" : "var(--border-mid)"}`,
    color: "var(--text)",
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 16,
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    marginBottom: 16,
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focused ? "0 0 0 3px var(--primary-glow)" : "none",
  };
}

// ── Component ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Detect the `?deleted=1` flash set by POST /api/account/delete so we can
  // show a confirmation that the account was permanently removed. The flag
  // lives only for the first render — clearing it after read means a page
  // refresh won't keep asserting "your account was deleted".
  const [deletedFlash, setDeletedFlash] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("deleted") === "1") {
      setDeletedFlash(true);
      params.delete("deleted");
      const q = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (q ? `?${q}` : ""),
      );
    }
  }, []);

  // ── Surfacing splash state ──────────────────────────────────────────
  // "none": repeat visit or reduced motion, the form shows as always.
  // "playing": the overlay owns the screen (the pre-paint script hides the
  // shell under it). "revealing": the exit began, the form staggers up.
  const [surfacing, setSurfacing] = useState<"none" | "playing" | "revealing" | "done">("none");
  // Dark theme keeps the dimmed lake as a static backdrop behind the form;
  // light theme lets the lake fade out to the light canvas instead.
  const [lakeBackdrop, setLakeBackdrop] = useState(false);

  useEffect(() => {
    if (document.documentElement.hasAttribute(SPLASH_ATTR)) setSurfacing("playing");
  }, []);

  function handleSplashExitStart() {
    setLakeBackdrop(document.documentElement.getAttribute("data-theme") !== "light");
    document.documentElement.removeAttribute(SPLASH_ATTR);
    setSurfacing("revealing");
  }

  const splashRan = surfacing !== "none";
  // On the splash path the children stagger in individually; otherwise the
  // container keeps its usual single fade-up.
  const reveal = (i: number): React.CSSProperties =>
    splashRan && surfacing !== "playing"
      ? { animation: `oe-fadeInUp 0.55s ${EASE} ${0.25 + i * 0.08}s both` }
      : {};

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setLoading(true);
    const result = await login(email.trim(), password, new URLSearchParams(window.location.search).get("next"));
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
      {/* Pre-paint splash decision + cover (see SPLASH_DECIDE above). */}
      <script dangerouslySetInnerHTML={{ __html: SPLASH_DECIDE }} />
      <style dangerouslySetInnerHTML={{ __html: SPLASH_CSS }} />

      {/* ═══ SURFACING SPLASH ═════════════════════════════════════════ */}
      {(surfacing === "playing" || surfacing === "revealing") && (
        <SurfacingSplash
          waterSrc={WATER.src}
          posterSrc={WATER.poster}
          videoWidth={WATER.width}
          videoHeight={WATER.height}
          waterlineFrac={WATER.waterlineFrac}
          rippleStartMs={WATER.rippleStartMs}
          mark={<HippoMark size={120} />}
          markSize={120}
          accent="#22D3EE"
          accentDeep="#0EA5E9"
          appName="Hippo"
          tagline="Track mastery. Share growth."
          targetSelector="[data-surfacing-mark-target]"
          onExitStart={handleSplashExitStart}
          onDone={() => setSurfacing("done")}
        />
      )}

      {/* Dark theme keeps the dimmed lake behind the form after the splash. */}
      {splashRan && surfacing !== "playing" && lakeBackdrop && (
        <div
          aria-hidden
          style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={WATER.poster}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(9px) brightness(.42)",
              transform: "scale(1.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "60%",
              background: "linear-gradient(to bottom, transparent, rgba(6,13,19,.8))",
            }}
          />
        </div>
      )}

      {/* ═══ LOGIN CONTENT ════════════════════════════════════════════ */}
      {(
        <div className="auth-page" style={{
          width: "100%",
          maxWidth: 400,
          position: "relative",
          zIndex: 1,
          animation: authSuccess
            ? `oe-exitUp 0.4s ${EASE} forwards`
            : splashRan
              ? undefined
              : `oe-fadeInUp 0.6s ${EASE} 0.1s both`,
        }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32, ...reveal(0) }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}>
              <span data-surfacing-mark-target style={{ display: "inline-flex" }}>
                <HippoMark size={44} />
              </span>
              <span style={{
                fontSize: 28,
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.6px",
              }}>
                Hippo
              </span>
            </div>
            <p style={{
              fontSize: 13.5,
              color: "var(--text-3)",
              margin: 0,
              letterSpacing: "-0.005em",
              fontWeight: 450,
            }}>
              The case log for surgical residents
            </p>
          </div>

          {/* Divider */}
          <div style={{
            ...reveal(1),
            width: 48,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(14,165,233,0.15), transparent)`,
            margin: "0 auto 28px",
          }} />

          {/* Account-deleted flash — one-shot confirmation after POST
              /api/account/delete succeeds and the client redirects here. */}
          {deletedFlash && (
            <div
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 18,
                fontSize: 13,
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 600 }}>✓</span>
              <span>Your account and all associated data have been permanently deleted.</span>
            </div>
          )}

          {/* Glass form */}
          <div style={{
            ...reveal(2),
            background: "var(--surface)",
            border: "1px solid var(--border-mid)",
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
                  color: "var(--danger)",
                  marginBottom: 16,
                  animation: `oe-fadeInUp 0.3s ${EASE} both`,
                }}>
                  {error}
                </div>
              )}

              <label htmlFor="login-email" style={labelStyle}>Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@hospital.ca"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                style={inputStyle(focused === "email")}
              />

              <label htmlFor="login-password" style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
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
                    color: "var(--text-3)",
                    transition: "color 0.15s",
                  }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Forgot password */}
              <div style={{ marginTop: -8, marginBottom: 16, textAlign: "right" }}>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: 12,
                    color: TEAL,
                    textDecoration: "none",
                    opacity: 0.8,
                  }}
                >
                  Forgot password?
                </Link>
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
                  background: btnHover && !loading ? "var(--primary-solid-hi)" : "var(--primary-solid)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: loading ? 0.6 : 1,
                  transition: `opacity .15s, background-color .18s ${EASE}, transform .12s ${EASE}`,
                  // One hairline inset highlight for a lit top edge. No
                  // coloured glow — shadows are for elevation here, not decoration.
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
                  transform: btnActive ? "scale(0.985)" : "scale(1)",
                  letterSpacing: "-0.005em",
                }}
              >
                {loading ? "Signing in\u2026" : "Sign In"}
              </button>
            </form>
          </div>

          <p style={{
            textAlign: "center",
            fontSize: 14,
            color: "var(--text-2)",
            marginTop: 24,
            ...reveal(3),
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
