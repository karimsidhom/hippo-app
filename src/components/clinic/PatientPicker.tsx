"use client";

// Hippo Clinic — PatientPicker.
//
// Pure ADD-mode by default. Typing the patient's name *is* adding them —
// no dropdown, no search, no "Create temporary patient" dance. The
// wizard auto-creates a temporary patient row at Start time using
// whatever the clinician typed (or skips the patient entirely if the
// field is left blank).
//
// Searching prior records is a quiet opt-in via "Browse existing
// patients" — collapsed by default so first-time clinicians never see
// it. We deliberately keep the two paths visually separate so the
// default action (add) feels like a single text field, not a search.

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

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
  onQueryChange,
  placeholder,
}: {
  selected: Patient | null;
  onSelect: (p: Patient | null) => void;
  /**
   * Fires whenever the typed text changes. The wizard uses this to
   * remember a free-text label so the user can type "Mrs Jones",
   * "MRN 12345", a single digit, or nothing at all and just hit Start.
   */
  onQueryChange?: (q: string) => void;
  placeholder?: string;
}) {
  const [name, setName] = useState("");
  const [browsing, setBrowsing] = useState(false);
  const [browseQuery, setBrowseQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Search runs ONLY when the clinician explicitly opts into "Browse"
  // mode. We never auto-search from the Add field — that's the whole
  // point of this redesign.
  useEffect(() => {
    if (!browsing) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `/api/clinic/patients?limit=10${browseQuery.trim() ? `&q=${encodeURIComponent(browseQuery.trim())}` : ""}`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return;
        const j = (await res.json()) as { patients: Patient[] };
        setResults(j.patients);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [browseQuery, browsing]);

  // Selected-state card: shows which existing record this encounter is
  // attached to, with a quick "change" affordance.
  if (selected) {
    return (
      <div
        ref={containerRef}
        className="st-card"
        style={{
          padding: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            {selected.preferredName || selected.givenName} {selected.familyName}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
            {selected.isTemporary ? "Temporary record" : "Existing patient"}
          </div>
        </div>
        <button
          type="button"
          className="chip press"
          onClick={() => {
            onSelect(null);
            setName("");
            onQueryChange?.("");
            setBrowsing(false);
            setBrowseQuery("");
          }}
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <X size={11} /> Change
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {/* ── ADD mode (default) ──────────────────────────────────────── */}
      <input
        className="st-input"
        value={name}
        placeholder={placeholder ?? "New patient name (or any label)"}
        onChange={(e) => {
          setName(e.target.value);
          onQueryChange?.(e.target.value);
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
      />
      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6, lineHeight: 1.4 }}>
        {name.trim()
          ? <>We&rsquo;ll save this as a new patient when you tap Start.</>
          : <>Type a name to add a new patient — or leave blank and dictate first.</>}
      </div>

      {/* ── BROWSE existing — quiet opt-in ──────────────────────────── */}
      <div style={{ marginTop: 10 }}>
        {!browsing ? (
          <button
            type="button"
            onClick={() => setBrowsing(true)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 11,
              color: "var(--text-3)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "underline",
              textDecorationColor: "var(--border-mid)",
            }}
          >
            <Search size={10} /> Browse existing patients
          </button>
        ) : (
          <div>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
              <input
                className="st-input"
                style={{ paddingLeft: 30, fontSize: 13 }}
                placeholder="Search prior patients…"
                value={browseQuery}
                onChange={(e) => setBrowseQuery(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => { setBrowsing(false); setBrowseQuery(""); }}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", color: "var(--text-3)", cursor: "pointer",
                  display: "inline-flex", alignItems: "center", padding: 4,
                }}
                aria-label="Close search"
              >
                <X size={12} />
              </button>
            </div>
            <div
              style={{
                marginTop: 6,
                background: "var(--surface)",
                border: "1px solid var(--border-mid)",
                borderRadius: "var(--r)",
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {loading && (
                <div style={{ padding: 10, fontSize: 12, color: "var(--text-3)" }}>Searching…</div>
              )}
              {!loading && results.length === 0 && (
                <div style={{ padding: 10, fontSize: 12, color: "var(--text-3)" }}>
                  {browseQuery.trim() ? "No matches." : "Start typing to search."}
                </div>
              )}
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p);
                    setName("");
                    onQueryChange?.("");
                    setBrowsing(false);
                    setBrowseQuery("");
                  }}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
