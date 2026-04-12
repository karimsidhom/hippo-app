"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Signup — same visual treatment as login (HippoMark, glass form,
   depth background) but without the splash animation.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Check } from "lucide-react";
import { HippoMark } from "@/components/HippoMark";

const TEAL = "#0EA5E9";
const EASE = "cubic-bezier(.16,1,.3,1)";

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

const FEATURES = [
  "Case logging & analytics",
  "Learning curve tracking",
  "Milestones & achievements",
  "Specialty benchmarks",
  "Social & leaderboards",
  "PHIA-safe exports",
];

export default function SignupPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [btnActive, setBtnActive] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const result = await register(name.trim(), email.trim(), password);
    if (result.ok) {
      setAuthSuccess(true);
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 400,
        animation: authSuccess
          ? `oe-exitUp 0.4s ${EASE} forwards`
          : `oe-fadeInUp 0.5s ${EASE} both`,
      }}
    >
      {/* ── Logo ────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <HippoMark size={44} />
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#E2E8F0",
              letterSpacing: "-0.6px",
            }}
          >
            Hippo
          </span>
        </div>
        <p
          style={{
            fontSize: 13,
            color: TEAL,
            margin: 0,
            opacity: 0.6,
            letterSpacing: "0.02em",
          }}
        >
          Precision in practice
        </p>
      </div>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div
        style={{
          width: 48,
          height: 1,
          background: `linear-gradient(90deg, transparent, rgba(14,165,233,0.15), transparent)`,
          margin: "0 auto 24px",
        }}
      />

      {/* ── Feature grid ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          marginBottom: 24,
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <Check
              size={11}
              color={TEAL}
              style={{ flexShrink: 0, opacity: 0.6 }}
            />
            {f}
          </div>
        ))}
      </div>

      {/* ── Glass form ───────────────────────────────────────────────── */}
      <div
        style={{
          background: "rgba(14,165,233,0.015)",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: 20,
          padding: "28px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top edge highlight */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
          }}
        />

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: "#fca5a5",
                marginBottom: 16,
                animation: `oe-fadeInUp 0.3s ${EASE} both`,
              }}
            >
              {error}
            </div>
          )}

          {/* Name */}
          <label style={labelStyle}>Full name</label>
          <input
            type="text"
            autoComplete="name"
            placeholder="Dr. Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            style={inputStyle(focused === "name")}
          />

          {/* Email */}
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

          {/* Password */}
          <label style={labelStyle}>
            Password{" "}
            <span style={{ color: "rgba(255,255,255,0.15)", textTransform: "none", letterSpacing: 0 }}>
              (min 8 characters)
            </span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
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
              }}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="oe-btn-shimmer"
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => {
              setBtnHover(false);
              setBtnActive(false);
            }}
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
              boxShadow:
                btnHover && !loading
                  ? "0 4px 32px -4px rgba(14,165,233,0.45), inset 0 1px 0 rgba(255,255,255,0.1)"
                  : "0 4px 24px -4px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
              transform: btnActive ? "scale(0.98)" : "scale(1)",
              letterSpacing: "0.01em",
            }}
          >
            {loading ? "Creating account\u2026" : "Create Account"}
          </button>
        </form>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <p
        style={{
          textAlign: "center",
          fontSize: 14,
          color: "rgba(255,255,255,0.3)",
          marginTop: 20,
        }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          style={{ color: TEAL, textDecoration: "none", fontWeight: 500 }}
        >
          Sign in
        </Link>
      </p>

      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.15)",
          textAlign: "center",
          marginTop: 14,
          lineHeight: 1.5,
        }}
      >
        By creating an account you agree not to enter patient-identifying
        information.
        <br />
        Hippo is PHIA/HIPAA privacy-conscious by design.
      </p>
    </div>
  );
}
