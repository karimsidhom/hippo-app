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
  ArrowUpDown,
  LayoutGrid,
  Rows3,
  FileSpreadsheet,
} from "lucide-react";

// ── Layout constants ────────────────────────────────────────────────────
// Desktop (≥ 768 px) defaults to the dense table because that's where
// scanning a 30-resident program actually lives. Mobile defaults to
// cards because tables don't scan well on narrow screens.
type ViewMode = "table" | "cards";
type SortKey =
  | "lastCase"      // default — silent first, then most recent
  | "name"
  | "year"
  | "casesMonth"
  | "epaProgress"
  | "epaPending";
type SortDir = "asc" | "desc";

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
  // Persisted lightweight UI state — defaults set on mount so SSR/CSR
  // hydration matches and mobile / desktop pick the right initial view.
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortKey, setSortKey] = useState<SortKey>("lastCase");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Default to cards on mobile; remember the user's last choice in
  // localStorage so it sticks across sessions.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("pdDashView");
    if (saved === "cards" || saved === "table") {
      setViewMode(saved);
      return;
    }
    if (window.matchMedia("(max-width: 767px)").matches) {
      setViewMode("cards");
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("pdDashView", viewMode);
  }, [viewMode]);

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

  // Demo storyboard's "Mapped Cases" — cohort total. Every case logged
  // by the cohort, all-time. Headline number; the weekly delta is the
  // sublabel so we keep the action-focused signal too.
  const mappedCasesTotal = residents.reduce((s, r) => s + r.totalCases, 0);

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

  // ── Action queue: residents who need PD attention right now ─────────
  // - silent ≥ 14 days, OR
  // - have ≥ 1 EPA pending review (someone needs to sign)
  // Surfaced above the cohort so the PD doesn't have to scan to find them.
  const actionQueue = residents
    .filter((r) => {
      const silent = !r.lastCaseDate || daysSince(r.lastCaseDate) >= SILENT_DAYS;
      return silent || r.epaPending > 0;
    })
    .slice()
    .sort((a, b) => {
      // Silent + pending EPAs first, then silent only, then pending only.
      const aSilent = !a.lastCaseDate || daysSince(a.lastCaseDate) >= SILENT_DAYS;
      const bSilent = !b.lastCaseDate || daysSince(b.lastCaseDate) >= SILENT_DAYS;
      const aScore = (aSilent ? 2 : 0) + (a.epaPending > 0 ? 1 : 0);
      const bScore = (bSilent ? 2 : 0) + (b.epaPending > 0 ? 1 : 0);
      if (aScore !== bScore) return bScore - aScore;
      // Then by silence duration (longest first).
      const aDays = a.lastCaseDate ? daysSince(a.lastCaseDate) : 9999;
      const bDays = b.lastCaseDate ? daysSince(b.lastCaseDate) : 9999;
      return bDays - aDays;
    });

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
    .sort((a, b) => sortResidents(a, b, sortKey, sortDir));

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

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Eight pre-built accreditation reports — Royal College
              reviewer's checklist in one click. Lives at its own
              page so the PD can pick which one to download. */}
          <Link
            href="/pd-dashboard/reports"
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
              fontFamily: "inherit",
              textDecoration: "none",
            }}
          >
            <FileSpreadsheet size={14} />
            Accreditation reports
          </Link>
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
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      {/* Top row mirrors the demo storyboard's three headline tiles:
          Mapped Cases / EPA Completion / Silent residents. The
          weekly-cases delta moves into the Mapped Cases sublabel so
          the PD still sees the action signal without a fifth tile.
          Demo also showed an "Overall Level" tile but that's the
          aggregate competency level which we don't compute server-side
          yet — using "Avg EPA completion" already conveys cohort
          progress, so we keep that as the third progress tile. */}
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
          label="Mapped Cases"
          value={mappedCasesTotal}
          color="var(--primary)"
          sublabel={`${casesThisWeek} this week`}
        />
        <KpiCard
          icon={<CheckCircle2 size={16} />}
          label="EPA Completion"
          value={avgEpaCompletion}
          color="var(--success)"
          suffix="%"
          sublabel={`${epasSignedTotal} signed`}
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
          label="Cohort size"
          value={residents.length}
          color="var(--text-2)"
          sublabel={`${residentCount} residents · ${fellowCount} fellows`}
        />
      </div>

      {/* ── Action queue ──────────────────────────────────────────────── */}
      {/* Residents who need PD attention right now: silent ≥ 14 days OR
          have EPAs pending sign-off. One quick-scan strip so the PD lands
          on the dashboard and immediately sees who to follow up with. */}
      {actionQueue.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 18,
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
            <AlertTriangle size={14} style={{ color: "var(--warning)" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-2)",
              }}
            >
              Needs your attention
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                fontFamily: MONO,
                marginLeft: "auto",
              }}
            >
              {actionQueue.length} resident{actionQueue.length === 1 ? "" : "s"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {actionQueue.slice(0, 6).map((r) => {
              const days = r.lastCaseDate ? daysSince(r.lastCaseDate) : null;
              const silent = days === null || days >= SILENT_DAYS;
              return (
                <button
                  key={r.userId}
                  type="button"
                  onClick={() => router.push(`/pd-dashboard/${r.userId}`)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px 6px 8px",
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 99,
                    color: "var(--text)",
                    fontSize: 12,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "border-color .15s",
                  }}
                  title={[
                    silent
                      ? days === null
                        ? "No cases logged yet"
                        : `Silent ${days} days`
                      : null,
                    r.epaPending > 0
                      ? `${r.epaPending} EPA${r.epaPending === 1 ? "" : "s"} pending review`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  <ResidentAvatar image={r.image} name={r.name} compact />
                  <span style={{ fontWeight: 600 }}>
                    {(r.name || r.email).split(" ")[0]}
                  </span>
                  {silent && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--danger)",
                        fontFamily: MONO,
                      }}
                    >
                      {days === null ? "0d" : `${days}d`}
                    </span>
                  )}
                  {r.epaPending > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--warning)",
                        fontFamily: MONO,
                      }}
                    >
                      {r.epaPending} EPA
                    </span>
                  )}
                </button>
              );
            })}
            {actionQueue.length > 6 && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  alignSelf: "center",
                  paddingLeft: 4,
                }}
              >
                + {actionQueue.length - 6} more below
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Filter / search / view bar ────────────────────────────────── */}
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
        <div
          role="group"
          aria-label="View mode"
          style={{
            display: "inline-flex",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 2,
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            title="Table view"
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "none",
              background: viewMode === "table" ? "var(--surface2)" : "transparent",
              color: viewMode === "table" ? "var(--text)" : "var(--text-3)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "inherit",
            }}
          >
            <Rows3 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            aria-pressed={viewMode === "cards"}
            title="Card view"
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "none",
              background: viewMode === "cards" ? "var(--surface2)" : "transparent",
              color: viewMode === "cards" ? "var(--text)" : "var(--text-3)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "inherit",
            }}
          >
            <LayoutGrid size={14} />
          </button>
        </div>
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

      {/* ── Cohort: table OR cards ────────────────────────────────────── */}
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
          ) : viewMode === "cards" ? (
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
          ) : (
            <ResidentTable
              residents={filtered}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={(key) => {
                if (key === sortKey) {
                  setSortDir(sortDir === "asc" ? "desc" : "asc");
                } else {
                  setSortKey(key);
                  setSortDir(defaultSortDirFor(key));
                }
              }}
              onRowClick={(id) => router.push(`/pd-dashboard/${id}`)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Resident table ──────────────────────────────────────────────────────────
//
// Dense, scannable, sortable. Header click toggles direction; clicking a
// different column changes the active sort. Designed for ≥ 768 px viewports
// (the toggle in the filter bar lets PDs pick their preference). Each row
// is a real <button>-style row so keyboard / screen-reader users can use it.

function ResidentTable({
  residents,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
}: {
  residents: ResidentData[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onRowClick: (userId: string) => void;
}) {
  const headers: Array<{ key: SortKey; label: string; align?: "right" }> = [
    { key: "name", label: "Resident" },
    { key: "year", label: "Year" },
    { key: "casesMonth", label: "Cases / mo", align: "right" },
    { key: "lastCase", label: "Last case", align: "right" },
    { key: "epaProgress", label: "EPAs", align: "right" },
    { key: "epaPending", label: "Pending", align: "right" },
  ];
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        // Horizontal scroll wrapper for narrow viewports; the table itself
        // still hits a min-width so columns don't crush.
        style={{ overflowX: "auto" }}
      >
        <table
          style={{
            width: "100%",
            minWidth: 720,
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              {headers.map((h) => {
                const active = sortKey === h.key;
                return (
                  <th
                    key={h.key}
                    onClick={() => onSort(h.key)}
                    style={{
                      textAlign: h.align ?? "left",
                      padding: "10px 14px",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: active ? "var(--text)" : "var(--text-3)",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      background: "var(--surface)",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        justifyContent: h.align === "right" ? "flex-end" : "flex-start",
                        width: "100%",
                      }}
                    >
                      {h.label}
                      <ArrowUpDown
                        size={11}
                        style={{
                          opacity: active ? 1 : 0.3,
                          transform: active && sortDir === "asc" ? "rotate(180deg)" : undefined,
                          transition: "transform .15s",
                        }}
                      />
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {residents.map((r) => (
              <ResidentRow key={r.userId} resident={r} onClick={() => onRowClick(r.userId)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResidentRow({
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

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        cursor: "pointer",
        background: silent ? "rgba(239, 68, 68, 0.04)" : undefined,
        transition: "background .15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = silent ? "rgba(239, 68, 68, 0.04)" : "";
      }}
    >
      {/* Resident — avatar + name + role pill */}
      <td
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border)",
          minWidth: 220,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <ResidentAvatar image={resident.image} name={resident.name} compact />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {resident.name || resident.email}
            </div>
            {resident.specialty && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  marginTop: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {resident.specialty}
              </div>
            )}
          </div>
          {resident.roleType === "FELLOW" && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "2px 6px",
                borderRadius: 4,
                background: "rgba(139, 92, 246, 0.12)",
                color: "#a78bfa",
                flexShrink: 0,
              }}
            >
              Fellow
            </span>
          )}
        </div>
      </td>

      {/* Year */}
      <td
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border)",
          color: "var(--text-2)",
          fontFamily: MONO,
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        {resident.trainingYearLabel ||
          (resident.pgyYear != null ? `PGY-${resident.pgyYear}` : "—")}
      </td>

      {/* Cases this month */}
      <td
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border)",
          color: "var(--text)",
          fontFamily: MONO,
          fontSize: 13,
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {resident.casesThisMonth}
      </td>

      {/* Last case */}
      <td
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border)",
          textAlign: "right",
          whiteSpace: "nowrap",
          fontSize: 12,
          fontFamily: MONO,
          color: silent ? "var(--danger)" : "var(--text-2)",
        }}
      >
        {lastDays === null
          ? "—"
          : lastDays === 0
            ? "today"
            : `${lastDays}d ago`}
      </td>

      {/* EPA progress — bar + count */}
      <td
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border)",
          minWidth: 140,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              height: 4,
              width: 70,
              background: "var(--border)",
              borderRadius: 99,
              overflow: "hidden",
              flexShrink: 0,
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
          <span
            style={{
              fontSize: 11,
              color: "var(--text-2)",
              fontFamily: MONO,
              minWidth: 56,
              textAlign: "right",
              whiteSpace: "nowrap",
            }}
          >
            {resident.epaSigned}/{resident.epaTotal}
          </span>
        </div>
      </td>

      {/* Pending review */}
      <td
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border)",
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {resident.epaPending > 0 ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 8px",
              borderRadius: 99,
              background: "rgba(245, 158, 11, 0.12)",
              color: "var(--warning)",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: MONO,
            }}
          >
            <AlertTriangle size={10} />
            {resident.epaPending}
          </span>
        ) : (
          <span style={{ color: "var(--text-3)", fontFamily: MONO, fontSize: 11 }}>—</span>
        )}
      </td>
    </tr>
  );
}

// Sort comparator. Silent-first remains an implicit tiebreaker on
// `lastCase` so PDs naturally see who's slipped first.
function sortResidents(
  a: ResidentData,
  b: ResidentData,
  key: SortKey,
  dir: SortDir,
): number {
  const flip = dir === "asc" ? 1 : -1;
  switch (key) {
    case "name": {
      const an = (a.name || a.email).toLowerCase();
      const bn = (b.name || b.email).toLowerCase();
      return an.localeCompare(bn) * flip;
    }
    case "year": {
      const ay = a.pgyYear ?? -1;
      const by = b.pgyYear ?? -1;
      return (ay - by) * flip;
    }
    case "casesMonth":
      return (a.casesThisMonth - b.casesThisMonth) * flip;
    case "epaProgress": {
      const ap = a.epaTotal > 0 ? a.epaSigned / a.epaTotal : 0;
      const bp = b.epaTotal > 0 ? b.epaSigned / b.epaTotal : 0;
      return (ap - bp) * flip;
    }
    case "epaPending":
      return (a.epaPending - b.epaPending) * flip;
    case "lastCase":
    default: {
      // Silent-first then most-recent-first when desc.
      const aSilent = a.lastCaseDate ? daysSince(a.lastCaseDate) >= SILENT_DAYS : true;
      const bSilent = b.lastCaseDate ? daysSince(b.lastCaseDate) >= SILENT_DAYS : true;
      if (aSilent !== bSilent) return aSilent ? -1 : 1;
      const aT = a.lastCaseDate ? new Date(a.lastCaseDate).getTime() : 0;
      const bT = b.lastCaseDate ? new Date(b.lastCaseDate).getTime() : 0;
      return (aT - bT) * flip;
    }
  }
}

function defaultSortDirFor(key: SortKey): SortDir {
  // Numeric / date columns descend (highest / most recent first); name
  // ascends so A-Z reads naturally on first click.
  return key === "name" ? "asc" : "desc";
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

function ResidentAvatar({
  image,
  name,
  compact,
}: {
  image: string | null;
  name: string | null;
  compact?: boolean;
}) {
  const size = compact ? 24 : 38;
  const fontSize = compact ? 11 : 14;
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
        fontSize,
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
