"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { useUser } from "@/hooks/useUser";
import { useCases } from "@/hooks/useCases";
import { useMilestones } from "@/hooks/useMilestones";
import { useStats } from "@/hooks/useStats";
import { formatMilestone } from "@/lib/milestones";
import { SPECIALTIES } from "@/lib/constants";
import { trainingYearLabelFor, suggestedPgyFromStart } from "@/lib/training-year";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsStrip } from "@/components/profile/StatsStrip";
import { ProfileTabs, type ProfileTab } from "@/components/profile/ProfileTabs";
import { PortfolioTab } from "@/components/profile/PortfolioTab";
import { PostsTab } from "@/components/profile/PostsTab";
import type { PublicProfile, Pearl, PortfolioCase, PostType } from "@/lib/types";

const PGY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const FIELD_LABEL_STYLE: CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-2)", marginBottom: 4,
};

/**
 * Downscale + re-encode an uploaded photo client-side before it ever hits
 * the network: max 640px on the long edge, JPEG quality 0.86. This keeps
 * full-resolution iPhone photos from timing out slow connections, and
 * transparently converts HEIC to JPEG on browsers that can decode it
 * (Safari can; some Chromium builds can't — those throw here and the
 * caller shows an inline "format not supported" message instead of
 * silently failing).
 */
async function downscaleImage(file: File, maxDim = 640, quality = 0.86): Promise<Blob> {
  let width: number;
  let height: number;
  let drawSource: CanvasImageSource;
  let cleanup: (() => void) | undefined;

  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new Error("UNSUPPORTED_FORMAT");
    }
    width = bitmap.width;
    height = bitmap.height;
    drawSource = bitmap;
    cleanup = () => bitmap.close();
  } else {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("UNSUPPORTED_FORMAT"));
        el.src = objectUrl;
      });
      width = img.naturalWidth;
      height = img.naturalHeight;
      drawSource = img;
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      throw err;
    }
    cleanup = () => URL.revokeObjectURL(objectUrl);
  }

  const scale = Math.min(1, maxDim / Math.max(width, height, 1));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    cleanup?.();
    throw new Error("CANVAS_UNSUPPORTED");
  }
  ctx.drawImage(drawSource, 0, 0, targetW, targetH);
  cleanup?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("ENCODE_FAILED");
  return blob;
}

export default function ProfilePage() {
  const { user, profile, updateProfile, updateUser } = useUser();
  const { cases } = useCases();
  const { milestones } = useMilestones();
  const { stats } = useStats(cases);

  const [activeTab, setActiveTab] = useState<ProfileTab>("portfolio");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState<PortfolioCase[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  // Pearls state
  const [pearls, setPearls] = useState<Pearl[]>([]);
  const [pearlsLoading, setPearlsLoading] = useState(true);

  // Follow counts
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<{
    name: string;
    bio: string;
    specialty: string;
    subspecialty: string;
    institution: string;
    city: string;
    pgyYear: number | null;
    publicProfile: boolean;
  }>({
    name: user?.name || "",
    bio: (profile?.bio as string) || "",
    specialty: profile?.specialty || "Urology",
    subspecialty: (profile?.subspecialty as string) || "",
    institution: (profile?.institution as string) || "",
    city: (profile?.city as string) || "",
    pgyYear: profile?.pgyYear ?? null,
    publicProfile: profile?.publicProfile || false,
  });

  // The Profile type doesn't carry residencyStartDate (it's a newer Prisma
  // column not yet reflected in shared/types), so read it defensively off
  // the raw profile object instead of editing the shared type.
  const residencyStartDate =
    (profile as unknown as { residencyStartDate?: string | Date | null } | null)
      ?.residencyStartDate ?? null;
  const suggestedPgy = suggestedPgyFromStart(residencyStartDate);

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/profile/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFollowerCount(data.followerCount || 0);
        setFollowingCount(data.followingCount || 0);
        setProfileImage(data.image || null);
      }
    } catch { /* ignore */ }
  }, [user?.id]);

  // Fetch portfolio
  const fetchPortfolio = useCallback(async () => {
    if (!user?.id) return;
    setPortfolioLoading(true);
    try {
      const res = await fetch(`/api/portfolio?userId=${user.id}`);
      if (res.ok) setPortfolioItems(await res.json());
    } catch { /* ignore */ }
    setPortfolioLoading(false);
  }, [user?.id]);

  // Fetch pearls
  const fetchPearls = useCallback(async () => {
    if (!user?.id) return;
    setPearlsLoading(true);
    try {
      const res = await fetch(`/api/pearls?authorId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPearls(data.items || []);
      }
    } catch { /* ignore */ }
    setPearlsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchProfileData();
    fetchPortfolio();
    fetchPearls();
  }, [fetchProfileData, fetchPortfolio, fetchPearls]);

  // Sync edit form when profile loads
  useEffect(() => {
    if (user && profile) {
      setEditForm({
        name: user.name || "",
        bio: (profile.bio as string) || "",
        specialty: profile.specialty || "Urology",
        subspecialty: (profile.subspecialty as string) || "",
        institution: (profile.institution as string) || "",
        city: (profile.city as string) || "",
        pgyYear: profile.pgyYear ?? null,
        publicProfile: profile.publicProfile || false,
      });
    }
  }, [user, profile]);

  const avgORTime = cases.length > 0
    ? Math.round(cases.filter((c) => c.operativeDurationMinutes).reduce((s, c) => s + (c.operativeDurationMinutes || 0), 0) /
        Math.max(cases.filter((c) => c.operativeDurationMinutes).length, 1))
    : 0;

  // Calculate streak
  let streak = 0;
  if (cases.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [...new Set(cases.map((c) => {
      const d = new Date(c.caseDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a);
    const diff = Math.floor((today.getTime() - dates[0]) / 86400000);
    if (diff <= 1) {
      streak = 1;
      for (let i = 1; i < dates.length; i++) {
        const gap = Math.floor((dates[i - 1] - dates[i]) / 86400000);
        if (gap <= 1) streak++;
        else break;
      }
    }
  }

  const handleSave = async () => {
    setSaving(true);
    // Send both fields so the visible training-year label always matches
    // the PGY the user just picked — the server derives the same label if
    // trainingYearLabel is omitted, but computing it here keeps the client
    // state and the saved record in step immediately, before the round trip.
    const trainingYearLabel = trainingYearLabelFor(profile?.roleType, editForm.pgyYear);
    await updateProfile({ ...editForm, trainingYearLabel });
    setSaving(false);
    setEditing(false);
  };

  // Portfolio handlers
  const handleAddPortfolio = async (data: { caseLogId: string; title: string; description: string; isFeatured: boolean; isMilestone: boolean }) => {
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) fetchPortfolio();
    } catch { /* ignore */ }
  };

  const handleRemovePortfolio = async (id: string) => {
    try {
      await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
      setPortfolioItems((prev) => prev.filter((p) => p.id !== id));
    } catch { /* ignore */ }
  };

  // Post handlers
  const handleCreatePearl = async (data: {
    procedureName: string;
    category: string;
    title: string;
    content: string;
    tags: string[];
    postType: PostType;
    imageUrl?: string;
    linkUrl?: string;
    linkedCaseId?: string;
  }) => {
    try {
      const res = await fetch("/api/pearls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) fetchPearls();
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

  // Photo upload handler — downscales client-side first so a full-res
  // iPhone photo never has to cross the network at full size, then falls
  // back to the original file if downscaling itself fails for a reason
  // other than an unsupported format (the server has its own 5 MB cap and
  // type check as a backstop either way).
  const handlePhotoUpload = async (file: File) => {
    setPhotoError(null);

    let uploadBlob: Blob = file;
    try {
      uploadBlob = await downscaleImage(file);
    } catch (err) {
      if (err instanceof Error && err.message === "UNSUPPORTED_FORMAT") {
        setPhotoError(
          "This photo format is not supported. On iPhone, open the photo, tap Share, then Save as JPEG, or take a screenshot of it."
        );
        return;
      }
      // Canvas/encode failure unrelated to format — let the server try the
      // original bytes rather than blocking the upload entirely.
      uploadBlob = file;
    }

    const formData = new FormData();
    formData.append("file", uploadBlob, "avatar.jpg");
    try {
      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { image } = await res.json();
        setProfileImage(image);
        updateUser({ image });
      } else {
        const { error } = await res.json().catch(() => ({ error: "Upload failed" }));
        setPhotoError(error || "Failed to upload photo.");
      }
    } catch {
      setPhotoError("Failed to upload photo. Please check your connection and try again.");
    }
  };

  // Photo remove handler
  const handlePhotoRemove = async () => {
    setPhotoError(null);
    try {
      const res = await fetch("/api/profile/photo", { method: "DELETE" });
      if (res.ok) {
        setProfileImage(null);
        updateUser({ image: null });
      } else {
        setPhotoError("Failed to remove photo. Please try again.");
      }
    } catch {
      setPhotoError("Failed to remove photo. Please try again.");
    }
  };

  // Build profile object for header
  const profileData: PublicProfile = {
    id: user?.id || "",
    name: user?.name || null,
    image: profileImage,
    profile: profile ? {
      roleType: profile.roleType,
      specialty: profile.specialty,
      subspecialty: profile.subspecialty as string | null,
      institution: profile.institution as string | null,
      city: profile.city as string | null,
      pgyYear: profile.pgyYear,
      trainingYearLabel: profile.trainingYearLabel,
      bio: profile.bio as string | null,
      publicProfile: profile.publicProfile,
    } : null,
    stats: {
      totalCases: stats?.total || 0,
      streak,
      avgORMinutes: avgORTime,
      independentRate: Math.round(stats?.independentRate || 0),
      topProcedures: [],
    },
    followerCount,
    followingCount,
    isFollowing: false,
    isOwnProfile: true,
  };

  const topProcedures = Object.entries(stats?.byProcedure || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxCount = topProcedures[0]?.[1] ?? 1;

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      {/* Profile Header */}
      <ProfileHeader
        profile={profileData}
        onEdit={() => setEditing(!editing)}
        onPhotoUpload={handlePhotoUpload}
        onPhotoRemove={handlePhotoRemove}
      />

      {/* Photo error bar — never alert(), always dismissible inline */}
      {photoError && (
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
          padding: "10px 12px", marginBottom: 16,
          background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--rs)", fontSize: 12, color: "#ef4444", lineHeight: 1.4,
        }}>
          <span style={{ flex: 1 }}>{photoError}</span>
          <button
            onClick={() => setPhotoError(null)}
            aria-label="Dismiss"
            style={{
              background: "none", border: "none", color: "#ef4444", cursor: "pointer",
              fontSize: 14, fontWeight: 700, flexShrink: 0, padding: 0, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Edit Form */}
      {editing && (
        <div style={{
          paddingBottom: 16, marginBottom: 16,
          borderBottom: "1px solid var(--border)",
        }}>
          <label style={FIELD_LABEL_STYLE}>
            Your name
          </label>
          <input className="st-input" style={{ marginBottom: 4 }} type="text" value={editForm.name}
            autoComplete="name" autoCapitalize="words"
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
          <p style={{ fontSize: 11, color: "var(--text-3)", margin: "0 0 10px", lineHeight: 1.4 }}>
            No Dr. needed. Your dashboard greets you as Dr. {editForm.name.trim().split(" ").filter(Boolean).pop() || "Lastname"}.
          </p>
          <label style={FIELD_LABEL_STYLE}>Bio</label>
          <textarea className="st-input" style={{ marginBottom: 8, resize: "none", height: 56 }} value={editForm.bio}
            onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Short bio..." />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div>
              <label style={FIELD_LABEL_STYLE}>Specialty</label>
              <select className="st-input" value={editForm.specialty}
                onChange={(e) => setEditForm((f) => ({ ...f, specialty: e.target.value }))}>
                {SPECIALTIES.map((s) => <option key={s.slug} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={FIELD_LABEL_STYLE}>Subspecialty</label>
              <input className="st-input" type="text" value={editForm.subspecialty}
                onChange={(e) => setEditForm((f) => ({ ...f, subspecialty: e.target.value }))} placeholder="Subspecialty" />
            </div>
            <div>
              <label style={FIELD_LABEL_STYLE}>Institution</label>
              <input className="st-input" type="text" value={editForm.institution}
                onChange={(e) => setEditForm((f) => ({ ...f, institution: e.target.value }))} placeholder="Institution" />
            </div>
            <div>
              <label style={FIELD_LABEL_STYLE}>City</label>
              <input className="st-input" type="text" value={editForm.city}
                onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" />
            </div>
          </div>

          {/* Training year — a labelled select that actually changes the
              PGY-N label shown across the app, unlike the old bare number
              input which updated pgyYear but never the displayed label. */}
          <div style={{ marginBottom: 8 }}>
            <label style={FIELD_LABEL_STYLE}>Training year</label>
            <select
              className="st-input"
              value={editForm.pgyYear === null ? "" : String(editForm.pgyYear)}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  pgyYear: e.target.value === "" ? null : parseInt(e.target.value, 10),
                }))
              }
            >
              <option value="">Not applicable</option>
              {PGY_OPTIONS.map((n) => (
                <option key={n} value={n}>{`PGY-${n}`}</option>
              ))}
            </select>
            {suggestedPgy !== null && suggestedPgy !== editForm.pgyYear && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginTop: 6,
                fontSize: 11, color: "var(--text-3)",
              }}>
                <span>Your start date suggests PGY-{suggestedPgy}.</span>
                <button
                  type="button"
                  onClick={() => setEditForm((f) => ({ ...f, pgyYear: suggestedPgy }))}
                  style={{
                    padding: "2px 8px", background: "none",
                    border: "1px solid var(--border-mid)", color: "var(--primary)",
                    borderRadius: 6, fontSize: 11, cursor: "pointer",
                    fontFamily: "'Geist', sans-serif",
                  }}
                >
                  Use PGY-{suggestedPgy}
                </button>
              </div>
            )}
          </div>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--surface)", border: "1px solid var(--border-mid)",
            borderRadius: "var(--rs)", padding: "8px 10px", marginBottom: 8,
          }}>
            <span style={{ fontSize: 11, color: "var(--text-2)" }}>Public profile</span>
            <button
              onClick={() => setEditForm((f) => ({ ...f, publicProfile: !f.publicProfile }))}
              style={{
                width: 36, height: 18, borderRadius: 9, border: "none", cursor: "pointer",
                background: editForm.publicProfile ? "var(--primary)" : "var(--border-mid)",
                position: "relative", transition: "background .2s",
              }}
            >
              <span style={{
                position: "absolute", top: 2, width: 14, height: 14,
                background: "#fff", borderRadius: "50%",
                left: editForm.publicProfile ? 19 : 2,
                transition: "left .2s",
              }} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: "8px 16px", background: "var(--primary)", color: "#fff",
              border: "none", borderRadius: "var(--rs)", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Geist', sans-serif",
              transition: "opacity .15s", opacity: saving ? 0.6 : 1,
            }}>{saving ? "Saving..." : "Save"}</button>
            <button onClick={() => setEditing(false)} style={{
              padding: "8px 16px", background: "none",
              border: "1px solid var(--border)", color: "var(--text-3)",
              borderRadius: "var(--rs)", fontSize: 12,
              cursor: "pointer", fontFamily: "'Geist', sans-serif",
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Stats Strip */}
      <StatsStrip
        totalCases={stats?.total || 0}
        streak={streak}
        avgORMinutes={avgORTime}
        independentRate={Math.round(stats?.independentRate || 0)}
      />

      {/* Tabs */}
      <ProfileTabs
        active={activeTab}
        onChange={setActiveTab}
        portfolioCount={portfolioItems.length}
        pearlCount={pearls.length}
      />

      {/* Tab Content */}
      {activeTab === "portfolio" && (
        portfolioLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-3)", fontSize: 12 }}>Loading...</div>
        ) : (
          <PortfolioTab
            items={portfolioItems}
            isOwn
            cases={cases}
            onAdd={handleAddPortfolio}
            onRemove={handleRemovePortfolio}
          />
        )
      )}

      {activeTab === "posts" && (
        pearlsLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-3)", fontSize: 12 }}>Loading...</div>
        ) : (
          <PostsTab
            pearls={pearls}
            isOwn
            onLike={handleLikePearl}
            onSave={handleSavePearl}
            onCreate={handleCreatePearl}
            cases={cases}
          />
        )
      )}

      {activeTab === "about" && (
        <div>
          {/* Top Procedures */}
          {topProcedures.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12,
              }}>Top Procedures</div>
              {topProcedures.map(([name, count], i) => (
                <div key={name} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "8px 0",
                  borderBottom: i < topProcedures.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                    fontFamily: "'Geist Mono', monospace", width: 16, flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: 500, color: "var(--text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{name}</span>
                  <div style={{ width: 48, height: 2, background: "var(--border-mid)", borderRadius: 1, flexShrink: 0 }}>
                    <div style={{
                      height: "100%", width: `${Math.round(((count as number) / (maxCount as number)) * 100)}%`,
                      background: "var(--primary)", borderRadius: 1,
                    }} />
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: "var(--text-2)",
                    fontFamily: "'Geist Mono', monospace", minWidth: 20, textAlign: "right",
                  }}>{count}</span>
                </div>
              ))}
            </section>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <section>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text-3)",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12,
              }}>Milestones</div>
              {milestones.map((m, i) => {
                const formatted = formatMilestone(m);
                return (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "9px 0",
                    borderBottom: i < milestones.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 5,
                      background: "var(--surface2)", border: "1px solid var(--border-mid)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: "var(--text)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{formatted.title}</div>
                      <div style={{
                        fontSize: 10, color: "var(--text-3)",
                        fontFamily: "'Geist Mono', monospace",
                      }}>
                        {new Date(m.achievedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
