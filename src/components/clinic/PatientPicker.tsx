"use client";

// Hippo Clinic — PatientPicker.
//
// Search-as-you-type chooser with an inline "create temporary patient"
// path. Temporary patients are flagged isTemporary=true so the dashboard
// can suggest merging them with a permanent record later.

import { useEffect, useRef, useState } from "react";
import { Search, UserPlus } from "lucide-react";

interface Patient {
  id: string;
  givenName: string;
  familyName: string;
  preferredName?: string | null;
  isTemporary: boolean;
}

export function PatientPicker({
  selected,
  onSelect,
}: {
  selected: Patient | null;
  onSelect: (p: Patient | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside-click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Search.
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `/api/clinic/patients?limit=15${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ""}`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return;
        const j = (await res.json()) as { patients: Patient[] };
        setResults(j.patients);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query, open]);

  async function createTemporary() {
    const name = query.trim() || "Unnamed patient";
    const parts = name.split(/\s+/);
    const givenName = parts.slice(0, -1).join(" ") || parts[0] || "Unknown";
    const familyName = parts.length > 1 ? parts[parts.length - 1] : "Patient";
    setCreating(true);
    try {
      const res = await fetch("/api/clinic/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ givenName, familyName, isTemporary: true }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as { patient: Patient };
      onSelect(j.patient);
      setOpen(false);
      setQuery("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {selected ? (
        <div
          className="st-card"
          style={{
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
          onClick={() => { onSelect(null); setOpen(true); }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
              {selected.preferredName || selected.givenName} {selected.familyName}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              {selected.isTemporary ? "Temporary record · tap to change" : "Tap to change"}
            </div>
          </div>
          <span className="badge badge-muted">Change</span>
        </div>
      ) : (
        <>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
            <input
              className="st-input"
              style={{ paddingLeft: 34 }}
              value={query}
              placeholder="Search patient by name…"
              onFocus={() => setOpen(true)}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            />
          </div>
          {open && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0, right: 0,
                background: "var(--surface)",
                border: "1px solid var(--border-mid)",
                borderRadius: "var(--r)",
                maxHeight: 280,
                overflowY: "auto",
                zIndex: 20,
                boxShadow: "0 4px 16px rgba(0,0,0,.25)",
              }}
            >
              {loading && (
                <div style={{ padding: 12, fontSize: 12, color: "var(--text-3)" }}>Searching…</div>
              )}
              {!loading && results.length === 0 && (
                <div style={{ padding: 12, fontSize: 12, color: "var(--text-3)" }}>
                  No matches.
                </div>
              )}
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onSelect(p); setOpen(false); setQuery(""); }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    padding: "10px 12px",
                    cursor: "pointer",
                    color: "var(--text)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {p.preferredName || p.givenName} {p.familyName}
                  </div>
                  {p.isTemporary && (
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>Temporary</div>
                  )}
                </button>
              ))}
              <button
                type="button"
                disabled={creating}
                onClick={createTemporary}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "var(--primary-dim)",
                  border: "none",
                  padding: "10px 12px",
                  color: "var(--primary-hi)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 13, fontWeight: 600,
                }}
              >
                <UserPlus size={13} />
                {creating
                  ? "Creating…"
                  : query.trim()
                  ? `Create temporary patient: "${query.trim()}"`
                  : "Create temporary patient"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
