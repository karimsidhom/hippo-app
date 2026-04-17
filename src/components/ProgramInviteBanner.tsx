"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Mail, X } from "lucide-react";

// ---------------------------------------------------------------------------
// ProgramInviteBanner
//
// Dashboard banner that surfaces any pending program invites whose email
// matches the authenticated user's account. Lets the invitee accept (or
// dismiss for this session) directly from the app — no email roundtrip
// required. Self-hides if there are no pending invites.
// ---------------------------------------------------------------------------

interface PendingInvite {
  id: string;
  token: string;
  programId: string;
  programName: string;
  programInstitution: string | null;
  programSpecialty: string | null;
  inviterName: string | null;
  expiresAt: string;
  createdAt: string;
}

export function ProgramInviteBanner() {
  const router = useRouter();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/programs/pending-invites", {
        credentials: "include",
      });
      if (!res.ok) {
        setInvites([]);
        return;
      }
      const data = (await res.json()) as { invites: PendingInvite[] };
      setInvites(data.invites ?? []);
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAccept = async (invite: PendingInvite) => {
    if (accepting) return;
    setAccepting(invite.id);
    try {
      const res = await fetch(`/api/programs/invites/${invite.token}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Could not accept invitation.");
        setAccepting(null);
        return;
      }
      // Remove from local list; refresh router so widgets (ProgramCalendar) re-fetch.
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      setAccepting(null);
      router.refresh();
    } catch {
      alert("Network error. Please try again.");
      setAccepting(null);
    }
  };

  const handleDismiss = (inviteId: string) => {
    setDismissed((prev) => new Set(prev).add(inviteId));
  };

  const visible = invites.filter((i) => !dismissed.has(i.id));
  if (loading || visible.length === 0) return null;

  return (
    <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      {visible.map((invite) => (
        <div
          key={invite.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            background: "#0EA5E910",
            border: "1px solid #0EA5E930",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#0EA5E920",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0EA5E9",
              flexShrink: 0,
            }}
          >
            <Mail size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-1)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {invite.inviterName
                ? `${invite.inviterName} invited you to join ${invite.programName}`
                : `You're invited to join ${invite.programName}`}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {[invite.programInstitution, invite.programSpecialty]
                .filter(Boolean)
                .join(" · ") || "Shared calendar · vacations, rounds, Zoom links"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => handleAccept(invite)}
              disabled={accepting === invite.id}
              style={{
                padding: "8px 14px",
                background: "var(--primary)",
                border: "none",
                borderRadius: 7,
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: accepting === invite.id ? "wait" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {accepting === invite.id ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              {accepting === invite.id ? "Joining" : "Accept"}
            </button>
            <button
              onClick={() => handleDismiss(invite.id)}
              aria-label="Dismiss"
              title="Dismiss"
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
              }}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
