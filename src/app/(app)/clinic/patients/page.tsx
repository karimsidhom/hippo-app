"use client";

// Hippo Clinic — Patients list. Search-as-you-type, tap to open detail.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";

interface Patient {
  id: string;
  givenName: string;
  familyName: string;
  preferredName?: string | null;
  isTemporary: boolean;
  updatedAt: string;
}

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `/api/clinic/patients?limit=50${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ""}`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return;
        const j = (await res.json()) as { patients: Patient[] };
        setPatients(j.patients);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query]);

  return (
    <div style={{ paddingTop: 4, animation: "fadeIn .3s ease forwards" }}>
      <div style={{ marginBottom: 14 }}>
        <div className="section-title">Patients</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "2px 0", letterSpacing: "-0.3px" }}>
          Your roster
        </h1>
      </div>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
        <input
          className="st-input"
          style={{ paddingLeft: 34 }}
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <div style={{ fontSize: 12, color: "var(--text-3)" }}>Loading…</div>}

      {!loading && patients.length === 0 && (
        <div className="empty-state">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
            <Users size={24} color="var(--text-3)" />
          </div>
          <div className="empty-title">No patients yet</div>
          <div className="empty-text">Patients are auto-created when you start a new note.</div>
          <Link href="/clinic/new" className="st-btn st-btn-primary press-key" style={{ marginTop: 14, display: "inline-flex", width: "auto" }}>
            <UserPlus size={14} /> Start a note
          </Link>
        </div>
      )}

      {!loading && patients.map((p) => (
        <Link key={p.id} href={`/clinic/patients/${p.id}`} className="case-card" style={{ textDecoration: "none" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="case-proc">
              {p.preferredName || p.givenName} {p.familyName}
              {p.isTemporary && <span className="badge badge-muted" style={{ marginLeft: 6 }}>Temp</span>}
            </div>
          </div>
          <div className="case-date">{new Date(p.updatedAt).toLocaleDateString()}</div>
        </Link>
      ))}
    </div>
  );
}
