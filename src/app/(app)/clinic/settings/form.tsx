"use client";

// Settings form for Hippo Clinic. Now combines:
//   - Profile (name / specialty / role) — links to the existing /profile
//     editor so the same identity carries across modules.
//   - Appearance (light / dark / system) — uses the shared ThemeContext.
//   - Notifications (link out to the existing /settings/notifications).
//   - Billing (clinic-specific, persisted via /api/profile).
//   - References add-on (localStorage-only, deployment-local).
//
// This brings parity with the broader hippomedicine.com settings while
// keeping the clinic-specific surfaces top-of-page.

import { useState } from "react";
import Link from "next/link";
import { Loader2, Moon, Sun, Monitor, BookOpen, User as UserIcon, Bell, Shield, FileText, BarChart3, CalendarDays } from "lucide-react";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { useReferenceSettings, type ReferenceRegion } from "@/hooks/useReferenceSettings";
import { useAuth } from "@/context/AuthContext";
import { MacrosCard } from "@/components/clinic/MacrosCard";

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

  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const refs = useReferenceSettings();
  const { user, profile } = useAuth();

  // Residents default-off per spec; staff can toggle.
  const isResident = initial.roleType === "RESIDENT";

  function toggleRegion(r: ReferenceRegion) {
    const next = refs.regions.includes(r)
      ? refs.regions.filter((x) => x !== r)
      : [...refs.regions, r];
    refs.setRegions(next);
  }

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
      {/* ── Profile ────────────────────────────────────────────────────── */}
      <div className="section-title" style={{ marginTop: 4 }}>Profile</div>
      <div className="st-card" style={{ marginBottom: 14, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <UserIcon size={14} color="var(--text-3)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                {user?.name || user?.email || "Clinician"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
              {profile?.specialty ?? "Specialty not set"} · {prettyRole(profile?.roleType)}
              {profile?.institution ? ` · ${profile.institution}` : ""}
            </div>
          </div>
          <Link href="/clinic/profile" className="st-btn st-btn-secondary st-btn-sm press" style={{ width: "auto", display: "inline-flex" }}>
            Edit
          </Link>
        </div>
      </div>

      {/* ── Appearance ─────────────────────────────────────────────────── */}
      <div className="section-title">Appearance</div>
      <div className="st-card" style={{ marginBottom: 14, padding: 14 }}>
        <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 10, lineHeight: 1.5 }}>
          Light or dark canvas. Hippo Clinic always uses the red accent regardless of theme.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          <ThemeChip current={themeMode} value="light"  label="Light"  icon={<Sun size={12} />}      onSelect={setThemeMode} />
          <ThemeChip current={themeMode} value="dark"   label="Dark"   icon={<Moon size={12} />}     onSelect={setThemeMode} />
          <ThemeChip current={themeMode} value="system" label="System" icon={<Monitor size={12} />} onSelect={setThemeMode} />
        </div>
      </div>

      {/* ── References add-on ──────────────────────────────────────────── */}
      <div className="section-title">References add-on (optional)</div>
      <div className="st-card" style={{ marginBottom: 14, padding: 14 }}>
        <label style={{ display: "flex", justifyContent: "space-between", gap: 8, cursor: "pointer" }}>
          <span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={13} /> Suggest PubMed + guideline references
            </span>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, lineHeight: 1.5 }}>
              When on, an encounter can scan its note for evidence-backable
              claims and suggest a one-line citation in light red below the
              editor. Suggestions never auto-load — you accept them per claim.
            </div>
          </span>
          <input
            type="checkbox"
            checked={refs.enabled}
            onChange={(e) => refs.setEnabled(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
          />
        </label>

        {refs.enabled && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            <div className="form-label" style={{ marginBottom: 6 }}>Region preference</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8, lineHeight: 1.5 }}>
              Which society guidelines should be matched. PubMed papers are unfiltered by region.
            </div>
            <div className="chip-group">
              <RegionChip current={refs.regions} value="US"  label="🇺🇸 American" onToggle={toggleRegion} />
              <RegionChip current={refs.regions} value="CA"  label="🇨🇦 Canadian" onToggle={toggleRegion} />
              <RegionChip current={refs.regions} value="EU"  label="🇪🇺 European" onToggle={toggleRegion} />
              <RegionChip current={refs.regions} value="INT" label="🌐 International" onToggle={toggleRegion} />
            </div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 8 }}>
              Toggle saved on this device only.
            </div>
          </div>
        )}
      </div>

      {/* ── Workflow tools ─────────────────────────────────────────────── */}
      <div className="section-title">Workflow</div>
      <div className="st-card" style={{ marginBottom: 14, padding: 0 }}>
        <Link href="/clinic/settings/templates" className="case-card" style={{ padding: "12px 14px", textDecoration: "none" }}>
          <FileText size={14} color="var(--text-3)" style={{ marginRight: 8 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Templates</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Built-in + your custom note structures.</div>
          </div>
        </Link>
        <Link href="/clinic/insights" className="case-card" style={{ padding: "12px 14px", textDecoration: "none", borderTop: "1px solid var(--border)" }}>
          <BarChart3 size={14} color="var(--text-3)" style={{ marginRight: 8 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Insights</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Time-to-finalize, AI acceptance, edit hot-spots.</div>
          </div>
        </Link>
        <Link href="/clinic/settings/schedule" className="case-card" style={{ padding: "12px 14px", textDecoration: "none", borderTop: "1px solid var(--border)" }}>
          <CalendarDays size={14} color="var(--text-3)" style={{ marginRight: 8 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Schedule import</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Connect a calendar feed so today's clinic auto-populates.</div>
          </div>
        </Link>
      </div>

      {/* ── Macros / dot-phrases ───────────────────────────────────────── */}
      <MacrosCard />

      {/* ── Notifications + audit links ────────────────────────────────── */}
      <div className="section-title">Notifications & audit</div>
      <div className="st-card" style={{ marginBottom: 14, padding: 0 }}>
        <Link href="/clinic/settings/notifications" className="case-card" style={{ padding: "12px 14px", textDecoration: "none" }}>
          <Bell size={14} color="var(--text-3)" style={{ marginRight: 8 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Notification preferences</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Push, email, in-app, sound, haptics for Hippo Clinic.</div>
          </div>
        </Link>
        <Link href="/clinic/settings/audit-log" className="case-card" style={{ padding: "12px 14px", textDecoration: "none", borderTop: "1px solid var(--border)" }}>
          <Shield size={14} color="var(--text-3)" style={{ marginRight: 8 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Audit log</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Every clinic action — timestamped + IP-stamped.</div>
          </div>
        </Link>
      </div>

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

function ThemeChip({
  current, value, label, icon, onSelect,
}: {
  current: ThemeMode;
  value: ThemeMode;
  label: string;
  icon: React.ReactNode;
  onSelect: (m: ThemeMode) => void;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`chip press ${selected ? "selected" : ""}`}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "10px 12px",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function RegionChip({
  current, value, label, onToggle,
}: {
  current: ReferenceRegion[];
  value: ReferenceRegion;
  label: string;
  onToggle: (v: ReferenceRegion) => void;
}) {
  const selected = current.includes(value);
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      className={`chip press ${selected ? "selected" : ""}`}
    >
      {label}
    </button>
  );
}

function prettyRole(r: string | null | undefined): string {
  if (!r) return "Role not set";
  return r.charAt(0) + r.slice(1).toLowerCase().replace(/_/g, " ");
}
