"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Flame, ArrowUpRight, Settings, Sparkles, RotateCcw } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import { useCases } from "@/hooks/useCases";
import { useMilestones } from "@/hooks/useMilestones";
import { getStreak } from "@/lib/milestones";
import { getLearningCurveData, getWeeklyHeatmapData } from "@/lib/stats";
import { LearningCurveChart } from "@/components/charts/LearningCurveChart";
import { VolumeHeatmap } from "@/components/charts/VolumeHeatmap";
import { BADGE_KEYS } from "@/lib/constants";
import { TodaysPrinciple } from "@/components/TodaysPrinciple";
import { BriefMeSheet } from "@/components/BriefMeSheet";
import { ScheduleSection } from "@/components/ScheduleSection";
import { DebriefSheet } from "@/components/DebriefSheet";
import { StaffDashboard } from "@/components/staff/StaffDashboard";

// Role types that see the staff/attending dashboard instead of the trainee one.
const STAFF_ROLES = new Set(["STAFF", "ATTENDING", "PROGRAM_DIRECTOR"]);

function approachColor(approach: string): string {
  const m: Record<string, string> = {
    ROBOTIC: "#0EA5E9", LAPAROSCOPIC: "#38BDF8", OPEN: "#F59E0B",
    ENDOSCOPIC: "#64748B", HYBRID: "#10B981", PERCUTANEOUS: "#F97316",
  };
  return m[approach] ?? "#334155";
}

export default function DashboardPage() {
  useSubscription();
  const { user, profile } = useAuth();
  const { cases } = useCases();
  const { milestones } = useMilestones();
  const now = new Date();

  // Pre-Op Brief sheet — triggered from the "Brief me" CTA below the
  // metric row. Closed by default; the sheet handles its own state.
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefPrefill, setBriefPrefill] = useState<string | undefined>();

  // Debrief sheet — triggered from schedule cards whose time has passed.
  const [debriefCase, setDebriefCase] = useState<{
    id: string;
    procedureName: string;
    caseDate: string;
  } | null>(null);

  // Returned-EPA alert — residents need prompt visibility of attending feedback.
  const [returnedCount, setReturnedCount] = useState<number>(0);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/epa/observations?status=RETURNED", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then((d: unknown) => {
        if (!cancelled && Array.isArray(d)) setReturnedCount(d.length);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const thisMonth = cases.filter(c => {
    const d = new Date(c.caseDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const durations = cases.filter(c => (c.operativeDurationMinutes ?? 0) > 0).map(c => c.operativeDurationMinutes as number);
  const avgOR = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const firstSurgeonCount = cases.filter(c =>
    c.role === "Primary Surgeon" || c.role === "Console Surgeon" || c.role === "First Surgeon"
  ).length;
  const firstSurgeonRate = cases.length > 0 ? Math.round((firstSurgeonCount / cases.length) * 100) : 0;

  const streakInfo = getStreak(cases ?? []);
  const heatmapData = getWeeklyHeatmapData(cases ?? []);

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.caseDate).getTime() - new Date(a.caseDate).getTime())
    .slice(0, 5);

  const procedureCount: Record<string, number> = {};
  cases.forEach(c => { procedureCount[c.procedureName] = (procedureCount[c.procedureName] || 0) + 1; });
  const topProcs = Object.entries(procedureCount).sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxCount = topProcs[0]?.[1] ?? 1;
  const topProcName = topProcs[0]?.[0] ?? "";
  const learningCurve = topProcName ? getLearningCurveData(cases ?? [], topProcName) : [];

  const firstName = user?.name?.split(" ")[0] ?? "Surgeon";

  // Staff / attending / PD get a different home — personal cases + teaching load.
  if (profile?.roleType && STAFF_ROLES.has(profile.roleType)) {
    return <StaffDashboard />;
  }

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>

      {/* Returned-EPA alert banner */}
      {returnedCount > 0 && (
        <Link
          href="/analytics?tab=EPAs"
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", marginBottom: 16,
            background: "#ef444410",
            border: "1px solid #ef444430",
            borderRadius: 10,
            textDecoration: "none",
            color: "var(--text-1)",
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#ef444420",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#ef4444", flexShrink: 0,
          }}>
            <RotateCcw size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
              {returnedCount === 1
                ? "1 EPA was returned for revision"
                : `${returnedCount} EPAs were returned for revision`}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              Your attending left feedback. Tap to review and resubmit.
            </div>
          </div>
          <ChevronRight size={16} style={{ color: "var(--text-3)", flexShrink: 0 }} />
        </Link>
      )}

      {/* ── Identity + Primary Metric ─────────────────────────────────── */}
      <div style={{
        marginBottom: 36,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 11,
            color: "var(--text-3)",
            marginBottom: 8,
            letterSpacing: ".04em",
            fontFamily: "'Geist', sans-serif",
          }}>
            {profile?.specialty}
            {profile?.trainingYearLabel && ` \u00b7 ${profile.trainingYearLabel}`}
          </div>
          <div style={{
            fontSize: 32,
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-1.5px",
            lineHeight: 1,
            fontFamily: "'Geist', sans-serif",
          }}>
            Dr. {firstName}
          </div>
        </div>

        {/* Quick access to Settings — mirrors the typographic scale of the
            rest of the dashboard (subtle, square, border-only). */}
        <Link
          href="/settings"
          aria-label="Settings"
          title="Settings"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-2)",
            textDecoration: "none",
            flexShrink: 0,
            transition: "background .15s, color .15s, border-color .15s",
          }}
        >
          <Settings size={16} strokeWidth={1.75} />
        </Link>
      </div>

      {/* ── Principle ─────────────────────────────────────────────────── */}
      <TodaysPrinciple />

      {/* ── Thin divider ──────────────────────────────────────────────── */}
      <div style={{
        height: 1,
        background: "var(--border)",
        margin: "28px 0",
      }} />

      {/* ── Hero number — left-aligned, massive, mono ─────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{
          fontSize: 64,
          fontWeight: 800,
          color: "var(--text)",
          letterSpacing: "-3px",
          lineHeight: .85,
          fontFamily: "'Geist Mono', monospace",
        }}>
          {cases.length}
        </div>
        <div style={{
          fontSize: 10,
          color: "var(--text-3)",
          marginTop: 8,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          fontWeight: 500,
        }}>
          Total Cases Logged
        </div>
      </div>

      {/* ── Metrics row — monospace numbers, no boxes ─────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: 0,
        padding: "20px 0",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        marginBottom: 28,
      }}>
        {[
          { n: String(thisMonth), l: "This mo" },
          { n: avgOR ? `${avgOR}m` : "\u2014", l: "Avg OR" },
          { n: `${firstSurgeonRate}%`, l: "Primary" },
          { n: String(streakInfo.currentStreak), l: "Streak", icon: streakInfo.currentStreak > 0 },
        ].map((s, i) => (
          <div key={i} style={{
            paddingLeft: i > 0 ? 16 : 0,
            borderLeft: i > 0 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{
              display: "flex", alignItems: "baseline", gap: 3,
            }}>
              <span style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text)",
                fontFamily: "'Geist Mono', monospace",
                letterSpacing: "-0.5px",
                lineHeight: 1,
              }}>
                {s.n}
              </span>
              {s.icon && <Flame size={11} color="var(--warning)" />}
            </div>
            <div style={{
              fontSize: 9,
              color: "var(--text-3)",
              marginTop: 4,
              textTransform: "uppercase",
              letterSpacing: ".8px",
              fontWeight: 500,
            }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* ── Pre-Op Brief CTA ──────────────────────────────────────────────
          Single-tap entry point for the "Brief me for tomorrow" flow. Kept
          as a full-width row so it reads as an action, not a tile, and
          matches the dashboard's border-only aesthetic. */}
      <button
        onClick={() => {
          setBriefPrefill(undefined);
          setBriefOpen(true);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          width: "100%",
          padding: "14px 16px",
          marginBottom: 28,
          background:
            "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.08))",
          border: "1px solid rgba(168,85,247,0.28)",
          borderRadius: 10,
          color: "var(--text)",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          transition: "background .15s, border-color .15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(168,85,247,0.16)",
              border: "1px solid rgba(168,85,247,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles size={14} style={{ color: "#c4b5fd" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              Brief me for tomorrow
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Personalized prep from your case history
            </div>
          </div>
        </div>
        <ChevronRight
          size={14}
          style={{ color: "var(--text-3)", flexShrink: 0 }}
        />
      </button>

      {/* ── This Week (scheduled cases) ──────────────────────────────── */}
      <ScheduleSection
        onBrief={(procedure, attending, when) => {
          const parts = [procedure];
          if (when) parts.push(when);
          if (attending) parts.push(`with ${attending}`);
          setBriefPrefill(parts.join(" "));
          setBriefOpen(true);
        }}
        onDebrief={(sc) => {
          // ScheduledCase doesn't have a CaseLog yet — create a placeholder
          // that DebriefSheet can use. The actual CaseLog creation happens
          // elsewhere; for now we just want to be able to open the sheet.
          setDebriefCase({
            id: sc.caseLogId ?? sc.id,
            procedureName: sc.procedureName,
            caseDate: sc.scheduledAt,
          });
        }}
      />

      {/* ── Activity ──────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: "var(--text-3)",
          textTransform: "uppercase", letterSpacing: "1px",
          marginBottom: 12,
        }}>Activity</div>
        <VolumeHeatmap data={heatmapData} />
      </section>

      {/* ── Top procedures ────────────────────────────────────────────── */}
      {topProcs.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "var(--text-3)",
            textTransform: "uppercase", letterSpacing: "1px",
            marginBottom: 14,
          }}>Top Procedures</div>
          {topProcs.map(([name, count], i) => (
            <div key={name} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 0",
              borderBottom: i < topProcs.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-3)",
                fontFamily: "'Geist Mono', monospace",
                width: 16,
                flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{
                flex: 1, fontSize: 13, fontWeight: 500,
                color: "var(--text)", minWidth: 0,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{name}</span>
              <div style={{ width: 60, height: 2, background: "var(--border-mid)", borderRadius: 1, flexShrink: 0 }}>
                <div style={{
                  height: "100%",
                  width: `${Math.round((count / maxCount) * 100)}%`,
                  background: "var(--primary)",
                  borderRadius: 1,
                  transition: "width .5s cubic-bezier(.16,1,.3,1)",
                }} />
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: "var(--text-2)",
                fontFamily: "'Geist Mono', monospace",
                minWidth: 20, textAlign: "right",
              }}>{count}</span>
            </div>
          ))}
        </section>
      )}

      {/* ── Learning curve ────────────────────────────────────────────── */}
      {learningCurve.length >= 3 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "var(--text-3)",
            textTransform: "uppercase", letterSpacing: "1px",
            marginBottom: 14,
          }}>Learning Curve — {topProcName}</div>
          <LearningCurveChart data={learningCurve} height={120} procedureName={topProcName} />
        </section>
      )}

      {/* ── Recent cases ──────────────────────────────────────────────── */}
      <section>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 600, color: "var(--text-3)",
            textTransform: "uppercase", letterSpacing: "1px",
          }}>Recent</span>
          <Link href="/cases" style={{
            fontSize: 11, color: "var(--text-3)", textDecoration: "none",
            display: "flex", alignItems: "center", gap: 2,
            transition: "color .15s",
          }}>
            All <ArrowUpRight size={10} />
          </Link>
        </div>

        {recentCases.length === 0 ? (
          <div style={{
            padding: "48px 0",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)", marginBottom: 4 }}>
              No cases yet
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>
              Tap Log to record your first procedure
            </div>
          </div>
        ) : recentCases.map((c, i) => (
          <div key={c.id} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "10px 0",
            borderBottom: i < recentCases.length - 1 ? "1px solid var(--border)" : "none",
            animation: `fadeIn .3s cubic-bezier(.16,1,.3,1) ${i * 50}ms both`,
          }}>
            <div style={{ paddingTop: 5, flexShrink: 0 }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%",
                background: approachColor(c.surgicalApproach),
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{
                  fontSize: 13, fontWeight: 500, color: "var(--text)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  marginRight: 8,
                }}>{c.procedureName}</span>
                <span style={{
                  fontSize: 11, color: "var(--text-3)",
                  fontFamily: "'Geist Mono', monospace",
                  flexShrink: 0,
                }}>
                  {new Date(c.caseDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div style={{
                display: "flex", gap: 6, marginTop: 2,
                fontSize: 11, color: "var(--text-3)",
              }}>
                <span>{c.role}</span>
                {c.operativeDurationMinutes && (
                  <>
                    <span style={{ color: "var(--muted)" }}>&middot;</span>
                    <span style={{ fontFamily: "'Geist Mono', monospace" }}>{c.operativeDurationMinutes}m</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Milestones ────────────────────────────────────────────────── */}
      {milestones.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <div style={{
            height: 1, background: "var(--border)", marginBottom: 20,
          }} />
          <div style={{
            fontSize: 10, fontWeight: 600, color: "var(--text-3)",
            textTransform: "uppercase", letterSpacing: "1px",
            marginBottom: 14,
          }}>Milestones</div>
          {milestones.slice(0, 3).map((m, i) => {
            const badge = BADGE_KEYS[m.badgeKey] ?? { label: m.badgeKey, color: "#0EA5E9" };
            return (
              <div key={m.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 0",
                borderBottom: i < 2 && i < milestones.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: "var(--surface2)",
                  border: "1px solid var(--border-mid)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: badge.color ?? "var(--primary)",
                  }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                    {badge.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                    {m.procedureName ?? m.type?.replace(/_/g, " ")}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Pre-Op Brief sheet — rendered at the end so it overlays everything. */}
      <BriefMeSheet
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
        prefill={briefPrefill}
      />

      {/* Post-Op Debrief sheet — triggered from scheduled case cards. */}
      <DebriefSheet
        open={debriefCase !== null}
        caseLog={debriefCase}
        onClose={() => setDebriefCase(null)}
      />
    </div>
  );
}
