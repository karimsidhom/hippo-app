"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import {
  GraduationCap, Download, Users, Activity, AlertTriangle,
  BarChart2, ChevronDown, ChevronUp, Clock, TrendingUp,
  CheckCircle, AlertCircle, Shield,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ResidentData {
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  roleType: string;
  specialty: string | null;
  pgyYear: number | null;
  trainingYearLabel: string | null;
  totalCases: number;
  casesThisMonth: number;
  casesThisWeek: number;
  epaTotal: number;
  epaSigned: number;
  epaPending: number;
  lastCaseDate: string | null;
}

interface EpaDetail {
  id: string;
  epaId: string;
  epaTitle: string;
  status: string;
  achievement: string;
  entrustmentScore: number | null;
  observationDate: string;
  assessorName: string;
  caseLog?: {
    procedureName: string;
    caseDate: string;
    surgicalApproach: string;
    autonomyLevel: string;
    operativeDurationMinutes: number | null;
  } | null;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PDDashboardPage() {
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState("");
  const [residents, setResidents] = useState<ResidentData[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [epaDetails, setEpaDetails] = useState<Record<string, EpaDetail[]>>({});
  const [epaLoading, setEpaLoading] = useState<Record<string, boolean>>({});
  const [exportLoading, setExportLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Fetch residents ──────────────────────────────────────────────────────

  const fetchResidents = useCallback(async () => {
    try {
      const res = await fetch("/api/pd/residents", { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFetchError(data.error || "Failed to load residents");
        return;
      }
      const data = await res.json();
      setInstitution(data.institution || "");
      setResidents(data.residents || []);
    } catch {
      setFetchError("Network error loading dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.roleType === "PROGRAM_DIRECTOR") {
      fetchResidents();
    } else {
      setLoading(false);
    }
  }, [profile?.roleType, fetchResidents]);

  // ── Fetch EPA details for a resident ─────────────────────────────────────

  const fetchEpaDetails = async (userId: string) => {
    if (epaDetails[userId]) return;
    setEpaLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`/api/pd/residents/${userId}/epa`, {
        credentials: "include",
      });
      if (res.ok) {
        const data: EpaDetail[] = await res.json();
        setEpaDetails((prev) => ({ ...prev, [userId]: data }));
      }
    } catch {
      // silently fail
    } finally {
      setEpaLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const toggleExpand = (userId: string) => {
    if (expandedId === userId) {
      setExpandedId(null);
    } else {
      setExpandedId(userId);
      fetchEpaDetails(userId);
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/pd/export?format=csv", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `program-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Access gate ──────────────────────────────────────────────────────────

  if (!loading && profile?.roleType !== "PROGRAM_DIRECTOR") {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "80px auto",
          textAlign: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "var(--surface2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Shield size={28} style={{ color: "var(--text-3)" }} />
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 8,
          }}
        >
          Program Director Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>
          This dashboard is for Program Directors only. If you are a program
          director, please update your role in{" "}
          <a
            href="/settings"
            style={{ color: "var(--primary)", textDecoration: "underline" }}
          >
            Settings
          </a>
          .
        </p>
      </div>
    );
  }

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
        Loading dashboard...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "80px auto",
          textAlign: "center",
          padding: "40px 24px",
        }}
      >
        <AlertCircle
          size={32}
          style={{ color: "var(--danger)", margin: "0 auto 12px", display: "block" }}
        />
        <p style={{ fontSize: 14, color: "var(--text-3)" }}>{fetchError}</p>
      </div>
    );
  }

  // ── Computed stats ───────────────────────────────────────────────────────

  const totalResidents = residents.length;
  const totalCases = residents.reduce((s, r) => s + r.totalCases, 0);
  const avgCases =
    totalResidents > 0 ? Math.round(totalCases / totalResidents) : 0;
  const belowTarget = residents.filter((r) => r.casesThisMonth < 10).length;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 0 60px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <GraduationCap size={24} style={{ color: "var(--primary)" }} />
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Program Director Dashboard
            </h1>
          </div>
          {institution && (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-3)",
                marginTop: 4,
                marginLeft: 34,
              }}
            >
              {institution}
            </p>
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            color: "var(--text-2)",
            fontSize: 13,
            fontWeight: 600,
            cursor: exportLoading ? "not-allowed" : "pointer",
            opacity: exportLoading ? 0.6 : 1,
            fontFamily: "inherit",
          }}
        >
          <Download size={15} />
          {exportLoading ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Stats Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <StatCard
          icon={<Users size={18} />}
          label="Total Residents"
          value={totalResidents}
          color="var(--primary)"
        />
        <StatCard
          icon={<Activity size={18} />}
          label="Total Cases"
          value={totalCases}
          color="var(--success)"
        />
        <StatCard
          icon={<BarChart2 size={18} />}
          label="Avg Cases / Resident"
          value={avgCases}
          color="var(--accent, #f59e0b)"
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Below Target (<10/mo)"
          value={belowTarget}
          color={belowTarget > 0 ? "var(--danger)" : "var(--success)"}
        />
      </div>

      {/* Resident Roster */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 40px",
            gap: 8,
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <span>Resident</span>
          <span>Total Cases</span>
          <span>This Month</span>
          <span>EPA Progress</span>
          <span>Last Active</span>
          <span />
        </div>

        {residents.length === 0 && (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              color: "var(--text-3)",
              fontSize: 14,
            }}
          >
            No residents found at your institution. Make sure residents have set
            their institution to &ldquo;{institution}&rdquo; in their profile.
          </div>
        )}

        {residents.map((r) => {
          const isExpanded = expandedId === r.userId;
          const epaPct =
            r.epaTotal > 0
              ? Math.round((r.epaSigned / r.epaTotal) * 100)
              : 0;

          return (
            <div key={r.userId}>
              {/* Row */}
              <div
                onClick={() => toggleExpand(r.userId)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 40px",
                  gap: 8,
                  padding: "14px 16px",
                  borderBottom: isExpanded
                    ? "none"
                    : "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "background .15s",
                  background: isExpanded
                    ? "var(--surface2)"
                    : "transparent",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded)
                    (e.currentTarget as HTMLDivElement).style.background =
                      "var(--surface2)";
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded)
                    (e.currentTarget as HTMLDivElement).style.background =
                      "transparent";
                }}
              >
                {/* Name + role */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--primary-dim, #1a1a2e)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--primary)",
                      flexShrink: 0,
                    }}
                  >
                    {(r.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {r.name || "Unknown"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {r.trainingYearLabel || r.roleType}{" "}
                      {r.specialty ? ` · ${r.specialty}` : ""}
                    </div>
                  </div>
                </div>

                {/* Total cases */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text)",
                    fontFamily: "'Geist Mono', monospace",
                  }}
                >
                  {r.totalCases}
                </div>

                {/* This month */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color:
                        r.casesThisMonth < 10
                          ? "var(--warning, #f59e0b)"
                          : "var(--text)",
                      fontFamily: "'Geist Mono', monospace",
                    }}
                  >
                    {r.casesThisMonth}
                  </span>
                  {r.casesThisMonth < 10 && (
                    <AlertTriangle
                      size={12}
                      style={{ color: "var(--warning, #f59e0b)" }}
                    />
                  )}
                </div>

                {/* EPA progress */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-2)",
                        fontFamily: "'Geist Mono', monospace",
                      }}
                    >
                      {r.epaSigned}/{r.epaTotal}
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 80,
                      height: 4,
                      background: "var(--border)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${epaPct}%`,
                        height: "100%",
                        background:
                          epaPct >= 75
                            ? "var(--success)"
                            : epaPct >= 40
                              ? "var(--warning, #f59e0b)"
                              : "var(--danger)",
                        borderRadius: 2,
                        transition: "width .3s",
                      }}
                    />
                  </div>
                </div>

                {/* Last active */}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-3)",
                    fontFamily: "'Geist Mono', monospace",
                  }}
                >
                  {r.lastCaseDate
                    ? formatRelativeDate(r.lastCaseDate)
                    : "Never"}
                </div>

                {/* Expand arrow */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp size={16} style={{ color: "var(--text-3)" }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: "var(--text-3)" }} />
                  )}
                </div>
              </div>

              {/* Expanded detail panel */}
              {isExpanded && (
                <ResidentDetailPanel
                  resident={r}
                  epas={epaDetails[r.userId] || []}
                  loading={epaLoading[r.userId] || false}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
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
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}18`,
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
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--text)",
          fontFamily: "'Geist Mono', monospace",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Resident Detail Panel ────────────────────────────────────────────────────

function ResidentDetailPanel({
  resident,
  epas,
  loading,
}: {
  resident: ResidentData;
  epas: EpaDetail[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div
        style={{
          padding: "24px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface2)",
          textAlign: "center",
          color: "var(--text-3)",
          fontSize: 13,
        }}
      >
        Loading EPA details...
      </div>
    );
  }

  // Compute autonomy distribution from EPA caseLog data
  const autonomyCounts: Record<string, number> = {};
  const approachCounts: Record<string, number> = {};
  epas.forEach((epa) => {
    if (epa.caseLog) {
      const auto = epa.caseLog.autonomyLevel || "Unknown";
      autonomyCounts[auto] = (autonomyCounts[auto] || 0) + 1;
      const appr = epa.caseLog.surgicalApproach || "Unknown";
      approachCounts[appr] = (approachCounts[appr] || 0) + 1;
    }
  });

  // Group EPAs by epaId for progress grid
  const epaGroups: Record<string, { title: string; observations: EpaDetail[] }> =
    {};
  epas.forEach((epa) => {
    if (!epaGroups[epa.epaId]) {
      epaGroups[epa.epaId] = { title: epa.epaTitle, observations: [] };
    }
    epaGroups[epa.epaId].observations.push(epa);
  });

  // Missing assessments — EPAs with 0 signed observations
  const missingEpas = Object.entries(epaGroups).filter(
    ([, g]) => g.observations.filter((o) => o.status === "SIGNED").length === 0,
  );

  // Needs attention flags
  const flags: string[] = [];
  if (resident.casesThisMonth < 10) {
    flags.push("Below target: fewer than 10 cases this month");
  }
  if (resident.epaPending > 3) {
    flags.push(`${resident.epaPending} EPA observations pending review`);
  }
  if (missingEpas.length > 0) {
    flags.push(
      `${missingEpas.length} EPA${missingEpas.length > 1 ? "s" : ""} with no signed observations`,
    );
  }
  if (
    resident.lastCaseDate &&
    Date.now() - new Date(resident.lastCaseDate).getTime() >
      14 * 24 * 60 * 60 * 1000
  ) {
    flags.push("No cases logged in the last 14 days");
  }

  return (
    <div
      style={{
        padding: "20px 16px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface2)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {/* EPA Completion Grid */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 16,
          }}
        >
          <h4
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-2)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CheckCircle size={14} /> EPA Progress
          </h4>
          {Object.keys(epaGroups).length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
              No EPA observations recorded
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(epaGroups)
                .slice(0, 8)
                .map(([epaId, group]) => {
                  const signed = group.observations.filter(
                    (o) => o.status === "SIGNED",
                  ).length;
                  const total = group.observations.length;
                  const pct = total > 0 ? Math.round((signed / total) * 100) : 0;
                  return (
                    <div key={epaId}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-2)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 180,
                          }}
                        >
                          {epaId}: {group.title}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-3)",
                            fontFamily: "'Geist Mono', monospace",
                            flexShrink: 0,
                          }}
                        >
                          {signed}/{total} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: 4,
                          background: "var(--border)",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background:
                              pct >= 75
                                ? "var(--success)"
                                : pct >= 40
                                  ? "var(--warning, #f59e0b)"
                                  : "var(--danger)",
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Autonomy Distribution */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 16,
          }}
        >
          <h4
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-2)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <TrendingUp size={14} /> Autonomy Distribution
          </h4>
          {Object.keys(autonomyCounts).length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
              No autonomy data available
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(autonomyCounts).map(([level, count]) => {
                const total = Object.values(autonomyCounts).reduce(
                  (s, v) => s + v,
                  0,
                );
                const pct = Math.round((count / total) * 100);
                return (
                  <div
                    key={level}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-2)",
                        minWidth: 120,
                      }}
                    >
                      {formatAutonomy(level)}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        background: "var(--border)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: autonomyColor(level),
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        fontFamily: "'Geist Mono', monospace",
                        minWidth: 36,
                        textAlign: "right",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Case volume mini summary */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            <h4
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-2)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Clock size={14} /> Case Volume
            </h4>
            <div style={{ display: "flex", gap: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
                  {resident.casesThisWeek}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>This week</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
                  {resident.casesThisMonth}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>This month</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
                  {resident.totalCases}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Needs Attention Flags */}
      {flags.length > 0 && (
        <div
          style={{
            marginTop: 12,
            background: "var(--danger, #ef4444)" + "10",
            border: "1px solid var(--danger, #ef4444)" + "30",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <h4
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--danger, #ef4444)",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <AlertCircle size={14} /> Needs Attention
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {flags.map((flag, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  color: "var(--text-2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ color: "var(--danger, #ef4444)" }}>&#x2022;</span>
                {flag}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Assessments */}
      {missingEpas.length > 0 && (
        <div
          style={{
            marginTop: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <h4
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--warning, #f59e0b)",
              marginBottom: 8,
            }}
          >
            Missing Signed Assessments
          </h4>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {missingEpas.map(([epaId, group]) => (
              <span
                key={epaId}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text-2)",
                }}
              >
                {epaId}: {group.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatAutonomy(level: string): string {
  const map: Record<string, string> = {
    OBSERVER: "Observer",
    ASSISTANT: "Assistant",
    SUPERVISOR_PRESENT: "Supervised",
    INDEPENDENT: "Independent",
    TEACHING: "Teaching",
  };
  return map[level] || level;
}

function autonomyColor(level: string): string {
  const map: Record<string, string> = {
    OBSERVER: "#64748b",
    ASSISTANT: "#94a3b8",
    SUPERVISOR_PRESENT: "#f59e0b",
    INDEPENDENT: "#10b981",
    TEACHING: "#6366f1",
  };
  return map[level] || "#64748b";
}
