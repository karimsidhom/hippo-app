"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import {
  GraduationCap,
  Download,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Search,
  ShieldAlert,
  Shield,
  AlertCircle,
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

const MONO = "'Geist Mono', monospace";
const SILENT_DAYS = 14;
const PD_STAFF_ROLES = ["PROGRAM_DIRECTOR", "ATTENDING", "STAFF"];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PDDashboardPage() {
  const { profile } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState("");
  const [residents, setResidents] = useState<ResidentData[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [pgyFilter, setPgyFilter] = useState<string>("ALL");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("ALL");

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
    if (profile?.roleType && PD_STAFF_ROLES.includes(profile.roleType)) {
      fetchResidents();
    } else if (profile !== null) {
      setLoading(false);
    }
  }, [profile, fetchResidents]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/pd/export?format=csv", { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cohort-report-${new Date().toISOString().slice(0, 10)}.csv`;
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

  // ── Derived (memoized) — must be before early returns for Rules of Hooks ──
  const pgyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of residents) {
      const v = r.trainingYearLabel ?? (r.pgyYear != null ? `PGY-${r.pgyYear}` : null);
      if (v) set.add(v);
    }
    return Array.from(set).sort();
  }, [residents]);

  const specialtyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of residents) if (r.specialty) set.add(r.specialty);
    return Array.from(set).sort();
  }, [residents]);

  // ── Role gate ──────────────────────────────────────────────────────────────
  if (!loading && profile && !PD_STAFF_ROLES.includes(profile.roleType ?? "")) {
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
          Cohort view
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 16 }}>
          This page is for staff and program directors. Head back to your dashboard.
        </p>
        <Link
          href="/dashboard"
          style={{
            fontSize: 13,
            color: "var(--primary)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Go to dashboard →
        </Link>
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
        Loading cohort…
      </div>
    );
  }

  if (fetchError) {
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
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 16 }}>{fetchError}</p>
        {fetchError.toLowerCase().includes("institution") && (
          <Link
            href="/settings"
            style={{
              fontSize: 13,
              color: "var(--primary)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Edit profile →
          </Link>
        )}
      </div>
    );
  }

  // ── Derived ─────────────────────────────────────────────────────────────
  const residentCount = residents.filter((r) => r.roleType === "RESIDENT").length;
  const fellowCount = residents.filter((r) => r.roleType === "FELLOW").length;

  const casesThisWeek = residents.reduce((s, r) => s + r.casesThisWeek, 0);

  // EPAs signed this month — best-effort: we use epaSigned totals as a signal.
  // The residents route doesn't break signed-by-month; we surface the live total
  // as "EPAs signed (all time)" and highlight "this month" if avail.
  const epasSignedTotal = residents.reduce((s, r) => s + r.epaSigned, 0);

  const silentResidents = residents.filter((r) => {
    if (!r.lastCaseDate) return true;
    return daysSince(r.lastCaseDate) >= SILENT_DAYS;
  });

  const avgEpaCompletion = (() => {
    const active = residents.filter((r) => r.epaTotal > 0);
    if (active.length === 0) return 0;
    const pct =
      active.reduce((s, r) => s + r.epaSigned / Math.max(1, r.epaTotal), 0) / active.length;
    return Math.round(pct * 100);
  })();

  const filtered = residents
    .filter((r) => {
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const name = (r.name || r.email).toLowerCase();
        if (!name.includes(q) && !r.email.toLowerCase().includes(q)) return false;
      }
      if (pgyFilter !== "ALL") {
        const label = r.trainingYearLabel ?? (r.pgyYear != null ? `PGY-${r.pgyYear}` : null);
        if (label !== pgyFilter) return false;
      }
      if (specialtyFilter !== "ALL") {
        if (r.specialty !== specialtyFilter) return false;
      }
      return true;
    })
    .slice()
    .sort((a, b) => {
      const aSilent = a.lastCaseDate ? daysSince(a.lastCaseDate) >= SILENT_DAYS : true;
      const bSilent = b.lastCaseDate ? daysSince(b.lastCaseDate) >= SILENT_DAYS : true;
      if (aSilent !== bSilent) return aSilent ? -1 : 1;
      const aT = a.lastCaseDate ? new Date(a.lastCaseDate).getTime() : 0;
      const bT = b.lastCaseDate ? new Date(b.lastCaseDate).getTime() : 0;
      return bT - aT;
    });

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 0 60px" }}>
      {/* Pulse keyframes for the silent-dot */}
      <style>{`
        @keyframes pd-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .pd-card:hover {
          transform: translateY(-1px);
          border-color: var(--border-mid);
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }
      `}</style>

      {/* ── Institution header ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <GraduationCap size={22} style={{ color: "var(--primary)" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-3)",
              }}
            >
              Cohort
            </span>
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text)",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {institution || "Your institution"}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-3)",
              marginTop: 4,
              fontFamily: MONO,
            }}
          >
            {residentCount} resident{residentCount === 1 ? "" : "s"} ·{" "}
            {fellowCount} fellow{fellowCount === 1 ? "" : "s"}
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={exportLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
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
          <Download size={14} />
          {exportLoading ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <KpiCard
          icon={<Activity size={16} />}
          label="Cases this week"
          value={casesThisWeek}
          color="var(--primary)"
        />
        <KpiCard
          icon={<CheckCircle2 size={16} />}
          label="EPAs signed"
          value={epasSignedTotal}
          color="var(--success)"
          sublabel="cohort total"
        />
        <KpiCard
          icon={<ShieldAlert size={16} />}
          label="Silent ≥ 2 weeks"
          value={silentResidents.length}
          color={silentResidents.length > 0 ? "var(--danger)" : "var(--success)"}
          emphasize={silentResidents.length > 0}
        />
        <KpiCard
          icon={<Users size={16} />}
          label="Avg EPA completion"
          value={avgEpaCompletion}
          color="var(--warning)"
          suffix="%"
        />
      </div>

      {/* ── Filter / search bar ───────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: "1 1 260px",
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              color: "var(--text-3)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>
        <select
          value={pgyFilter}
          onChange={(e) => setPgyFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="ALL">All PGYs</option>
          {pgyOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="ALL">All specialties</option>
          {specialtyOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {residents.length === 0 && (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "var(--surface)",
            border: "1px dashed var(--border)",
            borderRadius: 14,
          }}
        >
          <Users size={32} style={{ color: "var(--text-3)", margin: "0 auto 10px", display: "block" }} />
          {institution ? (
            <>
              <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 4 }}>
                No residents linked yet.
              </p>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                Residents who set their institution to{" "}
                <strong style={{ color: "var(--text-2)" }}>{institution}</strong> will appear here.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 10 }}>
                Your institution isn&rsquo;t set.
              </p>
              <Link
                href="/settings"
                style={{
                  fontSize: 13,
                  color: "var(--primary)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Edit profile →
              </Link>
            </>
          )}
        </div>
      )}

      {/* ── Resident grid ─────────────────────────────────────────────── */}
      {residents.length > 0 && (
        <>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "var(--text-3)",
                fontSize: 13,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
              }}
            >
              No residents match your filters.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 14,
              }}
            >
              {filtered.map((r) => (
                <ResidentCard
                  key={r.userId}
                  resident={r}
                  onClick={() => router.push(`/pd-dashboard/${r.userId}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Resident card ────────────────────────────────────────────────────────────

function ResidentCard({
  resident,
  onClick,
}: {
  resident: ResidentData;
  onClick: () => void;
}) {
  const lastDays = resident.lastCaseDate ? daysSince(resident.lastCaseDate) : null;
  const silent = lastDays === null || lastDays >= SILENT_DAYS;
  const epaPct =
    resident.epaTotal > 0 ? Math.round((resident.epaSigned / resident.epaTotal) * 100) : 0;

  const roleLabel = resident.roleType === "FELLOW" ? "Fellow" : "Resident";

  return (
    <button
      type="button"
      onClick={onClick}
      className="pd-card"
      style={{
        textAlign: "left",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 16,
        cursor: "pointer",
        color: "var(--text)",
        fontFamily: "inherit",
        transition: "transform .15s ease, border-color .15s ease, box-shadow .15s ease",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <ResidentAvatar image={resident.image} name={resident.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {resident.name || resident.email}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              gap: 6,
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
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "3px 7px",
            borderRadius: 5,
            background:
              resident.roleType === "FELLOW"
                ? "rgba(139, 92, 246, 0.12)"
                : "rgba(14, 165, 233, 0.12)",
            color: resident.roleType === "FELLOW" ? "#a78bfa" : "var(--primary)",
            flexShrink: 0,
          }}
        >
          {roleLabel}
        </span>
      </div>

      {/* Activity bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          background: silent ? "rgba(239, 68, 68, 0.07)" : "var(--surface2)",
          border: silent ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid var(--border)",
          borderRadius: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 12, color: "var(--text-2)" }}>
            <span style={{ fontFamily: MONO, fontWeight: 600, color: "var(--text)" }}>
              {resident.casesThisMonth}
            </span>{" "}
            cases this month
          </span>
          <span style={{ fontSize: 11, color: silent ? "var(--danger)" : "var(--text-3)" }}>
            {lastDays === null
              ? "No cases logged yet"
              : silent
                ? `Silent for ${lastDays} days`
                : `Last case ${lastDays === 0 ? "today" : `${lastDays}d ago`}`}
          </span>
        </div>
        {silent && (
          <span
            aria-hidden
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "var(--danger)",
              animation: "pd-pulse 1.8s ease-out infinite",
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* EPA progress */}
      <div style={{ marginBottom: resident.epaPending > 0 ? 10 : 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 5,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-3)",
            }}
          >
            EPA progress
          </span>
          <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: MONO }}>
            {resident.epaSigned} / {resident.epaTotal} signed
          </span>
        </div>
        <div
          style={{
            height: 5,
            background: "var(--border)",
            borderRadius: 99,
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
                    ? "var(--warning)"
                    : "var(--danger)",
              transition: "width .3s",
            }}
          />
        </div>
      </div>

      {/* Pending review pill */}
      {resident.epaPending > 0 && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            borderRadius: 99,
            background: "rgba(245, 158, 11, 0.12)",
            color: "var(--warning)",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={11} />
          {resident.epaPending} pending your review
        </div>
      )}
    </button>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  color,
  sublabel,
  suffix,
  emphasize,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  sublabel?: string;
  suffix?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: emphasize ? "1px solid rgba(239, 68, 68, 0.45)" : "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 16px",
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
            width: 28,
            height: 28,
            borderRadius: 7,
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
          fontSize: 26,
          fontWeight: 700,
          color: emphasize ? "var(--danger)" : "var(--text)",
          fontFamily: MONO,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
        {suffix && (
          <span style={{ fontSize: 14, color: "var(--text-3)", fontWeight: 500, marginLeft: 2 }}>
            {suffix}
          </span>
        )}
      </div>
      {sublabel && (
        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

// ── Helpers / small components ───────────────────────────────────────────────

function ResidentAvatar({ image, name }: { image: string | null; name: string | null }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name || "Resident"}
        style={{
          width: 38,
          height: 38,
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
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: "rgba(14, 165, 233, 0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        color: "var(--primary)",
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

const selectStyle: React.CSSProperties = {
  padding: "9px 12px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--text)",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
  minWidth: 140,
};
