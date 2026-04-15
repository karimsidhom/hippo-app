"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X, AlertTriangle, Image as ImageIcon, Upload, ShieldCheck, EyeOff, Plus, Trash2 } from "lucide-react";
import { ModalShell } from "@/components/shared/ModalShell";

// ---------------------------------------------------------------------------
// PostComposer
//
// One composer to rule them all. Called from:
//  - Social feed "New post" button — blank draft
//  - Case page  "Share as pearl"   — prefilled from case via Gemini
//  - EPA inbox  "Share lesson"     — prefilled from EPA via Gemini
//
// Design principles:
//  - Never a blank box. Smart templates and draft-from-source do the work.
//  - All PHIA checks happen server-side in /api/pearls; client shows warnings
//  - One-screen: no tabs, no wizards, no "advanced" hidden state
// ---------------------------------------------------------------------------

export type DraftSource =
  | { kind: "case"; caseId: string }
  | { kind: "epa"; epaId: string }
  | { kind: "blank" };

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional seed — triggers a Gemini draft-from-source on open. */
  source?: DraftSource;
  /** Fired with the created pearl payload on successful publish. */
  onPublished?: (pearl: unknown) => void;
}

const TEMPLATES: { label: string; title: string; content: string }[] = [
  { label: "Pearl", title: "", content: "One thing I learned today: " },
  { label: "Watch out for", title: "Watch out for...", content: "A pitfall to avoid in this procedure: " },
  { label: "My attending taught me", title: "My attending taught me...", content: "Teaching pearl from today's case: " },
  { label: "Ask the room", title: "Would you...", content: "Quick question for the community: " },
  { label: "I would do differently", title: "Next time I'd...", content: "Reflecting on today, what I'd change: " },
  { label: "Before \u2192 After", title: "Plan vs reality", content: "Pre-op plan: \n\nIntra-op finding: \n\nLesson: " },
];

const POST_TYPES = [
  { value: "pearl", label: "Pearl" },
  { value: "case_share", label: "Case share" },
  { value: "discussion", label: "Discussion" },
  { value: "research", label: "Research" },
  { value: "poll", label: "Ask the room (poll)" },
];

interface PollOptionDraft { id: string; label: string }
function mkOpt(i: number): PollOptionDraft { return { id: `opt-${i}-${Math.random().toString(36).slice(2, 7)}`, label: "" }; }

interface PhiPreflight {
  safe: boolean;
  redactedTitle?: string;
  redactedContent?: string;
  warnings: string[];
}

export function PostComposer({ open, onClose, source, onPublished }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [procedureName, setProcedureName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [postType, setPostType] = useState("pearl");
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageUploading, setImageUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pollOptions, setPollOptions] = useState<PollOptionDraft[]>([mkOpt(0), mkOpt(1)]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [phiChecking, setPhiChecking] = useState(false);
  const [phiResult, setPhiResult] = useState<PhiPreflight | null>(null);

  // On open: reset + optionally generate a draft from a case/EPA source.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setWarnings([]);
    setPollOptions([mkOpt(0), mkOpt(1)]);
    setIsAnonymous(false);
    setPhiResult(null);
    if (!source || source.kind === "blank") {
      setTitle("");
      setContent("");
      setProcedureName("");
      setTags([]);
      setPostType("pearl");
      setCategory(null);
      setImageUrl("");
      return;
    }
    setImageUrl("");
    // Ask Gemini to draft from the case/EPA.
    setDrafting(true);
    fetch("/api/pearls/draft", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(source.kind === "case" ? { caseId: source.caseId } : { epaId: source.epaId }),
    })
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || "Draft failed");
        return r.json();
      })
      .then(d => {
        setTitle(d.title ?? "");
        setContent(d.content ?? "");
        setProcedureName(d.procedureName ?? "");
        setTags(d.tags ?? []);
        setPostType(d.postType ?? "pearl");
        setCategory(d.category ?? null);
      })
      .catch(e => setError(String(e.message ?? e)))
      .finally(() => setDrafting(false));
  }, [open, source]);

  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    if (t.title) setTitle(t.title);
    setContent(prev => (prev ? prev : t.content));
  };

  const handleImageUpload = async (file: File) => {
    setError(null);
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/posts/image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Upload failed (${res.status})`);
        return;
      }
      if (data.imageUrl) setImageUrl(data.imageUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const runPhiCheck = async () => {
    setError(null);
    setPhiChecking(true);
    try {
      const res = await fetch("/api/pearls/phi-preflight", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "PHI check failed");
        return;
      }
      setPhiResult({
        safe: !!data.safe,
        redactedTitle: data.redactedTitle,
        redactedContent: data.redactedContent,
        warnings: Array.isArray(data.warnings) ? data.warnings : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "PHI check failed");
    } finally {
      setPhiChecking(false);
    }
  };

  const acceptPhiScrub = () => {
    if (!phiResult) return;
    if (phiResult.redactedTitle) setTitle(phiResult.redactedTitle);
    if (phiResult.redactedContent) setContent(phiResult.redactedContent);
    setPhiResult({ ...phiResult, safe: true, redactedTitle: undefined, redactedContent: undefined });
  };

  const handleSubmit = async () => {
    setError(null);
    setWarnings([]);
    if (!procedureName.trim() || !title.trim() || !content.trim()) {
      setError("Title, content, and procedure name are required.");
      return;
    }
    // Poll validation
    let pollPayload: PollOptionDraft[] | undefined;
    if (postType === "poll") {
      const cleaned = pollOptions
        .map(o => ({ id: o.id, label: o.label.trim() }))
        .filter(o => o.label.length > 0);
      if (cleaned.length < 2) {
        setError("Polls need at least 2 options.");
        return;
      }
      if (cleaned.length > 4) {
        setError("Polls support up to 4 options.");
        return;
      }
      pollPayload = cleaned;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/pearls", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          procedureName: procedureName.trim(),
          title: title.trim(),
          content: content.trim(),
          tags,
          postType,
          category,
          imageUrl: imageUrl || undefined,
          isAnonymous,
          pollOptions: pollPayload,
          linkedCaseId: source?.kind === "case" ? source.caseId : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (Array.isArray(j.warnings) && j.warnings.length) {
          setWarnings(j.warnings);
          setError(j.error || "Post contains potential PHI.");
        } else {
          setError(j.error || `Failed (${res.status})`);
        }
        return;
      }
      const pearl = await res.json();
      onPublished?.(pearl);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <ModalShell onClose={onClose}>
      <div style={{ width: "min(640px, 95vw)" }}>
        <div style={panelStyle}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border-mid)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={16} style={{ color: "#0EA5E9" }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>
                {source?.kind === "case" ? "Share this case" :
                 source?.kind === "epa" ? "Share this lesson" :
                 "New post"}
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" style={iconBtn}><X size={14} /></button>
          </div>

          {/* Body */}
          <div style={{ padding: 16, maxHeight: "70vh", overflowY: "auto" }}>
            {drafting && (
              <div style={draftBanner}>
                <Sparkles size={14} /> Drafting with AI...
              </div>
            )}

            {!drafting && !source && (
              <div style={{ marginBottom: 12 }}>
                <Label>Start from a template</Label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TEMPLATES.map(t => (
                    <button key={t.label} onClick={() => applyTemplate(t)} style={chipBtn}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Label>Title</Label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="A crisp 5-10 word headline"
              style={inputStyle}
              maxLength={120}
            />

            <Label>Body</Label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="80-150 words. Teachable. No patient identifiers."
              style={{ ...inputStyle, minHeight: 160, fontFamily: "inherit", lineHeight: 1.5 }}
              maxLength={2000}
            />
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: -4, marginBottom: 8 }}>
              {content.length} / 2000
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <Label>Procedure</Label>
                <input
                  value={procedureName}
                  onChange={e => setProcedureName(e.target.value)}
                  placeholder="e.g. Cholecystectomy"
                  style={inputStyle}
                  maxLength={80}
                />
              </div>
              <div>
                <Label>Type</Label>
                <select value={postType} onChange={e => setPostType(e.target.value)} style={inputStyle}>
                  {POST_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {postType === "poll" && (
              <>
                <Label>Poll options (2 – 4)</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                  {pollOptions.map((opt, idx) => (
                    <div key={opt.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        value={opt.label}
                        onChange={e => {
                          const v = e.target.value;
                          setPollOptions(prev => prev.map((o, i) => i === idx ? { ...o, label: v } : o));
                        }}
                        placeholder={`Option ${idx + 1}`}
                        style={{ ...inputStyle, marginBottom: 0 }}
                        maxLength={80}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                          style={{ ...iconBtn, color: "#EF4444" }}
                          aria-label="Remove option"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      onClick={() => setPollOptions(prev => [...prev, mkOpt(prev.length)])}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 10px", alignSelf: "flex-start",
                        background: "var(--bg-2)",
                        border: "1px dashed var(--border-mid)",
                        borderRadius: 8,
                        color: "var(--text-2)",
                        fontSize: 12, cursor: "pointer",
                      }}
                    >
                      <Plus size={12} /> Add option
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Anonymous toggle */}
            <button
              onClick={() => setIsAnonymous(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", marginBottom: 10, width: "100%",
                background: isAnonymous ? "rgba(14,165,233,0.08)" : "var(--bg-2)",
                border: `1px solid ${isAnonymous ? "rgba(14,165,233,0.45)" : "var(--border-mid)"}`,
                borderRadius: 8, cursor: "pointer", textAlign: "left",
              }}
            >
              <EyeOff size={14} style={{ color: isAnonymous ? "var(--primary)" : "var(--text-3)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                  Post anonymously {isAnonymous ? "· on" : "· off"}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                  Name & photo hidden. Specialty and PGY still shown so the post is credible.
                </div>
              </div>
            </button>

            {tags.length > 0 && (
              <>
                <Label>Tags</Label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {tags.map(t => (
                    <span key={t} style={tagChip}>#{t}</span>
                  ))}
                </div>
              </>
            )}

            {/* Image upload */}
            <Label>Image (optional)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f);
                // Reset so selecting the same file again re-triggers onChange
                e.target.value = "";
              }}
            />
            {imageUrl ? (
              <div style={{ position: "relative", display: "block", marginBottom: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Attached"
                  style={{
                    width: "100%", maxHeight: 240, objectFit: "cover",
                    borderRadius: 8, border: "1px solid var(--border-mid)",
                  }}
                />
                <button
                  onClick={() => setImageUrl("")}
                  aria-label="Remove image"
                  style={{
                    position: "absolute", top: 6, right: 6,
                    width: 24, height: 24, borderRadius: 12,
                    background: "rgba(0,0,0,0.6)", border: "none", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
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
                  padding: "8px 12px", marginBottom: 10,
                  background: "var(--bg-2)",
                  border: "1px dashed var(--border-mid)",
                  borderRadius: 8,
                  color: "var(--text-2)",
                  fontSize: 12, fontWeight: 500,
                  cursor: imageUploading ? "wait" : "pointer",
                  opacity: imageUploading ? 0.6 : 1,
                }}
              >
                {imageUploading ? <Upload size={12} /> : <ImageIcon size={12} />}
                {imageUploading ? "Uploading..." : "Add image (JPEG / PNG / WebP, up to 5 MB)"}
              </button>
            )}

            {/* PHI preflight result */}
            {phiResult && (
              <div style={phiResult.safe ? phiOkBox : warnBox}>
                <ShieldCheck size={14} style={{ flexShrink: 0, color: phiResult.safe ? "#10B981" : "#F59E0B" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {phiResult.safe ? "PHI preflight: looks clean" : "PHI preflight flagged your draft"}
                  </div>
                  {phiResult.warnings.length > 0 && phiResult.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: 12 }}>{"\u2022"} {w}</div>
                  ))}
                  {!phiResult.safe && (phiResult.redactedTitle || phiResult.redactedContent) && (
                    <button
                      onClick={acceptPhiScrub}
                      style={{
                        marginTop: 8, padding: "6px 10px",
                        background: "var(--primary)", color: "#fff",
                        border: "none", borderRadius: 6,
                        fontSize: 11, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Accept suggested scrub
                    </button>
                  )}
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div style={warnBox}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Potential PHI detected</div>
                  {warnings.map((w, i) => <div key={i} style={{ fontSize: 12 }}>{"\u2022"} {w}</div>)}
                </div>
              </div>
            )}

            {error && !warnings.length && (
              <div style={errBox}>{error}</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--border-mid)", gap: 8 }}>
            <button
              onClick={runPhiCheck}
              disabled={phiChecking || !title.trim() || !content.trim()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 12px", borderRadius: 8,
                background: "var(--bg-2)", border: "1px solid var(--border-mid)",
                color: "var(--text-1)", fontSize: 12, fontWeight: 500,
                cursor: "pointer",
                opacity: phiChecking || !title.trim() || !content.trim() ? 0.5 : 1,
              }}
            >
              <ShieldCheck size={12} /> {phiChecking ? "Scanning..." : "PHI preflight"}
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={secondaryBtn}>Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={loading || drafting || imageUploading || phiChecking || !title.trim() || !content.trim() || !procedureName.trim()}
                style={{ ...primaryBtn, opacity: (loading || drafting || imageUploading || phiChecking || !title.trim() || !content.trim() || !procedureName.trim()) ? 0.5 : 1 }}
              >
                <Send size={14} /> {loading ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: ".03em", marginTop: 10, marginBottom: 6 }}>{children}</div>;
}

const panelStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-mid)",
  borderRadius: 16,
  boxShadow: "0 24px 48px -12px rgba(0,0,0,0.4)",
  overflow: "hidden",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  color: "var(--text)",
  background: "var(--bg-2)",
  border: "1px solid var(--border-mid)",
  borderRadius: 8,
  outline: "none",
  marginBottom: 10,
  fontFamily: "inherit",
};
const chipBtn: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 12,
  color: "var(--text-1)",
  background: "var(--bg-2)",
  border: "1px solid var(--border-mid)",
  borderRadius: 999,
  cursor: "pointer",
};
const iconBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "transparent", border: "none", color: "var(--text-2)", cursor: "pointer",
};
const primaryBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "9px 14px", borderRadius: 8, border: "none",
  background: "linear-gradient(135deg, #0EA5E9, #0284C7)", color: "#fff",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const secondaryBtn: React.CSSProperties = {
  padding: "9px 14px", borderRadius: 8,
  background: "var(--bg-2)", border: "1px solid var(--border-mid)",
  color: "var(--text-1)", fontSize: 13, fontWeight: 500, cursor: "pointer",
};
const draftBanner: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "10px 12px", marginBottom: 12,
  background: "#0EA5E910", border: "1px solid #0EA5E930", borderRadius: 8,
  fontSize: 13, color: "var(--text-1)",
};
const warnBox: React.CSSProperties = {
  display: "flex", gap: 10, alignItems: "flex-start",
  padding: "10px 12px", marginTop: 10,
  background: "#F59E0B15", border: "1px solid #F59E0B40", borderRadius: 8,
  fontSize: 13, color: "var(--text-1)",
};
const phiOkBox: React.CSSProperties = {
  display: "flex", gap: 10, alignItems: "flex-start",
  padding: "10px 12px", marginTop: 10,
  background: "#10B98115", border: "1px solid #10B98140", borderRadius: 8,
  fontSize: 13, color: "var(--text-1)",
};
const errBox: React.CSSProperties = {
  padding: "10px 12px", marginTop: 10,
  background: "#ef444415", border: "1px solid #ef444440", borderRadius: 8,
  fontSize: 13, color: "#fca5a5",
};
const tagChip: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: 11,
  background: "var(--bg-2)",
  border: "1px solid var(--border-mid)",
  color: "var(--text-2)",
  borderRadius: 999,
};
