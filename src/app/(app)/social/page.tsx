"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search, UserPlus, Users, UserCheck, ChevronRight,
  Share2, MessageSquare, Link as LinkIcon, Check, Copy,
} from "lucide-react";
import { PostFeed } from "@/components/social/PostFeed";
import { PostComposer } from "@/components/social/PostComposer";

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

type Tab = "Feed" | "Discover" | "Following" | "Followers" | "Invite";

export default function SocialPage() {
  const { user } = useAuth();
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
      params.set("limit", "30");
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

  // Load counts on mount (for stats strip)
  useEffect(() => {
    fetchFollowing();
    fetchFollowers();
  }, [fetchFollowing, fetchFollowers]);

  useEffect(() => {
    if (activeTab === "Discover") fetchDiscover();
    if (activeTab === "Following") fetchFollowing();
    if (activeTab === "Followers") fetchFollowers();
  }, [activeTab, fetchDiscover, fetchFollowing, fetchFollowers]);

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

  const TABS: { key: Tab; label: string }[] = [
    { key: "Feed", label: "Feed" },
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
        display: "grid", gridTemplateColumns: "1fr 1fr",
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
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 16, gap: 0,
      }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              flex: 1, padding: "10px 0",
              background: "none", border: "none",
              borderBottom: activeTab === key ? "2px solid var(--primary)" : "2px solid transparent",
              color: activeTab === key ? "var(--text)" : "var(--text-3)",
              fontSize: 12, fontWeight: activeTab === key ? 600 : 500,
              cursor: "pointer", fontFamily: "'Geist', sans-serif",
              transition: "all .15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══ Feed Tab ═══ */}
      {activeTab === "Feed" && (
        <PostFeed onCreatePost={() => setComposerOpen(true)} />
      )}

      {/* Unified composer — opens from PostFeed's "new post" button or from
          "Share as pearl" buttons elsewhere in the app. */}
      <PostComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublished={() => { setComposerOpen(false); setFeedBump(b => b + 1); }}
      />

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

                {/* Follow button */}
                <button
                  onClick={() => handleFollow(u.id, u.isFollowing)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "6px 12px",
                    background: u.isFollowing ? "none" : "var(--primary)",
                    border: u.isFollowing ? "1px solid var(--border-mid)" : "1px solid var(--primary)",
                    color: u.isFollowing ? "var(--text-3)" : "#fff",
                    borderRadius: 8, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'Geist', sans-serif",
                    transition: "all .15s", flexShrink: 0,
                  }}
                >
                  {u.isFollowing ? (
                    <><UserCheck size={12} /> Following</>
                  ) : (
                    <><UserPlus size={12} /> Follow</>
                  )}
                </button>
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
