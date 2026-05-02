"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Forgot Password — request a reset email.
   Same visual treatment as /login. Always confirms "email sent" regardless
   of whether the address is registered, to avoid account enumeration.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Mail, Check } from "lucide-react";
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

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    const result = await sendPasswordReset(email.trim());
    setLoading(false);
    if (result.ok) {
      setSent(true);
    } else {
      setError(result.error);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 400,
        animation: `oe-fadeInUp 0.6s ${EASE} 0.1s both`,
      }}
    >
      {/* Logo */}
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
              fontSize: 28,
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
            fontStyle: "italic",
          }}
        >
          Reset your password
        </p>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 48,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.15), transparent)",
          margin: "0 auto 28px",
        }}
      />

      {/* Glass form */}
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
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
          }}
        />

        {sent ? (
          <div
            style={{
              textAlign: "center",
              padding: "16px 4px",
              animation: `oe-fadeInUp 0.4s ${EASE} both`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={26} color="#10b981" />
            </div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#E2E8F0",
                margin: "0 0 8px",
              }}
            >
              Check your inbox
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              If an account exists for <strong style={{ color: "#E2E8F0" }}>{email.trim()}</strong>,
              we&apos;ve sent a password reset link. The link expires in 1 hour.
            </p>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                marginTop: 14,
                lineHeight: 1.5,
              }}
            >
              Didn&apos;t get an email? Check spam, or{" "}
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: TEAL,
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 12,
                  fontFamily: "inherit",
                  textDecoration: "underline",
                }}
              >
                try a different email
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
                marginTop: 0,
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              Enter the email you signed up with and we&apos;ll send you a link to reset your password.
            </p>

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

            <label style={labelStyle}>Email</label>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@hospital.ca"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={inputStyle(focused)}
            />

            <button
              type="submit"
              disabled={loading}
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
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "opacity 0.15s, box-shadow 0.2s",
                boxShadow: "0 4px 24px -4px rgba(14,165,233,0.3)",
                letterSpacing: "0.01em",
              }}
            >
              <Mail size={16} />
              {loading ? "Sending\u2026" : "Send reset link"}
            </button>
          </form>
        )}
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 14,
          color: "rgba(255,255,255,0.3)",
          marginTop: 24,
        }}
      >
        <Link
          href="/login"
          style={{
            color: TEAL,
            textDecoration: "none",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
