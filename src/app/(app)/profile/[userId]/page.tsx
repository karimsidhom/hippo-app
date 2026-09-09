"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsStrip } from "@/components/profile/StatsStrip";
import { ProfileTabs, type ProfileTab } from "@/components/profile/ProfileTabs";
import { PortfolioTab } from "@/components/profile/PortfolioTab";
import { PostsTab } from "@/components/profile/PostsTab";
import { Lock, UserPlus, UserCheck, X } from "lucide-react";
import type { PublicProfile, Pearl, PortfolioCase } from "@/lib/types";

/** Mirrors the friendStatus contract shared with /api/social/discover. */
type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

interface SharedCase {
  id: string;
  procedureName: string;
  caseDate: string;
  role: string;
  autonomyLevel: string;
  surgicalApproach: string;
  institutionSite: string | null;
}

/** The API returns these on top of the shared PublicProfile shape. Kept
 * local since PublicProfile/ProfileHeader are owned by another file in
 * this workstream. */
type ProfileWithFriends = PublicProfile & {
  isFriend: boolean;
  friendStatus: FriendStatus;
  requestId?: string;
  friendshipId?: string;
  sharesCases: boolean;
  sharedCases?: SharedCase[];
};

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user } = useAuth();

  const [profileData, setProfileData] = useState<ProfileWithFriends | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("portfolio");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioCase[]>([]);
  const [pearls, setPearls] = useState<Pearl[]>([]);
  const [friendActionError, setFriendActionError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${userId}`);
      if (res.ok) setProfileData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [userId]);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch(`/api/portfolio?userId=${userId}`);
      if (res.ok) setPortfolioItems(await res.json());
    } catch { /* ignore */ }
  }, [userId]);

  const fetchPearls = useCallback(async () => {
    try {
      const res = await fetch(`/api/pearls?authorId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPearls(data.items || []);
      }
    } catch { /* ignore */ }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
    fetchPortfolio();
    fetchPearls();
  }, [fetchProfile, fetchPortfolio, fetchPearls]);

  const handleFollowToggle = async () => {
    if (!profileData) return;
    const method = profileData.isFollowing ? "DELETE" : "POST";
    try {
      await fetch("/api/social/follow", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      setProfileData((prev) => prev ? {
        ...prev,
        isFollowing: !prev.isFollowing,
        followerCount: prev.followerCount + (prev.isFollowing ? -1 : 1),
      } : prev);
    } catch { /* ignore */ }
  };

  const handleSendFriendRequest = async () => {
    setFriendActionError(null);
    try {
      const res = await fetch("/api/social/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: userId }),
      });
      if (res.ok) {
        const created = await res.json();
        setProfileData((prev) => prev ? { ...prev, friendStatus: "pending_sent", requestId: created.id } : prev);
      } else {
        const body = await res.json().catch(() => ({}));
        setFriendActionError(body?.error || "Could not send that friend request.");
      }
    } catch {
      setFriendActionError("Could not send that friend request.");
    }
  };

  const handleCancelRequest = async () => {
    if (!profileData?.requestId) return;
    try {
      const res = await fetch("/api/social/requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: profileData.requestId }),
      });
      if (res.ok) {
        setProfileData((prev) => prev ? { ...prev, friendStatus: "none", requestId: undefined } : prev);
      }
    } catch { /* ignore */ }
  };

  const handleAcceptRequest = async () => {
    if (!profileData?.requestId) return;
    try {
      const res = await fetch("/api/social/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: profileData.requestId, action: "ACCEPT" }),
      });
      if (res.ok) {
        setProfileData((prev) => prev ? { ...prev, friendStatus: "friends", requestId: undefined, isFriend: true } : prev);
      }
    } catch { /* ignore */ }
  };

  const handleLikePearl = async (id: string) => {
    const pearl = pearls.find((p) => p.id === id);
    if (!pearl) return;
    const method = pearl.liked ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/pearls/${id}/like`, { method });
      if (res.ok) {
        const { likeCount } = await res.json();
        setPearls((prev) => prev.map((p) =>
          p.id === id ? { ...p, liked: !p.liked, likeCount } : p
        ));
      }
    } catch { /* ignore */ }
  };

  const handleSavePearl = async (id: string) => {
    const pearl = pearls.find((p) => p.id === id);
    if (!pearl) return;
    const method = pearl.saved ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/pearls/${id}/save`, { method });
      if (res.ok) {
        const { saveCount } = await res.json();
        setPearls((prev) => prev.map((p) =>
          p.id === id ? { ...p, saved: !p.saved, saveCount } : p
        ));
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--text-3)", fontSize: 13 }}>
        Loading profile...
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--text-3)", fontSize: 13 }}>
        User not found.
      </div>
    );
  }

  // Private profile
  if (!profileData.profile?.publicProfile && !profileData.isOwnProfile) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Lock size={24} color="var(--text-3)" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          {profileData.name || "This user"}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>
          This profile is private.
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      <ProfileHeader
        profile={profileData}
        onFollowToggle={handleFollowToggle}
      />

      {/* Friend action — rendered here (rather than inside ProfileHeader,
          which is owned by another workstream) so it sits right beside
          the follow control at the top of the profile. */}
      {!profileData.isOwnProfile && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -12, marginBottom: 16 }}>
          {profileData.friendStatus === "friends" ? (
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 14px", background: "none",
              border: "1px solid var(--border-mid)", color: "var(--text-2)",
              borderRadius: 8, fontSize: 12, fontWeight: 600,
              fontFamily: "'Geist', sans-serif",
            }}>
              <UserCheck size={12} /> Friends
            </span>
          ) : profileData.friendStatus === "pending_received" ? (
            <button
              onClick={handleAcceptRequest}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 14px", background: "var(--primary)",
                border: "1px solid var(--primary)", color: "#fff",
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Geist', sans-serif",
              }}
            >
              <UserCheck size={12} /> Accept friend request
            </button>
          ) : profileData.friendStatus === "pending_sent" ? (
            <button
              onClick={handleCancelRequest}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 14px", background: "none",
                border: "1px solid var(--border-mid)", color: "var(--text-3)",
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Geist', sans-serif",
              }}
            >
              <X size={12} /> Requested
            </button>
          ) : (
            <button
              onClick={handleSendFriendRequest}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 14px", background: "none",
                border: "1px solid var(--primary)", color: "var(--primary)",
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Geist', sans-serif",
              }}
            >
              <UserPlus size={12} /> Add friend
            </button>
          )}
        </div>
      )}

      {friendActionError && (
        <div style={{
          padding: "10px 14px", marginBottom: 16,
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 10, fontSize: 12, color: "#ef4444",
        }}>
          {friendActionError}
        </div>
      )}

      {/* Recent cases — only ever shown to an accepted friend, and only
          the PHIA-safe fields the owner opted to share. */}
      {!profileData.isOwnProfile && profileData.isFriend && profileData.sharedCases && (
        <div style={{
          marginBottom: 20, padding: 16,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "var(--text-3)",
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10,
          }}>
            Recent cases
          </div>
          {profileData.sharedCases.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>No cases logged yet.</div>
          ) : (
            profileData.sharedCases.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0",
                  borderBottom: i < profileData.sharedCases!.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'Geist Mono', monospace", flexShrink: 0, width: 72 }}>
                  {new Date(c.caseDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.procedureName}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>
                  {c.role}
                </span>
              </div>
            ))
          )}
        </div>
      )}
      {!profileData.isOwnProfile && profileData.isFriend && !profileData.sharesCases && (
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 20 }}>
          This surgeon keeps their case log private.
        </div>
      )}

      {profileData.stats && (
        <StatsStrip
          totalCases={profileData.stats.totalCases}
          streak={profileData.stats.streak}
          avgORMinutes={profileData.stats.avgORMinutes}
          independentRate={profileData.stats.independentRate}
        />
      )}

      <ProfileTabs
        active={activeTab}
        onChange={setActiveTab}
        portfolioCount={portfolioItems.length}
        pearlCount={pearls.length}
      />

      {activeTab === "portfolio" && (
        <PortfolioTab items={portfolioItems} isOwn={false} />
      )}

      {activeTab === "posts" && (
        <PostsTab
          pearls={pearls}
          isOwn={false}
          onLike={handleLikePearl}
          onSave={handleSavePearl}
        />
      )}

      {activeTab === "about" && profileData.stats && (
        <div>
          {profileData.stats.topProcedures.length > 0 && (
            <section>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12,
              }}>Top Procedures</div>
              {profileData.stats.topProcedures.map((proc, i) => (
                <div key={proc.name} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "8px 0",
                  borderBottom: i < profileData.stats!.topProcedures.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                    fontFamily: "'Geist Mono', monospace", width: 16, flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: 500, color: "var(--text)",
                  }}>{proc.name}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: "var(--text-2)",
                    fontFamily: "'Geist Mono', monospace",
                  }}>{proc.count}</span>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
