"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { SPECIALTIES, USER_ROLE_TYPES, PGY_YEARS } from "@/lib/constants";
import { POLICY_KEYS, POLICY_VERSIONS, POLICY_META, type PolicyKey } from "@/lib/legal";
import { Shield, Activity, Users, Trophy, ChevronRight, ChevronLeft, Check, ExternalLink } from "lucide-react";

const TOTAL_STEPS = 10;

export default function OnboardingPage() {
  const router = useRouter();
  const { updateProfile } = useUser();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    roleType: "RESIDENT",
    trainingCountry: "",
    specialty: "",
    pgyYear: 3,
    institution: "",
    city: "",
    publicProfile: false,
    allowLeaderboardParticipation: true,
    allowBenchmarkSharing: true,
    allowFriendRequests: true,
    phiaAgreed: false,
  });

  // Per-policy acceptance. Every key in POLICY_KEYS must be true before
  // the user can leave step 3 or finish onboarding.
  const [legalAccepted, setLegalAccepted] = useState<Record<PolicyKey, boolean>>(
    () => Object.fromEntries(POLICY_KEYS.map((k) => [k, false])) as Record<PolicyKey, boolean>,
  );
  const allLegalAccepted = POLICY_KEYS.every((k) => legalAccepted[k]) && form.phiaAgreed;

  const update = (updates: Partial<typeof form>) => setForm((f) => ({ ...f, ...updates }));
  const toggleLegal = (key: PolicyKey) =>
    setLegalAccepted((prev) => ({ ...prev, [key]: !prev[key] }));

  const recordLegalAcceptances = async () => {
    // Only POST acceptances that the user actually ticked. The server
    // enforces version match against POLICY_VERSIONS.
    const acceptances = POLICY_KEYS.filter((k) => legalAccepted[k]).map((k) => ({
      policyKey: k,
      version: POLICY_VERSIONS[k],
    }));
    if (acceptances.length === 0) return;
    await fetch("/api/legal/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptances }),
    }).catch(() => {
      // Non-blocking: if the network drops here we don't want to strand the
      // user, but we do want to know. Onboarding completion will still fire;
      // the gate will re-prompt on next load if any acceptance is missing.
    });
  };

  const handleFinish = async () => {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { phiaAgreed: _, ...profileData } = form;
    await recordLegalAcceptances();
    await updateProfile({
      ...(profileData as Parameters<typeof updateProfile>[0]),
      onboardingCompleted: true,
      trainingYearLabel: `PGY-${form.pgyYear}`,
      trainingCountry: form.trainingCountry || undefined,
    });
    setSaving(false);
    router.push("/dashboard");
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2563eb] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[#64748b] mt-2 text-center">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>

      <div className="w-full max-w-md">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-6 animate-slide-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#2563eb] to-[#6366f1] flex items-center justify-center shadow-glow-blue animate-bounce-in">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M10 30 L20 5 L30 30" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 22 L27 22" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                  <circle cx="30" cy="30" r="5" fill="#10b981"/>
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#f1f5f9]">Hippo</h1>
              <p className="text-[#2563eb] font-semibold mt-1 text-lg">Strava for Surgeons</p>
              <p className="text-[#94a3b8] mt-3 leading-relaxed">
                The premier case logging platform for surgical trainees. Track your operative journey, measure your growth, and achieve your milestones.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl transition-all active:scale-95 shadow-glow-blue"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Step 2: Strava Explainer */}
        {step === 2 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#f1f5f9]">Your Operative Journey</h2>
              <p className="text-[#94a3b8] mt-2">Like Strava tracks your runs, Hippo tracks your surgical growth</p>
            </div>
            <div className="space-y-3">
              {[
                { icon: Activity, color: "#2563eb", title: "Log Cases", desc: "Capture every procedure with rich metadata, approach, autonomy level, and OR times" },
                { icon: Trophy, color: "#f59e0b", title: "Earn Milestones", desc: "Unlock badges when you hit 10, 25, 50 cases of a procedure or achieve independence" },
                { icon: Users, color: "#10b981", title: "Compare with Peers", desc: "Privacy-safe benchmarks against national training data — see where you stand" },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex gap-4 p-4 bg-[#111118] border border-[#1e2130] rounded-xl">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#f1f5f9]">{title}</p>
                    <p className="text-sm text-[#94a3b8] mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Legal acceptance (click-wrap) */}
        {step === 3 && (
          <div className="space-y-5 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1a1a2e] border border-[#2563eb]/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#3b82f6]" />
              </div>
              <h2 className="text-2xl font-bold text-[#f1f5f9]">Terms & Privacy</h2>
              <p className="text-[#94a3b8] mt-2 text-sm">
                Please review each document and tick to accept. We record the
                version and timestamp of each acceptance.
              </p>
            </div>

            {/* Per-policy checkboxes */}
            <div className="space-y-2">
              {POLICY_KEYS.map((key) => {
                const meta = POLICY_META[key];
                const checked = legalAccepted[key];
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-3 cursor-pointer p-3.5 rounded-xl border transition-colors ${
                      checked
                        ? "bg-[#1a1a2e] border-[#2563eb]/60"
                        : "bg-[#111118] border-[#1e2130] hover:border-[#252838]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLegal(key)}
                      className="w-4 h-4 mt-0.5 accent-[#2563eb] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#f1f5f9]">
                          I have read & agree to the {meta.title}
                        </span>
                        <Link
                          href={meta.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-[#3b82f6] hover:underline"
                        >
                          Read
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">
                        {meta.summary}
                      </p>
                      <p className="text-[10px] text-[#475569] mt-1 uppercase tracking-wider">
                        v{POLICY_VERSIONS[key]}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* PHIA pledge (separate, affirmative) */}
            <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-4 space-y-2.5">
              <h3 className="font-semibold text-[#f1f5f9] text-sm">Patient privacy pledge</h3>
              {[
                "I will never enter patient names, health-card numbers, MRNs, or other identifiers.",
                "I will use age groups or decades instead of exact dates of birth.",
                "I understand Hippo scrubs for PHI patterns automatically, but I am ultimately responsible.",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#10b981] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#94a3b8] leading-relaxed">{item}</p>
                </div>
              ))}
              <label className="flex items-start gap-3 cursor-pointer pt-2 mt-2 border-t border-[#1e2130]">
                <input
                  type="checkbox"
                  checked={form.phiaAgreed}
                  onChange={(e) => update({ phiaAgreed: e.target.checked })}
                  className="w-4 h-4 mt-0.5 accent-[#2563eb] flex-shrink-0"
                />
                <p className="text-xs text-[#f1f5f9]">
                  I understand and commit to never entering patient-identifying information in Hippo.
                </p>
              </label>
            </div>

            {!allLegalAccepted && (
              <p className="text-xs text-[#64748b] text-center">
                Please accept every document above to continue.
              </p>
            )}
          </div>
        )}

        {/* Step 4: Role Selection */}
        {step === 4 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#f1f5f9]">Your Role</h2>
              <p className="text-[#94a3b8] mt-1">This helps personalize your experience</p>
            </div>
            <div className="space-y-3">
              {USER_ROLE_TYPES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => update({ roleType: role.value })}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                    form.roleType === role.value
                      ? "bg-[#1a1a2e] border-[#2563eb]"
                      : "bg-[#111118] border-[#1e2130] hover:border-[#252838]"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all ${
                    form.roleType === role.value ? "border-[#2563eb] bg-[#2563eb]" : "border-[#64748b]"
                  }`} />
                  <div>
                    <p className={`font-semibold ${form.roleType === role.value ? "text-[#f1f5f9]" : "text-[#94a3b8]"}`}>
                      {role.label}
                    </p>
                    <p className="text-sm text-[#64748b] mt-0.5">{role.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Training Country */}
        {step === 5 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#f1f5f9]">Training Country</h2>
              <p className="text-[#94a3b8] mt-1">This determines your EPA framework and milestones</p>
            </div>
            <div className="space-y-3">
              {[
                { value: "US", label: "United States", desc: "ACGME milestones & EPAs", flag: "🇺🇸" },
                { value: "CA", label: "Canada", desc: "Royal College CBD & CanMEDS", flag: "🇨🇦" },
              ].map((country) => (
                <button
                  key={country.value}
                  onClick={() => update({ trainingCountry: country.value })}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    form.trainingCountry === country.value
                      ? "bg-[#1a1a2e] border-[#2563eb]"
                      : "bg-[#111118] border-[#1e2130] hover:border-[#252838]"
                  }`}
                >
                  <span className="text-3xl">{country.flag}</span>
                  <div>
                    <p className={`font-semibold ${form.trainingCountry === country.value ? "text-[#f1f5f9]" : "text-[#94a3b8]"}`}>
                      {country.label}
                    </p>
                    <p className="text-sm text-[#64748b] mt-0.5">{country.desc}</p>
                  </div>
                  <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                    form.trainingCountry === country.value ? "border-[#2563eb] bg-[#2563eb]" : "border-[#64748b]"
                  }`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Specialty */}
        {step === 6 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#f1f5f9]">Your Specialty</h2>
              <p className="text-[#94a3b8] mt-1">Select your primary surgical specialty</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALTIES.map((spec) => (
                <button
                  key={spec.slug}
                  onClick={() => update({ specialty: spec.name })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.specialty === spec.name
                      ? "bg-[#1a1a2e] border-[#2563eb]"
                      : "bg-[#111118] border-[#1e2130] hover:border-[#252838]"
                  }`}
                >
                  <span className="text-xl">{spec.icon}</span>
                  <p className={`text-xs font-medium mt-1 ${form.specialty === spec.name ? "text-[#f1f5f9]" : "text-[#94a3b8]"}`}>
                    {spec.name.replace(" Surgery", "").replace(" Oncology", "")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: PGY Level */}
        {step === 7 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#f1f5f9]">Training Year</h2>
              <p className="text-[#94a3b8] mt-1">Helps calibrate benchmarks for your level</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PGY_YEARS.map((pgy) => (
                <button
                  key={pgy.value}
                  onClick={() => update({ pgyYear: pgy.value })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.pgyYear === pgy.value
                      ? "bg-[#1a1a2e] border-[#2563eb]"
                      : "bg-[#111118] border-[#1e2130] hover:border-[#252838]"
                  }`}
                >
                  <p className={`font-semibold ${form.pgyYear === pgy.value ? "text-[#f1f5f9]" : "text-[#94a3b8]"}`}>
                    {pgy.label}
                  </p>
                  {pgy.description && (
                    <p className="text-xs text-[#64748b] mt-0.5">{pgy.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Institution */}
        {step === 8 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#f1f5f9]">Your Institution</h2>
              <p className="text-[#94a3b8] mt-1">Helps with benchmark comparison (optional)</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Institution / Hospital</label>
                <input
                  type="text"
                  value={form.institution}
                  onChange={(e) => update({ institution: e.target.value })}
                  placeholder="e.g. University Health Network"
                  className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update({ city: e.target.value })}
                  placeholder="e.g. Toronto"
                  className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Privacy Prefs */}
        {step === 9 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#f1f5f9]">Privacy Settings</h2>
              <p className="text-[#94a3b8] mt-1">Control how your data is shared</p>
            </div>
            <div className="space-y-3">
              {[
                { key: "publicProfile" as const, label: "Public profile", desc: "Visible to other Hippo users" },
                { key: "allowFriendRequests" as const, label: "Allow friend requests", desc: "Other surgeons can add you as a friend" },
                { key: "allowLeaderboardParticipation" as const, label: "Leaderboard participation", desc: "Show in anonymized rankings" },
                { key: "allowBenchmarkSharing" as const, label: "Contribute to benchmarks", desc: "Help improve national benchmark data" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-[#111118] border border-[#1e2130] rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-[#f1f5f9]">{label}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => update({ [key]: !form[key] })}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-4 ${form[key] ? "bg-[#2563eb]" : "bg-[#1e2130]"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 10: First Case Prompt */}
        {step === 10 && (
          <div className="text-center space-y-6 animate-bounce-in">
            <div className="text-6xl">🎉</div>
            <div>
              <h2 className="text-2xl font-bold text-[#f1f5f9]">You're all set!</h2>
              <p className="text-[#94a3b8] mt-2 leading-relaxed">
                Welcome to Hippo, {form.specialty ? `${form.specialty} ` : ""}resident.
                Let's log your first case!
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl transition-all active:scale-95 shadow-glow-blue disabled:opacity-50"
              >
                {saving ? "Saving..." : "Go to Dashboard →"}
              </button>
              <button
                onClick={async () => {
                  setSaving(true);
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { phiaAgreed: _pa, ...skipData } = form;
                  await recordLegalAcceptances();
                  await updateProfile({ ...(skipData as Parameters<typeof updateProfile>[0]), onboardingCompleted: true });
                  setSaving(false);
                  router.push("/dashboard");
                }}
                className="w-full py-3 text-[#64748b] hover:text-[#94a3b8] text-sm transition-colors"
              >
                Skip for now, go to dashboard
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step > 1 && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#16161f] border border-[#1e2130] text-[#94a3b8] rounded-lg text-sm hover:text-[#f1f5f9] transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {step < TOTAL_STEPS && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 3 && !allLegalAccepted}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
