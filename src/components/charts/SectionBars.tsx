"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { SectionCount } from "@/lib/subspecialty";
import { CHART, ChartEmpty } from "./chartKit";

/**
 * Ranked horizontal bars for the subspecialty breakdown. Each row shows the
 * case count, the share of all cases and how many of that section's cases
 * were done independently. Rows link to the Cases list filtered to that
 * section when `hrefFor` is given.
 */
export function SectionBars({
  rows,
  hrefFor,
  emptyText = "No cases yet",
}: {
  rows: SectionCount[];
  hrefFor?: (row: SectionCount) => string;
  emptyText?: string;
}) {
  if (rows.length === 0) return <ChartEmpty height={160}>{emptyText}</ChartEmpty>;
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
      {rows.map((r) => {
        const muted = r.offService || r.key === "other";
        const body = (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
              <span style={{
                flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500,
                color: muted ? CHART.axis : CHART.label,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {r.label}
              </span>
              <span style={{ fontSize: 12.5, fontFamily: CHART.mono, fontWeight: 600, color: CHART.value }}>
                {r.count.toLocaleString()}
              </span>
              <span style={{ fontSize: 11.5, fontFamily: CHART.mono, color: CHART.axis, minWidth: 44, textAlign: "right" }}>
                {r.pct < 1 && r.count > 0 ? "<1" : Math.round(r.pct)}%
              </span>
              {hrefFor && <ChevronRight size={13} style={{ color: CHART.axis, flexShrink: 0 }} aria-hidden />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--surface2)", overflow: "hidden" }}>
                <div style={{
                  width: `${Math.max(2, (r.count / max) * 100)}%`, height: "100%", borderRadius: 3,
                  background: muted ? "var(--text-3)" : "var(--primary)",
                  transition: "width .6s cubic-bezier(.16,1,.3,1)",
                }} />
              </div>
              <span style={{ fontSize: 11, color: CHART.axis, whiteSpace: "nowrap", minWidth: 92, textAlign: "right" }}>
                {r.independentPct}% independent
              </span>
            </div>
          </>
        );
        return (
          <li key={r.key}>
            {hrefFor ? (
              <Link
                href={hrefFor(r)}
                className="section-row"
                aria-label={`${r.label}: ${r.count} cases, ${Math.round(r.pct)} percent, ${r.independentPct} percent independent. Show these cases`}
              >
                {body}
              </Link>
            ) : (
              <div className="section-row">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
