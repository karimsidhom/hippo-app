"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trash2, Info, X, Plus, Sparkles, AlertTriangle, Receipt } from "lucide-react";
import {
  getStyleProfile,
  hydrateStyleProfile,
  mergeStyleProfile,
  resetStyleProfile,
  setStyleProfile,
} from "@/lib/dictation/style/store";
import type { StyleProfile } from "@/lib/dictation/style/profile";
import {
  ALL_REGIONS,
  type BillingRegion,
} from "@/lib/dictation/billing";
import {
  DEFAULT_DICTATION_PREFERENCES,
  BILLING_DISCLAIMER,
  type DictationPreferences,
  type DictationLength,
  type DictationTone,
  type PostopPlanInclusion,
} from "@/lib/dictation/preferences";

// ---------------------------------------------------------------------------
// /settings/dictation — inspect and edit the learned StyleProfile.
//
// Reads synchronously from the in-memory cache via `getStyleProfile()` and
// triggers a background rehydrate on mount so the user sees fresh data from
// the server. All mutations go through `mergeStyleProfile()` /
// `setStyleProfile()` which transparently sync to /api/dictation/style.
// ---------------------------------------------------------------------------

export default function DictationSettingsPage() {
  // Local mirror of the profile so React re-renders on every mutation.
  const [profile, setProfile] = useState<StyleProfile>(() => getStyleProfile());
  const [hydrating, setHydrating] = useState(true);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [newPreferredPhrase, setNewPreferredPhrase] = useState("");
  const [newAvoidPhrase, setNewAvoidPhrase] = useState("");
  const [newSubFrom, setNewSubFrom] = useState("");
  const [newSubTo, setNewSubTo] = useState("");

  // Dictation preferences (length, tone, billing toggle + region, teaching pearls).
  const [prefs, setPrefs] = useState<DictationPreferences>(
    DEFAULT_DICTATION_PREFERENCES,
  );
  const [prefsLoading, setPrefsLoading] = useState(true);

  // Pull latest from server once.
  useEffect(() => {
    let cancelled = false;
    hydrateStyleProfile()
      .then((fresh) => {
        if (!cancelled) setProfile(fresh);
      })
      .catch(() => {
        // Non-fatal — stay on the local copy.
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pull preferences once.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/dictation/preferences")
      .then((r) => (r.ok ? r.json() : DEFAULT_DICTATION_PREFERENCES))
      .then((p: DictationPreferences) => {
        if (!cancelled) setPrefs(p);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPrefsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function patchPrefs(patch: Partial<DictationPreferences>) {
    // Optimistic UI
    setPrefs((p) => ({ ...p, ...patch }));
    flash();
    try {
      const res = await fetch("/api/dictation/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const fresh = (await res.json()) as DictationPreferences;
        setPrefs(fresh);
      }
    } catch {
      // Non-fatal — keep optimistic state.
    }
  }

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  // --- Mutators --------------------------------------------------------------

  function updateGlobal(patch: Partial<StyleProfile["global"]>) {
    const next = mergeStyleProfile({ global: { ...profile.global, ...patch } });
    setProfile(next);
    flash();
  }

  function removePreferredPhrase(phrase: string) {
    updateGlobal({
      preferredPhrases: profile.global.preferredPhrases.filter((p) => p !== phrase),
    });
  }

  function addPreferredPhrase() {
    const trimmed = newPreferredPhrase.trim();
    if (!trimmed) return;
    if (profile.global.preferredPhrases.includes(trimmed)) {
      setNewPreferredPhrase("");
      return;
    }
    updateGlobal({
      preferredPhrases: [...profile.global.preferredPhrases, trimmed],
    });
    setNewPreferredPhrase("");
  }

  function removeAvoidPhrase(phrase: string) {
    updateGlobal({
      avoidPhrases: profile.global.avoidPhrases.filter((p) => p !== phrase),
    });
  }

  function addAvoidPhrase() {
    const trimmed = newAvoidPhrase.trim();
    if (!trimmed) return;
    if (profile.global.avoidPhrases.includes(trimmed)) {
      setNewAvoidPhrase("");
      return;
    }
    updateGlobal({
      avoidPhrases: [...profile.global.avoidPhrases, trimmed],
    });
    setNewAvoidPhrase("");
  }

  function removeSubstitution(from: string, to: string) {
    const subs = profile.global.phraseSubstitutions ?? [];
    updateGlobal({
      phraseSubstitutions: subs.filter((s) => !(s.from === from && s.to === to)),
    });
  }

  function addSubstitution() {
    const from = newSubFrom.trim();
    const to = newSubTo.trim();
    if (!from || !to) return;
    const subs = profile.global.phraseSubstitutions ?? [];
    if (subs.some((s) => s.from === from)) {
      return;
    }
    updateGlobal({
      phraseSubstitutions: [...subs, { from, to }],
    });
    setNewSubFrom("");
    setNewSubTo("");
  }

  function removeDroppedSection(section: string) {
    updateGlobal({
      droppedSections: (profile.global.droppedSections ?? []).filter((s) => s !== section),
    });
  }

  function removeExample(savedAt: string) {
    // examples are concat-merged by mergeProfiles, so we have to go through
    // setStyleProfile() (full replace) to actually drop one.
    const next: StyleProfile = {
      ...profile,
      examples: profile.examples.filter((e) => e.savedAt !== savedAt),
      updatedAt: new Date().toISOString(),
    };
    setStyleProfile(next);
    setProfile(next);
    flash();
  }

  function handleReset() {
    resetStyleProfile();
    // The store resets memory to DEFAULT_STYLE_PROFILE synchronously — re-read.
    setProfile(getStyleProfile());
    setConfirmReset(false);
    flash();
  }

  // --- Render ----------------------------------------------------------------

  const correctionCount = profile.global.correctionCount ?? 0;
  const droppedSections = profile.global.droppedSections ?? [];
  const phraseSubs = profile.global.phraseSubstitutions ?? [];
  const formatting = profile.global.formatting ?? {};

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Settings
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#3b82f6]" />
              Dictation Style
            </h1>
            <p className="text-[var(--text-2)] text-sm mt-0.5">
              How Hippo writes your operative notes — learned from your edits.
            </p>
          </div>
          {saved && (
            <span className="text-sm text-[#10b981] animate-fade-in pt-1">✓ Saved</span>
          )}
        </div>
      </div>

      {/* Learning status */}
      <div className="p-4 bg-[var(--surface2)] border border-[var(--primary)]/30 rounded-xl">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-[#3b82f6] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--text)]">
              {correctionCount === 0
                ? "No corrections recorded yet"
                : `Learned from ${correctionCount} correction${correctionCount === 1 ? "" : "s"}`}
            </p>
            <p className="text-xs text-[var(--text-2)] mt-1 leading-relaxed">
              Every time you edit a generated draft, Hippo picks up on the
              wording and formatting you prefer. Changes sync automatically
              across your devices.
            </p>
            {hydrating && (
              <p className="text-[10px] text-[var(--text-3)] mt-2">Syncing latest from server…</p>
            )}
          </div>
        </div>
      </div>

      {/* Dictation preferences */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Dictation Output</h2>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-5">
          {prefsLoading && (
            <p className="text-[10px] text-[var(--text-3)]">Loading preferences…</p>
          )}

          {/* Length */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-2">
              Default dictation length
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["complete", "extra-detailed", "brief"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => patchPrefs({ length: l as DictationLength })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all ${
                    prefs.length === l
                      ? "bg-[var(--primary)] text-white border border-[var(--primary)]"
                      : "bg-[var(--surface2)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--primary)]/40"
                  }`}
                >
                  {l === "extra-detailed" ? "Extra detailed" : l}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-3)] mt-1.5">
              Default is &quot;complete&quot; — full operative note. &quot;Brief&quot; is reserved for handover/sign-out.
            </p>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-2">Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["standard", "Standard hospital"],
                  ["academic", "Academic detailed"],
                  ["concise-attending", "Concise attending"],
                  ["resident-teaching", "Resident teaching"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => patchPrefs({ tone: key as DictationTone })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    prefs.tone === key
                      ? "bg-[var(--primary)] text-white border border-[var(--primary)]"
                      : "bg-[var(--surface2)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--primary)]/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Postop plan */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-2">
              Postoperative plan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["always", "Always include"],
                  ["if-entered", "Only if entered"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => patchPrefs({ postopPlanInclusion: key as PostopPlanInclusion })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    prefs.postopPlanInclusion === key
                      ? "bg-[var(--primary)] text-white border border-[var(--primary)]"
                      : "bg-[var(--surface2)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--primary)]/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5">
            <ToggleRow
              label="Teaching pearls"
              hint="Append a short pearls / common pitfalls block after the operative note."
              value={prefs.teachingPearlsEnabled}
              onChange={(v) => patchPrefs({ teachingPearlsEnabled: v })}
            />
            <ToggleRow
              label="Missing-field prompts"
              hint="Show what's missing before generating (laterality, stent size, specimen status, etc.)."
              value={prefs.missingFieldPromptsEnabled}
              onChange={(v) => patchPrefs({ missingFieldPromptsEnabled: v })}
            />
          </div>
        </div>
      </section>

      {/* Billing — province + toggle */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)] flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#3b82f6]" />
          Billing / Documentation Support
        </h2>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-5">
          {/* Province selector */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-2">
              Province / Region
            </label>
            <select
              value={prefs.billingRegion ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                patchPrefs({
                  billingRegion: v === "" ? null : (v as BillingRegion),
                });
              }}
              className="w-full bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">— Not selected —</option>
              {ALL_REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} {r.status === "verified" ? "" : "(coming soon)"}
                </option>
              ))}
            </select>
            {prefs.billingRegion && (
              <p className="text-[10px] text-[var(--text-3)] mt-1.5">
                {ALL_REGIONS.find((r) => r.code === prefs.billingRegion)?.feeScheduleName}
                {ALL_REGIONS.find((r) => r.code === prefs.billingRegion)?.status === "scaffolded" && (
                  <span className="text-[#f59e0b]"> · library not yet populated for this region</span>
                )}
              </p>
            )}
          </div>

          {/* Billing toggle */}
          <ToggleRow
            label="Append billing codes to dictations"
            hint={
              !prefs.billingRegion
                ? "Pick a province above first."
                : "When on, every generated dictation gets a Billing / Documentation Support section."
            }
            value={prefs.billingEnabled && !!prefs.billingRegion}
            onChange={(v) => patchPrefs({ billingEnabled: v })}
            disabled={!prefs.billingRegion}
          />

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-[#1a1500] border border-[#f59e0b]/30 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-[var(--text-2)] leading-relaxed">
              {BILLING_DISCLAIMER}
            </p>
          </div>
        </div>
      </section>

      {/* Brevity & formatting */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Tone & Formatting</h2>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-5">
          {/* Brevity */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-2">Brevity</label>
            <div className="grid grid-cols-3 gap-2">
              {(["verbose", "standard", "concise"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => updateGlobal({ brevity: level })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all ${
                    profile.global.brevity === level
                      ? "bg-[var(--primary)] text-white border border-[var(--primary)]"
                      : "bg-[var(--surface2)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--primary)]/40"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-3)] mt-1.5">
              Concise trims routine language; verbose keeps every detail.
            </p>
          </div>

          {/* Header style */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-2">Section headers</label>
            <div className="grid grid-cols-3 gap-2">
              {(["upper", "title", "plain"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => updateGlobal({ headerStyle: style })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    profile.global.headerStyle === style
                      ? "bg-[var(--primary)] text-white border border-[var(--primary)]"
                      : "bg-[var(--surface2)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--primary)]/40"
                  }`}
                >
                  {style === "upper" && "UPPER"}
                  {style === "title" && "Title"}
                  {style === "plain" && "plain"}
                </button>
              ))}
            </div>
          </div>

          {/* Blank lines */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-2">
              Blank lines between sections
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([0, 1, 2] as const).map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    updateGlobal({
                      formatting: { ...formatting, blankLinesBetweenSections: n },
                    })
                  }
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    (formatting.blankLinesBetweenSections ?? 1) === n
                      ? "bg-[var(--primary)] text-white border border-[var(--primary)]"
                      : "bg-[var(--surface2)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--primary)]/40"
                  }`}
                >
                  {n === 0 ? "None" : n === 1 ? "Single" : "Double"}
                </button>
              ))}
            </div>
          </div>

          {/* Bullet style */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-2">Bullet style</label>
            <div className="grid grid-cols-4 gap-2">
              {([null, "-", "•", "*"] as const).map((bullet) => (
                <button
                  key={bullet ?? "prose"}
                  onClick={() =>
                    updateGlobal({ formatting: { ...formatting, bulletStyle: bullet } })
                  }
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    (formatting.bulletStyle ?? null) === bullet
                      ? "bg-[var(--primary)] text-white border border-[var(--primary)]"
                      : "bg-[var(--surface2)] text-[var(--text-2)] border border-[var(--border)] hover:border-[var(--primary)]/40"
                  }`}
                >
                  {bullet === null ? "Prose" : bullet}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dropped sections */}
      {droppedSections.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--text)]">Sections you usually remove</h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-2">
            <p className="text-xs text-[var(--text-3)] mb-2">
              Hippo has learned to drop these from your drafts. Click × to bring any of them back.
            </p>
            <div className="flex flex-wrap gap-2">
              {droppedSections.map((section) => (
                <span
                  key={section}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--surface2)] border border-[var(--border)] text-xs text-[var(--text)] rounded-full"
                >
                  {section}
                  <button
                    onClick={() => removeDroppedSection(section)}
                    className="text-[var(--text-3)] hover:text-[#ef4444] transition-colors"
                    title="Unremove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Preferred phrases */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Preferred phrases</h2>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <p className="text-xs text-[var(--text-3)]">
            Wording Hippo will favour when drafting your notes.
          </p>
          {profile.global.preferredPhrases.length === 0 ? (
            <p className="text-xs text-[#52525b] italic">No preferred phrases yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {profile.global.preferredPhrases.map((phrase) => (
                <li
                  key={phrase}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg"
                >
                  <span className="text-sm text-[var(--text)] truncate">{phrase}</span>
                  <button
                    onClick={() => removePreferredPhrase(phrase)}
                    className="flex-shrink-0 text-[var(--text-3)] hover:text-[#ef4444] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newPreferredPhrase}
              onChange={(e) => setNewPreferredPhrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPreferredPhrase()}
              placeholder="Add a phrase you prefer…"
              className="flex-1 bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder:text-[var(--muted)]"
            />
            <button
              onClick={addPreferredPhrase}
              disabled={!newPreferredPhrase.trim()}
              className="px-3 py-2 bg-[var(--primary)] hover:bg-[var(--primary-lo)] disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>
      </section>

      {/* Avoid phrases */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Phrases to avoid</h2>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <p className="text-xs text-[var(--text-3)]">
            Wording Hippo will strip out of drafts before showing them to you.
          </p>
          {profile.global.avoidPhrases.length === 0 ? (
            <p className="text-xs text-[#52525b] italic">No avoid phrases yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {profile.global.avoidPhrases.map((phrase) => (
                <li
                  key={phrase}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg"
                >
                  <span className="text-sm text-[var(--text)] truncate">{phrase}</span>
                  <button
                    onClick={() => removeAvoidPhrase(phrase)}
                    className="flex-shrink-0 text-[var(--text-3)] hover:text-[#ef4444] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newAvoidPhrase}
              onChange={(e) => setNewAvoidPhrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAvoidPhrase()}
              placeholder="Add a phrase to strip out…"
              className="flex-1 bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder:text-[var(--muted)]"
            />
            <button
              onClick={addAvoidPhrase}
              disabled={!newAvoidPhrase.trim()}
              className="px-3 py-2 bg-[var(--primary)] hover:bg-[var(--primary-lo)] disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>
      </section>

      {/* Phrase substitutions */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Phrase substitutions</h2>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <p className="text-xs text-[var(--text-3)]">
            Literal find-and-replace rules. Applied at render time.
          </p>
          {phraseSubs.length === 0 ? (
            <p className="text-xs text-[#52525b] italic">No substitutions yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {phraseSubs.map((sub) => (
                <li
                  key={`${sub.from}->${sub.to}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-2)] truncate">{sub.from}</span>
                    <span className="text-[var(--text-3)]">→</span>
                    <span className="text-[var(--text)] truncate">{sub.to}</span>
                  </div>
                  <button
                    onClick={() => removeSubstitution(sub.from, sub.to)}
                    className="flex-shrink-0 text-[var(--text-3)] hover:text-[#ef4444] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center pt-1">
            <input
              type="text"
              value={newSubFrom}
              onChange={(e) => setNewSubFrom(e.target.value)}
              placeholder="Replace…"
              className="bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder:text-[var(--muted)]"
            />
            <span className="text-[var(--text-3)] text-xs">→</span>
            <input
              type="text"
              value={newSubTo}
              onChange={(e) => setNewSubTo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubstitution()}
              placeholder="With…"
              className="bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder:text-[var(--muted)]"
            />
            <button
              onClick={addSubstitution}
              disabled={!newSubFrom.trim() || !newSubTo.trim()}
              className="px-3 py-2 bg-[var(--primary)] hover:bg-[var(--primary-lo)] disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>
      </section>

      {/* Examples */}
      {profile.examples.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Saved examples ({profile.examples.length})
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-2">
            <p className="text-xs text-[var(--text-3)] mb-2">
              Notes you marked as good — Hippo uses these as references when drafting.
            </p>
            <ul className="space-y-2">
              {profile.examples.map((ex) => (
                <li
                  key={ex.savedAt}
                  className="flex items-start justify-between gap-3 px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--text-3)]">
                      <span>{ex.service}</span>
                      <span>·</span>
                      <span>{ex.noteType}</span>
                      <span>·</span>
                      <span>{new Date(ex.savedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-[var(--text-2)] mt-1 line-clamp-2">{ex.excerpt}</p>
                  </div>
                  <button
                    onClick={() => removeExample(ex.savedAt)}
                    className="flex-shrink-0 text-[var(--text-3)] hover:text-[#ef4444] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Reset */}
      <section className="pt-4 border-t border-[var(--border)]">
        <div className="p-4 bg-[#1a0f0f] border border-[#ef4444]/30 rounded-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-[#ef4444]">Reset dictation style</p>
              <p className="text-xs text-[var(--text-3)] mt-0.5">
                Clears every learned preference. Hippo will start from defaults. Your case logs
                are unaffected.
              </p>
            </div>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444] hover:text-white rounded-lg text-xs transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-2)] rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#ef4444] text-white rounded-lg text-xs font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  Confirm reset
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text)]">{label}</p>
        {hint && <p className="text-[10px] text-[var(--text-3)] mt-0.5">{hint}</p>}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        aria-pressed={value}
        className={`relative flex-shrink-0 h-6 w-10 rounded-full transition-colors ${
          value ? "bg-[var(--primary)]" : "bg-[var(--border)]"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
