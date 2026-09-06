"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target, ChevronRight } from "lucide-react";
import type { TargetProgress, TrackStatus } from "@/lib/projections";
import { STATUS_LABEL } from "@/lib/projections";

type Payload = {
  gated: boolean;
  graduationDate: string | null;
  targets: TargetProgress[];
};

const STATUS_COLOR: Record<TrackStatus, string> = {
  done: "#10b981",
  on_track: "#0ea5e9",
  at_risk: "#f59e0b",
  behind: "#ef4444",
  no_due_date: "#64748b",
};

function fmtDate(d: string | Date | null): string {
  if (!d) return "";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? "" : x.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * "On track": for each target the program holds the resident to, where they
 * stand, their recent pace, and where that pace lands at graduation. Reads
 * /api/targets; the math is in src/lib/projections.ts.
 */
export function OnTrackCard() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/targets")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: Payload) => alive && setData(j))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  if (error || (data && data.gated)) return null;

  const targets = data?.targets ?? [];
  const shown = targets.slice(0, 4);
  const behind = targets.filter((t) => t.status === "behind" || t.status === "at_risk").length;

  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "16px 18px",
        marginTop: 20,
        background: "var(--card, transparent)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Target size={16} strokeWidth={1.75} />
          <strong style={{ fontSize: 14 }}>On track</strong>
          {data?.graduationDate && (
            <span style={{ fontSize: 12, opacity: 0.7 }}>to {fmtDate(data.graduationDate)}</span>
          )}
        </div>
        <Link
          href="/settings/targets"
          style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4, opacity: 0.8 }}
        >
          {targets.length ? "Manage" : "Set targets"} <ChevronRight size={14} />
        </Link>
      </div>

      {!data && <p style={{ fontSize: 13, opacity: 0.6, margin: "10px 0 0" }}>Loading…</p>}

      {data && targets.length === 0 && (
        <p style={{ fontSize: 13, opacity: 0.75, margin: "10px 0 0", lineHeight: 1.5 }}>
          Add your program&apos;s case minimums and a graduation date, and this card will tell you every
          week whether your current pace gets you there.
        </p>
      )}

      {shown.length > 0 && (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {shown.map((t) => {
            const pct = Math.min(100, Math.round((t.current / Math.max(1, t.target)) * 100));
            const projPct = t.projected === null ? null : Math.min(100, Math.round((t.projected / Math.max(1, t.target)) * 100));
            return (
              <div key={t.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, gap: 8 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
                  <span style={{ whiteSpace: "nowrap" }}>
                    <span style={{ color: STATUS_COLOR[t.status], fontWeight: 600 }}>{STATUS_LABEL[t.status]}</span>
                    <span style={{ opacity: 0.7 }}> · {t.current}/{t.target}</span>
                  </span>
                </div>
                <div
                  aria-hidden
                  style={{ position: "relative", height: 6, borderRadius: 3, background: "var(--border)", marginTop: 6, overflow: "hidden" }}
                >
                  {projPct !== null && (
                    <div style={{ position: "absolute", inset: 0, width: `${projPct}%`, background: STATUS_COLOR[t.status], opacity: 0.25 }} />
                  )}
                  <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: STATUS_COLOR[t.status] }} />
                </div>
                <div style={{ fontSize: 11.5, opacity: 0.7, marginTop: 4 }}>
                  {t.status === "done" && "Target met."}
                  {t.status === "no_due_date" && "Add a due date or a graduation date to project this."}
                  {(t.status === "on_track" || t.status === "at_risk" || t.status === "behind") && (
                    <>
                      Pace {t.ratePerMonth}/mo, projected {t.projected} by {fmtDate(t.dueDate)}
                      {t.neededPerMonth !== null && t.status !== "on_track" && ` · need ${t.neededPerMonth}/mo`}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {targets.length > shown.length && (
            <Link href="/settings/targets" style={{ fontSize: 12, opacity: 0.8 }}>
              {targets.length - shown.length} more{behind > 0 ? `, ${behind} need attention` : ""}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
