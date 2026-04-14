"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Inbox, FileText, Activity, Plus, Settings, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type StaffStats = {
  casesThisMonth: number;
  casesYtd: number;
  casesTotal: number;
  pendingSignOffs: number;
  signedThisMonth: number;
  signedYtd: number;
  topProcedures: { name: string; count: number }[];
  recentCases: {
    id: string;
    procedureName: string;
    caseDate: string;
    surgicalApproach: string | null;
    role: string | null;
  }[];
  recentSigned: {
    id: string;
    epaId: string;
    epaTitle: string;
    signedAt: string | null;
    entrustmentScore: number | null;
    residentName: string | null;
  }[];
};

/**
 * Staff / attending / PD home dashboard.
 * Shows personal case volume + teaching load in one glance.
 */
export function StaffDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/stats", { credentials: "include" })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled) { setStats(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Surgeon";
  const roleLabel = profile?.roleType
    ? profile.roleType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    : "Attending";

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      {/* Header */}
      <div style={{
        marginBottom: 32,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 11, color: "var(--text-3)", marginBottom: 8, letterSpacing: ".04em",
            fontFamily: "'Geist', sans-serif",
          }}>
            {roleLabel}{profile?.specialty && ` \u00b7 ${profile.specialty}`}
            {profile?.institution && ` \u00b7 ${profile.institution}`}
          </div>
          <div style={{
            fontSize: 32, fontWeight: 800, color: "var(--text)",
            letterSpacing: "-1.5px", lineHeight: 1, fontFamily: "'Geist', sans-serif",
          }}>
            Dr. {firstName}
          </div>
        </div>
        <Link href="/settings" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 40, height: 40, borderRadius: 10,
          background: "var(--surface)", border: "1px solid var(--border-mid)",
          color: "var(--text-2)", textDecoration: "none",
        }} aria-label="Settings">
          <Settings size={16} />
        </Link>
      </div>

      {/* Pending sign-offs banner (highest-priority CTA for attendings) */}
      {stats && stats.pendingSignOffs > 0 && (
        <Link href="/inbox" style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px", marginBottom: 20,
          background: "#0EA5E910",
          border: "1px solid #0EA5E930",
          borderRadius: 12,
          textDecoration: "none", color: "var(--text-1)",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "#0EA5E920",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#0EA5E9", flexShrink: 0,
          }}>
            <Inbox size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
              {stats.pendingSignOffs === 1
                ? "1 EPA awaiting your signature"
                : `${stats.pendingSignOffs} EPAs awaiting your signature`}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              Residents are waiting on your feedback. Tap to review.
            </div>
          </div>
          <ChevronRight size={16} style={{ color: "var(--text-3)", flexShrink: 0 }} />
        </Link>
      )}

      {/* Primary actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
        <Link href="/log" style={primaryAction}>
          <Plus size={16} /> Log a case
        </Link>
        <Link href="/api/epa/export?format=xlsx" style={secondaryAction}>
          <Download size={16} /> MOC / portfolio export
        </Link>
      </div>

      {/* Stats grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10, marginBottom: 28,
      }}>
        <StatCard label="Cases this month" value={stats?.casesThisMonth ?? 0} loading={loading} />
        <StatCard label="YTD" value={stats?.casesYtd ?? 0} loading={loading} />
        <StatCard label="EPAs signed (month)" value={stats?.signedThisMonth ?? 0} loading={loading} accent="#10B981" />
        <StatCard label="EPAs signed YTD" value={stats?.signedYtd ?? 0} loading={loading} accent="#10B981" />
      </div>

      {/* Two-column: recent cases + recent signed EPAs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        <Section title="Recent cases" href="/cases" icon={<Activity size={14} />}>
          {loading ? (
            <SkeletonRow />
          ) : !stats?.recentCases.length ? (
            <Empty text="No cases logged yet. Log your first one above." />
          ) : (
            stats.recentCases.map(c => (
              <Link key={c.id} href={`/cases/${c.id}`} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: "var(--text-1)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.procedureName}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    {new Date(c.caseDate).toLocaleDateString()}{c.surgicalApproach && ` \u00b7 ${c.surgicalApproach}`}{c.role && ` \u00b7 ${c.role}`}
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: "var(--text-3)" }} />
              </Link>
            ))
          )}
        </Section>

        <Section title="Recent sign-offs" href="/inbox" icon={<FileText size={14} />}>
          {loading ? (
            <SkeletonRow />
          ) : !stats?.recentSigned.length ? (
            <Empty text="No EPAs signed yet. Residents' submissions will appear here." />
          ) : (
            stats.recentSigned.map(e => (
              <div key={e.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: "var(--text-1)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {e.epaId} {"\u2014"} {e.epaTitle}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    {e.residentName ?? "Resident"}{e.signedAt && ` \u00b7 ${new Date(e.signedAt).toLocaleDateString()}`}
                    {e.entrustmentScore && ` \u00b7 O-Score ${e.entrustmentScore}`}
                  </div>
                </div>
              </div>
            ))
          )}
        </Section>

        {stats?.topProcedures.length ? (
          <Section title="Your top procedures" icon={<Activity size={14} />}>
            {stats.topProcedures.map(p => {
              const pct = Math.round((p.count / (stats.topProcedures[0]?.count ?? 1)) * 100);
              return (
                <div key={p.name} style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{p.count}</span>
                  </div>
                  <div style={{ height: 4, background: "var(--bg-2)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#0EA5E9", borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </Section>
        ) : null}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────
const primaryAction: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "14px 16px", borderRadius: 12,
  background: "linear-gradient(135deg, #0EA5E9, #0284C7)",
  color: "#fff", fontSize: 14, fontWeight: 600,
  textDecoration: "none",
};
const secondaryAction: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "14px 16px", borderRadius: 12,
  background: "var(--surface)", border: "1px solid var(--border-mid)",
  color: "var(--text-1)", fontSize: 14, fontWeight: 600,
  textDecoration: "none",
};

function StatCard({ label, value, loading, accent }: { label: string; value: number; loading: boolean; accent?: string }) {
  return (
    <div style={{
      padding: "14px 14px", borderRadius: 12,
      background: "var(--surface)", border: "1px solid var(--border-mid)",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: ".03em", marginBottom: 6 }}>{label}</div>
      <div style={{
        fontSize: 24, fontWeight: 700, color: accent ?? "var(--text)",
        fontFamily: "'Geist', sans-serif", letterSpacing: "-.5px",
      }}>
        {loading ? "\u2014" : value}
      </div>
    </div>
  );
}

function Section({ title, href, icon, children }: { title: string; href?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border-mid)", overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px", borderBottom: "1px solid var(--border-mid)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-2)", fontSize: 12, fontWeight: 600, letterSpacing: ".03em" }}>
          {icon}{title.toUpperCase()}
        </div>
        {href && (
          <Link href={href} style={{ fontSize: 12, color: "var(--text-3)", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
            View all <ChevronRight size={12} />
          </Link>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "12px 14px", borderBottom: "1px solid var(--border-mid)",
  textDecoration: "none", color: "inherit",
};

function SkeletonRow() {
  return (
    <div style={{ padding: 14 }}>
      <div style={{ height: 12, width: "60%", background: "var(--bg-2)", borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 10, width: "40%", background: "var(--bg-2)", borderRadius: 4 }} />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: "24px 14px", fontSize: 13, color: "var(--text-3)", textAlign: "center" }}>{text}</div>
  );
}
