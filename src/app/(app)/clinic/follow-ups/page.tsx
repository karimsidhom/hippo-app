"use client";

// Hippo Clinic — Follow-up tracker.
//
// Filterable buckets: Due soon · Overdue · Waiting · Needs call · Needs letter · Needs booking · Completed.
// Tap a row to update status without leaving the page.

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, AlertTriangle, Clock, Phone, Mail, Calendar, Loader2 } from "lucide-react";
import type { ClinicFollowUpStatus } from "@/lib/clinic/types";

interface FollowUpRow {
  id: string;
  kind: string;
  title: string;
  detail: string | null;
  intervalLabel: string | null;
  dueAt: string | null;
  status: ClinicFollowUpStatus;
  encounter: { id: string; encounterDate: string; patient: { id: string; givenName: string; familyName: string } | null };
}

const BUCKETS: { id: ClinicFollowUpStatus | "ALL"; label: string }[] = [
  { id: "ALL",              label: "All" },
  { id: "DUE_SOON",         label: "Due soon" },
  { id: "OVERDUE",          label: "Overdue" },
  { id: "WAITING_RESULTS",  label: "Waiting" },
  { id: "NEEDS_CALL",       label: "Calls" },
  { id: "NEEDS_LETTER",     label: "Letters" },
  { id: "NEEDS_BOOKING",    label: "Booking" },
  { id: "COMPLETED",        label: "Done" },
];

export default function FollowUpsPage() {
  const [bucket, setBucket] = useState<typeof BUCKETS[number]["id"]>("ALL");
  const [rows, setRows] = useState<FollowUpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const ctrl = new AbortController();
    const url = `/api/clinic/follow-ups${bucket === "ALL" ? "" : `?status=${bucket}`}`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: { followUps: FollowUpRow[] }) => setRows(j.followUps))
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [bucket]);

  async function setStatus(id: string, status: ClinicFollowUpStatus) {
    setUpdatingId(id);
    try {
      await fetch(`/api/clinic/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div style={{ paddingTop: 4, animation: "fadeIn .3s ease forwards" }}>
      <div className="section-title">Follow-ups</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "2px 0 14px", letterSpacing: "-0.3px" }}>
        Pending tasks
      </h1>

      <div className="year-tabs" style={{ marginBottom: 14 }}>
        {BUCKETS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`year-tab ${bucket === b.id ? "active" : ""}`}
            onClick={() => setBucket(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ fontSize: 12, color: "var(--text-3)" }}>Loading…</div>}
      {!loading && rows.length === 0 && (
        <div className="empty-state">
          <CalendarClock size={20} color="var(--text-3)" />
          <div className="empty-title" style={{ marginTop: 6 }}>Nothing here</div>
          <div className="empty-text">Tasks appear here once a note generates extracted follow-ups.</div>
        </div>
      )}

      {rows.map((r) => (
        <div key={r.id} className="st-card" style={{ marginBottom: 8, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{r.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                {r.kind}
                {r.intervalLabel && ` · ${r.intervalLabel}`}
                {r.encounter.patient && ` · ${r.encounter.patient.givenName} ${r.encounter.patient.familyName}`}
              </div>
              {r.detail && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 6 }}>{r.detail}</div>}
            </div>
            <span className={`badge ${r.status === "OVERDUE" ? "badge-danger" : r.status === "COMPLETED" ? "badge-success" : "badge-warning"}`}>
              {r.status}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <Link href={`/clinic/encounters/${r.encounter.id}`} className="chip press">Open encounter</Link>
            {updatingId === r.id ? (
              <span className="chip" style={{ cursor: "default" }}><Loader2 size={11} className="spin" /></span>
            ) : (
              <>
                {r.status !== "COMPLETED" && (
                  <button type="button" className="chip press" onClick={() => setStatus(r.id, "COMPLETED")} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 size={11} /> Mark done
                  </button>
                )}
                {r.status !== "WAITING_RESULTS" && (
                  <button type="button" className="chip press" onClick={() => setStatus(r.id, "WAITING_RESULTS")} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} /> Waiting
                  </button>
                )}
                {r.status !== "NEEDS_CALL" && (
                  <button type="button" className="chip press" onClick={() => setStatus(r.id, "NEEDS_CALL")} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Phone size={11} /> Call
                  </button>
                )}
                {r.status !== "NEEDS_LETTER" && (
                  <button type="button" className="chip press" onClick={() => setStatus(r.id, "NEEDS_LETTER")} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Mail size={11} /> Letter
                  </button>
                )}
                {r.status !== "NEEDS_BOOKING" && (
                  <button type="button" className="chip press" onClick={() => setStatus(r.id, "NEEDS_BOOKING")} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={11} /> Book
                  </button>
                )}
                {r.status !== "OVERDUE" && (
                  <button type="button" className="chip press" onClick={() => setStatus(r.id, "OVERDUE")} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={11} /> Overdue
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}

      <style>{`.spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}
