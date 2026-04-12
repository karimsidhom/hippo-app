"use client";

import { useState } from "react";
import { Plus, Shield } from "lucide-react";
import { PearlCard } from "./PearlCard";
import type { Pearl, PearlCategory } from "@/lib/types";

const CATEGORIES: PearlCategory[] = [
  "Anatomy Tip", "Technical Pearl", "Pitfall",
  "Decision Point", "Equipment", "Post-Op", "Other",
];

interface Props {
  pearls: Pearl[];
  isOwn: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onCreate?: (data: { procedureName: string; category: string; title: string; content: string; tags: string[] }) => void;
}

export function PearlsTab({ pearls, isOwn, onLike, onSave, onCreate }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [procedureName, setProcedureName] = useState("");
  const [category, setCategory] = useState<string>("Technical Pearl");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!procedureName.trim() || !title.trim() || !content.trim()) return;
    setSaving(true);
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    onCreate?.({ procedureName: procedureName.trim(), category, title: title.trim(), content: content.trim(), tags });
    setSaving(false);
    setShowCreate(false);
    setProcedureName("");
    setTitle("");
    setContent("");
    setTagInput("");
  };

  return (
    <div>
      {/* Pearl list */}
      {pearls.map((pearl) => (
        <PearlCard key={pearl.id} pearl={pearl} onLike={onLike} onSave={onSave} />
      ))}

      {pearls.length === 0 && !showCreate && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: 13 }}>
          {isOwn ? "Share your first teaching pearl." : "No pearls shared yet."}
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
          <Plus size={14} /> Write a Pearl
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
          }}>New Pearl</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input
              className="st-input"
              type="text"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="Procedure name"
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
            placeholder="Pearl title"
            style={{ marginBottom: 8 }}
          />

          <textarea
            className="st-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Educational content (no patient info)..."
            style={{ marginBottom: 8, resize: "none", height: 100 }}
          />

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
              {saving ? "Publishing..." : "Publish Pearl"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
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
