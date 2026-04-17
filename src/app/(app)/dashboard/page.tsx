"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Flame, ArrowUpRight, Settings, Sparkles, RotateCcw, Share2, Inbox, LayoutDashboard, AlertTriangle } from "lucide-react";
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
import { PostComposer } from "@/components/social/PostComposer";
import { ProgramCalendar } from "@/components/ProgramCalendar";
import { ProgramInviteBanner } from "@/components/ProgramInviteBanner";

// Role types that see staff-specific modules (sign-offs, teaching load).
const STAFF_ROLES = new Set(["STAFF", "ATTENDING", "PROGRAM_DIRECTOR"]);

type StaffStats = {
  pendingSignOffs: number;
  signedThisMonth: number;
  signedYtd: number;
  recentSigned: {
    id: string;
    epaId: string;
    epaTitle: string;
    signedAt: string | null;
    entrustmentScore: number | null;
    residentName: string | null;
  }[];
};

type CohortResident = {
  userId: string;
  name: string | null;
  totalCases: number;
  casesThisWeek: number;
  casesThisMonth: number;
  epaTotal: number;
  epaSigned: number;
  epaPending: number;
  lastCaseDate: string | null;
};

type CohortData = {
  institution: string;
  residents: CohortResident[];
};

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

  const isStaff = !!(profile?.roleType && STAFF_ROLES.has(profile.roleType));
  const isPD = profile?.roleType === "PROGRAM_DIRECTOR";
  const isResident = !isStaff;

  // Pre-Op Brief sheet
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefPrefill, setBriefPrefill] = useState<string | undefined>();

  // Debrief sheet
  const [debriefCase, setDebriefCase] = useState<{
    id: string;
    procedureName: string;
    caseDate: string;
  } | null>(null);

  // PostComposer seeded from a recent case
  const [shareCaseId, setShareCaseId] = useState<string | null>(null);

  // ── Staff-specific data ────────────────────────────────────────────────
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  useEffect(() => {
    if (!isStaff) return;
    let cancelled = false;
    fetch("/api/staff/stats", { credentials: "include" })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d) setStaffStats(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isStaff]);

  // ── Staff-specific: cohort / program data ───────────────────────────
  const [cohortData, setCohortData] = useState<CohortData | null>(null);
  useEffect(() => {
    if (!isStaff) return;
    let cancelled = false;
    fetch("/api/pd/residents", { credentials: "include" })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d) setCohortData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isStaff]);

  // Cohort KPIs (computed client-side from roster data)
  const cohortKpis = (() => {
    if (!cohortData?.residents?.length) return null;
    const rs = cohortData.residents;
    const totalResidents = rs.length;
    const casesThisWeek = rs.reduce((s, r) => s + r.casesThisWeek, 0);
    const epasPending = rs.reduce((s, r) => s + r.epaPending, 0);
    const avgEpaCompletion = Math.round(
      rs.reduce((s, r) => s + (r.epaTotal > 0 ? (r.epaSigned / r.epaTotal) * 100 : 0), 0) / totalResidents
    );
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const silentResidents = rs.filter(r => {
      if (!r.lastCaseDate) return true;
      return new Date(r.lastCaseDate).getTime() < twoWeeksAgo;
    }).length;
    return { totalResidents, casesThisWeek, epasPending, avgEpaCompletion, silentResidents };
  })();

  // ── Resident-specific: returned EPA alert ─────────────────────────────
  const [returnedCount, setReturnedCount] = useState<number>(0);
  useEffect(() => {
    if (!isResident) return;
    let cancelled = false;
    fetch("/api/epa/observations?status=RETURNED", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then((d: unknown) => {
        if (!cancelled && Array.isArray(d)) setReturnedCount(d.length);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isResident]);

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

  // Role label for staff identity
  const roleLabel = profile?.roleType
    ? profile.roleType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    : "";

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>

      {/* ══════════════════════════════════════════════════════════════════
          SHARED CORE — all roles see everything above the divider
          ══════════════════════════════════════════════════════════════════ */}

      {/* ── Pending program invites (in-app, self-hides if none) ───────── */}
      <ProgramInviteBanner />

      {/* ── Staff: EPAs to complete — persistent link to inbox ──────────
          Always shown for attendings/PDs so the entry point is stable,
          even when the queue is clear. The visual intensity scales with
          pendingSignOffs: teal+accent when >0, muted when 0. */}
      {isStaff && (
        (() => {
          const pending = staffStats?.pendingSignOffs ?? 0;
          const hot = pending > 0;
          return (
            <Link
              href="/inbox"
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", marginBottom: 16,
                background: hot ? "#0EA5E910" : "var(--surface)",
                border: hot ? "1px solid #0EA5E930" : "1px solid var(--border)",
                borderRadius: 10,
                textDecoration: "none",
                color: "var(--text-1)",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: hot ? "#0EA5E920" : "var(--bg-1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: hot ? "#0EA5E9" : "var(--text-3)", flexShrink: 0,
              }}>
                <Inbox size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                  {pending === 0
                    ? "EPAs to complete"
                    : pending === 1
                      ? "1 EPA awaiting your signature"
                      : `${pending} EPAs awaiting your signature`}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                  {pending === 0
                    ? "You're all caught up. Tap to check the inbox."
                    : "Residents are waiting on your feedback. Tap to review."}
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-3)", flexShrink: 0 }} />
            </Link>
          );
        })()
      )}

      {/* ── Resident: returned-EPA alert banner ──────────────────────────── */}
      {isResident && returnedCount > 0 && (
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
            {isStaff
              ? [roleLabel, profile?.specialty, profile?.institution].filter(Boolean).join(" \u00b7 ")
              : [profile?.specialty, profile?.trainingYearLabel].filter(Boolean).join(" \u00b7 ")}
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
        gridTemplateColumns: isStaff ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr 1fr",
        gap: 0,
        padding: "20px 0",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        marginBottom: 28,
      }}>
        {(isStaff
          ? [
              { n: String(thisMonth), l: "This mo" },
              { n: avgOR ? `${avgOR}m` : "\u2014", l: "Avg OR" },
              { n: String(staffStats?.signedThisMonth ?? 0), l: "Signed" },
              { n: String(staffStats?.signedYtd ?? 0), l: "YTD sign" },
            ]
          : [
              { n: String(thisMonth), l: "This mo" },
              { n: avgOR ? `${avgOR}m` : "\u2014", l: "Avg OR" },
              { n: `${firstSurgeonRate}%`, l: "Primary" },
              { n: String(streakInfo.currentStreak), l: "Streak", icon: streakInfo.currentStreak > 0 },
            ]
        ).map((s, i) => (
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

      {/* ── Pre-Op Brief CTA ──────────────────────────────────────────── */}
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
          setDebriefCase({
            id: sc.caseLogId ?? sc.id,
            procedureName: sc.procedureName,
            caseDate: sc.scheduledAt,
          });
        }}
      />

      {/* ── Shared program calendar (self-hides if user in no programs) ── */}
      <ProgramCalendar />

      {/* ══════════════════════════════════════════════════════════════════
          ROLE-SPECIFIC MODULES — layered below the shared core
          ══════════════════════════════════════════════════════════════════ */}

      {/* ── Staff / PD: teaching load section ────────────────────────────── */}
      {isStaff && staffStats?.recentSigned && staffStats.recentSigned.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: "var(--text-3)",
              textTransform: "uppercase", letterSpacing: "1px",
            }}>Recent Sign-offs</span>
            <Link href="/inbox" style={{
              fontSize: 11, color: "var(--text-3)", textDecoration: "none",
              display: "flex", alignItems: "center", gap: 2,
              transition: "color .15s",
            }}>
              All <ArrowUpRight size={10} />
            </Link>
          </div>
          {staffStats.recentSigned.slice(0, 4).map((e, i) => (
            <div key={e.id} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 0",
              borderBottom: i < Math.min(staffStats.recentSigned.length, 4) - 1
                ? "1px solid var(--border)"
                : "none",
            }}>
              <div style={{ paddingTop: 5, flexShrink: 0 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "#10B981",
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: "var(--text)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    flex: 1, minWidth: 0,
                  }}>{e.epaId} — {e.epaTitle}</span>
                  {e.signedAt && (
                    <span style={{
                      fontSize: 11, color: "var(--text-3)",
                      fontFamily: "'Geist Mono', monospace",
                      flexShrink: 0,
                    }}>
                      {new Date(e.signedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
                <div style={{
                  display: "flex", gap: 6, marginTop: 2,
                  fontSize: 11, color: "var(--text-3)",
                }}>
                  <span>{e.residentName ?? "Resident"}</span>
                  {e.entrustmentScore && (
                    <>
                      <span style={{ color: "var(--muted)" }}>&middot;</span>
                      <span style={{ fontFamily: "'Geist Mono', monospace" }}>O-Score {e.entrustmentScore}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── PD only: big, obvious PD Dashboard CTA ─────────────────────
          Intentionally gated to PROGRAM_DIRECTOR. Attendings (ATTENDING/
          STAFF) don't see this — they don't manage the cohort, just
          review their residents' sign-offs via the inbox above. */}
      {isPD && (
        <section style={{ marginBottom: 28 }}>
          <Link
            href="/pd-dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 18px",
              background:
                "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(16,185,129,0.06))",
              border: "1px solid rgba(14,165,233,0.35)",
              borderRadius: 12,
              color: "var(--text)",
              textDecoration: "none",
              transition: "background .15s, border-color .15s",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "rgba(14,165,233,0.15)",
                border: "1px solid rgba(14,165,233,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0EA5E9",
                flexShrink: 0,
              }}
            >
              <LayoutDashboard size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text)",
                  letterSpacing: "-0.2px",
                  marginBottom: 2,
                }}
              >
                Program Director Dashboard
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-3)",
                  lineHeight: 1.4,
                }}
              >
                Full cohort view — resident logbooks, EPA progress, and
                inactivity alerts
                {cohortKpis
                  ? ` · ${cohortKpis.totalResidents} resident${cohortKpis.totalResidents === 1 ? "" : "s"}`
                  : ""}
                {cohortKpis && cohortKpis.silentResidents > 0 ? (
                  <span style={{ color: "#F59E0B", fontWeight: 600 }}>
                    {" · "}
                    {cohortKpis.silentResidents} silent
                  </span>
                ) : null}
              </div>
            </div>
            <ChevronRight
              size={18}
              style={{ color: "var(--text-3)", flexShrink: 0 }}
            />
          </Link>

          {/* Silent residents — actionable, stays as a top-level alert */}
          {cohortKpis && cohortKpis.silentResidents > 0 && (
            <Link
              href="/pd-dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                marginTop: 10,
                background: "#F59E0B10",
                border: "1px solid #F59E0B25",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--text-2)",
                textDecoration: "none",
              }}
            >
              <AlertTriangle
                size={13}
                style={{ color: "#F59E0B", flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>
                {cohortKpis.silentResidents === 1
                  ? "1 resident hasn\u2019t logged a case in 14+ days"
                  : `${cohortKpis.silentResidents} residents haven\u2019t logged a case in 14+ days`}
              </span>
              <ChevronRight size={12} style={{ color: "var(--text-3)" }} />
            </Link>
          )}
        </section>
      )}

      {/* ── Activity (all roles) ─────────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: "var(--text-3)",
          textTransform: "uppercase", letterSpacing: "1px",
          marginBottom: 12,
        }}>Activity</div>
        <VolumeHeatmap data={heatmapData} />
      </section>

      {/* ── Top procedures (all roles) ───────────────────────────────── */}
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

      {/* ── Resident: learning curve ─────────────────────────────────── */}
      {isResident && learningCurve.length >= 3 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "var(--text-3)",
            textTransform: "uppercase", letterSpacing: "1px",
            marginBottom: 14,
          }}>Learning Curve — {topProcName}</div>
          <LearningCurveChart data={learningCurve} height={120} procedureName={topProcName} />
        </section>
      )}

      {/* ── Recent cases (all roles) ─────────────────────────────────── */}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{
                  fontSize: 13, fontWeight: 500, color: "var(--text)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  marginRight: 8, flex: 1, minWidth: 0,
                }}>{c.procedureName}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShareCaseId(c.id); }}
                    title="Share as pearl"
                    aria-label="Share as pearl"
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border-mid)",
                      borderRadius: 5,
                      width: 22, height: 22,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "var(--text-3)",
                      transition: "all .15s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(14,165,233,0.4)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--primary)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)";
                    }}
                  >
                    <Share2 size={11} />
                  </button>
                  <span style={{
                    fontSize: 11, color: "var(--text-3)",
                    fontFamily: "'Geist Mono', monospace",
                  }}>
                    {new Date(c.caseDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                  </span>
                </div>
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

      {/* ── Resident: milestones ──────────────────────────────────────── */}
      {isResident && milestones.length > 0 && (
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

      {/* ── Sheets (rendered at the end so they overlay) ──────────────── */}
      <BriefMeSheet
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
        prefill={briefPrefill}
      />

      <DebriefSheet
        open={debriefCase !== null}
        caseLog={debriefCase}
        onClose={() => setDebriefCase(null)}
      />

      <PostComposer
        open={shareCaseId !== null}
        onClose={() => setShareCaseId(null)}
        source={shareCaseId ? { kind: "case", caseId: shareCaseId } : undefined}
        onPublished={() => setShareCaseId(null)}
      />
    </div>
  );
}
