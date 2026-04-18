"use client";

import { useState, useCallback, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import { useSubscription } from "@/context/SubscriptionContext";
import { PRICING } from "@/lib/pricing";
import Link from "next/link";
import { Shield, Users, BarChart2, Download, Trash2, User, ChevronRight, Zap, CreditCard, CheckCircle, AlertCircle, Sparkles, Sun, Moon, Monitor, Building2, MessageSquare, Send, KeyRound, X, Lock, Eye, EyeOff, Bell } from "lucide-react";
import { createClient as createSupabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import type { ThemeMode } from "@/context/ThemeContext";
import { USER_ROLE_TYPES } from "@/lib/constants";
import type { UserRoleType } from "@/lib/types";

const ROLES_REQUIRING_INSTITUTION = new Set(["ATTENDING", "PROGRAM_DIRECTOR", "STAFF"]);

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "appearance", label: "Appearance", icon: Sun },
  { key: "privacy", label: "Privacy & PHIA", icon: Shield },
  { key: "social", label: "Social", icon: Users },
  { key: "leaderboard", label: "Leaderboard", icon: BarChart2 },
  { key: "export", label: "Export", icon: Download },
  { key: "subscription", label: "Subscription", icon: CreditCard },
  { key: "feedback", label: "Feedback", icon: MessageSquare },
  { key: "account", label: "Account", icon: Trash2 },
];

const SUBROUTES = [
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/dictation", label: "Dictation Style", icon: Sparkles },
  { href: "/settings/audit-log", label: "Activity & Audit Log", icon: Shield },
];

export default function SettingsPage() {
  const { user, profile, updateProfile } = useUser();
  const { isPro, isFree, currentPeriodEnd, cancelAtPeriodEnd, startCheckout, openBillingPortal, simulateUpgrade, simulateDowngrade } = useSubscription();
  const { mode: themeMode, resolved: resolvedTheme, setMode: setThemeMode } = useTheme();
  const [activeTab, setActiveTab] = useState("privacy");
  const [portalLoading, setPortalLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── Auto-save indicator ─────────────────────────────────────────────
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const flashSaved = useCallback(() => {
    setAutoSaved(true);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => setAutoSaved(false), 1800);
  }, []);

  // ── Profile field drafts ────────────────────────────────────────────
  const [nameDraft, setNameDraft] = useState(user?.name ?? "");
  const [institutionDraft, setInstitutionDraft] = useState(profile?.institution ?? "");
  const [cityDraft, setCityDraft] = useState(profile?.city ?? "");
  const [institutionPrompt, setInstitutionPrompt] = useState<string | null>(null);

  // ── Password change state ───────────────────────────────────────────
  const [pwOpen, setPwOpen] = useState(false);
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwShow, setPwShow] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwStatus, setPwStatus] = useState<
    { kind: "success" } | { kind: "error"; message: string } | null
  >(null);

  const submitPasswordChange = useCallback(async () => {
    if (pwSubmitting) return;
    if (pwNew.length < 8) {
      setPwStatus({ kind: "error", message: "Password must be at least 8 characters." });
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwStatus({ kind: "error", message: "Passwords don't match." });
      return;
    }
    setPwSubmitting(true);
    setPwStatus(null);
    try {
      const supabase = createSupabaseBrowser();
      const { error: err } = await supabase.auth.updateUser({ password: pwNew });
      if (err) throw new Error(err.message);
      setPwNew("");
      setPwConfirm("");
      setPwStatus({ kind: "success" });
      // Auto-close after 1.5s so success flashes visibly first.
      setTimeout(() => {
        setPwOpen(false);
        setPwStatus(null);
      }, 1500);
    } catch (err) {
      setPwStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Could not update password.",
      });
    } finally {
      setPwSubmitting(false);
    }
  }, [pwNew, pwConfirm, pwSubmitting]);

  // ── Account deletion state ──────────────────────────────────────────
  const settingsRouter = useRouter();
  const [delOpen, setDelOpen] = useState(false);
  const [delConfirm, setDelConfirm] = useState("");
  const [delSubmitting, setDelSubmitting] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  const expectedDelete = user?.email ? `DELETE ${user.email}` : "";

  const submitAccountDelete = useCallback(async () => {
    if (delSubmitting || !user?.email) return;
    if (delConfirm.trim() !== expectedDelete) {
      setDelError(`To confirm, type exactly: ${expectedDelete}`);
      return;
    }
    setDelSubmitting(true);
    setDelError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirm: delConfirm.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Delete failed (${res.status})`);
      }
      // Account is gone. Sign out the Supabase session (which still has
      // a valid JWT until expiry otherwise) and redirect to login.
      try {
        const supabase = createSupabaseBrowser();
        await supabase.auth.signOut();
      } catch {
        /* ignore — row is already deleted server-side */
      }
      settingsRouter.replace("/login?deleted=1");
    } catch (err) {
      setDelError(err instanceof Error ? err.message : "Could not delete account.");
      setDelSubmitting(false);
    }
  }, [delConfirm, expectedDelete, delSubmitting, user?.email, settingsRouter]);

  // ── Feedback form state ─────────────────────────────────────────────
  const [feedbackCategory, setFeedbackCategory] = useState<"bug" | "idea" | "general">("general");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<
    | { kind: "success" }
    | { kind: "error"; message: string }
    | null
  >(null);

  const submitFeedback = useCallback(async () => {
    const msg = feedbackMessage.trim();
    if (!msg || feedbackSending) return;
    setFeedbackSending(true);
    setFeedbackStatus(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: msg, category: feedbackCategory }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(err?.error ?? `Send failed (${res.status})`);
      }
      setFeedbackMessage("");
      setFeedbackStatus({ kind: "success" });
    } catch (err) {
      setFeedbackStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Could not send your message.",
      });
    } finally {
      setFeedbackSending(false);
    }
  }, [feedbackMessage, feedbackCategory, feedbackSending]);

  // Helper: save a profile field on blur and show indicator
  const saveOnBlur = useCallback(async (updates: Record<string, unknown>) => {
    await updateProfile(updates as Parameters<typeof updateProfile>[0]);
    flashSaved();
  }, [updateProfile, flashSaved]);

  // Helper: toggle a boolean profile field and save immediately
  const toggleAndSave = useCallback(async (key: string, currentValue: boolean) => {
    await updateProfile({ [key]: !currentValue } as Parameters<typeof updateProfile>[0]);
    flashSaved();
  }, [updateProfile, flashSaved]);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } finally {
      setPortalLoading(false);
    }
  }

  // Toggle row for boolean settings — auto-saves on click
  const ToggleRow = ({
    label,
    description,
    profileKey,
    value,
    sensitive = false,
  }: {
    label: string;
    description: string;
    profileKey: string;
    value: boolean;
    sensitive?: boolean;
  }) => (
    <div className={`flex items-start justify-between p-4 rounded-lg ${sensitive ? "bg-[#1a0f0f] border border-[#ef4444]/20" : "bg-[#16161f] border border-[#1e2130]"}`}>
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-[#f1f5f9]">{label}</p>
        <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => toggleAndSave(profileKey, value)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
          value ? (sensitive ? "bg-[#ef4444]" : "bg-[#2563eb]") : "bg-[#1e2130]"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Settings</h1>
          <p className="text-[#94a3b8] text-sm mt-0.5">Manage your account and privacy preferences</p>
        </div>
        {/* Auto-save indicator — appears briefly after any save */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#10b981",
            opacity: autoSaved ? 1 : 0,
            transition: "opacity .3s",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <CheckCircle size={12} /> Saved
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Navigation */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  activeTab === key
                    ? "bg-[#1a1a2e] text-[#f1f5f9] border-l-2 border-[#2563eb]"
                    : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#16161f]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}

            <div className="pt-2 mt-2 border-t border-[#1e2130]">
              {SUBROUTES.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#16161f] transition-all"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#475569]" />
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 space-y-4">

          {/* ── Profile ──────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Profile Settings</h2>
              <p style={{ fontSize: 11, color: "var(--text-3)", margin: "-8px 0 4px" }}>
                All changes save automatically.
              </p>
              <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-xs text-[#64748b] mb-2">Display Name</label>
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onBlur={() => {
                      if (nameDraft.trim() && nameDraft !== (user?.name ?? "")) {
                        saveOnBlur({ name: nameDraft.trim() });
                      }
                    }}
                    placeholder="Dr. Smith"
                    className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#64748b] mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ""}
                    disabled
                    className="w-full bg-[#16161f] border border-[#1e2130] text-[#64748b] rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-[#64748b] mt-1">Email cannot be changed after registration</p>
                </div>
                <div>
                  <label className="block text-xs text-[#64748b] mb-2">Role</label>
                  <select
                    value={profile?.roleType || "RESIDENT"}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRoleType;
                      const needsInstitution = ROLES_REQUIRING_INSTITUTION.has(newRole);
                      const hasInstitution = !!(institutionDraft.trim() || profile?.institution?.trim());
                      if (needsInstitution && !hasInstitution) {
                        setInstitutionPrompt(newRole);
                        return;
                      }
                      setInstitutionPrompt(null);
                      saveOnBlur({ roleType: newRole });
                    }}
                    style={{
                      width: "100%",
                      background: "var(--surface2)",
                      border: "1px solid var(--border-mid)",
                      color: "var(--text)",
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 14,
                      outline: "none",
                      cursor: "pointer",
                      appearance: "none" as const,
                      WebkitAppearance: "none" as const,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                    }}
                  >
                    {USER_ROLE_TYPES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label} — {role.description}
                      </option>
                    ))}
                  </select>

                  {institutionPrompt && (
                    <div style={{
                      marginTop: 10,
                      padding: "12px 14px",
                      background: "rgba(14,165,233,0.06)",
                      border: "1px solid rgba(14,165,233,0.25)",
                      borderRadius: 10,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Building2 size={14} style={{ color: "#0EA5E9" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                          Institution required
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 10px", lineHeight: 1.5 }}>
                        Add your institution below, then switch your role.
                      </p>
                    </div>
                  )}
                </div>

                {/* Institution & City */}
                <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Building2 size={14} style={{ color: "var(--text-3)" }} />
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: "var(--text-3)",
                      textTransform: "uppercase", letterSpacing: ".5px",
                    }}>Institution</span>
                    {profile?.roleType && ROLES_REQUIRING_INSTITUTION.has(profile.roleType) && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, color: "#0EA5E9",
                        background: "rgba(14,165,233,0.1)",
                        padding: "2px 6px", borderRadius: 4,
                        textTransform: "uppercase", letterSpacing: ".5px",
                      }}>Required for your role</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label className="block text-xs text-[#64748b] mb-2">Hospital / Institution</label>
                      <input
                        type="text"
                        value={institutionDraft}
                        onChange={(e) => setInstitutionDraft(e.target.value)}
                        onBlur={() => {
                          if (institutionDraft !== (profile?.institution ?? "")) {
                            saveOnBlur({ institution: institutionDraft || null });
                            if (institutionPrompt && institutionDraft.trim()) {
                              saveOnBlur({ roleType: institutionPrompt as UserRoleType, institution: institutionDraft });
                              setInstitutionPrompt(null);
                            }
                          }
                        }}
                        placeholder="e.g. University Health Network"
                        className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#64748b] mb-2">City</label>
                      <input
                        type="text"
                        value={cityDraft}
                        onChange={(e) => setCityDraft(e.target.value)}
                        onBlur={() => {
                          if (cityDraft !== (profile?.city ?? "")) {
                            saveOnBlur({ city: cityDraft || null });
                          }
                        }}
                        placeholder="e.g. Toronto"
                        className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Appearance ───────────────────────────────────────────── */}
          {activeTab === "appearance" && (
            <div className="space-y-4">
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Appearance</h2>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
                Choose how Hippo looks on your device.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {([
                  { key: "dark" as ThemeMode, label: "Dark", desc: "Easier on the eyes, especially in the OR", icon: <Moon size={18} /> },
                  { key: "light" as ThemeMode, label: "Light", desc: "Clean and bright for clinic and reading", icon: <Sun size={18} /> },
                  { key: "system" as ThemeMode, label: "System", desc: "Follows your device settings automatically", icon: <Monitor size={18} /> },
                ]).map((option) => {
                  const isActive = themeMode === option.key;
                  return (
                    <button
                      key={option.key}
                      onClick={() => setThemeMode(option.key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 16px",
                        background: isActive ? "var(--primary-dim)" : "var(--surface)",
                        border: `1.5px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                        borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                        textAlign: "left", transition: "all .15s",
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: isActive ? "var(--primary-glow)" : "var(--surface2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: isActive ? "var(--primary)" : "var(--text-3)", flexShrink: 0,
                      }}>
                        {option.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? "var(--primary)" : "var(--text)" }}>
                          {option.label}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                          {option.desc}
                        </div>
                      </div>
                      {isActive && (
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: "var(--primary)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <CheckCircle size={12} color="#fff" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{
                marginTop: 16, padding: "10px 14px",
                background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 8, fontSize: 11, color: "var(--text-3)",
              }}>
                Currently using: <strong style={{ color: "var(--text-2)" }}>
                  {resolvedTheme === "dark" ? "Dark" : "Light"} mode
                </strong>
                {themeMode === "system" && " (following system)"}
              </div>
            </div>
          )}

          {/* ── Privacy & PHIA ───────────────────────────────────────── */}
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Privacy & PHIA Compliance</h2>

              <div className="p-4 bg-[#1a1a2e] border border-[#2563eb]/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-[#3b82f6] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#f1f5f9]">PHIA Commitment</p>
                    <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                      Hippo is designed to comply with the Ontario Personal Health Information Act (PHIA) and equivalent provincial legislation. We never store patient-identifiable information. All case notes are screened for PHI patterns before storage. Your data is encrypted at rest and in transit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <ToggleRow
                  label="Public profile"
                  description="Make your profile visible to other Hippo users"
                  profileKey="publicProfile"
                  value={profile?.publicProfile ?? false}
                />
                <ToggleRow
                  label="Allow benchmark contribution"
                  description="Contribute anonymized operative times to improve national benchmarks for all trainees"
                  profileKey="allowBenchmarkSharing"
                  value={profile?.allowBenchmarkSharing ?? true}
                />
              </div>
            </div>
          )}

          {/* ── Social ───────────────────────────────────────────────── */}
          {activeTab === "social" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Social & Notifications</h2>
              <div className="space-y-2">
                <ToggleRow
                  label="Allow friend requests"
                  description="Other surgeons can send you friend requests"
                  profileKey="allowFriendRequests"
                  value={profile?.allowFriendRequests ?? true}
                />
                <ToggleRow
                  label="Weekly digest email"
                  description="A short weekly summary of your cases, EPAs pending sign-off, and milestones"
                  profileKey="allowWeeklyDigest"
                  value={profile?.allowWeeklyDigest ?? true}
                />
              </div>
            </div>
          )}

          {/* ── Leaderboard ──────────────────────────────────────────── */}
          {activeTab === "leaderboard" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Leaderboard Participation</h2>
              <div className="p-4 bg-[#16161f] border border-[#1e2130] rounded-lg text-xs text-[#94a3b8]">
                Leaderboard rankings use anonymized display names (e.g., &quot;Resident PGY-4&quot; or &quot;Dr. A.C.&quot;). No patient data is ever shared. Rankings are based solely on case volume, autonomy levels, and improvement metrics.
              </div>
              <div className="space-y-2">
                <ToggleRow
                  label="Participate in leaderboard"
                  description="Allow your (anonymized) stats to appear on the leaderboard"
                  profileKey="allowLeaderboardParticipation"
                  value={profile?.allowLeaderboardParticipation ?? true}
                />
              </div>
            </div>
          )}

          {/* ── Export ────────────────────────────────────────────────── */}
          {activeTab === "export" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Export Case Log</h2>

              {/* Download button */}
              <button
                disabled={exporting}
                onClick={async () => {
                  setExporting(true);
                  try {
                    const res = await fetch('/api/export', {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({}),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.error ?? 'Export failed');
                    }
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Hippo-Export-${new Date().toISOString().slice(0,10)}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    alert('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                  } finally {
                    setExporting(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Preparing\u2026' : 'Download Excel (.xlsx)'}
              </button>

              <p className="text-xs text-[#475569] text-center">
                Exports all your cases in a PHIA-safe format. No patient identifiers are included.
              </p>

              {/* EPA portfolio export */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                  EPA Portfolio (Royal College format)
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, margin: "0 0 12px" }}>
                  Multi-sheet Excel workbook of every EPA observation — dates, O-scores,
                  CanMEDS milestone ratings, criterion ratings, attending feedback,
                  sign-off status. Drop straight into Entrada or hand to your CCC.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a
                    href="/api/epa/export?format=xlsx"
                    download
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "10px 14px", background: "#10b981", border: "none",
                      borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600,
                      textDecoration: "none", cursor: "pointer",
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download Excel (.xlsx)
                  </a>
                  <a
                    href="/api/epa/export?format=csv"
                    download
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "10px 14px", background: "var(--surface2)",
                      border: "1px solid var(--border-mid)", borderRadius: 8,
                      color: "var(--text)", fontSize: 13, fontWeight: 500,
                      textDecoration: "none", cursor: "pointer",
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </a>
                </div>
              </div>

              {/* Full-archive JSON */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                  Download all your data
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, margin: "0 0 12px" }}>
                  Machine-readable JSON archive of everything Hippo holds for your account —
                  cases, EPA observations, schedule, profile, audit log. Use this if you
                  want to leave, back up, or verify what we store.
                </p>
                <a
                  href="/api/account/export"
                  download
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", background: "var(--surface2)",
                    border: "1px solid var(--border-mid)", borderRadius: 8,
                    color: "var(--text)", fontSize: 13, fontWeight: 500,
                    textDecoration: "none", cursor: "pointer",
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download JSON archive
                </a>
              </div>
            </div>
          )}

          {/* ── Subscription ─────────────────────────────────────────── */}
          {activeTab === "subscription" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Subscription</h2>

              {/* Beta-era card: everything is free. No paid tier, no billing
                  flow surfaced. When we turn Pro back on post-launch, the
                  old paywall UI lives in git history at this path. */}
              <div className="bg-gradient-to-br from-[#0EA5E9]/8 to-[#10B981]/6 border border-[#0EA5E9]/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#f1f5f9]">Everything is free during beta</div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">
                      All features unlocked for every user — no paid tier yet.
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed mt-3">
                  Hippo is in open beta. Unlimited case logging, AI coaching,
                  PDF exports, and the full attending toolkit are available to
                  every user at no cost.
                </p>
                <p className="text-[11px] text-[#64748b] mt-3 leading-relaxed">
                  A paid tier will come later once we know what residents value
                  most. You&apos;ll hear about it in the app before anything
                  changes — nothing will be silently removed.
                </p>
              </div>

              <div className="bg-[#111118] border border-[#1f1f23] rounded-xl p-5">
                <p className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">What you have access to</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Unlimited case logging",
                    "All 10+ specialties",
                    "Logbook PDF export",
                    "Unlimited AI Brief Me",
                    "AI O-score suggestions",
                    "Bulk EPA sign-off",
                    "Benchmark percentiles",
                    "Excel export",
                    "Social & friends",
                    "No ads",
                  ].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                      <CheckCircle className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Feedback for the developer ───────────────────────────── */}
          {activeTab === "feedback" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[#f1f5f9]">Feedback for the developer</h2>
                <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
                  Bug, idea, or general note — goes straight to Karim&apos;s personal inbox.
                  Include as much detail as you&apos;d like (steps to reproduce, what you
                  expected, what happened). Please don&apos;t include patient identifiers.
                </p>
              </div>

              <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-5 space-y-4">
                {/* Category chips */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-2 block">
                    What kind of feedback?
                  </label>
                  <div className="flex gap-2">
                    {(
                      [
                        { key: "bug", label: "Bug" },
                        { key: "idea", label: "Idea" },
                        { key: "general", label: "General" },
                      ] as const
                    ).map((opt) => {
                      const selected = feedbackCategory === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setFeedbackCategory(opt.key)}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            selected
                              ? "bg-[#0EA5E9]/15 border border-[#0EA5E9]/40 text-[#0EA5E9]"
                              : "bg-[#16161f] border border-[#1e2130] text-[#94a3b8] hover:text-[#f1f5f9]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message textarea */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-2 block">
                    Message
                  </label>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => {
                      setFeedbackMessage(e.target.value);
                      if (feedbackStatus) setFeedbackStatus(null);
                    }}
                    maxLength={4000}
                    rows={7}
                    placeholder={
                      feedbackCategory === "bug"
                        ? "What went wrong? What did you expect? Steps to reproduce if you can."
                        : feedbackCategory === "idea"
                          ? "What would make Hippo work better for you?"
                          : "Anything on your mind — good, bad, or otherwise."
                    }
                    className="w-full bg-[#0a0a0f] border border-[#1e2130] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none focus:border-[#0EA5E9]/50 resize-y"
                    style={{ minHeight: 140 }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-[#475569]">
                      {feedbackMessage.length} / 4000
                    </span>
                    <span className="text-[10px] text-[#475569]">
                      Replies come from karimsidhom@outlook.com
                    </span>
                  </div>
                </div>

                {/* Status row */}
                {feedbackStatus?.kind === "success" && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg text-xs text-[#10b981]">
                    <CheckCircle size={13} />
                    Message sent. Karim will reply to your account email if needed.
                  </div>
                )}
                {feedbackStatus?.kind === "error" && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg text-xs text-[#ef4444]">
                    <AlertCircle size={13} />
                    {feedbackStatus.message}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={submitFeedback}
                  disabled={!feedbackMessage.trim() || feedbackSending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0EA5E9] hover:bg-[#0284c7] disabled:bg-[#1e2130] disabled:text-[#475569] text-white rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                  {feedbackSending ? "Sending…" : "Send to developer"}
                </button>
              </div>
            </div>
          )}

          {/* ── Account ──────────────────────────────────────────────── */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Account Controls</h2>

              <div className="space-y-3">
                <div className="p-4 bg-[#111118] border border-[#1e2130] rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#f1f5f9]">Download my data</p>
                      <p className="text-xs text-[#64748b] mt-0.5">Export all your case data in JSON format</p>
                    </div>
                    <a href="/api/account/export" download className="flex items-center gap-1.5 px-3 py-2 bg-[#16161f] border border-[#1e2130] text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg text-xs transition-all">
                      <Download className="w-3 h-3" />
                      Download
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-[#16161f] border border-[#1e2130] rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#f1f5f9]">Change password</p>
                      <p className="text-xs text-[#64748b] mt-0.5">Update your account password</p>
                    </div>
                    <button
                      onClick={() => {
                        setPwStatus(null);
                        setPwNew("");
                        setPwConfirm("");
                        setPwShow(false);
                        setPwOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#16161f] border border-[#252838] text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg text-xs transition-all"
                    >
                      Change <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#1a0f0f] border border-[#ef4444]/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#ef4444]">Delete account</p>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        Permanently delete your account and all data. This cannot be undone.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setDelConfirm("");
                        setDelError(null);
                        setDelOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444] hover:text-white rounded-lg text-xs transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Password change modal ───────────────────────────────────── */}
      {pwOpen && (
        <div
          onClick={() => !pwSubmitting && setPwOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0b0b0e] border border-[#1f1f23] rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f23]">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-[#0EA5E9]" />
                <span className="text-sm font-semibold text-[#f1f5f9]">Change password</span>
              </div>
              <button
                onClick={() => !pwSubmitting && setPwOpen(false)}
                className="text-[#71717a] hover:text-[#f1f5f9]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-2 block">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={pwShow ? "text" : "password"}
                    autoComplete="new-password"
                    value={pwNew}
                    onChange={(e) => {
                      setPwNew(e.target.value);
                      if (pwStatus) setPwStatus(null);
                    }}
                    placeholder="At least 8 characters"
                    className="w-full bg-[#0a0a0f] border border-[#1e2130] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none focus:border-[#0EA5E9]/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setPwShow((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#64748b] hover:text-[#f1f5f9]"
                    tabIndex={-1}
                    aria-label={pwShow ? "Hide password" : "Show password"}
                  >
                    {pwShow ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-2 block">
                  Confirm new password
                </label>
                <input
                  type={pwShow ? "text" : "password"}
                  autoComplete="new-password"
                  value={pwConfirm}
                  onChange={(e) => {
                    setPwConfirm(e.target.value);
                    if (pwStatus) setPwStatus(null);
                  }}
                  placeholder="Re-enter the password"
                  className="w-full bg-[#0a0a0f] border border-[#1e2130] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none focus:border-[#0EA5E9]/50"
                />
              </div>

              {pwStatus?.kind === "success" && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg text-xs text-[#10b981]">
                  <CheckCircle size={13} />
                  Password updated.
                </div>
              )}
              {pwStatus?.kind === "error" && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg text-xs text-[#ef4444]">
                  <AlertCircle size={13} />
                  {pwStatus.message}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPwOpen(false)}
                  disabled={pwSubmitting}
                  className="flex-1 py-2.5 bg-transparent border border-[#1e2130] text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPasswordChange}
                  disabled={pwSubmitting || !pwNew || !pwConfirm}
                  className="flex-1 py-2.5 bg-[#0EA5E9] hover:bg-[#0284c7] disabled:bg-[#1e2130] disabled:text-[#475569] text-white rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock size={14} />
                  {pwSubmitting ? "Updating…" : "Update password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Account deletion modal ──────────────────────────────────── */}
      {delOpen && (
        <div
          onClick={() => !delSubmitting && setDelOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0b0b0e] border border-[#ef4444]/30 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f23] bg-[#ef4444]/5">
              <div className="flex items-center gap-2">
                <Trash2 size={16} className="text-[#ef4444]" />
                <span className="text-sm font-semibold text-[#ef4444]">Delete account</span>
              </div>
              <button
                onClick={() => !delSubmitting && setDelOpen(false)}
                className="text-[#71717a] hover:text-[#f1f5f9]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#f1f5f9]">
                  This action is permanent and cannot be undone.
                </p>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Every case log, EPA observation, milestone, and program
                  membership tied to <strong className="text-[#f1f5f9]">{user?.email}</strong>{" "}
                  will be deleted from Hippo's servers. Your Supabase auth record
                  will be removed so the email can register fresh if you change
                  your mind.
                </p>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Consider downloading your data first from{" "}
                  <strong className="text-[#f1f5f9]">Account → Download my data</strong>.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-2 block">
                  To confirm, type:{" "}
                  <span className="text-[#ef4444] font-mono normal-case tracking-normal">
                    {expectedDelete}
                  </span>
                </label>
                <input
                  value={delConfirm}
                  onChange={(e) => {
                    setDelConfirm(e.target.value);
                    if (delError) setDelError(null);
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={expectedDelete}
                  className="w-full bg-[#0a0a0f] border border-[#1e2130] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#334155] focus:outline-none focus:border-[#ef4444]/50 font-mono"
                />
              </div>

              {delError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg text-xs text-[#ef4444]">
                  <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                  <span>{delError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDelOpen(false)}
                  disabled={delSubmitting}
                  className="flex-1 py-2.5 bg-transparent border border-[#1e2130] text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAccountDelete}
                  disabled={delSubmitting || delConfirm.trim() !== expectedDelete}
                  className="flex-1 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] disabled:bg-[#1e2130] disabled:text-[#475569] text-white rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  {delSubmitting ? "Deleting…" : "Permanently delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
