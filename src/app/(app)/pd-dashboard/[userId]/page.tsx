"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { getSpecialtyEpaData } from "@/lib/epa/data";
import type { EpaDefinition } from "@/lib/epa/data";

// ── Types ────────────────────────────────────────────────────────────────────

interface SummaryResponse {
  resident: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    specialty: string | null;
    pgyYear: number | null;
    trainingYearLabel: string | null;
    trainingCountry: string | null;
    institution: string | null;
    roleType: string;
  };
  stats: {
    totalCases: number;
    casesThisMonth: number;
    epaSigned: number;
    epaPending: number;
    endorsementsReceived: number;
    lastCaseDate: string | null;
  };
  casesByWeek: { weekStart: string; count: number }[];
  autonomyRecent: Record<string, number>;
  autonomyPrior: Record<string, number>;
  epaObservations: {
    epaId: string;
    status: string;
    signedAt: string | null;
    entrustmentScore: number | null;
    observationDate: string;
  }[];
  recentPearls: {
    id: string;
    title: string;
    endorseCount: number;
    reactionCount: number;
    createdAt: string;
  }[];
}

const MONO = "'Geist Mono', monospace";

const AUTONOMY_ORDER = [
  "OBSERVER",
  "ASSISTANT",
  "SUPERVISOR_PRESENT",
  "INDEPENDENT",
  "TEACHING",
] as const;

const AUTONOMY_LABELS: Record<string, string> = {
  OBSERVER: "Observer",
  ASSISTANT: "Assistant",
  SUPERVISOR_PRESENT: "Supervisor present",
  INDEPENDENT: "Independent",
  TEACHING: "Teaching",
};

const AUTONOMY_COLORS: Record<string, string> = {
  OBSERVER: "#64748b",
  ASSISTANT: "#94a3b8",
  SUPERVISOR_PRESENT: "#f59e0b",
  INDEPENDENT: "#10b981",
  TEACHING: "#8b5cf6",
};

// ── Stage helpers (match EpaDashboard pattern) ───────────────────────────────

function getStageColor(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTP")) return "#10b981";
  if (id.startsWith("TD")) return "#6366f1";
  if (id.startsWith("CSA") || id.startsWith("FSA") || id.startsWith("TTPSA")) return "#a855f7";
  if (id.startsWith("C")) return "#0ea5e9";
  if (id.startsWith("F")) return "#f59e0b";
  return "#0ea5e9";
}

function getStageLabel(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTPSA")) return "TTP Special Assessment";
  if (id.startsWith("TTP")) return "Transition to Practice";
  if (id.startsWith("TD")) return "Transition to Discipline";
  if (id.startsWith("CSA")) return "Core Special Assessment";
  if (id.startsWith("FSA")) return "Foundations Special Assessment";
  if (id.startsWith("C")) return "Core of Discipline";
  if (id.startsWith("F")) return "Foundations";
  return "EPA";
}

const STAGE_ORDER = [
  "Transition to Discipline",
  "Foundations",
  "Foundations Special Assessment",
  "Core of Discipline",
  "Core Special Assessment",
  "Transition to Practice",
  "TTP Special Assessment",
  "EPA",
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ResidentDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/pd/residents/${userId}/summary`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (!cancelled) setError(data.error || "Failed to load resident");
          return;
        }
        const data: SummaryResponse = await res.json();
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          color: "var(--text-3)",
          fontSize: 14,
        }}
      >
        Loading resident…
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div
        style={{
          maxWidth: 520,
          margin: "60px auto",
          textAlign: "center",
          padding: "32px 24px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
        }}
      >
        <AlertCircle
          size={28}
          style={{ color: "var(--danger)", margin: "0 auto 12px", display: "block" }}
        />
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 16 }}>
          {error || "Resident not found."}
        </p>
        <Link
          href="/pd-dashboard"
          style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
        >
          ← Back to cohort
        </Link>
      </div>
    );
  }

  const { resident, stats, casesByWeek, autonomyRecent, autonomyPrior, epaObservations, recentPearls } =
    summary;

  const lastDays = stats.lastCaseDate
    ? Math.floor((Date.now() - new Date(stats.lastCaseDate).getTime()) / 86400000)
    : null;

  // Build EPA heatmap rows from spec + observations
  const specialtyData = resident.specialty
    ? getSpecialtyEpaData(resident.specialty, resident.trainingCountry || "CA")
    : undefined;

  const observationsByEpa = epaObservations.reduce<Record<string, number>>((acc, o) => {
    acc[o.epaId] = (acc[o.epaId] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 0 60px" }}>
      {/* Back link */}
      <Link
        href="/pd-dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--text-3)",
          textDecoration: "none",
          marginBottom: 16,
        }}
      >
        <ArrowLeft size={14} />
        Back to cohort
      </Link>

      {/* Header */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <ResidentAvatar image={resident.image} name={resident.name} size={64} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text)",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {resident.name || resident.email}
          </h1>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-3)",
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontFamily: MONO }}>
              {resident.trainingYearLabel ||
                (resident.pgyYear != null ? `PGY-${resident.pgyYear}` : "—")}
            </span>
            {resident.specialty && (
              <>
                <span>·</span>
                <span>{resident.specialty}</span>
              </>
            )}
            {resident.institution && (
              <>
                <span>·</span>
                <span>{resident.institution}</span>
              </>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
            {resident.email}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Last activity
          </div>
          <div
            style={{
              fontSize: 14,
              color:
                lastDays !== null && lastDays >= 14
                  ? "var(--danger)"
                  : "var(--text)",
              fontFamily: MONO,
              marginTop: 4,
              fontWeight: 600,
            }}
          >
            {lastDays === null
              ? "Never"
              : lastDays === 0
                ? "Today"
                : lastDays === 1
                  ? "Yesterday"
                  : `${lastDays} days ago`}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <MiniKpi icon={<Activity size={15} />} label="Total cases" value={stats.totalCases} color="var(--primary)" />
        <MiniKpi icon={<Clock size={15} />} label="Cases this month" value={stats.casesThisMonth} color="var(--primary)" />
        <MiniKpi icon={<CheckCircle2 size={15} />} label="EPAs signed" value={stats.epaSigned} color="var(--success)" />
        <MiniKpi
          icon={<AlertCircle size={15} />}
          label="EPAs pending"
          value={stats.epaPending}
          color={stats.epaPending > 0 ? "var(--warning)" : "var(--text-3)"}
        />
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 16,
        }}
      >
        <CaseVolumeChart weeks={casesByWeek} />

        <AutonomyCard recent={autonomyRecent} prior={autonomyPrior} />

        {specialtyData && (
          <EpaHeatmap
            specialtyEpas={specialtyData.epas}
            observations={observationsByEpa}
          />
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <RecentPearlsCard
            pearls={recentPearls}
            endorsementsReceived={stats.endorsementsReceived}
          />
        </div>
      </div>
    </div>
  );
}

// ── Case volume bar chart (SVG) ──────────────────────────────────────────────

function CaseVolumeChart({ weeks }: { weeks: { weekStart: string; count: number }[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const barWidth = 100 / Math.max(1, weeks.length);
  const chartHeight = 120;

  return (
    <SectionCard
      icon={<TrendingUp size={14} />}
      title="Case volume — last 12 weeks"
    >
      <div style={{ padding: "4px 2px 0" }}>
        <svg
          viewBox={`0 0 100 ${chartHeight + 20}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: 140, display: "block" }}
        >
          {/* subtle baseline */}
          <line
            x1={0}
            y1={chartHeight}
            x2={100}
            y2={chartHeight}
            stroke="var(--border)"
            strokeWidth={0.3}
          />
          {weeks.map((w, i) => {
            const h = (w.count / max) * (chartHeight - 4);
            const x = i * barWidth + barWidth * 0.15;
            const y = chartHeight - h;
            const width = barWidth * 0.7;
            return (
              <g key={w.weekStart}>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={h}
                  rx={0.5}
                  fill={w.count === 0 ? "var(--border-mid)" : "var(--primary)"}
                  opacity={w.count === 0 ? 0.5 : 1}
                >
                  <title>{`${w.weekStart}: ${w.count} case${w.count === 1 ? "" : "s"}`}</title>
                </rect>
                {w.count > 0 && (
                  <text
                    x={x + width / 2}
                    y={y - 1.5}
                    textAnchor="middle"
                    fontSize={3}
                    fill="var(--text-2)"
                    fontFamily="Geist Mono, monospace"
                  >
                    {w.count}
                  </text>
                )}
              </g>
            );
          })}
          {/* x labels */}
          {weeks.map((w, i) => {
            if (i % 2 !== 0 && i !== weeks.length - 1) return null;
            const x = i * barWidth + barWidth * 0.5;
            const label = formatWeekLabel(w.weekStart);
            return (
              <text
                key={`lbl-${w.weekStart}`}
                x={x}
                y={chartHeight + 7}
                textAnchor="middle"
                fontSize={3}
                fill="var(--text-3)"
                fontFamily="Geist Mono, monospace"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </SectionCard>
  );
}

function formatWeekLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ── Autonomy card ────────────────────────────────────────────────────────────

function AutonomyCard({
  recent,
  prior,
}: {
  recent: Record<string, number>;
  prior: Record<string, number>;
}) {
  const recentTotal = Object.values(recent).reduce((s, n) => s + n, 0);
  const priorTotal = Object.values(prior).reduce((s, n) => s + n, 0);

  return (
    <SectionCard icon={<Award size={14} />} title="Autonomy progression">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <AutonomyBar label="Last 30 days" total={recentTotal} counts={recent} />
        <AutonomyBar label="Prior 30 days" total={priorTotal} counts={prior} faded />
        <Legend />
      </div>
    </SectionCard>
  );
}

function AutonomyBar({
  label,
  total,
  counts,
  faded,
}: {
  label: string;
  total: number;
  counts: Record<string, number>;
  faded?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: faded ? "var(--text-3)" : "var(--text-2)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: MONO }}>
          {total} case{total === 1 ? "" : "s"}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          height: 12,
          borderRadius: 6,
          overflow: "hidden",
          background: "var(--border)",
          opacity: faded ? 0.6 : 1,
        }}
      >
        {total === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "var(--text-3)",
            }}
          >
            no cases
          </div>
        ) : (
          AUTONOMY_ORDER.map((k) => {
            const c = counts[k] || 0;
            if (c === 0) return null;
            const pct = (c / total) * 100;
            return (
              <div
                key={k}
                title={`${AUTONOMY_LABELS[k]}: ${c} (${Math.round(pct)}%)`}
                style={{
                  width: `${pct}%`,
                  background: AUTONOMY_COLORS[k],
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {AUTONOMY_ORDER.map((k) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: AUTONOMY_COLORS[k],
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            {AUTONOMY_LABELS[k]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── EPA heatmap ──────────────────────────────────────────────────────────────

function EpaHeatmap({
  specialtyEpas,
  observations,
}: {
  specialtyEpas: EpaDefinition[];
  observations: Record<string, number>;
}) {
  // Group by stage
  const grouped = useMemo(() => {
    const by: Record<string, EpaDefinition[]> = {};
    for (const epa of specialtyEpas) {
      const stage = getStageLabel(epa.id);
      (by[stage] = by[stage] || []).push(epa);
    }
    for (const k of Object.keys(by)) {
      by[k].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }
    return by;
  }, [specialtyEpas]);

  const orderedStages = STAGE_ORDER.filter((s) => grouped[s] && grouped[s].length > 0);

  return (
    <SectionCard icon={<Sparkles size={14} />} title="EPA coverage heatmap">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {orderedStages.map((stage) => {
          const items = grouped[stage];
          const stageColor = items[0] ? getStageColor(items[0].id) : "#0ea5e9";
          return (
            <div key={stage}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: stageColor,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {stage}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-3)",
                    fontFamily: MONO,
                  }}
                >
                  {items.length} EPA{items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))",
                  gap: 6,
                }}
              >
                {items.map((epa) => {
                  const count = observations[epa.id] || 0;
                  const target = epa.targetCaseCount || 1;
                  const pct = (count / target) * 100;
                  return (
                    <div
                      key={epa.id}
                      title={`${epa.id}: ${count}/${target} cases (${Math.round(pct)}%) — ${epa.title}`}
                      style={{
                        padding: "8px 4px",
                        borderRadius: 6,
                        textAlign: "center",
                        background: heatColor(pct),
                        color: pct <= 25 ? "var(--text)" : "#0b0f1a",
                        fontFamily: MONO,
                        fontSize: 11,
                        fontWeight: 700,
                        border: "1px solid rgba(0,0,0,0.2)",
                        cursor: "default",
                      }}
                    >
                      <div>{epa.id}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.85, marginTop: 1 }}>
                        {count}/{target}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {orderedStages.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>
            No EPA framework available for this specialty.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function heatColor(pct: number): string {
  if (pct >= 100) return "#facc15"; // gold
  if (pct >= 76) return "#10b981"; // green
  if (pct >= 51) return "#eab308"; // yellow
  if (pct >= 26) return "#f59e0b"; // amber
  if (pct > 0) return "rgba(239, 68, 68, 0.75)"; // red
  return "var(--surface2)"; // empty
}

// ── Pearls card ──────────────────────────────────────────────────────────────

function RecentPearlsCard({
  pearls,
  endorsementsReceived,
}: {
  pearls: SummaryResponse["recentPearls"];
  endorsementsReceived: number;
}) {
  return (
    <SectionCard icon={<Sparkles size={14} />} title="Recent pearls authored">
      <div
        style={{
          fontSize: 11,
          color: "var(--text-3)",
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <span style={{ fontFamily: MONO, color: "var(--text-2)", fontWeight: 700 }}>
          {endorsementsReceived}
        </span>{" "}
        endorsements received · {pearls.length} recent post{pearls.length === 1 ? "" : "s"}
      </div>
      {pearls.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>No pearls yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pearls.map((p) => (
            <div
              key={p.id}
              style={{
                padding: "10px 12px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text)",
                  fontWeight: 600,
                  marginBottom: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  display: "flex",
                  gap: 10,
                  fontFamily: MONO,
                }}
              >
                <span>{p.endorseCount} endorse</span>
                <span>{p.reactionCount} reactions</span>
                <span style={{ marginLeft: "auto" }}>{formatShortDate(p.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Shared bits ──────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <div style={{ color: "var(--primary)", display: "flex" }}>{icon}</div>
        <h3
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-2)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function MiniKpi({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--text)",
          fontFamily: MONO,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ResidentAvatar({
  image,
  name,
  size = 40,
}: {
  image: string | null;
  name: string | null;
  size?: number;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name || "Resident"}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "1px solid var(--border)",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(14, 165, 233, 0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 700,
        color: "var(--primary)",
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
