"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PostCard } from "@/components/profile/PostCard";
import { Plus } from "lucide-react";
import type { Pearl } from "@/lib/types";

interface Props {
  onCreatePost?: () => void;
}

export function PostFeed({ onCreatePost }: Props) {
  const [posts, setPosts] = useState<Pearl[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
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
        if (cursor) {
          setPosts((prev) => [...prev, ...(data.items || [])]);
        } else {
          setPosts(data.items || []);
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

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!nextCursor || loadingMore) return;
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
  }, [nextCursor, loadingMore, fetchPosts]);

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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--text-3)", fontSize: 12 }}>
        Loading feed...
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
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
          {posts.map((post) => (
            <PostCard key={post.id} pearl={post} onLike={handleLike} onSave={handleSave} />
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
