"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useCases } from "@/hooks/useCases";
import { useMilestones } from "@/hooks/useMilestones";
import { useStats } from "@/hooks/useStats";
import { formatMilestone } from "@/lib/milestones";
import { SPECIALTIES } from "@/lib/constants";
import { Camera, Edit2, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, updateProfile } = useUser();
  const { cases } = useCases();
  const { milestones } = useMilestones();
  const { stats } = useStats(cases);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    bio: (profile?.bio as string) || "",
    specialty: profile?.specialty || "Urology",
    subspecialty: (profile?.subspecialty as string) || "",
    institution: (profile?.institution as string) || "",
    city: (profile?.city as string) || "",
    pgyYear: profile?.pgyYear || 1,
    publicProfile: profile?.publicProfile || false,
  });

  const topProcedures = Object.entries(stats?.byProcedure || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const avgORTime = cases.length > 0
    ? Math.round(cases.filter(c => c.operativeDurationMinutes).reduce((s, c) => s + (c.operativeDurationMinutes || 0), 0) /
        Math.max(cases.filter(c => c.operativeDurationMinutes).length, 1))
    : 0;

  const handleSave = async () => {
    setSaving(true);
    await updateProfile(editForm);
    setSaving(false);
    setEditing(false);
  };

  const initials = user?.name
    ? user.name.replace("Dr. ", "").trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "DR";

  const isPublic = profile?.publicProfile;
  const maxCount = topProcedures[0]?.[1] ?? 1;

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 24,
      }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-.4px" }}>Profile</span>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 12px",
            background: "none", border: "1px solid var(--border)",
            color: "var(--text-3)", borderRadius: 5,
            fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Geist', sans-serif",
            transition: "all .15s",
          }}
        >
          <Edit2 size={11} />
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {/* Identity */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 16,
        paddingBottom: 20,
        borderBottom: "1px solid var(--border)",
        marginBottom: 20,
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: "#fff",
            fontFamily: "'Geist', sans-serif",
          }}>
            {initials}
          </div>
          {editing && (
            <div style={{
              position: "absolute", bottom: -4, right: -4,
              width: 20, height: 20, background: "var(--surface2)",
              border: "1px solid var(--border-mid)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Camera size={10} color="var(--text-2)" />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {!editing ? (
            <>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                {user?.name || "Dr. Surgeon"}
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, padding: "2px 7px", borderRadius: 3,
                background: isPublic ? "rgba(16,185,129,0.08)" : "var(--surface2)",
                color: isPublic ? "var(--success)" : "var(--text-3)",
                border: `1px solid ${isPublic ? "rgba(16,185,129,0.12)" : "var(--border)"}`,
                marginBottom: 6,
              }}>
                {isPublic ? <Eye size={9} /> : <EyeOff size={9} />}
                {isPublic ? "Public" : "Private"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 1 }}>
                {profile?.trainingYearLabel} &middot; {profile?.specialty}
                {profile?.subspecialty ? ` (${profile.subspecialty as string})` : ""}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                {profile?.institution as string}{profile?.city ? ` \u00b7 ${profile.city as string}` : ""}
              </div>
              {profile?.bio && (
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 8, lineHeight: 1.5 }}>
                  {profile.bio as string}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>Editing profile...</div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div style={{
          paddingBottom: 20, marginBottom: 20,
          borderBottom: "1px solid var(--border)",
        }}>
          <input className="st-input" style={{ marginBottom: 8 }} type="text" value={editForm.name}
            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          <textarea className="st-input" style={{ marginBottom: 8, resize: "none", height: 56 }} value={editForm.bio}
            onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Short bio..." />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <select className="st-input" value={editForm.specialty}
              onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))}>
              {SPECIALTIES.map(s => <option key={s.slug} value={s.name}>{s.name}</option>)}
            </select>
            <input className="st-input" type="text" value={editForm.subspecialty}
              onChange={e => setEditForm(f => ({ ...f, subspecialty: e.target.value }))} placeholder="Subspecialty" />
            <input className="st-input" type="text" value={editForm.institution}
              onChange={e => setEditForm(f => ({ ...f, institution: e.target.value }))} placeholder="Institution" />
            <input className="st-input" type="text" value={editForm.city}
              onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
            <input className="st-input" type="number" min={1} max={8} value={editForm.pgyYear}
              onChange={e => setEditForm(f => ({ ...f, pgyYear: parseInt(e.target.value) }))} />
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--surface)", border: "1px solid var(--border-mid)",
              borderRadius: "var(--rs)", padding: "8px 10px",
            }}>
              <span style={{ fontSize: 11, color: "var(--text-2)" }}>Public</span>
              <button
                onClick={() => setEditForm(f => ({ ...f, publicProfile: !f.publicProfile }))}
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

      {/* Stats — unboxed, monospace numbers */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: 0, padding: "16px 0",
        borderBottom: "1px solid var(--border)",
        marginBottom: 24,
      }}>
        {[
          { n: String(stats?.total || 0), l: "Cases" },
          { n: `${avgORTime}m`, l: "Avg OR" },
          { n: `${Math.round(stats?.independentRate || 0)}%`, l: "Indep." },
          { n: String(milestones.length), l: "Badges" },
        ].map((s, i) => (
          <div key={i} style={{
            paddingLeft: i > 0 ? 14 : 0,
            borderLeft: i > 0 ? "1px solid var(--border)" : "none",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 18, fontWeight: 700, color: "var(--text)",
              fontFamily: "'Geist Mono', monospace", letterSpacing: "-0.5px",
            }}>{s.n}</div>
            <div style={{
              fontSize: 9, color: "var(--text-3)", marginTop: 3,
              textTransform: "uppercase", letterSpacing: ".7px",
            }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Top Procedures — clean list */}
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

      {/* Milestones — clean list, no emoji */}
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
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--primary)",
                  }} />
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
  );
}
