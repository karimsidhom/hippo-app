"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PostCard } from "@/components/profile/PostCard";
import { Plus, TrendingUp, Sparkles, UserPlus, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Pearl, UserRoleType } from "@/lib/types";

// Feed rails — small, scannable blocks that sit above the main feed and turn
// an empty home screen into a live product. All three fetch in parallel on
// mount; each renders only if it returned items, so first-time users still
// see something (featured) even before they follow anyone.

interface Props {
  onCreatePost?: () => void;
}

interface SuggestedUser {
  id: string;
  name: string | null;
  image: string | null;
  reason?: string;
  profile?: {
    specialty: string | null;
    trainingYearLabel: string | null;
    institution?: string | null;
  } | null;
}

interface SuggestionsPayload {
  sameProgram: SuggestedUser[];
  attendings: SuggestedUser[];
  pgyPeers: SuggestedUser[];
}

export function PostFeed({ onCreatePost }: Props) {
  const router = useRouter();
  const { profile } = useAuth();
  const viewerRoleType = profile?.roleType as UserRoleType | undefined;

  const [posts, setPosts] = useState<Pearl[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fellBackToFeatured, setFellBackToFeatured] = useState(false);

  const [trending, setTrending] = useState<Pearl[]>([]);
  const [digest, setDigest] = useState<Pearl[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionsPayload | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (cursor?: string) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({ feed: "true", limit: "15" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/pearls?${params}`);
      if (res.ok) {
        const data = await res.json();
        const items: Pearl[] = data.items || [];
        if (cursor) {
          setPosts((prev) => [...prev, ...items]);
        } else {
          // Alive empty state: if the personal feed is empty, pull featured
          // pearls so new users see real content on first open.
          if (items.length === 0) {
            const featured = await fetch(`/api/pearls?feed=featured&limit=10`).then(r => r.ok ? r.json() : { items: [] });
            setPosts(featured.items || []);
            setFellBackToFeatured(true);
          } else {
            setPosts(items);
            setFellBackToFeatured(false);
          }
        }
        setNextCursor(data.nextCursor || null);
      }
    } catch { /* ignore */ }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Rails load in parallel, don't block the feed.
  useEffect(() => {
    fetch("/api/pearls/trending?limit=5").then(r => r.ok ? r.json() : null).then((d) => {
      if (d?.items) setTrending(d.items);
    }).catch(() => {});
    fetch("/api/pearls/digest?limit=3").then(r => r.ok ? r.json() : null).then((d) => {
      if (d?.items) setDigest(d.items);
    }).catch(() => {});
    fetch("/api/follow/suggestions").then(r => r.ok ? r.json() : null).then((d) => {
      if (d) setSuggestions(d);
    }).catch(() => {});
  }, []);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!nextCursor || loadingMore || fellBackToFeatured) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          fetchPosts(nextCursor);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchPosts, fellBackToFeatured]);

  const handleLike = async (id: string) => {
    const pearl = posts.find((p) => p.id === id);
    if (!pearl) return;
    const method = pearl.liked ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/pearls/${id}/like`, { method });
      if (res.ok) {
        const { likeCount } = await res.json();
        setPosts((prev) => prev.map((p) =>
          p.id === id ? { ...p, liked: !p.liked, likeCount } : p
        ));
      }
    } catch { /* ignore */ }
  };

  const handleSave = async (id: string) => {
    const pearl = posts.find((p) => p.id === id);
    if (!pearl) return;
    const method = pearl.saved ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/pearls/${id}/save`, { method });
      if (res.ok) {
        const { saveCount } = await res.json();
        setPosts((prev) => prev.map((p) =>
          p.id === id ? { ...p, saved: !p.saved, saveCount } : p
        ));
      }
    } catch { /* ignore */ }
  };

  // Combine follow suggestions into a single compact list (max 4).
  const compactSuggestions: SuggestedUser[] = suggestions
    ? [...(suggestions.sameProgram || []), ...(suggestions.attendings || []), ...(suggestions.pgyPeers || [])]
        .filter((u, i, arr) => arr.findIndex(x => x.id === u.id) === i)
        .slice(0, 4)
    : [];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--text-3)", fontSize: 12 }}>
        Loading feed...
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Weekly digest rail — top pearls in the viewer's specialty, last 7d */}
      {digest.length > 0 && (
        <RailSection
          icon={<Sparkles size={14} color="#F59E0B" />}
          title="This week in your specialty"
          subtitle="Top pearls from the last 7 days"
          bg="rgba(245,158,11,0.06)"
          border="rgba(245,158,11,0.22)"
        >
          {digest.map((p) => (
            <MiniPearl key={p.id} pearl={p} onClick={() => router.push(`/social?p=${p.id}`)} />
          ))}
        </RailSection>
      )}

      {/* Trending rail — platform-wide hot pearls */}
      {trending.length > 0 && (
        <RailSection
          icon={<TrendingUp size={14} color="#0EA5E9" />}
          title="Trending this week"
          subtitle="What surgical residents are reacting to"
          bg="rgba(14,165,233,0.06)"
          border="rgba(14,165,233,0.22)"
        >
          {trending.map((p) => (
            <MiniPearl key={p.id} pearl={p} onClick={() => router.push(`/social?p=${p.id}`)} />
          ))}
        </RailSection>
      )}

      {/* Follow suggestions rail */}
      {compactSuggestions.length > 0 && (
        <div style={railStyle("rgba(139,92,246,0.06)", "rgba(139,92,246,0.22)")}>
          <div style={railHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <UserPlus size={14} color="#8B5CF6" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                Suggested to follow
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {compactSuggestions.map((u) => (
              <div
                key={u.id}
                onClick={() => router.push(`/profile/${u.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", cursor: "pointer",
                  borderTop: "1px solid rgba(139,92,246,0.15)",
                }}
              >
                {u.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.image} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#fff",
                  }}>
                    {(u.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                    {u.name || "Anonymous"}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                    {[u.profile?.trainingYearLabel, u.profile?.specialty, u.profile?.institution].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-3)" />
              </div>
            ))}
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            Your feed is empty
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5 }}>
            Follow colleagues to see their posts here, or create your own.
          </div>
        </div>
      ) : (
        <>
          {fellBackToFeatured && (
            <div style={{
              padding: "8px 12px", marginBottom: 8,
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 8, fontSize: 11, color: "var(--text-3)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Sparkles size={12} color="#F59E0B" />
              Nothing from people you follow yet — showing featured pearls.
            </div>
          )}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              pearl={post}
              onLike={handleLike}
              onSave={handleSave}
              viewerRoleType={viewerRoleType}
            />
          ))}
          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} style={{ height: 1 }} />
          {loadingMore && (
            <div style={{ textAlign: "center", padding: 20, color: "var(--text-3)", fontSize: 12 }}>
              Loading more...
            </div>
          )}
        </>
      )}

      {/* FAB — Create post */}
      {onCreatePost && (
        <button
          onClick={onCreatePost}
          style={{
            position: "fixed",
            bottom: 80,
            right: 20,
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "var(--primary)",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "transform .15s",
            zIndex: 50,
          }}
        >
          <Plus size={22} />
        </button>
      )}
    </div>
  );
}

// ── Rail primitives ────────────────────────────────────────────────────────

function RailSection({
  icon, title, subtitle, bg, border, children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  bg: string;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <div style={railStyle(bg, border)}>
      <div style={railHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {icon}
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{title}</span>
        </div>
        {subtitle && (
          <span style={{ fontSize: 10, color: "var(--text-3)" }}>{subtitle}</span>
        )}
      </div>
      <div style={{
        display: "flex", gap: 8, overflowX: "auto", padding: "0 10px 10px 10px",
        scrollbarWidth: "none",
      }}>
        {children}
      </div>
    </div>
  );
}

function MiniPearl({ pearl, onClick }: { pearl: Pearl; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: 220, maxWidth: 220, flexShrink: 0,
        textAlign: "left", padding: "10px 12px",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 4,
      }}
    >
      <div style={{
        fontSize: 9, fontWeight: 600, color: "var(--primary)",
        textTransform: "uppercase", letterSpacing: ".05em",
      }}>
        {pearl.procedureName}
      </div>
      <div style={{
        fontSize: 12, fontWeight: 600, color: "var(--text)",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {pearl.title}
      </div>
      <div style={{
        fontSize: 10, color: "var(--text-3)",
        display: "flex", gap: 8, marginTop: 2,
      }}>
        <span>{pearl.reactionCount ?? 0} reactions</span>
        {(pearl.endorseCount ?? 0) > 0 && <span style={{ color: "var(--primary)" }}>· co-signed</span>}
      </div>
    </button>
  );
}

const railStyle = (bg: string, border: string): React.CSSProperties => ({
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: 12,
  marginBottom: 12,
});
const railHeader: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "10px 12px 8px 12px",
};
