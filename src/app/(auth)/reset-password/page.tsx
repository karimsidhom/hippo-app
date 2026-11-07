"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Reset Password — terminus of the password-reset email link.
   The user arrives here via a Supabase recovery link. Supabase has
   already established a temporary recovery session by the time this
   page mounts, so we just call updateUser({ password }) and route home.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, AlertTriangle, Lock } from "lucide-react";
import { HippoMark } from "@/components/HippoMark";
import { createClient } from "@/lib/supabase";
import { verifyRecoverySession, updateRecoveredPassword } from "@/lib/password-recovery";

const TEAL = "var(--auth-link)";
const EASE = "cubic-bezier(.16,1,.3,1)";

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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(createClient);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Supabase exchanges a PKCE recovery code automatically. Await its
  // initialization and check redirect errors before trusting a stored session.
  const [linkValid, setLinkValid] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const valid = await verifyRecoverySession(supabase.auth, () => window.location.href);
      if (!cancelled) setLinkValid(valid);
    }
    checkSession();

    // Signing out while the form is open must revoke the local form state.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !cancelled) setLinkValid(false);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || linkValid !== true) return;
    setError("");
    setLoading(true);
    const result = await updateRecoveredPassword(supabase.auth, password, confirm);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  return (
    <div
      className="auth-page"
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
              fontWeight: 600,
              color: "var(--text)",
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
          Set a new password
        </p>
      </div>

      <div
        style={{
          width: 48,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.15), transparent)",
          margin: "0 auto 28px",
        }}
      />

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-mid)",
          borderRadius: 20,
          padding: "28px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {linkValid === false && (
          <div style={{ textAlign: "center", padding: "8px 4px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={26} color="var(--danger)" />
            </div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text)",
                margin: "0 0 8px",
              }}
            >
              Reset link unavailable
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-2)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              This link may have expired, already been used, or opened in a different browser.
              Request a new link and open it in the same browser to continue.
            </p>
            <Link
              href="/forgot-password"
              style={{
                display: "inline-block",
                marginTop: 18,
                padding: "10px 16px",
                background: `linear-gradient(135deg, ${TEAL}, var(--primary-lo))`,
                color: "#fff",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Request a new link
            </Link>
          </div>
        )}

        {linkValid === null && (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-2)",
              textAlign: "center",
              padding: "16px 4px",
              margin: 0,
            }}
          >
            Verifying reset link…
          </p>
        )}

        {linkValid === true && done && (
          <div
            style={{
              textAlign: "center",
              padding: "8px 4px",
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
                color: "var(--text)",
                margin: "0 0 8px",
              }}
            >
              Password updated
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-2)",
                margin: 0,
              }}
            >
              Redirecting to your dashboard…
            </p>
          </div>
        )}

        {linkValid === true && !done && (
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--danger)",
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <label htmlFor="reset-password" style={labelStyle}>New password</label>
            <div style={{ position: "relative" }}>
              <input
                id="reset-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                autoFocus
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("pw")}
                onBlur={() => setFocused(null)}
                style={{ ...inputStyle(focused === "pw"), paddingRight: 44 }}
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
                }}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <label htmlFor="reset-confirm-password" style={labelStyle}>Confirm password</label>
            <input
              id="reset-confirm-password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onFocus={() => setFocused("confirm")}
              onBlur={() => setFocused(null)}
              style={{ ...inputStyle(focused === "confirm"), marginBottom: 20 }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: `linear-gradient(135deg, ${TEAL}, var(--primary-lo))`,
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
                transition: "opacity 0.15s",
                boxShadow: "0 4px 24px -4px rgba(14,165,233,0.3)",
                letterSpacing: "0.01em",
              }}
            >
              <Lock size={16} />
              {loading ? "Updating\u2026" : "Update password"}
            </button>
          </form>
        )}
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 14,
          color: "var(--text-2)",
          marginTop: 24,
        }}
      >
        <Link
          href="/login"
          style={{ color: TEAL, textDecoration: "none", fontWeight: 500 }}
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
