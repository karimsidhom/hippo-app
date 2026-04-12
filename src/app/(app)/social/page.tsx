"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Search, UserPlus, Users, UserCheck, ChevronRight } from "lucide-react";

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

const TABS = ["Discover", "Following", "Followers"];

export default function SocialPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Discover");
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

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch discover results
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

  useEffect(() => {
    if (activeTab === "Discover") fetchDiscover();
  }, [activeTab, fetchDiscover]);

  useEffect(() => {
    if (activeTab === "Following") fetchFollowing();
  }, [activeTab, fetchFollowing]);

  useEffect(() => {
    if (activeTab === "Followers") fetchFollowers();
  }, [activeTab, fetchFollowers]);

  // Follow/unfollow handler
  const handleFollow = async (targetId: string, currentlyFollowing: boolean) => {
    const method = currentlyFollowing ? "DELETE" : "POST";
    try {
      await fetch("/api/social/follow", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetId }),
      });
      // Update local state
      setDiscoverUsers((prev) =>
        prev.map((u) =>
          u.id === targetId
            ? { ...u, isFollowing: !currentlyFollowing, followerCount: u.followerCount + (currentlyFollowing ? -1 : 1) }
            : u
        )
      );
      // Also refresh following list if on that tab
      if (activeTab === "Following") fetchFollowing();
    } catch { /* ignore */ }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.replace("Dr. ", "").trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-.4px" }}>
          Community
        </span>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
          Discover and follow surgical colleagues
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 8, marginBottom: 20,
      }}>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "12px 14px", textAlign: "center",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
            {following.length || 0}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".7px", marginTop: 2 }}>
            Following
          </div>
        </div>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "12px 14px", textAlign: "center",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
            {followers.length || 0}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".7px", marginTop: 2 }}>
            Followers
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 16, gap: 0,
      }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "10px 0",
              background: "none", border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
              color: activeTab === tab ? "var(--text)" : "var(--text-3)",
              fontSize: 12, fontWeight: activeTab === tab ? 600 : 500,
              cursor: "pointer", fontFamily: "'Geist', sans-serif",
              transition: "all .15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

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
              <Users size={24} color="var(--text-3)" style={{ marginBottom: 8, margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                {searchDebounced ? "No users found" : "No public profiles yet"}
              </div>
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
                    {[u.trainingYearLabel, u.specialty, u.institution].filter(Boolean).join(" \u00b7 ")}
                  </div>
                  <div style={{
                    display: "flex", gap: 8, marginTop: 3,
                  }}>
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
              <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 8 }}>Not following anyone yet</div>
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
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>No followers yet</div>
            </div>
          ) : (
            followers.map((u) => (
              <UserRow key={u.id} user={u} router={router} />
            ))
          )}
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
          {[user.profile?.trainingYearLabel, user.profile?.specialty, user.profile?.institution].filter(Boolean).join(" \u00b7 ")}
        </div>
      </div>
      <ChevronRight size={14} color="var(--text-3)" />
    </div>
  );
}
