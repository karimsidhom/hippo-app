"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsStrip } from "@/components/profile/StatsStrip";
import { ProfileTabs, type ProfileTab } from "@/components/profile/ProfileTabs";
import { PortfolioTab } from "@/components/profile/PortfolioTab";
import { PostsTab } from "@/components/profile/PostsTab";
import { Lock } from "lucide-react";
import type { PublicProfile, Pearl, PortfolioCase } from "@/lib/types";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user } = useAuth();

  const [profileData, setProfileData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("portfolio");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioCase[]>([]);
  const [pearls, setPearls] = useState<Pearl[]>([]);

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
