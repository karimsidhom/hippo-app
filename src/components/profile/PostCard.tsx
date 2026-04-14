"use client";

import { useState } from "react";
import { Heart, Bookmark, MessageCircle, ExternalLink, ChevronDown, ChevronUp, Send, Briefcase } from "lucide-react";
import type { Pearl, PearlComment } from "@/lib/types";

const POST_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pearl: { label: "Pearl", color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  case_share: { label: "Case Share", color: "#10B981", bg: "rgba(16,185,129,0.08)" },
  research: { label: "Research", color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  discussion: { label: "Discussion", color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
};

interface Props {
  pearl: Pearl;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
}

export function PostCard({ pearl, onLike, onSave }: Props) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PearlComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(pearl.commentCount || 0);

  const postType = pearl.postType || "pearl";
  const badge = POST_TYPE_LABELS[postType] || POST_TYPE_LABELS.pearl;

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/pearls/${pearl.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.items || []);
      }
    } catch { /* ignore */ }
    setCommentsLoading(false);
  };

  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/pearls/${pearl.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [newComment, ...prev]);
        setCommentText("");
        setLocalCommentCount((c) => c + 1);
      }
    } catch { /* ignore */ }
    setSubmittingComment(false);
  };

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 0,
      marginBottom: 10,
      overflow: "hidden",
    }}>
      {/* Image (if present) */}
      {pearl.imageUrl && (
        <div style={{
          width: "100%",
          aspectRatio: "16 / 9",
          overflow: "hidden",
          background: "var(--surface2)",
        }}>
          <img
            src={pearl.imageUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      )}

      <div style={{ padding: 16 }}>
        {/* Author row */}
        {pearl.author && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "var(--primary-dim)",
              border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: "var(--primary)",
              fontFamily: "'Geist', sans-serif",
              overflow: "hidden",
            }}>
              {pearl.author.image ? (
                <img src={pearl.author.image} alt="" style={{ width: 28, height: 28, objectFit: "cover" }} />
              ) : (
                pearl.author.name?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                {pearl.author.name || "Anonymous"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                {pearl.author.profile?.trainingYearLabel}
                {pearl.author.profile?.specialty ? ` \u00b7 ${pearl.author.profile.specialty}` : ""}
              </div>
            </div>
          </div>
        )}

        {/* Post type + procedure + category badges */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 4,
            background: badge.bg, color: badge.color,
            border: `1px solid ${badge.bg}`,
            fontWeight: 600,
          }}>
            {badge.label}
          </span>
          <span style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 4,
            background: "rgba(14,165,233,0.06)", color: "var(--primary)",
            border: "1px solid rgba(14,165,233,0.1)",
            fontWeight: 500,
          }}>
            {pearl.procedureName}
          </span>
          {pearl.category && (
            <span style={{
              fontSize: 10, padding: "2px 7px", borderRadius: 4,
              background: "var(--surface2)", color: "var(--text-3)",
              border: "1px solid var(--border)",
            }}>
              {pearl.category}
            </span>
          )}
        </div>

        {/* Title + content */}
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          {pearl.title}
        </div>
        <div style={{
          fontSize: 13, color: "var(--text-2)", lineHeight: 1.6,
          marginBottom: 12,
        }}>
          {pearl.content}
        </div>

        {/* Linked article URL (research posts) */}
        {pearl.linkUrl && (
          <a
            href={pearl.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 10px", marginBottom: 10,
              background: "rgba(139,92,246,0.04)",
              border: "1px solid rgba(139,92,246,0.1)",
              borderRadius: 8,
              color: "#8B5CF6",
              fontSize: 12, fontWeight: 500,
              textDecoration: "none",
              transition: "background .15s",
            }}
          >
            <ExternalLink size={12} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {pearl.linkUrl}
            </span>
          </a>
        )}

        {/* Linked case summary (case share posts) */}
        {pearl.linkedCase && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 10px", marginBottom: 10,
            background: "rgba(16,185,129,0.04)",
            border: "1px solid rgba(16,185,129,0.1)",
            borderRadius: 8,
            color: "var(--text-2)",
            fontSize: 12,
          }}>
            <Briefcase size={12} color="#10B981" />
            <span style={{ fontWeight: 500 }}>{pearl.linkedCase.procedureName}</span>
            <span style={{ color: "var(--text-3)", fontSize: 10 }}>
              {pearl.linkedCase.surgicalApproach} · {new Date(pearl.linkedCase.caseDate).toLocaleDateString("en-CA", { month: "short", year: "numeric" })}
            </span>
          </div>
        )}

        {/* Tags */}
        {pearl.tags.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
            {pearl.tags.map((tag) => (
              <span key={tag} style={{
                fontSize: 10, color: "var(--text-3)", padding: "1px 6px",
                background: "var(--surface2)", borderRadius: 3,
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 16 }}>
          <button
            onClick={() => onLike(pearl.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              padding: 0, fontFamily: "'Geist', sans-serif",
              color: pearl.liked ? "#EF4444" : "var(--text-3)",
              transition: "color .15s",
            }}
          >
            <Heart size={14} fill={pearl.liked ? "#EF4444" : "none"} />
            <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace" }}>
              {pearl.likeCount}
            </span>
          </button>
          <button
            onClick={() => onSave(pearl.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              padding: 0, fontFamily: "'Geist', sans-serif",
              color: pearl.saved ? "var(--primary)" : "var(--text-3)",
              transition: "color .15s",
            }}
          >
            <Bookmark size={14} fill={pearl.saved ? "var(--primary)" : "none"} />
            <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace" }}>
              {pearl.saveCount}
            </span>
          </button>
          <button
            onClick={toggleComments}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              padding: 0, fontFamily: "'Geist', sans-serif",
              color: showComments ? "var(--primary)" : "var(--text-3)",
              transition: "color .15s",
            }}
          >
            <MessageCircle size={14} />
            <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace" }}>
              {localCommentCount}
            </span>
            {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Comments section (collapsed by default) */}
        {showComments && (
          <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            {/* Comment input */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                className="st-input"
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                style={{ flex: 1, marginBottom: 0 }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={submittingComment || !commentText.trim()}
                style={{
                  padding: "8px 12px", background: "var(--primary)", color: "#fff",
                  border: "none", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'Geist', sans-serif",
                  opacity: submittingComment || !commentText.trim() ? 0.5 : 1,
                  display: "flex", alignItems: "center",
                }}
              >
                <Send size={14} />
              </button>
            </div>

            {/* Comments list */}
            {commentsLoading ? (
              <div style={{ textAlign: "center", padding: 16, color: "var(--text-3)", fontSize: 11 }}>
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div style={{ textAlign: "center", padding: 12, color: "var(--text-3)", fontSize: 11 }}>
                No comments yet. Be the first!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} style={{
                  display: "flex", gap: 8, padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: "var(--primary-dim)",
                    border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, fontWeight: 700, color: "var(--primary)",
                    fontFamily: "'Geist', sans-serif",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}>
                    {comment.author?.image ? (
                      <img src={comment.author.image} alt="" style={{ width: 22, height: 22, objectFit: "cover" }} />
                    ) : (
                      comment.author?.name?.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>
                        {comment.author?.name || "Anonymous"}
                      </span>
                      <span style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "'Geist Mono', monospace" }}>
                        {new Date(comment.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2, lineHeight: 1.5 }}>
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
