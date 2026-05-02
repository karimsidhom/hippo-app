"use client";

// Settings form for Hippo Clinic. Persists to /api/profile so it shares
// the existing profile mutation pipeline used by the rest of Hippo.

import { useState } from "react";
import { Loader2 } from "lucide-react";

const PROVINCES: Array<{ code: string; name: string }> = [
  { code: "MB", name: "Manitoba" },
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "ON", name: "Ontario" },
  { code: "SK", name: "Saskatchewan" },
  { code: "QC", name: "Quebec" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "PE", name: "PEI" },
  { code: "YT", name: "Yukon" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
];

interface Initial {
  billingEnabled: boolean;
  billingRegion: string | null;
  roleType: string;
}

export function ClinicSettingsForm({ initial }: { initial: Initial }) {
  const [billingEnabled, setBillingEnabled] = useState(initial.billingEnabled);
  const [billingRegion, setBillingRegion] = useState(initial.billingRegion ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Residents default-off per spec; staff can toggle.
  const isResident = initial.roleType === "RESIDENT";

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingEnabled,
          billingRegion: billingRegion || null,
        }),
      });
      if (!res.ok) {
        // Fall back to a clinic-namespaced no-op so the user sees an error
        // when /api/profile isn't accepting these fields yet.
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setSavedAt(Date.now());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="section-title" style={{ marginTop: 4 }}>Billing module</div>
      <div className="st-card" style={{ marginBottom: 14 }}>
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: "pointer" }}>
          <span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Billing suggestions</span>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, lineHeight: 1.5 }}>
              {isResident
                ? "Off by default for residents. Toggle on to see province-specific code suggestions."
                : "Show province-specific code suggestions in finalized notes. The model never invents codes."}
            </div>
          </span>
          <input
            type="checkbox"
            checked={billingEnabled}
            onChange={(e) => setBillingEnabled(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
          />
        </label>

        {billingEnabled && (
          <div style={{ marginTop: 12 }}>
            <label className="form-label">Province</label>
            <select className="st-input" value={billingRegion} onChange={(e) => setBillingRegion(e.target.value)}>
              <option value="">— select —</option>
              {PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
            {!billingRegion && (
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>
                Without a province, billing module is shown as &quot;not configured&quot; — no codes are emitted.
              </div>
            )}
            {billingRegion && (
              <div style={{ fontSize: 11, color: "var(--warning)", marginTop: 6, lineHeight: 1.5 }}>
                Billing module is currently in scaffolded state. Validated province code tables ship in the next release.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="section-title">Audio retention</div>
      <div className="st-card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
          By default, audio chunks are deleted as soon as the transcript is confirmed. Per-encounter
          retention can be toggled from inside an encounter (under "Audit"). This is the safest
          default under PHIA / HIPAA — the audio leaves the system once it's served its purpose.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        {savedAt && Date.now() - savedAt < 4000 && (
          <span style={{ fontSize: 11, color: "var(--success)" }}>Saved</span>
        )}
        {error && <span style={{ fontSize: 11, color: "var(--danger)" }}>{error}</span>}
        <button className="st-btn st-btn-primary press-key" disabled={saving} onClick={save} style={{ width: "auto" }}>
          {saving ? <Loader2 size={14} className="spin" /> : null}
          Save preferences
        </button>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}
