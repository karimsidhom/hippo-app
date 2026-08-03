"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import type { EpaObservation } from "@/lib/types";
import { SMSNA_CATEGORIES } from "@/lib/smsna/taxonomy";
import { OPRS_CITATION } from "@/lib/smsna/oprs";

/**
 * Read-only summary card for SMSNA fellows on the analytics EPA/Milestones
 * tabs — counts submitted OPRS observations by SMSNA case category and
 * links to /cases. No new charts, no new analytics math. Exists purely so
 * an SMSNA fellow doesn't see the "EPA tracking coming soon" empty state
 * that EpaAnalyticsPanel/EpaDashboard show for specialties with no EPA data.
 */
export function SmsnaAssessmentPanel() {
  const [observations, setObservations] = useState<EpaObservation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/epa/observations", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setObservations(Array.isArray(data) ? data : []);
      })
      .catch(() => { /* silently fail — panel just shows zero counts */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const countsByCategory = SMSNA_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    const epaId = `SMSNA-${cat.key.toUpperCase()}`;
    acc[cat.key] = observations.filter((o) => o.epaId === epaId && o.status !== "RETURNED").length;
    return acc;
  }, {});

  const totalSigned = observations.filter((o) => o.status === "SIGNED").length;
  const totalPending = observations.filter((o) => o.status === "SUBMITTED" || o.status === "PENDING_REVIEW").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <ClipboardList size={16} style={{ color: "var(--primary)" }} />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>
          OPRS Operative Assessments
        </h3>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 18, lineHeight: 1.5 }}>
        {OPRS_CITATION}
      </p>

      <div style={{
        display: "flex", gap: 16, marginBottom: 20,
        padding: "10px 14px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
          {observations.length} total
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>
          {totalSigned} signed
        </span>
        {totalPending > 0 && (
          <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>
            {totalPending} pending
          </span>
        )}
        {!loaded && (
          <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>Loading…</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
        {SMSNA_CATEGORIES.map((cat) => (
          <div key={cat.key} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 16 }}>{cat.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", flex: 1 }}>
              {cat.name}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "'Geist Mono', monospace" }}>
              {countsByCategory[cat.key] ?? 0}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/cases"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, fontWeight: 600, color: "var(--primary)", textDecoration: "none",
        }}
      >
        View all cases →
      </Link>
    </div>
  );
}
