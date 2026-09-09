"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search, UserPlus, Users, UserCheck, ChevronRight,
  Share2, MessageSquare, Link as LinkIcon, Check, Copy, X,
} from "lucide-react";
import { PostFeed } from "@/components/social/PostFeed";
import { PostComposer } from "@/components/social/PostComposer";
import { FriendCard, type FriendSummary } from "@/components/social/FriendCard";
import type { Profile } from "@/lib/types";

/** Mirrors the `friendStatus` shape returned by /api/social/discover and
 * /api/profile/:userId — kept local since it isn't part of the shared
 * Profile/PublicProfile types owned by other files. */
type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

interface DiscoverUser {
  id: string;
  name: string | null;
  image: string | null;
  specialty: string | null;
  institution: string | null;
  trainingYearLabel: string | null;
  city: string | null;
  followerCount: number;
  caseCount: number;
  isFollowing: boolean;
  friendStatus: FriendStatus;
  requestId?: string;
  friendshipId?: string;
  allowFriendRequests: boolean;
}

interface FollowUser {
  id: string;
  name: string | null;
  image: string | null;
  profile?: {
    specialty: string | null;
    trainingYearLabel: string | null;
    institution: string | null;
  } | null;
}

/** A user attached to a pending friend request (either direction). */
interface RequestUser {
  id: string;
  name: string | null;
  image: string | null;
  profile?: {
    specialty: string | null;
    trainingYearLabel: string | null;
    institution: string | null;
    roleType?: string | null;
  } | null;
}

interface ReceivedRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  fromUser: RequestUser;
}

interface SentRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  toUser: RequestUser;
}

// Demo storyboard (S9 — Community) shows three primary tabs: Feed,
// Pearls, Leaderboard. Discover/Following/Followers/Invite remain
// reachable from the secondary chip strip below the tabs so we don't
// lose any existing surface area, but the demo's promised surface is
// what users land on.
type Tab =
  | "Feed"
  | "Pearls"
  | "Leaderboard"
  | "Friends"
  | "Discover"
  | "Following"
  | "Followers"
  | "Invite";

export default function SocialPage() {
  const { user, profile, updateProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Discover state
  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);

  // Following/Followers state
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followersLoading, setFollowersLoading] = useState(false);

  // Friends state
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [receivedRequests, setReceivedRequests] = useState<ReceivedRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [friendActionError, setFriendActionError] = useState<string | null>(null);

  // The current user's own sharing preferences — read with a local cast
  // since `shareCasesWithFriends` isn't yet part of the shared Profile
  // type (owned by another file in this workstream).
  const shareCasesWithFriends =
    (profile as unknown as { shareCasesWithFriends?: boolean } | null)?.shareCasesWithFriends ?? false;
  const isPublicProfile = profile?.publicProfile ?? false;

  // Invite state
  const [copied, setCopied] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [, setFeedBump] = useState(0);

  // The invite link — use NEXT_PUBLIC_APP_URL for clean production URLs,
  // fall back to window.location.origin for dev/preview
  const appBase = process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== "http://localhost:3000"
    ? process.env.NEXT_PUBLIC_APP_URL
    : typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = `${appBase}/signup?ref=${user?.id || ""}`;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch discover — runs on mount and when search changes
  const fetchDiscover = useCallback(async () => {
    setDiscoverLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchDebounced) params.set("q", searchDebounced);
      params.set("limit", "50");
      const res = await fetch(`/api/social/discover?${params}`);
      if (res.ok) setDiscoverUsers(await res.json());
    } catch { /* ignore */ }
    setDiscoverLoading(false);
  }, [searchDebounced]);

  // Fetch following
  const fetchFollowing = useCallback(async () => {
    if (!user?.id) return;
    setFollowingLoading(true);
    try {
      const res = await fetch(`/api/social/following?userId=${user.id}`);
      if (res.ok) setFollowing(await res.json());
    } catch { /* ignore */ }
    setFollowingLoading(false);
  }, [user?.id]);

  // Fetch followers
  const fetchFollowers = useCallback(async () => {
    if (!user?.id) return;
    setFollowersLoading(true);
    try {
      const res = await fetch(`/api/social/followers?userId=${user.id}`);
      if (res.ok) setFollowers(await res.json());
    } catch { /* ignore */ }
    setFollowersLoading(false);
  }, [user?.id]);

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      const res = await fetch("/api/social/friends");
      if (res.ok) setFriends(await res.json());
    } catch { /* ignore */ }
    setFriendsLoading(false);
  }, []);

  // Fetch incoming + outgoing friend requests
  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch("/api/social/requests");
      if (res.ok) {
        const data = await res.json();
        setReceivedRequests(data.received || []);
        setSentRequests(data.sent || []);
      }
    } catch { /* ignore */ }
    setRequestsLoading(false);
  }, []);

  // Load counts on mount (for stats strip + Friends badge)
  useEffect(() => {
    fetchFollowing();
    fetchFollowers();
    fetchFriends();
    fetchRequests();
  }, [fetchFollowing, fetchFollowers, fetchFriends, fetchRequests]);

  useEffect(() => {
    if (activeTab === "Discover") fetchDiscover();
    if (activeTab === "Following") fetchFollowing();
    if (activeTab === "Followers") fetchFollowers();
    if (activeTab === "Friends") { fetchFriends(); fetchRequests(); }
  }, [activeTab, fetchDiscover, fetchFollowing, fetchFollowers, fetchFriends, fetchRequests]);

  // Follow/unfollow handler
  const handleFollow = async (targetId: string, currentlyFollowing: boolean) => {
    const method = currentlyFollowing ? "DELETE" : "POST";
    try {
      await fetch("/api/social/follow", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetId }),
      });
      setDiscoverUsers((prev) =>
        prev.map((u) =>
          u.id === targetId
            ? { ...u, isFollowing: !currentlyFollowing, followerCount: u.followerCount + (currentlyFollowing ? -1 : 1) }
            : u
        )
      );
      // Always refresh following/followers after a follow/unfollow action
      fetchFollowing();
      fetchFollowers();
    } catch { /* ignore */ }
  };

  // Send a friend request from a Discover row.
  const handleSendFriendRequest = async (targetId: string) => {
    setFriendActionError(null);
    try {
      const res = await fetch("/api/social/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: targetId }),
      });
      if (res.ok) {
        const created = await res.json();
        setDiscoverUsers((prev) => prev.map((u) =>
          u.id === targetId ? { ...u, friendStatus: "pending_sent", requestId: created.id } : u
        ));
        fetchRequests();
      } else {
        const body = await res.json().catch(() => ({}));
        setFriendActionError(body?.error || "Could not send that friend request.");
      }
    } catch {
      setFriendActionError("Could not send that friend request.");
    }
  };

  // Cancel a pending request I sent — usable from Discover or the Friends tab.
  const handleCancelRequest = async (requestId: string, targetId?: string) => {
    try {
      const res = await fetch("/api/social/requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) {
        if (targetId) {
          setDiscoverUsers((prev) => prev.map((u) =>
            u.id === targetId ? { ...u, friendStatus: "none", requestId: undefined } : u
          ));
        }
        setSentRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch { /* ignore */ }
  };

  // Accept or decline a request I received — usable from Discover or the Friends tab.
  const handleRespondToRequest = async (requestId: string, action: "ACCEPT" | "REJECT", targetId?: string) => {
    try {
      const res = await fetch("/api/social/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
        if (action === "ACCEPT") {
          if (targetId) {
            setDiscoverUsers((prev) => prev.map((u) =>
              u.id === targetId ? { ...u, friendStatus: "friends", requestId: undefined } : u
            ));
          }
          fetchFriends();
        }
      }
    } catch { /* ignore */ }
  };

  // Unfriend from the Friends tab.
  const handleUnfriend = async (friendshipId: string) => {
    try {
      const res = await fetch(`/api/social/friends/${friendshipId}`, { method: "DELETE" });
      if (res.ok) {
        setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
        fetchDiscover();
      }
    } catch { /* ignore */ }
  };

  // Toggle "share my cases with friends" — persisted via updateProfile.
  // `shareCasesWithFriends` isn't yet part of the shared Profile type
  // (owned by another file in this workstream), so the patch is cast
  // through `unknown` rather than widening that type here.
  const handleToggleShareCases = async () => {
    try {
      const patch = { shareCasesWithFriends: !shareCasesWithFriends };
      await updateProfile(patch as unknown as Partial<Profile>);
    } catch { /* ignore */ }
  };

  const handleTogglePublicProfile = async () => {
    try {
      await updateProfile({ publicProfile: !isPublicProfile });
    } catch { /* ignore */ }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.replace("Dr. ", "").trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  // Invite helpers
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hippo — Surgical Training Tracker",
          text: "I've been using Hippo to track my cases and connect with other surgical residents. Sign up and follow me!",
          url: inviteLink,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  const handleInviteViaSMS = () => {
    const message = encodeURIComponent(
      `Hey! I've been using this app called Hippo to track my surgical cases, share clinical pearls, and connect with other residents. You should check it out — sign up here: ${inviteLink}`
    );
    window.open(`sms:?&body=${message}`, "_self");
  };

  // Primary tabs match the demo storyboard.
  const PRIMARY_TABS: { key: Tab; label: string }[] = [
    { key: "Feed", label: "Feed" },
    { key: "Pearls", label: "Pearls" },
    { key: "Leaderboard", label: "Leaderboard" },
  ];
  // Secondary chips — preserve the existing functionality without
  // crowding the primary nav. Friends comes first since it's the main
  // way to add colleagues and decide whether to share cases with them.
  const SECONDARY_CHIPS: { key: Tab; label: string }[] = [
    { key: "Friends", label: "Friends" },
    { key: "Discover", label: "Discover" },
    { key: "Following", label: "Following" },
    { key: "Followers", label: "Followers" },
    { key: "Invite", label: "Invite" },
  ];

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-.4px" }}>
          Community
        </span>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
          Find colleagues, share knowledge, grow together
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8, marginBottom: 20,
      }}>
        <button
          onClick={() => setActiveTab("Following")}
          style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "12px 14px", textAlign: "center",
            cursor: "pointer", transition: "border-color .15s",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
            {following.length || 0}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".7px", marginTop: 2 }}>
            Following
          </div>
        </button>
        <button
          onClick={() => setActiveTab("Followers")}
          style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "12px 14px", textAlign: "center",
            cursor: "pointer", transition: "border-color .15s",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
            {followers.length || 0}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".7px", marginTop: 2 }}>
            Followers
          </div>
        </button>
        <button
          onClick={() => setActiveTab("Friends")}
          style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "12px 14px", textAlign: "center",
            cursor: "pointer", transition: "border-color .15s",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
            {friends.length || 0}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".7px", marginTop: 2 }}>
            Friends
          </div>
        </button>
      </div>

      {/* Primary tabs — the three the demo storyboard actually shows. */}
      <div style={{
        display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 12, gap: 0,
      }}>
        {PRIMARY_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1, padding: "10px 0",
              background: "none", border: "none",
              borderBottom: activeTab === key ? "2px solid var(--primary)" : "2px solid transparent",
              color: activeTab === key ? "var(--text)" : "var(--text-3)",
              fontSize: 13, fontWeight: activeTab === key ? 600 : 500,
              cursor: "pointer", fontFamily: "'Geist', sans-serif",
              transition: "all .15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Secondary chip strip — Discover / Following / Followers / Invite. */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 16,
        }}
      >
        {SECONDARY_CHIPS.map(({ key, label }) => {
          const active = activeTab === key;
          const badgeCount = key === "Friends" ? receivedRequests.length : 0;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 99,
                border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                background: active ? "rgba(14,165,233,0.1)" : "var(--surface)",
                color: active ? "var(--primary)" : "var(--text-3)",
                cursor: "pointer",
                transition: "all .15s",
                fontFamily: "'Geist', sans-serif",
              }}
            >
              {label}
              {badgeCount > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 15, height: 15, padding: "0 4px",
                  background: "var(--primary)", color: "#fff",
                  borderRadius: 99, fontSize: 9, fontWeight: 700,
                  fontFamily: "'Geist Mono', monospace",
                }}>
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ Feed Tab ═══ */}
      {activeTab === "Feed" && (
        <PostFeed onCreatePost={() => setComposerOpen(true)} />
      )}

      {/* ═══ Pearls Tab — curated subset of the same feed ═══
          The pearl model in this app IS the post model — every shared
          post is a "clinical pearl". The Pearls tab gives the same feed
          a different framing: a one-line header that names what the
          user is looking at, then the same chronological pearl list. */}
      {activeTab === "Pearls" && (
        <div>
          <div
            style={{
              padding: "12px 14px",
              marginBottom: 12,
              background: "rgba(14,165,233,0.04)",
              border: "1px solid rgba(14,165,233,0.18)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--primary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              Clinical pearls
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-2)",
                lineHeight: 1.5,
              }}
            >
              Surgical pearls shared by the community. Every pearl is
              auto-screened for PHI before it lands here.
            </div>
          </div>
          <PostFeed onCreatePost={() => setComposerOpen(true)} />
        </div>
      )}

      {/* ═══ Leaderboard Tab — link to the dedicated leaderboard page ═══
          We render a compact "see-it-here" header with a primary CTA
          that takes the user to the full leaderboard so all the
          existing filters (volume / autonomy / improvement, specialty,
          PGY, time range) remain available. */}
      {activeTab === "Leaderboard" && (
        <div>
          <div
            style={{
              padding: 18,
              marginBottom: 14,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Hippo top contributors
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--text)",
                fontWeight: 500,
                lineHeight: 1.5,
                marginBottom: 14,
              }}
            >
              See the volume, autonomy and improvement leaderboards
              across your specialty and PGY year.
            </div>
            <button
              onClick={() => router.push("/leaderboard")}
              style={{
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "linear-gradient(135deg, var(--primary-hi), var(--primary-lo))",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 24px -4px rgba(14,165,233,0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Open the leaderboard
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Unified composer — opens from PostFeed's "new post" button or from
          "Share as pearl" buttons elsewhere in the app. */}
      <PostComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublished={() => { setComposerOpen(false); setFeedBump(b => b + 1); }}
      />

      {/* ═══ Friends Tab ═══ */}
      {activeTab === "Friends" && (
        <div>
          {/* Share cases toggle */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px", marginBottom: 10,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                Share my cases with friends
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3, lineHeight: 1.5 }}>
                Friends can see your recent cases (procedure, date, role). Notes and patient details are never shared.
              </div>
            </div>
            <ToggleSwitch checked={shareCasesWithFriends} onClick={handleToggleShareCases} />
          </div>

          {/* Public profile nudge — only shown if the user is currently private */}
          {!isPublicProfile && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", marginBottom: 16,
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
                Your profile is private, so colleagues can&apos;t find you in Discover. Make it public to be found and add friends.
              </div>
              <ToggleSwitch checked={isPublicProfile} onClick={handleTogglePublicProfile} />
            </div>
          )}

          {friendActionError && (
            <div style={{
              padding: "10px 14px", marginBottom: 14,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10, fontSize: 12, color: "#ef4444",
            }}>
              {friendActionError}
            </div>
          )}

          {/* Incoming requests */}
          {receivedRequests.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
              }}>
                Requests ({receivedRequests.length})
              </div>
              {receivedRequests.map((r) => (
                <RequestRow
                  key={r.id}
                  user={r.fromUser}
                  router={router}
                  actions={
                    <>
                      <button
                        onClick={() => handleRespondToRequest(r.id, "ACCEPT", r.fromUserId)}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "6px 10px", background: "var(--primary)",
                          border: "1px solid var(--primary)", color: "#fff",
                          borderRadius: 8, fontSize: 11, fontWeight: 600,
                          cursor: "pointer", fontFamily: "'Geist', sans-serif",
                        }}
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(r.id, "REJECT")}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "6px 10px", background: "none",
                          border: "1px solid var(--border-mid)", color: "var(--text-3)",
                          borderRadius: 8, fontSize: 11, fontWeight: 600,
                          cursor: "pointer", fontFamily: "'Geist', sans-serif",
                        }}
                      >
                        <X size={12} /> Decline
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )}

          {/* Sent requests */}
          {sentRequests.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
              }}>
                Sent ({sentRequests.length})
              </div>
              {sentRequests.map((r) => (
                <RequestRow
                  key={r.id}
                  user={r.toUser}
                  router={router}
                  actions={
                    <button
                      onClick={() => handleCancelRequest(r.id, r.toUserId)}
                      style={{
                        padding: "6px 10px", background: "none",
                        border: "1px solid var(--border-mid)", color: "var(--text-3)",
                        borderRadius: 8, fontSize: 11, fontWeight: 600,
                        cursor: "pointer", fontFamily: "'Geist', sans-serif",
                      }}
                    >
                      Cancel
                    </button>
                  }
                />
              ))}
            </div>
          )}

          {/* Friends list */}
          <div style={{
            fontSize: 10, fontWeight: 600, color: "var(--text-3)",
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
          }}>
            Friends ({friends.length})
          </div>
          {friendsLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-3)", fontSize: 12 }}>Loading...</div>
          ) : friends.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Users size={24} color="var(--text-3)" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                No friends yet
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
                Add colleagues from Discover to build your circle and decide what to share.
              </div>
              <button
                onClick={() => setActiveTab("Discover")}
                style={{
                  padding: "8px 16px", background: "var(--primary)", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Geist', sans-serif",
                }}
              >
                Discover colleagues
              </button>
            </div>
          ) : (
            friends.map((f) => (
              <FriendCard
                key={f.friendshipId}
                friend={f}
                onOpen={(id) => router.push(`/profile/${id}`)}
                onUnfriend={handleUnfriend}
              />
            ))
          )}
        </div>
      )}

      {/* ═══ Discover Tab ═══ */}
      {activeTab === "Discover" && (
        <div>
          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search size={14} style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-3)",
            }} />
            <input
              type="text"
              placeholder="Search by name, specialty, institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="st-input"
              style={{ paddingLeft: 34, marginBottom: 0 }}
            />
          </div>

          {discoverLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-3)", fontSize: 12 }}>
              Searching...
            </div>
          ) : discoverUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Users size={24} color="var(--text-3)" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                {searchDebounced ? "No users found" : "No colleagues here yet"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5 }}>
                {searchDebounced
                  ? "Try a different search or invite them to join."
                  : "Be the first to build your network. Invite colleagues to join Hippo."}
              </div>
              <button
                onClick={() => setActiveTab("Invite")}
                style={{
                  padding: "10px 20px", background: "var(--primary)", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Geist', sans-serif",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <Share2 size={14} />
                Invite colleagues
              </button>
            </div>
          ) : (
            discoverUsers.map((u) => (
              <div key={u.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}>
                {/* Avatar */}
                {u.image ? (
                  <img
                    src={u.image}
                    alt=""
                    onClick={() => router.push(`/profile/${u.id}`)}
                    style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      objectFit: "cover", cursor: "pointer",
                    }}
                  />
                ) : (
                  <div
                    onClick={() => router.push(`/profile/${u.id}`)}
                    style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: "linear-gradient(135deg, var(--primary), var(--primary-lo))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#fff",
                      fontFamily: "'Geist', sans-serif", cursor: "pointer",
                    }}
                  >
                    {getInitials(u.name)}
                  </div>
                )}

                {/* Info */}
                <div
                  style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                  onClick={() => router.push(`/profile/${u.id}`)}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                    {u.name || "Anonymous"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                    {[u.trainingYearLabel, u.specialty, u.institution].filter(Boolean).join(" · ")}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'Geist Mono', monospace" }}>
                      {u.caseCount} cases
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'Geist Mono', monospace" }}>
                      {u.followerCount} followers
                    </span>
                  </div>
                </div>

                {/* Friend action (primary) + Follow (smaller, secondary) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                  {u.friendStatus === "friends" ? (
                    <span style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "6px 12px", background: "none",
                      border: "1px solid var(--border-mid)", color: "var(--text-2)",
                      borderRadius: 8, fontSize: 11, fontWeight: 600,
                      fontFamily: "'Geist', sans-serif",
                    }}>
                      <UserCheck size={12} /> Friends
                    </span>
                  ) : u.friendStatus === "pending_received" ? (
                    <button
                      onClick={() => handleRespondToRequest(u.requestId!, "ACCEPT", u.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "6px 12px", background: "var(--primary)",
                        border: "1px solid var(--primary)", color: "#fff",
                        borderRadius: 8, fontSize: 11, fontWeight: 600,
                        cursor: "pointer", fontFamily: "'Geist', sans-serif",
                      }}
                    >
                      <UserCheck size={12} /> Accept
                    </button>
                  ) : u.friendStatus === "pending_sent" ? (
                    <button
                      onClick={() => handleCancelRequest(u.requestId!, u.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "6px 12px", background: "none",
                        border: "1px solid var(--border-mid)", color: "var(--text-3)",
                        borderRadius: 8, fontSize: 11, fontWeight: 600,
                        cursor: "pointer", fontFamily: "'Geist', sans-serif",
                      }}
                    >
                      Requested
                    </button>
                  ) : u.allowFriendRequests ? (
                    <button
                      onClick={() => handleSendFriendRequest(u.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "6px 12px", background: "none",
                        border: "1px solid var(--primary)", color: "var(--primary)",
                        borderRadius: 8, fontSize: 11, fontWeight: 600,
                        cursor: "pointer", fontFamily: "'Geist', sans-serif",
                      }}
                    >
                      <UserPlus size={12} /> Add friend
                    </button>
                  ) : null}

                  <button
                    onClick={() => handleFollow(u.id, u.isFollowing)}
                    style={{
                      display: "flex", alignItems: "center", gap: 3,
                      padding: "3px 8px",
                      background: "none",
                      border: "none",
                      color: "var(--text-3)",
                      borderRadius: 6, fontSize: 10, fontWeight: 500,
                      cursor: "pointer", fontFamily: "'Geist', sans-serif",
                      transition: "all .15s",
                    }}
                  >
                    {u.isFollowing ? (
                      <><UserCheck size={10} /> Following</>
                    ) : (
                      <><UserPlus size={10} /> Follow</>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ Following Tab ═══ */}
      {activeTab === "Following" && (
        <div>
          {followingLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-3)", fontSize: 12 }}>Loading...</div>
          ) : following.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Users size={24} color="var(--text-3)" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                Not following anyone yet
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
                Discover colleagues or invite friends to get started.
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button
                  onClick={() => setActiveTab("Discover")}
                  style={{
                    padding: "8px 16px", background: "var(--primary)", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'Geist', sans-serif",
                  }}
                >
                  Discover
                </button>
                <button
                  onClick={() => setActiveTab("Invite")}
                  style={{
                    padding: "8px 16px", background: "none", color: "var(--text-2)",
                    border: "1px solid var(--border-mid)", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'Geist', sans-serif",
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <Share2 size={12} /> Invite
                </button>
              </div>
            </div>
          ) : (
            following.map((u) => (
              <UserRow key={u.id} user={u} router={router} />
            ))
          )}
        </div>
      )}

      {/* ═══ Followers Tab ═══ */}
      {activeTab === "Followers" && (
        <div>
          {followersLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-3)", fontSize: 12 }}>Loading...</div>
          ) : followers.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Users size={24} color="var(--text-3)" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                No followers yet
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
                Share your profile link with colleagues to grow your network.
              </div>
              <button
                onClick={() => setActiveTab("Invite")}
                style={{
                  padding: "8px 16px", background: "var(--primary)", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Geist', sans-serif",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}
              >
                <Share2 size={12} /> Invite colleagues
              </button>
            </div>
          ) : (
            followers.map((u) => (
              <UserRow key={u.id} user={u} router={router} />
            ))
          )}
        </div>
      )}

      {/* ═══ Invite Tab ═══ */}
      {activeTab === "Invite" && (
        <div>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "linear-gradient(135deg, var(--primary), var(--primary-lo))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <Share2 size={24} color="#fff" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
              Grow your network
            </div>
            <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>
              Invite colleagues to join Hippo. Track cases together, share clinical pearls, and build your surgical community.
            </div>
          </div>

          {/* Invite actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Text message invite */}
            <button
              onClick={handleInviteViaSMS}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 12, cursor: "pointer",
                transition: "border-color .15s",
                width: "100%", textAlign: "left",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "linear-gradient(135deg, #34C759, #30D158)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <MessageSquare size={18} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                  Invite via Text
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                  Send an invite link to a colleague via iMessage or SMS
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-3)" />
            </button>

            {/* Share link (native share or copy) */}
            <button
              onClick={handleShareNative}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 12, cursor: "pointer",
                transition: "border-color .15s",
                width: "100%", textAlign: "left",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "linear-gradient(135deg, var(--primary), #818CF8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Share2 size={18} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                  Share invite link
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                  Share via any app — WhatsApp, email, Slack, and more
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-3)" />
            </button>

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 12, cursor: "pointer",
                transition: "border-color .15s",
                width: "100%", textAlign: "left",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "linear-gradient(135deg, var(--text-2), var(--text-3))",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {copied ? <Check size={18} color="#fff" /> : <Copy size={18} color="#fff" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                  {copied ? "Copied!" : "Copy invite link"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                  Copy the link and paste it anywhere
                </div>
              </div>
              {!copied && <ChevronRight size={16} color="var(--text-3)" />}
            </button>
          </div>

          {/* Invite link preview */}
          <div style={{
            marginTop: 20, padding: "10px 14px",
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 6 }}>
              Your invite link
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <LinkIcon size={12} color="var(--text-3)" style={{ flexShrink: 0 }} />
              <div style={{
                fontSize: 11, color: "var(--text-2)",
                fontFamily: "'Geist Mono', monospace",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                flex: 1,
              }}>
                {inviteLink}
              </div>
            </div>
          </div>

          {/* Future: contact sync hint */}
          <div style={{
            marginTop: 20, padding: "16px",
            background: "var(--surface)", border: "1px dashed var(--border-mid)",
            borderRadius: 12, textAlign: "center",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>
              Contact sync coming soon
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
              We&apos;re building a way to sync your phone contacts to automatically find colleagues already on Hippo. Stay tuned.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Reusable row for following/followers lists */
function UserRow({ user, router }: { user: FollowUser; router: ReturnType<typeof useRouter> }) {
  const initials = user.name
    ? user.name.replace("Dr. ", "").trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <div
      onClick={() => router.push(`/profile/${user.id}`)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
      }}
    >
      {user.image ? (
        <img
          src={user.image}
          alt=""
          style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, objectFit: "cover" }}
        />
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, var(--primary), var(--primary-lo))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "#fff",
          fontFamily: "'Geist', sans-serif",
        }}>
          {initials}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
          {user.name || "Anonymous"}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
          {[user.profile?.trainingYearLabel, user.profile?.specialty, user.profile?.institution].filter(Boolean).join(" · ")}
        </div>
      </div>
      <ChevronRight size={14} color="var(--text-3)" />
    </div>
  );
}

/** Reusable row for incoming/outgoing friend request lists. */
function RequestRow({
  user, actions, router,
}: {
  user: RequestUser;
  actions: ReactNode;
  router: ReturnType<typeof useRouter>;
}) {
  const initials = user.name
    ? user.name.replace("Dr. ", "").trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 0", borderBottom: "1px solid var(--border)",
    }}>
      <div onClick={() => router.push(`/profile/${user.id}`)} style={{ cursor: "pointer", flexShrink: 0 }}>
        {user.image ? (
          <img
            src={user.image}
            alt=""
            style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, var(--primary), var(--primary-lo))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#fff",
            fontFamily: "'Geist', sans-serif",
          }}>
            {initials}
          </div>
        )}
      </div>
      <div onClick={() => router.push(`/profile/${user.id}`)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
          {user.name || "Anonymous"}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
          {[user.profile?.trainingYearLabel, user.profile?.specialty, user.profile?.institution].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>{actions}</div>
    </div>
  );
}

/** Small pill toggle matching the app's inline-style token design. */
function ToggleSwitch({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={checked}
      style={{
        position: "relative", flexShrink: 0,
        width: 42, height: 24, borderRadius: 99,
        border: "none", padding: 0, cursor: "pointer",
        background: checked ? "var(--primary)" : "var(--border-mid)",
        transition: "background .15s",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: checked ? 20 : 2,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        transition: "left .15s",
      }} />
    </button>
  );
}
