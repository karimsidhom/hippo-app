"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, UserPlus, X } from "lucide-react";

// ---------------------------------------------------------------------------
// MyProgramStatus
//
// Sibling of ProgramInviteBanner, in the same visual language and mounted
// directly beneath it. That one owns emailed ProgramInvite tokens; this one
// owns ProgramJoinRequest, which covers the two newer paths:
//
//   invited: false  they asked to join and are waiting on the director
//   invited: true   a director invited them in app and they must answer
//
// It also carries the nudge for someone in no program at all, so a resident
// who skipped the onboarding picker is not left with nothing to act on.
// Renders nothing once they are in a program with nothing outstanding.
// ---------------------------------------------------------------------------

interface MyRequest {
  id: string;
  programId: string;
  programName: string;
  programDetail: string | null;
  invited: boolean;
}

const NUDGE_DISMISSED_KEY = "hippo-program-nudge-dismissed";

export function MyProgramStatus() {
  const router = useRouter();
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [hasProgram, setHasProgram] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(true);

  useEffect(() => {
    // Read once on mount. Wrapped because storage throws in some
    // private-browsing modes, and the banner must still render.
    try {
      setNudgeDismissed(
        window.localStorage.getItem(NUDGE_DISMISSED_KEY) === "1",
      );
    } catch {
      setNudgeDismissed(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/programs/my-requests", {
        credentials: "include",
      });
      if (!res.ok) {
        setRequests([]);
        return;
      }
      const data = (await res.json()) as {
        requests: MyRequest[];
        hasProgram: boolean;
      };
      setRequests(data.requests ?? []);
      setHasProgram(Boolean(data.hasProgram));
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const respond = async (
    r: MyRequest,
    action: "accept" | "decline" | "withdraw",
  ) => {
    if (busy) return;
    setBusy(r.id);
    try {
      const res = await fetch(
        `/api/programs/${r.programId}/join-requests/${r.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Could not update that request.");
        setBusy(null);
        return;
      }
      await refresh();
      setBusy(null);
      // Joining changes what the rest of the dashboard should show.
      if (action === "accept") router.refresh();
    } catch {
      alert("Network error. Please try again.");
      setBusy(null);
    }
  };

  const dismissNudge = () => {
    try {
      window.localStorage.setItem(NUDGE_DISMISSED_KEY, "1");
    } catch {
      // Per-device convenience only. Losing it just means it reappears.
    }
    setNudgeDismissed(true);
  };

  if (loading) return null;

  const showNudge = requests.length === 0 && !hasProgram && !nudgeDismissed;
  if (requests.length === 0 && !showNudge) return null;

  return (
    <div
      style={{
        marginBottom: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {requests.map((r) => (
        <div
          key={r.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            background: r.invited ? "#0EA5E910" : "var(--surface)",
            border: `1px solid ${r.invited ? "#0EA5E930" : "var(--border)"}`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: r.invited ? "#0EA5E920" : "var(--surface2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: r.invited ? "#0EA5E9" : "var(--text-3)",
              flexShrink: 0,
            }}
          >
            {r.invited ? <UserPlus size={16} /> : <Clock size={16} />}
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
              {r.invited
                ? `You're invited to join ${r.programName}`
                : r.programName}
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
              {r.invited
                ? (r.programDetail ?? "A program director invited you.")
                : "Waiting for the program director to approve you."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {r.invited ? (
              <>
                <button
                  onClick={() => respond(r, "accept")}
                  disabled={busy === r.id}
                  style={{
                    padding: "8px 14px",
                    background: "var(--primary)",
                    border: "none",
                    borderRadius: 7,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: busy === r.id ? "wait" : "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {busy === r.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  {busy === r.id ? "Joining" : "Accept"}
                </button>
                <button
                  onClick={() => respond(r, "decline")}
                  disabled={busy === r.id}
                  aria-label="Decline invitation"
                  title="Decline"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-3)",
                    cursor: busy === r.id ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "inherit",
                  }}
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <button
                onClick={() => respond(r, "withdraw")}
                disabled={busy === r.id}
                style={{
                  padding: "8px 14px",
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-3)",
                  fontSize: 12,
                  cursor: busy === r.id ? "wait" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                Withdraw
              </button>
            )}
          </div>
        </div>
      ))}

      {showNudge && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--surface2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-3)",
              flexShrink: 0,
            }}
          >
            <UserPlus size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
              You are not in a program yet
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              Join one so your program director can see your progress.
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => router.push("/programs")}
              style={{
                padding: "8px 14px",
                background: "var(--primary)",
                border: "none",
                borderRadius: 7,
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Find my program
            </button>
            <button
              onClick={dismissNudge}
              aria-label="Dismiss"
              title="Not now"
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
      )}
    </div>
  );
}
