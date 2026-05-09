"use client";

// ---------------------------------------------------------------------------
// /pd-dashboard/reports — accreditation report hub.
//
// Eight one-click downloads — exactly the reports a Royal College
// accreditation reviewer asks for at a site visit. CSV format opens
// cleanly in Excel (BOM-prefixed UTF-8) and feeds into any institutional
// reporting pipeline.
//
// Owner / PD-only by API contract; non-owners get a friendly empty
// state.
// ---------------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface OwnedProgram {
  id: string;
  name: string;
  myRole: string;
}

interface ReportSpec {
  id: string;
  title: string;
  description: string;
}

const REPORTS: ReportSpec[] = [
  { id: "epa-matrix",          title: "EPA completion matrix",         description: "Resident × EPA matrix — total / signed / achieved / percent. The single most-asked-for accreditation table." },
  { id: "cohort-heatmap",      title: "Cohort progression heatmap",    description: "Per-resident percent signed by stage (TD / F / COD / TTP). Paste into Excel for a heat map." },
  { id: "signoff-latency",     title: "Sign-off latency",              description: "Days from EPA request to sign-off, median + p90 per attending. Reviewers ask 'how long do attendings sit on EPAs?'" },
  { id: "case-volume",         title: "Case volume by procedure",      description: "Per-resident procedure counts split by autonomy role (primary / assistant / observer / teacher)." },
  { id: "silent-days",         title: "Silent residents",              description: "Days since last logged case + EPA per resident. Anyone silent ≥ 14 days surfaces first." },
  { id: "cc-decisions",        title: "CC decisions log",              description: "Every CC review's decision, rationale, dissent, and chair — your 25-year audit trail." },
  { id: "faculty-observations",title: "Faculty observations",          description: "Attendings ranked by total EPAs signed, with achievement and average O-Score." },
  { id: "demographics",        title: "Programme demographics",        description: "Per-resident case mix by approach (open / lap / robotic / endo), autonomy role, and complication rate." },
];

export default function ReportsHubPage() {
  const [programs, setPrograms] = useState<OwnedProgram[]>([]);
  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/programs");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const owned = (json.programs ?? []).filter(
        (p: OwnedProgram) => p.myRole === "OWNER" || p.myRole === "PD",
      );
      setPrograms(owned);
      if (owned[0]) setActiveProgramId(owned[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function downloadReport(reportId: string) {
    if (!activeProgramId) return;
    setDownloadingId(reportId);
    try {
      const url = `/api/pd/reports/${reportId}?programId=${encodeURIComponent(activeProgramId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? `Download failed (HTTP ${res.status})`);
        return;
      }
      // Pull the filename out of the Content-Disposition header.
      const dispo = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(dispo);
      const filename = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : `${reportId}.csv`;
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, display: "flex", justifyContent: "center", color: "var(--text-3)" }}>
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }
  if (programs.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20, color: "var(--text)", margin: "0 0 8px" }}>
          Accreditation reports
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
          You aren&rsquo;t a program owner yet. Reports are restricted to
          OWNER / PD roles since they contain cohort-level data. Set up
          a program from{" "}
          <Link href="/programs" style={{ color: "var(--primary)" }}>
            /programs
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn .4s cubic-bezier(.16,1,.3,1) forwards" }}>
      <Link
        href="/pd-dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: "var(--text-3)",
          textDecoration: "none",
          marginBottom: 14,
        }}
      >
        <ArrowLeft size={12} />
        Back to PD dashboard
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.4px",
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FileSpreadsheet size={18} color="var(--primary)" />
            Accreditation reports
          </h1>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            Eight canned reports the Royal College reviewer asks for. CSVs open in Excel.
          </div>
        </div>
        {programs.length > 1 && (
          <select
            value={activeProgramId ?? ""}
            onChange={(e) => setActiveProgramId(e.target.value)}
            className="st-input"
            style={{ width: "auto" }}
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Privacy notice */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "10px 14px",
          marginBottom: 18,
          background: "rgba(14,165,233,0.04)",
          border: "1px solid rgba(14,165,233,0.18)",
          borderRadius: 12,
          fontSize: 12,
          color: "var(--text-2)",
          lineHeight: 1.55,
        }}
      >
        <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 2, color: "var(--primary)" }} />
        <div>
          Reports contain cohort-level data scoped to this program only.
          No patient identifiers are present at any point — Hippo&rsquo;s
          schema does not store PHI by design.
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {REPORTS.map((r) => {
          const busy = downloadingId === r.id;
          return (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: 14,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 3,
                    letterSpacing: "-0.1px",
                  }}
                >
                  {r.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-3)",
                    lineHeight: 1.55,
                  }}
                >
                  {r.description}
                </div>
              </div>
              <button
                onClick={() => downloadReport(r.id)}
                disabled={busy || !activeProgramId}
                className="press-soft"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "var(--surface2)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  cursor: busy ? "wait" : "pointer",
                  opacity: busy ? 0.6 : 1,
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {busy ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Download size={12} />
                )}
                {busy ? "Generating…" : "Download CSV"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
