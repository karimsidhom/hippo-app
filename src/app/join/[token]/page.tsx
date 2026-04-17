"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { HippoMark } from "@/components/HippoMark";
import { CheckCircle2, AlertTriangle, Users2, Calendar, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// /join/[token]
//
// Program invite acceptance page. Public (no auth required) for preview,
// but actually joining requires a signed-in session.
// ---------------------------------------------------------------------------

interface InvitePreview {
  email: string;
  program: {
    id: string;
    name: string;
    institution: string | null;
    specialty: string | null;
  };
  inviterName: string | null;
  expiresAt: string;
}

export default function JoinProgramPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/programs/invites/${token}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data?.error ?? `Invite unavailable (${res.status})`);
          setLoading(false);
          return;
        }
        const data = (await res.json()) as InvitePreview;
        setInvite(data);
      } catch {
        setError("Could not load invite.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/invites/${token}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        // Need to log in / sign up first
        setNeedsAuth(true);
        setAccepting(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Accept failed");
        setAccepting(false);
        return;
      }
      setAccepted(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch {
      setError("Network error accepting invite.");
      setAccepting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg, #0e1520)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <HippoMark size={48} />
          <div
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              marginTop: 8,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Program Invitation
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 28,
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "var(--text-3)",
                padding: "32px 0",
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              Loading invitation…
            </div>
          ) : error && !invite ? (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "#ef444410",
                  border: "1px solid #ef444430",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <AlertTriangle size={20} style={{ color: "#ef4444" }} />
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 6,
                }}
              >
                Invitation unavailable
              </div>
              <div
                style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}
              >
                {error}
              </div>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  marginTop: 20,
                  padding: "10px 20px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-2)",
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Go home
              </Link>
            </div>
          ) : accepted ? (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "#10B98110",
                  border: "1px solid #10B98130",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <CheckCircle2 size={20} style={{ color: "#10B981" }} />
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 6,
                }}
              >
                You're in!
              </div>
              <div
                style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}
              >
                Redirecting to your dashboard…
              </div>
            </div>
          ) : needsAuth && invite ? (
            <div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--text-2)",
                  lineHeight: 1.6,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                Sign in or create an account with{" "}
                <strong style={{ color: "var(--text)" }}>{invite.email}</strong>{" "}
                to accept this invitation.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link
                  href={`/login?next=${encodeURIComponent(`/join/${token}`)}`}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--text)",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  Sign in
                </Link>
                <Link
                  href={`/signup?next=${encodeURIComponent(`/join/${token}`)}&email=${encodeURIComponent(invite.email)}`}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    background: "var(--primary)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  Create account
                </Link>
              </div>
            </div>
          ) : invite ? (
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-3)",
                  marginBottom: 8,
                }}
              >
                {invite.inviterName
                  ? `${invite.inviterName} invited you to join`
                  : "You've been invited to join"}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--text)",
                  letterSpacing: "-0.5px",
                  marginBottom: 4,
                }}
              >
                {invite.program.name}
              </div>
              {invite.program.institution && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-3)",
                    marginBottom: 20,
                  }}
                >
                  {invite.program.institution}
                  {invite.program.specialty
                    ? ` · ${invite.program.specialty}`
                    : ""}
                </div>
              )}

              <div
                style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <BulletRow
                  icon={<Calendar size={14} />}
                  text="See the program's shared calendar"
                />
                <BulletRow
                  icon={<Users2 size={14} />}
                  text="Post vacation dates, conferences, Zoom links"
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#ef444410",
                    border: "1px solid #ef444430",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#ef4444",
                    marginBottom: 14,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleAccept}
                disabled={accepting}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  background: accepting ? "var(--muted)" : "var(--primary)",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: accepting ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontFamily: "inherit",
                }}
              >
                {accepting && <Loader2 size={14} className="animate-spin" />}
                {accepting ? "Joining…" : "Accept invitation"}
              </button>

              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  textAlign: "center",
                  marginTop: 12,
                  lineHeight: 1.5,
                }}
              >
                Invited email: {invite.email}
                <br />
                Expires {new Date(invite.expiresAt).toLocaleDateString()}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BulletRow({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13,
        color: "var(--text-2)",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          background: "var(--primary-alpha, rgba(14,165,233,0.12))",
          color: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <span>{text}</span>
    </div>
  );
}
