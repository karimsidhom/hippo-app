"use client";

/**
 * Matches the shape returned by GET /api/social/friends — one row per
 * accepted Friendship, from the current user's point of view.
 */
export interface FriendSummary {
  userId: string;
  name: string | null;
  image: string | null;
  specialty?: string | null;
  trainingYearLabel?: string | null;
  institution?: string | null;
  roleType?: string | null;
  totalCases: number;
  thisMonth: number;
  friendshipId: string;
  since?: string;
}

interface FriendCardProps {
  friend: FriendSummary;
  onOpen?: (userId: string) => void;
  onUnfriend?: (friendshipId: string) => void;
}

export function FriendCard({ friend, onOpen, onUnfriend }: FriendCardProps) {
  const initials = friend.name
    ? friend.name.replace("Dr. ", "").trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: 14, marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => onOpen?.(friend.userId)} style={{ cursor: "pointer", flexShrink: 0 }}>
          {friend.image ? (
            <img
              src={friend.image}
              alt=""
              style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, var(--primary), var(--primary-lo))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "#fff",
              fontFamily: "'Geist', sans-serif",
            }}>
              {initials}
            </div>
          )}
        </div>

        <div onClick={() => onOpen?.(friend.userId)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            {friend.name || "Anonymous"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
            {[friend.trainingYearLabel, friend.specialty, friend.institution].filter(Boolean).join(" · ")}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
              {friend.totalCases}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-3)" }}>total</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", fontFamily: "'Geist Mono', monospace" }}>
              {friend.thisMonth}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-3)" }}>this mo.</div>
          </div>
        </div>
      </div>

      {onUnfriend && (
        <button
          onClick={() => onUnfriend(friend.friendshipId)}
          style={{
            marginTop: 10, width: "100%", padding: "6px 0",
            background: "none", border: "1px solid var(--border-mid)",
            color: "var(--text-3)", borderRadius: 8, fontSize: 11, fontWeight: 500,
            cursor: "pointer", fontFamily: "'Geist', sans-serif",
          }}
        >
          Unfriend
        </button>
      )}
    </div>
  );
}
