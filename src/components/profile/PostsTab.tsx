"use client";

import { useState, useRef } from "react";
import { Plus, Shield, Upload, X, Link as LinkIcon } from "lucide-react";
import { PostCard } from "./PostCard";
import type { Pearl, PostType, CaseLog } from "@/lib/types";

const CATEGORIES = [
  "Clinical Pearl", "Case Share", "Research", "Discussion", "Question", "Milestone",
];

const POST_TYPE_TABS: { key: PostType; label: string }[] = [
  { key: "pearl", label: "Pearl" },
  { key: "case_share", label: "Case Share" },
  { key: "research", label: "Research" },
  { key: "discussion", label: "Discussion" },
];

interface Props {
  pearls: Pearl[];
  isOwn: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onCreate?: (data: {
    procedureName: string;
    category: string;
    title: string;
    content: string;
    tags: string[];
    postType: PostType;
    imageUrl?: string;
    linkUrl?: string;
    linkedCaseId?: string;
  }) => void;
  cases?: CaseLog[];
}

export function PostsTab({ pearls, isOwn, onLike, onSave, onCreate, cases }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [postType, setPostType] = useState<PostType>("pearl");
  const [procedureName, setProcedureName] = useState("");
  const [category, setCategory] = useState<string>("Clinical Pearl");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkedCaseId, setLinkedCaseId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/posts/image", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.imageUrl);
      } else {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        alert(err.error || "Failed to upload image");
      }
    } catch {
      alert("Failed to upload image. Please try again.");
    }
    setImageUploading(false);
  };

  const handleCreate = async () => {
    if (!procedureName.trim() || !title.trim() || !content.trim()) return;
    setSaving(true);
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    onCreate?.({
      procedureName: procedureName.trim(),
      category,
      title: title.trim(),
      content: content.trim(),
      tags,
      postType,
      imageUrl: imageUrl || undefined,
      linkUrl: postType === "research" && linkUrl ? linkUrl.trim() : undefined,
      linkedCaseId: postType === "case_share" && linkedCaseId ? linkedCaseId : undefined,
    });
    setSaving(false);
    setShowCreate(false);
    setProcedureName("");
    setTitle("");
    setContent("");
    setTagInput("");
    setLinkUrl("");
    setLinkedCaseId("");
    setImageUrl("");
    setPostType("pearl");
  };

  return (
    <div>
      {/* Post list */}
      {pearls.map((pearl) => (
        <PostCard key={pearl.id} pearl={pearl} onLike={onLike} onSave={onSave} />
      ))}

      {pearls.length === 0 && !showCreate && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: 13 }}>
          {isOwn ? "Share your first post." : "No posts shared yet."}
        </div>
      )}

      {/* Create button */}
      {isOwn && !showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          style={{
            width: "100%", padding: 14,
            background: "none",
            border: "1px dashed var(--border-mid)",
            borderRadius: 12,
            color: "var(--text-3)",
            fontSize: 12, fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Geist', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all .15s",
            marginTop: 4,
          }}
        >
          <Plus size={14} /> Create a Post
        </button>
      )}

      {/* Create form */}
      {isOwn && showCreate && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border-mid)",
          borderRadius: 12,
          padding: 16,
          marginTop: 4,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "var(--text-3)",
            textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10,
          }}>New Post</div>

          {/* Post type tabs */}
          <div style={{
            display: "flex", gap: 0, marginBottom: 12,
            border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden",
          }}>
            {POST_TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPostType(tab.key)}
                style={{
                  flex: 1, padding: "7px 0",
                  background: postType === tab.key ? "var(--primary)" : "transparent",
                  color: postType === tab.key ? "#fff" : "var(--text-3)",
                  border: "none",
                  fontSize: 11, fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Geist', sans-serif",
                  transition: "all .15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input
              className="st-input"
              type="text"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="Procedure / topic"
            />
            <select
              className="st-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <input
            className="st-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            style={{ marginBottom: 8 }}
          />

          <textarea
            className="st-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your knowledge (no patient info)..."
            style={{ marginBottom: 8, resize: "none", height: 100 }}
          />

          {/* Link URL field for research type */}
          {postType === "research" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <LinkIcon size={14} color="var(--text-3)" style={{ flexShrink: 0 }} />
              <input
                className="st-input"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Article / paper URL"
                style={{ flex: 1, marginBottom: 0 }}
              />
            </div>
          )}

          {/* Case selector for case share type */}
          {postType === "case_share" && cases && cases.length > 0 && (
            <select
              className="st-input"
              value={linkedCaseId}
              onChange={(e) => setLinkedCaseId(e.target.value)}
              style={{ marginBottom: 8 }}
            >
              <option value="">Select a case to share...</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.procedureName} — {new Date(c.caseDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                </option>
              ))}
            </select>
          )}

          {/* Image upload */}
          <div style={{ marginBottom: 8 }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f);
              }}
            />
            {imageUrl ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={imageUrl}
                  alt="Post image"
                  style={{
                    width: "100%", maxHeight: 200, objectFit: "cover",
                    borderRadius: 8, border: "1px solid var(--border)",
                  }}
                />
                <button
                  onClick={() => setImageUrl("")}
                  style={{
                    position: "absolute", top: 4, right: 4,
                    width: 22, height: 22, borderRadius: 11,
                    background: "rgba(0,0,0,0.6)", border: "none",
                    color: "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={imageUploading}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 12px",
                  background: "none",
                  border: "1px dashed var(--border-mid)",
                  borderRadius: 8,
                  color: "var(--text-3)",
                  fontSize: 11, fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "'Geist', sans-serif",
                  opacity: imageUploading ? 0.5 : 1,
                }}
              >
                <Upload size={12} />
                {imageUploading ? "Uploading..." : "Add image (optional)"}
              </button>
            )}
          </div>

          <input
            className="st-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Tags (comma-separated)"
            style={{ marginBottom: 8 }}
          />

          {/* PHIA notice */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 10, color: "var(--text-3)",
            marginBottom: 12,
            padding: "6px 8px",
            background: "rgba(16,185,129,0.04)",
            border: "1px solid rgba(16,185,129,0.08)",
            borderRadius: 6,
          }}>
            <Shield size={10} color="var(--success)" />
            Content is auto-scrubbed for PHIA/HIPAA compliance before publishing.
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleCreate}
              disabled={saving || !procedureName.trim() || !title.trim() || !content.trim()}
              style={{
                padding: "8px 16px", background: "var(--primary)", color: "#fff",
                border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Geist', sans-serif",
                opacity: saving || !procedureName.trim() || !title.trim() || !content.trim() ? 0.5 : 1,
              }}
            >
              {saving ? "Publishing..." : "Publish Post"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setImageUrl(""); }}
              style={{
                padding: "8px 16px", background: "none",
                border: "1px solid var(--border)", color: "var(--text-3)",
                borderRadius: 6, fontSize: 12,
                cursor: "pointer", fontFamily: "'Geist', sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
