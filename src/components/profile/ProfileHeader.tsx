"use client";

import { Camera } from "lucide-react";
import type { PublicProfile } from "@/lib/types";

interface Props {
  profile: PublicProfile;
  onEdit?: () => void;
  onFollowToggle?: () => void;
  onShowFollowers?: () => void;
  onShowFollowing?: () => void;
}

export function ProfileHeader({ profile, onEdit, onFollowToggle, onShowFollowers, onShowFollowing }: Props) {
  const initials = profile.name
    ? profile.name.replace("Dr. ", "").trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "DR";

  const p = profile.profile;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Avatar + name row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {profile.image ? (
            <img
              src={profile.image}
              alt=""
              style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover" }}
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
          )}
          {profile.isOwnProfile && (
            <div style={{
              position: "absolute", bottom: -3, right: -3,
              width: 22, height: 22, background: "var(--surface2)",
              border: "1px solid var(--border-mid)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>
              <Camera size={10} color="var(--text-2)" />
            </div>
          )}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 18, fontWeight: 700, color: "var(--text)",
            letterSpacing: "-0.3px", marginBottom: 3,
          }}>
            {profile.name || "Surgeon"}
          </div>
          {p && (
            <>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 2 }}>
                {p.trainingYearLabel}{p.specialty ? ` \u00b7 ${p.specialty}` : ""}
                {p.subspecialty ? ` (${p.subspecialty})` : ""}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                {p.institution}{p.city ? ` \u00b7 ${p.city}` : ""}
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
            Edit
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
