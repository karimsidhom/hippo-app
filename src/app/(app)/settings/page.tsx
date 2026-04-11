"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useSubscription } from "@/context/SubscriptionContext";
import { PRICING } from "@/lib/pricing";
import { Shield, Users, BarChart2, Download, Trash2, Bell, User, ChevronRight, Zap, CreditCard, CheckCircle, AlertCircle } from "lucide-react";

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "privacy", label: "Privacy & PHIA", icon: Shield },
  { key: "social", label: "Social", icon: Users },
  { key: "leaderboard", label: "Leaderboard", icon: BarChart2 },
  { key: "export", label: "Export", icon: Download },
  { key: "subscription", label: "Subscription", icon: CreditCard },
  { key: "account", label: "Account", icon: Trash2 },
];

export default function SettingsPage() {
  const { user, profile, updateProfile } = useUser();
  const { isPro, isFree, tier, status, currentPeriodEnd, cancelAtPeriodEnd, startCheckout, openBillingPortal, simulateUpgrade, simulateDowngrade } = useSubscription();
  const [activeTab, setActiveTab] = useState("privacy");
  const [portalLoading, setPortalLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [settings, setSettings] = useState({
    publicProfile: profile?.publicProfile || false,
    allowFriendRequests: profile?.allowFriendRequests ?? true,
    allowLeaderboardParticipation: profile?.allowLeaderboardParticipation ?? true,
    allowBenchmarkSharing: profile?.allowBenchmarkSharing ?? true,
    notifyMilestones: true,
    notifyFriendActivity: true,
    notifyWeeklySummary: true,
    exportIncludeNotes: true,
    exportIncludeReflections: false,
    exportFormat: "xlsx",
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } finally {
      setPortalLoading(false);
    }
  }

  const handleSave = async () => {
    await updateProfile({
      publicProfile: settings.publicProfile,
      allowFriendRequests: settings.allowFriendRequests,
      allowLeaderboardParticipation: settings.allowLeaderboardParticipation,
      allowBenchmarkSharing: settings.allowBenchmarkSharing,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ToggleRow = ({
    label,
    description,
    settingKey,
    sensitive = false,
  }: {
    label: string;
    description: string;
    settingKey: keyof typeof settings;
    sensitive?: boolean;
  }) => (
    <div className={`flex items-start justify-between p-4 rounded-lg ${sensitive ? "bg-[#1a0f0f] border border-[#ef4444]/20" : "bg-[#16161f] border border-[#1e2130]"}`}>
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-[#f1f5f9]">{label}</p>
        <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => toggle(settingKey)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
          settings[settingKey] ? (sensitive ? "bg-[#ef4444]" : "bg-[#2563eb]") : "bg-[#1e2130]"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            settings[settingKey] ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Settings</h1>
        <p className="text-[#94a3b8] text-sm mt-0.5">Manage your account and privacy preferences</p>
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
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 space-y-4">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Profile Settings</h2>
              <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-xs text-[#64748b] mb-2">Display Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name || ""}
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
              </div>
            </div>
          )}

          {/* Privacy & PHIA */}
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
                  settingKey="publicProfile"
                />
                <ToggleRow
                  label="Allow benchmark contribution"
                  description="Contribute anonymized operative times to improve national benchmarks for all trainees"
                  settingKey="allowBenchmarkSharing"
                />
              </div>
            </div>
          )}

          {/* Social Settings */}
          {activeTab === "social" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Social Permissions</h2>
              <div className="space-y-2">
                <ToggleRow
                  label="Allow friend requests"
                  description="Other surgeons can send you friend requests"
                  settingKey="allowFriendRequests"
                />
                <ToggleRow
                  label="Notify me on milestones"
                  description="Get notified when you or your friends achieve milestones"
                  settingKey="notifyMilestones"
                />
                <ToggleRow
                  label="Friend activity notifications"
                  description="See when friends log cases or earn achievements"
                  settingKey="notifyFriendActivity"
                />
                <ToggleRow
                  label="Weekly summary digest"
                  description="Receive a weekly email summary of your activity"
                  settingKey="notifyWeeklySummary"
                />
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {activeTab === "leaderboard" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Leaderboard Participation</h2>
              <div className="p-4 bg-[#16161f] border border-[#1e2130] rounded-lg text-xs text-[#94a3b8]">
                Leaderboard rankings use anonymized display names (e.g., "Resident PGY-4" or "Dr. A.C."). No patient data is ever shared. Rankings are based solely on case volume, autonomy levels, and improvement metrics.
              </div>
              <div className="space-y-2">
                <ToggleRow
                  label="Participate in leaderboard"
                  description="Allow your (anonymized) stats to appear on the leaderboard"
                  settingKey="allowLeaderboardParticipation"
                />
              </div>
            </div>
          )}

          {/* Export Settings */}
          {activeTab === "export" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Export Case Log</h2>
              <div className="space-y-2">
                <ToggleRow
                  label="Include operative notes in exports"
                  description="Notes are always scrubbed of PHI before export"
                  settingKey="exportIncludeNotes"
                />
                <ToggleRow
                  label="Include personal reflections"
                  description="Include your private reflections in exported documents"
                  settingKey="exportIncludeReflections"
                />
              </div>

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
                      body: JSON.stringify({
                        includeNotes: settings.exportIncludeNotes,
                        includeReflections: settings.exportIncludeReflections,
                      }),
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
                {exporting ? 'Preparing…' : 'Download Excel (.xlsx)'}
              </button>

              <p className="text-xs text-[#475569] text-center">
                Exports all your cases in a PHIA-safe format. No patient identifiers are included.
              </p>
            </div>
          )}

          {/* Subscription */}
          {activeTab === "subscription" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#f1f5f9]">Subscription</h2>

              {/* Current plan badge */}
              <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isPro ? (
                        <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-[#71717a]" />
                      )}
                      <span className="text-sm font-semibold text-[#f1f5f9]">
                        {isPro ? 'Hippo Pro' : 'Free Plan'}
                      </span>
                      {isPro && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#3b82f6]/15 text-[#3b82f6] px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </div>
                    {isPro && currentPeriodEnd && (
                      <p className="text-xs text-[#71717a]">
                        {cancelAtPeriodEnd
                          ? `Cancels on ${new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                          : `Renews on ${new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                      </p>
                    )}
                    {isFree && (
                      <p className="text-xs text-[#71717a]">5 cases/week · 1 specialty · Ads shown</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#fafafa]">{isPro ? PRICING.pro.monthlyDisplay : '$0'}</div>
                    <div className="text-xs text-[#52525b]">/month</div>
                  </div>
                </div>

                {isPro ? (
                  <button
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                    className="w-full py-2.5 bg-[#1c1c1f] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                  >
                    {portalLoading ? 'Opening portal…' : 'Manage Billing & Cancel'}
                  </button>
                ) : (
                  <button
                    onClick={startCheckout}
                    className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Upgrade to Pro — {PRICING.pro.monthlyDisplay}/month
                  </button>
                )}
              </div>

              {/* What's included */}
              {isFree && (
                <div className="bg-[#111118] border border-[#1f1f23] rounded-xl p-5">
                  <p className="text-xs font-semibold text-[#71717a] uppercase tracking-wider mb-3">Pro includes</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PRICING.pro.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                        <CheckCircle className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dev tools */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="bg-[#0d0d10] border border-dashed border-[#27272a] rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#3f3f46] mb-2">Dev Tools</p>
                  <button
                    onClick={simulateUpgrade}
                    className="w-full py-2 bg-transparent border border-dashed border-[#27272a] text-[#3f3f46] hover:text-[#71717a] rounded-lg text-xs transition-colors"
                  >
                    ⚡ Simulate Pro Upgrade
                  </button>
                  <button
                    onClick={simulateDowngrade}
                    className="w-full py-2 bg-transparent border border-dashed border-[#27272a] text-[#3f3f46] hover:text-[#71717a] rounded-lg text-xs transition-colors"
                  >
                    ↓ Simulate Downgrade to Free
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Account */}
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
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-[#16161f] border border-[#1e2130] text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg text-xs transition-all">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#16161f] border border-[#1e2130] rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#f1f5f9]">Change password</p>
                      <p className="text-xs text-[#64748b] mt-0.5">Update your account password</p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-[#16161f] border border-[#252838] text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg text-xs transition-all">
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
                      onClick={() => confirm("Are you absolutely sure? This will permanently delete your account and ALL case data. This cannot be undone.") && alert("Account deletion requested. In production this would delete your account.")}
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

          {/* Save Button (not for account or subscription) */}
          {activeTab !== "account" && activeTab !== "subscription" && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium rounded-lg text-sm transition-all active:scale-95"
              >
                Save Settings
              </button>
              {saved && (
                <span className="text-sm text-[#10b981] animate-fade-in">✓ Saved</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
