"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CaseLog } from "@/lib/types";
import { exportSafeTransform } from "@/lib/phia";
import { HippoMark } from "@/components/HippoMark";

// ---------------------------------------------------------------------------
// /cases/logbook-print
//
// Print-optimized logbook view. Opens in a new tab, auto-prompts the
// browser's print dialog on load, and is styled for A4/letter paper
// via the @media print rules at the bottom of this file.
//
// Users can "Save as PDF" from the print dialog to get an interview /
// fellowship-ready copy of their logbook — the anchor Hippo Pro feature.
//
// All cases are run through exportSafeTransform() client-side here to
// strip any incidental PHI (names, MRNs, DOBs) before display, matching
// the behaviour of the Excel export. PHIA-safe by construction.
// ---------------------------------------------------------------------------

const APPROACH_LABELS: Record<string, string> = {
  OPEN: "Open",
  LAPAROSCOPIC: "Lap",
  ROBOTIC: "Robotic",
  ENDOSCOPIC: "Endo",
  HYBRID: "Hybrid",
  PERCUTANEOUS: "Perc",
  OTHER: "Other",
};

const ROLE_LABELS: Record<string, string> = {
  OBSERVER: "Observer",
  ASSISTANT: "Assistant",
  FIRST_ASSISTANT: "1st Assist",
  PRIMARY_SURGEON: "Primary",
  CONSOLE_SURGEON: "Console",
};

const OUTCOME_LABELS: Record<string, string> = {
  UNCOMPLICATED: "Uncomp",
  MINOR_COMPLICATION: "Minor",
  MAJOR_COMPLICATION: "Major",
  REOPERATION: "Reop",
  DEATH: "Death",
  UNKNOWN: "—",
};

function formatDate(iso: string | Date): string {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function statusLabel(s: string): string {
  switch (s) {
    case "SIGNED":         return "Verified";
    case "PENDING_REVIEW": return "Pending";
    case "SUBMITTED":      return "Submitted";
    case "RETURNED":       return "Returned";
    case "DRAFT":          return "Draft";
    default:               return s;
  }
}

function statusColor(s: string): string {
  switch (s) {
    case "SIGNED":         return "#0f5132"; // deep green
    case "PENDING_REVIEW": return "#8c5a00"; // warm amber
    case "SUBMITTED":      return "#1e40af"; // deep blue
    case "RETURNED":       return "#991b1b"; // deep red
    case "DRAFT":          return "#64748b"; // slate
    default:               return "#475569";
  }
}

// Matches the shape returned by GET /api/epa/observations — we only pull the
// columns we'll render, plus signed* for the verified block.
interface LogbookObservation {
  id: string;
  epaId: string;
  epaTitle: string;
  observationDate: string;
  status: "DRAFT" | "SUBMITTED" | "PENDING_REVIEW" | "SIGNED" | "RETURNED";
  entrustmentScore: number | null;
  achievement: "NOT_ACHIEVED" | "ACHIEVED";
  assessorName: string;
  signedAt: string | null;
  signedByName: string | null;
  caseLog?: {
    id: string;
    procedureName: string;
    caseDate: string;
  } | null;
}

export default function LogbookPrintPage() {
  const { user, profile, cases, loading } = useAuth();
  const [printed, setPrinted] = useState(false);
  const [epas, setEpas] = useState<LogbookObservation[]>([]);
  const [epasLoading, setEpasLoading] = useState(true);

  // Fetch this user's EPA observations once. We show ALL statuses in the
  // "EPA Assessments" section so reviewers see the full picture — but
  // the "Verified" column makes it visually unambiguous which ones count
  // toward the academic record.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/epa/observations", { cache: "no-store" });
        if (!res.ok) return;
        const rows = (await res.json()) as LogbookObservation[];
        if (!cancelled) setEpas(rows);
      } finally {
        if (!cancelled) setEpasLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const safeCases = useMemo(
    () =>
      [...cases]
        .sort(
          (a, b) =>
            new Date(b.caseDate).getTime() - new Date(a.caseDate).getTime(),
        )
        .map((c) => exportSafeTransform(c as never)),
    [cases],
  );

  // Sort EPAs newest-first, and group SIGNED at the top of the status
  // list so reviewers see verified entries immediately. Within each
  // status, descending by observationDate.
  const sortedEpas = useMemo(() => {
    const statusOrder: Record<string, number> = {
      SIGNED: 0, PENDING_REVIEW: 1, SUBMITTED: 2, RETURNED: 3, DRAFT: 4,
    };
    return [...epas].sort((a, b) => {
      const sa = statusOrder[a.status] ?? 99;
      const sb = statusOrder[b.status] ?? 99;
      if (sa !== sb) return sa - sb;
      return new Date(b.observationDate).getTime() - new Date(a.observationDate).getTime();
    });
  }, [epas]);

  const epaStats = useMemo(() => {
    const total = epas.length;
    const verified = epas.filter(o => o.status === "SIGNED").length;
    const pending = epas.filter(o => o.status === "PENDING_REVIEW" || o.status === "SUBMITTED").length;
    const returned = epas.filter(o => o.status === "RETURNED").length;
    return { total, verified, pending, returned };
  }, [epas]);

  // Stats for the header summary block.
  const stats = useMemo(() => {
    const total = cases.length;
    const byApproach = new Map<string, number>();
    const byRole = new Map<string, number>();
    const bySpecialty = new Map<string, number>();
    let totalMinutes = 0;
    for (const c of cases) {
      const a = String(c.surgicalApproach ?? "OTHER").toUpperCase();
      byApproach.set(a, (byApproach.get(a) ?? 0) + 1);
      const r = String(c.role ?? "OTHER").toUpperCase();
      byRole.set(r, (byRole.get(r) ?? 0) + 1);
      const s = c.specialtyName ?? c.specialtyId ?? "—";
      bySpecialty.set(s, (bySpecialty.get(s) ?? 0) + 1);
      if (c.operativeDurationMinutes) totalMinutes += c.operativeDurationMinutes;
    }
    const firstDate =
      cases.length > 0
        ? new Date(
            Math.min(...cases.map((c) => new Date(c.caseDate).getTime())),
          )
        : null;
    const lastDate =
      cases.length > 0
        ? new Date(
            Math.max(...cases.map((c) => new Date(c.caseDate).getTime())),
          )
        : null;
    return { total, byApproach, byRole, bySpecialty, totalMinutes, firstDate, lastDate };
  }, [cases]);

  // Fire the print dialog once both cases and EPAs are loaded. Otherwise
  // the print preview catches mid-fetch and the user gets a logbook
  // without their EPA table.
  useEffect(() => {
    if (loading || epasLoading || printed || cases.length === 0) return;
    const t = setTimeout(() => {
      setPrinted(true);
      window.print();
    }, 450);
    return () => clearTimeout(t);
  }, [loading, epasLoading, printed, cases.length]);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#666" }}>
        Loading logbook…
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#666" }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          No cases to print
        </div>
        <div style={{ fontSize: 13 }}>
          Log your first case, then come back here.
        </div>
      </div>
    );
  }

  return (
    <div className="logbook-root">
      {/* Floating toolbar — hidden when printing */}
      <div className="logbook-toolbar no-print">
        <div style={{ fontSize: 12, color: "#555" }}>
          <strong>Hippo</strong> · Logbook PDF export
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: "6px 14px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Print / Save as PDF
          </button>
          <button
            onClick={() => window.close()}
            style={{
              padding: "6px 12px",
              background: "transparent",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>

      <div className="logbook-page">
        {/* ── Header ───────────────────────────────────────────── */}
        <div className="logbook-header">
          <div className="logbook-header-left">
            <div className="logbook-eyebrow">Surgical Case Log · Official Record</div>
            <div className="logbook-title">{user?.name ?? user?.email ?? "Hippo user"}</div>
            <div className="logbook-sub">
              {profile?.trainingYearLabel
                ? profile.trainingYearLabel
                : profile?.pgyYear
                  ? `PGY-${profile.pgyYear}`
                  : null}
              {profile?.specialty ? `${profile?.trainingYearLabel || profile?.pgyYear ? " · " : ""}${profile.specialty}` : ""}
              {profile?.institution ? ` · ${profile.institution}` : ""}
              {profile?.trainingCountry
                ? ` · ${profile.trainingCountry === "CA" ? "RCPSC" : profile.trainingCountry === "US" ? "ACGME" : profile.trainingCountry}`
                : ""}
            </div>
          </div>
          <div className="logbook-brand">
            <div className="logbook-brand-lockup">
              <HippoMark size={34} />
              <div className="logbook-brand-text">
                <span className="logbook-brand-wordmark">
                  Hippo<sup>™</sup>
                </span>
                <span className="logbook-brand-company">Hippo Medicine Inc.</span>
              </div>
            </div>
            <div className="logbook-brand-caption">
              Generated {formatDate(new Date())}
            </div>
          </div>
        </div>

        {/* ── Summary block ────────────────────────────────────── */}
        <div className="logbook-summary">
          <SummaryCell label="Total cases" value={String(stats.total)} />
          <SummaryCell
            label="Date range"
            value={
              stats.firstDate && stats.lastDate
                ? `${formatDate(stats.firstDate)} – ${formatDate(stats.lastDate)}`
                : "—"
            }
          />
          <SummaryCell
            label="OR time"
            value={`${Math.round(stats.totalMinutes / 60)} h`}
          />
          <SummaryCell
            label="Primary / Console"
            value={String(
              (stats.byRole.get("PRIMARY_SURGEON") ?? 0) +
                (stats.byRole.get("CONSOLE_SURGEON") ?? 0),
            )}
          />
        </div>

        {/* Breakdowns — specialty (if >1), role, approach */}
        <div className="logbook-breakdown-grid">
          {stats.bySpecialty.size > 1 && (
            <div className="logbook-breakdown">
              <div className="logbook-breakdown-label">By specialty</div>
              <div className="logbook-breakdown-list">
                {Array.from(stats.bySpecialty.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([spec, n]) => (
                    <div key={spec} className="logbook-breakdown-item">
                      <span>{spec}</span>
                      <span className="logbook-breakdown-num">{n}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          <div className="logbook-breakdown">
            <div className="logbook-breakdown-label">By role</div>
            <div className="logbook-breakdown-list">
              {Array.from(stats.byRole.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([role, n]) => (
                  <div key={role} className="logbook-breakdown-item">
                    <span>{ROLE_LABELS[role.toUpperCase()] ?? role}</span>
                    <span className="logbook-breakdown-num">{n}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="logbook-breakdown">
            <div className="logbook-breakdown-label">By approach</div>
            <div className="logbook-breakdown-list">
              {Array.from(stats.byApproach.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([a, n]) => (
                  <div key={a} className="logbook-breakdown-item">
                    <span>{APPROACH_LABELS[a.toUpperCase()] ?? a}</span>
                    <span className="logbook-breakdown-num">{n}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* ── Case table ───────────────────────────────────────── */}
        <table className="logbook-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th style={{ width: 78 }}>Date</th>
              <th>Procedure</th>
              <th style={{ width: 56 }}>Approach</th>
              <th style={{ width: 72 }}>Role</th>
              <th style={{ width: 38 }}>Diff</th>
              <th style={{ width: 40 }}>Min</th>
              <th style={{ width: 60 }}>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {safeCases.map((c, i) => (
              <tr key={c.id}>
                <td style={{ color: "#999", fontFamily: "ui-monospace, monospace", fontSize: 9 }}>
                  {safeCases.length - i}
                </td>
                <td>{c.caseDate ? formatDate(c.caseDate as unknown as string) : "—"}</td>
                <td style={{ fontWeight: 500 }}>{c.procedureName}</td>
                <td>{APPROACH_LABELS[String(c.surgicalApproach ?? "").toUpperCase()] ?? c.surgicalApproach}</td>
                <td>{ROLE_LABELS[String(c.role ?? "").toUpperCase()] ?? c.role}</td>
                <td style={{ textAlign: "center" }}>
                  {c.difficultyScore ? `${c.difficultyScore}/5` : "—"}
                </td>
                <td style={{ textAlign: "right", fontFamily: "ui-monospace, monospace" }}>
                  {c.operativeDurationMinutes ?? "—"}
                </td>
                <td style={{ fontSize: 9 }}>
                  {OUTCOME_LABELS[String(c.outcomeCategory ?? "").toUpperCase()] ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── EPA Assessments ──────────────────────────────────
             Separate table, distinct visual treatment. Verified rows
             get a solid green tick + bold "Verified by X on DATE"
             line so a reviewer scanning the printed page can tell
             academic-record-significant entries from merely logged
             ones at a glance. */}
        {sortedEpas.length > 0 && (
          <>
            <div className="logbook-section-header" style={{ marginTop: 24 }}>
              <div className="logbook-section-title">EPA Assessments</div>
              <div className="logbook-section-stats">
                <span><strong>{epaStats.verified}</strong> verified</span>
                {epaStats.pending > 0 && <span> · <strong>{epaStats.pending}</strong> awaiting review</span>}
                {epaStats.returned > 0 && <span> · <strong>{epaStats.returned}</strong> returned for edits</span>}
                <span> · <strong>{epaStats.total}</strong> total</span>
              </div>
            </div>
            <table className="logbook-table logbook-epa-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  <th style={{ width: 44 }}>Verified</th>
                  <th style={{ width: 78 }}>Date</th>
                  <th style={{ width: 50 }}>EPA</th>
                  <th>Title</th>
                  <th style={{ width: 36 }}>O-Score</th>
                  <th style={{ width: 70 }}>Status</th>
                  <th>Verified By</th>
                </tr>
              </thead>
              <tbody>
                {sortedEpas.map((o, i) => {
                  const isSigned = o.status === "SIGNED";
                  return (
                    <tr key={o.id} className={isSigned ? "logbook-epa-signed" : undefined}>
                      <td style={{ color: "#999", fontFamily: "ui-monospace, monospace", fontSize: 9 }}>
                        {sortedEpas.length - i}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: isSigned ? "#0f5132" : "#94a3b8", fontSize: 11 }}>
                        {isSigned ? "✓" : "—"}
                      </td>
                      <td>{formatDate(o.observationDate)}</td>
                      <td style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600, fontSize: 10 }}>
                        {o.epaId}
                      </td>
                      <td style={{ fontWeight: 500 }}>{o.epaTitle}</td>
                      <td style={{ textAlign: "center", fontFamily: "ui-monospace, monospace" }}>
                        {o.entrustmentScore ? `O-${o.entrustmentScore}` : "—"}
                      </td>
                      <td style={{ fontSize: 9, fontWeight: isSigned ? 700 : 500, color: statusColor(o.status) }}>
                        {statusLabel(o.status)}
                      </td>
                      <td style={{ fontSize: 9.5, color: isSigned ? "#0f172a" : "#94a3b8" }}>
                        {isSigned && o.signedByName ? (
                          <>
                            <div>{o.signedByName}</div>
                            {o.signedAt && (
                              <div style={{ fontSize: 8, color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
                                {formatDate(o.signedAt)}
                              </div>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {/* ── Certification + signature block ─────────────────── */}
        <div className="logbook-certification">
          <div className="logbook-certification-label">Certification</div>
          <div className="logbook-certification-body">
            I certify that the records contained in this logbook accurately reflect
            my operative experience as entered into the Hippo training platform.
            No patient-identifying information (names, medical record numbers, or
            dates of birth) is included in this document — all fields were scrubbed
            at export per PHIA / HIPAA guidelines.
          </div>
          <div className="logbook-sigline">
            <div className="logbook-sigcell">
              <div className="logbook-sigslot" />
              <div className="logbook-siglabel">Resident signature</div>
            </div>
            <div className="logbook-sigcell" style={{ maxWidth: 110 }}>
              <div className="logbook-sigslot" />
              <div className="logbook-siglabel">Date</div>
            </div>
          </div>
          <div className="logbook-sigline">
            <div className="logbook-sigcell">
              <div className="logbook-sigslot" />
              <div className="logbook-siglabel">Supervisor / Program Director signature</div>
            </div>
            <div className="logbook-sigcell" style={{ maxWidth: 110 }}>
              <div className="logbook-sigslot" />
              <div className="logbook-siglabel">Date</div>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="logbook-footer">
          <div>
            Hippo<sup>™</sup> is a trademark of Hippo Medicine Inc. ·
            © {new Date().getFullYear()} Hippo Medicine Inc. All rights reserved.
          </div>
          <div style={{ marginTop: 4 }}>
            hippomedicine.com · PHIA / HIPAA-safe export · Patient identifiers have been
            stripped from this document.
          </div>
        </div>
      </div>

      {/* ── Print-specific CSS ──────────────────────────────── */}
      <style jsx global>{`
        @page {
          size: letter;
          margin: 0.5in 0.5in 0.55in 0.5in;
        }

        .logbook-root {
          background: #e5e7eb;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif;
          color: #0f172a;
          padding: 80px 16px 32px;
        }

        .logbook-toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #fff;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #ddd;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          z-index: 100;
        }

        .logbook-page {
          background: #fff;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.6in 0.55in 0.55in;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          border-radius: 2px;
        }

        .logbook-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          padding-bottom: 14px;
          border-bottom: 2px solid #0f172a;
          margin-bottom: 18px;
        }
        .logbook-header-left {
          flex: 1 1 auto;
          min-width: 0;
        }
        .logbook-eyebrow {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0EA5E9;
          margin-bottom: 6px;
        }
        .logbook-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 4px;
          color: #0f172a;
        }
        .logbook-sub {
          font-size: 11px;
          color: #475569;
          line-height: 1.4;
        }
        .logbook-brand {
          flex-shrink: 0;
          text-align: right;
        }
        .logbook-brand-lockup {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .logbook-brand-text {
          display: flex;
          flex-direction: column;
          text-align: left;
          line-height: 1.15;
        }
        .logbook-brand-wordmark {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #0EA5E9;
        }
        .logbook-brand-wordmark sup {
          font-size: 9px;
          font-weight: 700;
          margin-left: 1px;
          vertical-align: super;
          color: #0EA5E9;
        }
        .logbook-brand-company {
          font-size: 9px;
          font-weight: 500;
          color: #64748b;
          letter-spacing: 0.01em;
        }
        .logbook-brand-caption {
          font-size: 9px;
          color: #94a3b8;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .logbook-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .logbook-summary-cell {
          padding: 8px 10px;
          border-right: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .logbook-summary-cell:last-child {
          border-right: none;
        }
        .logbook-summary-label {
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .logbook-summary-value {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }

        .logbook-breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px;
          margin-bottom: 14px;
        }
        .logbook-breakdown {
          padding: 8px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          background: #fdfefe;
        }
        .logbook-breakdown-label {
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .logbook-breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 10.5px;
        }
        .logbook-breakdown-item {
          display: flex;
          justify-content: space-between;
          color: #334155;
        }
        .logbook-breakdown-num {
          font-weight: 600;
          font-family: ui-monospace, monospace;
          color: #0f172a;
        }

        .logbook-certification {
          margin-top: 22px;
          padding: 14px 14px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          background: #fafbfc;
          page-break-inside: avoid;
        }
        .logbook-certification-label {
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0EA5E9;
          margin-bottom: 6px;
        }
        .logbook-certification-body {
          font-size: 10.5px;
          color: #334155;
          line-height: 1.55;
          margin-bottom: 18px;
        }
        .logbook-sigline {
          display: flex;
          gap: 20px;
          margin-bottom: 14px;
        }
        .logbook-sigcell {
          flex: 1;
          min-width: 0;
        }
        .logbook-sigslot {
          border-bottom: 1px solid #0f172a;
          height: 18px;
          margin-bottom: 3px;
        }
        .logbook-siglabel {
          font-size: 9px;
          color: #64748b;
          letter-spacing: 0.03em;
        }

        .logbook-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          page-break-inside: auto;
        }
        .logbook-table th {
          background: #0f172a;
          color: #fff;
          padding: 6px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .logbook-table td {
          padding: 5px 8px;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
          vertical-align: middle;
        }
        .logbook-table tbody tr {
          page-break-inside: avoid;
        }
        .logbook-table tbody tr:nth-child(even) {
          background: #fafbfc;
        }

        /* EPA section — distinct header + verified-row highlighting. The
           signed rows get a pale green row background and a solid green
           left border so a reviewer can see "this was actually verified
           by an attending" from across the desk. */
        .logbook-section-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin: 20px 0 8px;
          padding-bottom: 6px;
          border-bottom: 2px solid #0f172a;
        }
        .logbook-section-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.2px;
        }
        .logbook-section-stats {
          font-size: 10px;
          color: #475569;
        }
        .logbook-section-stats strong {
          color: #0f172a;
          font-weight: 700;
        }
        .logbook-epa-table tbody tr {
          border-left: 3px solid transparent;
        }
        .logbook-epa-table tbody tr.logbook-epa-signed {
          background: #ecfdf5 !important;
          border-left-color: #10b981;
        }
        .logbook-epa-table tbody tr.logbook-epa-signed td {
          border-bottom-color: #d1fae5;
        }

        .logbook-footer {
          margin-top: 18px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 9px;
          color: #94a3b8;
          text-align: center;
          line-height: 1.5;
        }
        .logbook-footer sup {
          font-size: 7px;
          vertical-align: super;
        }

        @media print {
          html,
          body {
            background: #fff !important;
            margin: 0;
            padding: 0;
          }
          .logbook-root {
            background: #fff !important;
            padding: 0 !important;
          }
          .logbook-page {
            max-width: none;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
          .logbook-header {
            margin-bottom: 14px;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="logbook-summary-cell">
      <div className="logbook-summary-label">{label}</div>
      <div className="logbook-summary-value">{value}</div>
    </div>
  );
}
