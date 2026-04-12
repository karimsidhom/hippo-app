"use client";

import { useState } from "react";
import { Plus, Star, Award } from "lucide-react";
import type { PortfolioCase, CaseLog } from "@/lib/types";

interface Props {
  items: PortfolioCase[];
  isOwn: boolean;
  cases?: CaseLog[];
  onAdd?: (data: { caseLogId: string; title: string; description: string; isFeatured: boolean; isMilestone: boolean }) => void;
  onRemove?: (id: string) => void;
}

export function PortfolioTab({ items, isOwn, cases, onAdd, onRemove }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isMilestone, setIsMilestone] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cases not already in portfolio
  const availableCases = (cases || []).filter(
    (c) => !items.some((p) => p.caseLogId === c.id)
  );

  const handleAdd = async () => {
    if (!selectedCaseId || !title.trim()) return;
    setSaving(true);
    onAdd?.({ caseLogId: selectedCaseId, title: title.trim(), description, isFeatured, isMilestone });
    setSaving(false);
    setShowAdd(false);
    setSelectedCaseId("");
    setTitle("");
    setDescription("");
    setIsFeatured(false);
    setIsMilestone(false);
  };

  if (items.length === 0 && !isOwn) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: 13 }}>
        No portfolio cases yet.
      </div>
    );
  }

  return (
    <div>
      {/* Cards */}
      {items.map((item) => (
        <div key={item.id} style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 10,
          position: "relative",
        }}>
          {/* Tags */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {item.isFeatured && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 9, padding: "2px 6px", borderRadius: 4,
                background: "rgba(14,165,233,0.08)", color: "var(--primary)",
                border: "1px solid rgba(14,165,233,0.12)",
                textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600,
              }}>
                <Star size={8} /> Featured
              </span>
            )}
            {item.isMilestone && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 9, padding: "2px 6px", borderRadius: 4,
                background: "rgba(16,185,129,0.08)", color: "var(--success)",
                border: "1px solid rgba(16,185,129,0.12)",
                textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600,
              }}>
                <Award size={8} /> Milestone
              </span>
            )}
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            {item.title}
          </div>

          {item.caseLog && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text-2)" }}>{item.caseLog.procedureName}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{item.caseLog.surgicalApproach}</span>
              {item.caseLog.operativeDurationMinutes && (
                <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'Geist Mono', monospace" }}>
                  {item.caseLog.operativeDurationMinutes}min
                </span>
              )}
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                {new Date(item.caseLog.caseDate).toLocaleDateString("en-CA", { month: "short", year: "numeric" })}
              </span>
            </div>
          )}

          {item.description && (
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
              {item.description}
            </div>
          )}

          {isOwn && onRemove && (
            <button
              onClick={() => onRemove(item.id)}
              style={{
                position: "absolute", top: 10, right: 10,
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-3)", fontSize: 10,
                fontFamily: "'Geist', sans-serif",
              }}
            >
              Remove
            </button>
          )}
        </div>
      ))}

      {/* Add button */}
      {isOwn && !showAdd && (
        <button
          onClick={() => setShowAdd(true)}
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
          }}
        >
          <Plus size={14} /> Add to Portfolio
        </button>
      )}

      {/* Add form */}
      {isOwn && showAdd && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border-mid)",
          borderRadius: 12,
          padding: 16,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "var(--text-3)",
            textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10,
          }}>Add Case to Portfolio</div>

          <select
            className="st-input"
            value={selectedCaseId}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              const c = availableCases.find((x) => x.id === e.target.value);
              if (c) setTitle(c.procedureName);
            }}
            style={{ marginBottom: 8 }}
          >
            <option value="">Select a case...</option>
            {availableCases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.procedureName} — {new Date(c.caseDate).toLocaleDateString("en-CA")}
              </option>
            ))}
          </select>

          <input
            className="st-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Public title"
            style={{ marginBottom: 8 }}
          />

          <textarea
            className="st-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Public description (PHIA-safe, no patient info)..."
            style={{ marginBottom: 8, resize: "none", height: 64 }}
          />

          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={isMilestone} onChange={(e) => setIsMilestone(e.target.checked)} />
              Milestone
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleAdd}
              disabled={saving || !selectedCaseId || !title.trim()}
              style={{
                padding: "8px 16px", background: "var(--primary)", color: "#fff",
                border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Geist', sans-serif",
                opacity: saving || !selectedCaseId || !title.trim() ? 0.5 : 1,
              }}
            >
              {saving ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
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
