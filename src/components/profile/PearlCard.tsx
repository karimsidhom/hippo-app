"use client";

import { Heart, Bookmark } from "lucide-react";
import type { Pearl } from "@/lib/types";

interface Props {
  pearl: Pearl;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
}

export function PearlCard({ pearl, onLike, onSave }: Props) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
    }}>
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
          }}>
            {pearl.author.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
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

      {/* Procedure + category badges */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
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
      </div>
    </div>
  );
}
