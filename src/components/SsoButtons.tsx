"use client";

import { useState } from "react";
import { useAuth, type SsoProvider } from "@/context/AuthContext";

// ---------------------------------------------------------------------------
// SsoButtons — Google sign-in.
//
// Used on /login and /signup. Starts an OAuth redirect via Supabase.
// The page unloads on click (browser navigates to Google's consent screen),
// so we just show an in-flight spinner up until the redirect happens.
// Apple + Microsoft were intentionally removed for now — adding them back
// is a one-line change here plus turning them on in the Supabase dashboard.
// ---------------------------------------------------------------------------

interface Props {
  /** Optional same-origin relative path to land on after auth. */
  redirectTo?: string;
  /** Surface SSO errors back to the parent form. */
  onError?: (msg: string) => void;
}

export function SsoButtons({ redirectTo, onError }: Props) {
  const { signInWithProvider } = useAuth();
  const [pending, setPending] = useState<SsoProvider | null>(null);

  async function start(provider: SsoProvider) {
    setPending(provider);
    const res = await signInWithProvider(provider, redirectTo);
    if (!res.ok) {
      setPending(null);
      onError?.(res.error || "Sign-in failed.");
    }
    // On success the browser is being redirected — no further state work.
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      <SsoButton
        label="Continue with Google"
        loading={pending === "google"}
        onClick={() => start("google")}
      />
    </div>
  );
}

interface ButtonProps {
  label: string;
  loading: boolean;
  onClick: () => void;
}

function SsoButton({ label, loading, onClick }: ButtonProps) {
  const style: React.CSSProperties = {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "12px 16px",
    borderRadius: 12,
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 500,
    cursor: loading ? "not-allowed" : "pointer",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.96)",
    color: "#1f2937",
    transition: "transform 0.15s, box-shadow 0.2s",
  };

  return (
    <button type="button" onClick={onClick} disabled={loading} aria-label={label} style={style}>
      <span
        style={{
          display: "inline-flex",
          width: 18,
          height: 18,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? <Spinner /> : <GoogleIcon />}
      </span>
      <span style={{ letterSpacing: "0.01em" }}>{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13.5 24 13.5c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 7.5 29.5 5.5 24 5.5c-7.6 0-14.1 4.3-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44.5c5.4 0 10.3-2 14-5.3l-6.5-5.4c-1.9 1.4-4.4 2.2-7.5 2.2-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 39.9 16.2 44.5 24 44.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2.1 3.7-3.9 5l6.5 5.4C42.3 35.5 44.5 30.2 44.5 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" fill="none" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
