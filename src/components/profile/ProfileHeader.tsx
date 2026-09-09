"use client";

import { useRef, useState } from "react";
import { Camera, Pencil } from "lucide-react";
import type { PublicProfile } from "@/lib/types";

interface Props {
  profile: PublicProfile;
  onEdit?: () => void;
  onFollowToggle?: () => void;
  onShowFollowers?: () => void;
  onShowFollowing?: () => void;
  onPhotoUpload?: (file: File) => Promise<void>;
  onPhotoRemove?: () => Promise<void>;
}

export function ProfileHeader({
  profile, onEdit, onFollowToggle, onShowFollowers, onShowFollowing, onPhotoUpload, onPhotoRemove,
}: Props) {
  const initials = profile.name
    ? profile.name.replace("Dr. ", "").trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "DR";

  const p = profile.profile;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onPhotoUpload) return;
    setUploading(true);
    try {
      await onPhotoUpload(file);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveClick = async () => {
    if (!onPhotoRemove || removing) return;
    setRemoving(true);
    try {
      await onPhotoRemove();
    } finally {
      setRemoving(false);
    }
  };

  const canEditPhoto = profile.isOwnProfile && !!onPhotoUpload;

  const avatarContent = profile.image ? (
    <img
      src={profile.image}
      alt=""
      style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", display: "block" }}
    />
  ) : (
    <div style={{
      width: 64, height: 64, borderRadius: 16,
      background: "linear-gradient(135deg, var(--primary), var(--primary-lo))",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20, fontWeight: 700, color: "#fff",
      fontFamily: "'Geist', sans-serif",
    }}>
      {initials}
    </div>
  );

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Avatar + name row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        {/* Avatar column: the whole avatar is tappable on your own profile,
            not just the tiny camera badge, since users reported not being
            able to find how to add a photo. */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            {canEditPhoto ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label={profile.image ? "Change your photo" : "Add a photo"}
                title={profile.image ? "Change your photo" : "Add a photo"}
                style={{
                  width: 64, height: 64, borderRadius: 16, padding: 0, border: "none",
                  background: "none", cursor: uploading ? "wait" : "pointer",
                  position: "relative", overflow: "hidden", display: "block",
                }}
              >
                {avatarContent}
                {uploading && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(0,0,0,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: 18, height: 18,
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff", borderRadius: "50%",
                      animation: "spin .6s linear infinite",
                    }} />
                  </div>
                )}
              </button>
            ) : (
              avatarContent
            )}

            {/* Camera badge — visible affordance layered on top of the
                tappable avatar; clicking it opens the same file picker. */}
            {canEditPhoto && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  tabIndex={-1}
                  aria-hidden="true"
                  style={{
                    position: "absolute", bottom: -4, right: -4,
                    width: 24, height: 24, borderRadius: 8,
                    background: "var(--surface2)", border: "1.5px solid var(--border-mid)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: uploading ? "wait" : "pointer",
                    transition: "all .15s",
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  <Camera size={12} color="var(--text-2)" />
                </button>
              </>
            )}
          </div>

          {/* Remove photo — only shown once there's a photo to remove */}
          {canEditPhoto && profile.image && onPhotoRemove && (
            <button
              type="button"
              onClick={handleRemoveClick}
              disabled={removing}
              style={{
                background: "none", border: "none", padding: 0,
                fontSize: 10, color: "var(--text-3)", cursor: removing ? "wait" : "pointer",
                fontFamily: "'Geist', sans-serif", textDecoration: "underline",
                opacity: removing ? 0.6 : 1,
              }}
            >
              {removing ? "Removing..." : "Remove photo"}
            </button>
          )}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* On your own profile the name itself is tappable and opens the
              edit form, so changing it doesn't depend on finding the button. */}
          {profile.isOwnProfile && onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Change your name"
              title="Change your name"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "none", border: "none", padding: 0, marginBottom: 3,
                fontSize: 18, fontWeight: 700, color: "var(--text)",
                letterSpacing: "-0.3px", cursor: "pointer", textAlign: "left",
                fontFamily: "'Geist', sans-serif", maxWidth: "100%",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile.name || "Add your name"}
              </span>
              <Pencil size={13} color="var(--text-3)" style={{ flexShrink: 0 }} />
            </button>
          ) : (
            <div style={{
              fontSize: 18, fontWeight: 700, color: "var(--text)",
              letterSpacing: "-0.3px", marginBottom: 3,
            }}>
              {profile.name || "Surgeon"}
            </div>
          )}
          {p && (
            <>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 2 }}>
                {p.trainingYearLabel}{p.specialty ? ` · ${p.specialty}` : ""}
                {p.subspecialty ? ` (${p.subspecialty})` : ""}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                {p.institution}{p.city ? ` · ${p.city}` : ""}
              </div>
            </>
          )}
        </div>

        {/* Action button */}
        {profile.isOwnProfile ? (
          <button
            onClick={onEdit}
            style={{
              padding: "6px 14px",
              background: "none",
              border: "1px solid var(--border-mid)",
              color: "var(--text-2)",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Geist', sans-serif",
              transition: "all .15s",
              flexShrink: 0,
            }}
          >
            Edit profile
          </button>
        ) : (
          <button
            onClick={onFollowToggle}
            style={{
              padding: "6px 16px",
              background: profile.isFollowing ? "none" : "var(--primary)",
              border: profile.isFollowing ? "1px solid var(--border-mid)" : "1px solid var(--primary)",
              color: profile.isFollowing ? "var(--text-2)" : "#fff",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Geist', sans-serif",
              transition: "all .15s",
              flexShrink: 0,
            }}
          >
            {profile.isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Bio */}
      {p?.bio && (
        <div style={{
          fontSize: 13, color: "var(--text-2)",
          lineHeight: 1.5, marginBottom: 14,
        }}>
          {p.bio}
        </div>
      )}

      {/* Follower / Following counts */}
      <div style={{ display: "flex", gap: 16 }}>
        <button
          onClick={onShowFollowers}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 0, fontFamily: "'Geist', sans-serif",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
            {profile.followerCount}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>followers</span>
        </button>
        <button
          onClick={onShowFollowing}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 0, fontFamily: "'Geist', sans-serif",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
            {profile.followingCount}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>following</span>
        </button>
      </div>
    </div>
  );
}
