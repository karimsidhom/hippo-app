"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useCases } from "@/hooks/useCases";
import { useMilestones } from "@/hooks/useMilestones";
import { useUser } from "@/hooks/useUser";
import { CelebrationModal } from "@/components/shared/CelebrationModal";
import { ProcedurePicker } from "@/components/shared/ProcedurePicker";
import { validateNotes } from "@/lib/phia";
import { checkMilestones, checkPersonalRecords } from "@/lib/milestones";
import { SPECIALTIES, AUTONOMY_LEVELS, SURGICAL_APPROACHES, OUTCOME_CATEGORIES, COMPLICATION_CATEGORIES, DIFFICULTY_SCORES } from "@/lib/constants";
import { getProceduresBySpecialty } from "@/lib/procedureLibrary";
import type { AutonomyLevel, SurgicalApproach, OutcomeCategory, ComplicationCategory, AgeBin, Milestone, PersonalRecord, EpaSuggestion, EpaObservationInput } from "@/lib/types";
import { ChevronLeft, ChevronRight, Check, AlertTriangle, Shield, Mic, Sparkles } from "lucide-react";
import { VoiceTextarea } from "@/components/VoiceTextarea";
import type { VoiceLogParseResult } from "@/lib/voice-log/parse";
import { EpaSuggestionSheet } from "@/components/epa/EpaSuggestionSheet";
import { EpaObservationForm } from "@/components/epa/EpaObservationForm";

interface LogFormState {
  specialtySlug: string;
  specialtyName: string;
  procedureName: string;
  procedureCategory: string | null;
  surgicalApproach: string;
  role: string;
  autonomyLevel: string;
  difficultyScore: number;
  consoleTimeMinutes?: number;
  dockingTimeMinutes?: number;
  attendingLabel: string;
  institutionSite: string;
  patientAgeBin: string;
  diagnosisCategory: string;
  outcomeCategory: string;
  complicationCategory: string;
  conversionOccurred: boolean;
  notes: string;
  reflection: string;
  tags: string[];
  isPublic: boolean;
  benchmarkOptIn: boolean;
  caseDate: Date;
}

const STEPS = [
  { label: "Essentials", description: "Procedure, date, role" },
  { label: "Operative Details", description: "Approach, difficulty, findings" },
  { label: "Outcomes & Notes", description: "Outcome, complications, notes" },
  { label: "Review", description: "Confirm and submit" },
];

export default function LogCasePage() {
  const router = useRouter();
  const { cases, addCase, addCaseAsync } = useCases();
  const { milestones, personalRecords, addMilestone } = useMilestones();
  const { user, profile } = useUser();

  const userSpecialtySlug = (() => {
    if (!profile?.specialty) return "urology";
    const found = SPECIALTIES.find(s => s.name === profile.specialty || s.slug === profile.specialty);
    return found?.slug ?? "urology";
  })();
  const userSpecialtyName = (() => {
    const found = SPECIALTIES.find(s => s.slug === userSpecialtySlug);
    return found?.name ?? "Urology";
  })();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [celebration, setCelebration] = useState<{ milestones: Milestone[]; prs: PersonalRecord[] } | null>(null);

  const [form, setForm] = useState<LogFormState>({
    specialtySlug: userSpecialtySlug,
    specialtyName: userSpecialtyName,
    procedureName: "",
    procedureCategory: null,
    surgicalApproach: "ROBOTIC",
    role: "First Surgeon",
    autonomyLevel: "SUPERVISOR_PRESENT",
    difficultyScore: 3,
    consoleTimeMinutes: undefined,
    dockingTimeMinutes: undefined,
    attendingLabel: "",
    institutionSite: "",
    diagnosisCategory: "",
    patientAgeBin: "UNKNOWN",
    outcomeCategory: "UNCOMPLICATED",
    complicationCategory: "NONE",
    conversionOccurred: false,
    notes: "",
    reflection: "",
    tags: [],
    isPublic: false,
    benchmarkOptIn: true,
    caseDate: new Date(),
  });

  const [notesValidation, setNotesValidation] = useState<{ safe: boolean; warnings: string[] }>({ safe: true, warnings: [] });
  const [tagInput, setTagInput] = useState("");
  const [patientAgeDisplay, setPatientAgeDisplay] = useState("");

  // EPA suggestion flow state
  const [epaSuggestions, setEpaSuggestions] = useState<EpaSuggestion[]>([]);
  const [epaSuggestionsLoading, setEpaSuggestionsLoading] = useState(false);
  const [showEpaSuggestions, setShowEpaSuggestions] = useState(false);
  const [selectedEpaSuggestion, setSelectedEpaSuggestion] = useState<EpaSuggestion | null>(null);
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null);

  // Portal root for rendering modals outside the scrollable content
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalRoot(document.getElementById("portal-root"));
  }, []);

  // Voice case logging — dictate a quick description, Claude fills the form.
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceParsing, setVoiceParsing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceFilled, setVoiceFilled] = useState(false);

  const handleVoiceParse = async () => {
    const trimmed = voiceTranscript.trim();
    if (!trimmed || voiceParsing) return;
    setVoiceParsing(true);
    setVoiceError(null);
    try {
      const res = await fetch("/api/voice-log", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Parse failed (${res.status})`);
      }
      const json = (await res.json()) as VoiceLogParseResult;
      const f = json.fields;
      const updates: Partial<LogFormState> = {};
      if (f.procedureName) updates.procedureName = f.procedureName;
      if (f.surgicalApproach) updates.surgicalApproach = f.surgicalApproach;
      if (f.role) updates.role = f.role;
      if (f.autonomyLevel) updates.autonomyLevel = f.autonomyLevel;
      if (f.attendingLabel) updates.attendingLabel = f.attendingLabel;
      if (f.outcomeCategory) updates.outcomeCategory = f.outcomeCategory;
      if (f.complicationCategory) updates.complicationCategory = f.complicationCategory;
      if (f.notes) updates.notes = f.notes;
      if (f.reflection) updates.reflection = f.reflection;
      if (f.caseDate) updates.caseDate = new Date(f.caseDate);
      updateForm(updates);
      setVoiceFilled(true);
      if (json.warnings?.length) {
        setVoiceError(json.warnings[0]);
      }
    } catch (err) {
      console.error("Voice log parse failed", err);
      setVoiceError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setVoiceParsing(false);
    }
  };

  const specialtyProcedures = getProceduresBySpecialty(form.specialtySlug || "urology");

  const updateForm = (updates: Partial<LogFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleNotesChange = (text: string) => {
    updateForm({ notes: text });
    if (text.length > 10) {
      const result = validateNotes(text);
      setNotesValidation({ safe: result.safe, warnings: result.warnings });
    } else {
      setNotesValidation({ safe: true, warnings: [] });
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags?.includes(tag)) {
      updateForm({ tags: [...(form.tags || []), tag] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    updateForm({ tags: (form.tags || []).filter((t) => t !== tag) });
  };

  const canAdvance = () => {
    if (step === 0) return !!form.procedureName && !!form.caseDate && !!form.role;
    if (step === 1) return true;
    if (step === 2) return notesValidation.safe;
    return true;
  };

  /** Quick submit — log the essentials and go */
  const handleQuickSubmit = async () => {
    if (!form.procedureName) return;
    await doSubmit();
  };

  /** Full submit from review step */
  const handleSubmit = async () => {
    if (!form.procedureName) return;
    await doSubmit();
  };

  const doSubmit = async () => {
    setSubmitting(true);

    const caseInput = {
      userId: user?.id ?? '',
      specialtyId: form.specialtySlug ?? null,
      specialtyName: form.specialtyName,
      procedureDefinitionId: null,
      procedureName: form.procedureName,
      procedureCategory: form.procedureCategory ?? null,
      surgicalApproach: form.surgicalApproach as SurgicalApproach,
      role: form.role,
      autonomyLevel: form.autonomyLevel as AutonomyLevel,
      difficultyScore: form.difficultyScore || 3,
      operativeDurationMinutes: null,
      consoleTimeMinutes: form.consoleTimeMinutes ?? null,
      dockingTimeMinutes: form.dockingTimeMinutes ?? null,
      attendingLabel: form.attendingLabel || null,
      institutionSite: form.institutionSite || null,
      patientAgeBin: (form.patientAgeBin ?? 'UNKNOWN') as AgeBin,
      diagnosisCategory: form.diagnosisCategory || null,
      outcomeCategory: (form.outcomeCategory ?? 'UNCOMPLICATED') as OutcomeCategory,
      complicationCategory: (form.complicationCategory ?? 'NONE') as ComplicationCategory,
      conversionOccurred: form.conversionOccurred ?? false,
      notes: form.notes ?? null,
      tags: form.tags ?? [],
      reflection: form.reflection ?? null,
      isPublic: form.isPublic ?? false,
      benchmarkOptIn: form.benchmarkOptIn ?? true,
      caseDate: form.caseDate || new Date(),
    };

    // Step 1: Save the case
    let realCaseId: string | null = null;
    try {
      const newCase = await addCaseAsync(caseInput);
      if (newCase && !newCase.id.startsWith('tmp_')) {
        realCaseId = newCase.id;
        setSavedCaseId(newCase.id);
      }
    } catch (e) {
      console.error('[doSubmit] addCaseAsync threw:', e);
    }

    setSubmitting(false);

    // Step 2: ALWAYS show EPA suggestions — even if case save got a temp ID
    if (realCaseId) {
      startEpaSuggestionFetch(realCaseId);
    } else {
      // Even without a real case ID, show the modal with empty suggestions
      setEpaSuggestionsLoading(false);
    }

    // Force the EPA suggestion modal open — this MUST run no matter what
    setShowEpaSuggestions(true);

    // Scroll to top so the fixed modal is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Start fetching EPA suggestions in the background.
   * Called immediately after case save — runs in parallel with milestone checks.
   * Does NOT redirect on failure — always shows the EPA modal.
   */
  const startEpaSuggestionFetch = async (caseLogId: string) => {
    setEpaSuggestionsLoading(true);
    setEpaSuggestions([]);
    try {
      const res = await fetch("/api/epa/ai-suggest", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseLogId }),
      });
      if (res.ok) {
        const json = await res.json();
        const suggestions: EpaSuggestion[] = json.suggestions ?? [];
        setEpaSuggestions(suggestions);
      } else {
        console.error('[startEpaSuggestionFetch] API error:', res.status);
        // Keep suggestions empty — the sheet will show "no suggestions" UI
      }
    } catch (err) {
      console.error('[startEpaSuggestionFetch] Fetch error:', err);
    } finally {
      setEpaSuggestionsLoading(false);
    }
  };

  /** Handle user selecting an EPA suggestion */
  const handleEpaSelect = (suggestion: EpaSuggestion) => {
    setSelectedEpaSuggestion(suggestion);
    setShowEpaSuggestions(false);
  };

  /** Handle skipping EPA suggestions */
  const handleEpaSkip = () => {
    setShowEpaSuggestions(false);
    setSelectedEpaSuggestion(null);
    router.push("/cases");
  };

  /** Handle EPA observation form submission */
  const handleEpaObservationSubmit = async (data: EpaObservationInput) => {
    try {
      // Create the observation
      const createRes = await fetch("/api/epa/observations", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...data,
          observationDate: data.observationDate instanceof Date
            ? data.observationDate.toISOString()
            : data.observationDate,
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create observation");
      const observation = await createRes.json();

      // Submit the observation
      await fetch(`/api/epa/observations/${observation.id}/submit`, {
        method: "POST",
        credentials: "include",
      });

      setSelectedEpaSuggestion(null);
      router.push("/cases");
    } catch (err) {
      console.error("EPA observation submit failed:", err);
      setSelectedEpaSuggestion(null);
      router.push("/cases");
    }
  };

  /** Handle EPA observation save as draft */
  const handleEpaObservationDraft = async (data: EpaObservationInput) => {
    try {
      await fetch("/api/epa/observations", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...data,
          observationDate: data.observationDate instanceof Date
            ? data.observationDate.toISOString()
            : data.observationDate,
        }),
      });
    } catch (err) {
      console.error("EPA observation draft save failed:", err);
    }
    setSelectedEpaSuggestion(null);
    router.push("/cases");
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Log a Case</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Record your operative experience</p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-200 ${
                i < step
                  ? "bg-[#10b981] text-white"
                  : i === step
                  ? "bg-[#2563eb] text-white shadow-glow-blue"
                  : "bg-[#16161f] text-[#64748b] border border-[#1e2130]"
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <div className="hidden sm:block">
              <p className={`text-xs font-medium ${i === step ? "text-[#f1f5f9]" : "text-[#64748b]"}`}>
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-[#10b981]" : "bg-[#1e2130]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-6 shadow-card">
        {/* ── Step 1: Essentials ── */}
        {step === 0 && (
          <div className="space-y-5 animate-slide-up">
            {/* Voice dictation — fill the form by talking */}
            <div
              style={{
                padding: "14px 16px",
                background: voiceFilled
                  ? "rgba(16,185,129,0.06)"
                  : "linear-gradient(135deg, rgba(168,85,247,0.06), rgba(59,130,246,0.06))",
                border: `1px solid ${
                  voiceFilled
                    ? "rgba(16,185,129,0.25)"
                    : "rgba(168,85,247,0.2)"
                }`,
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  color: voiceFilled ? "var(--success)" : "#c4b5fd",
                }}
              >
                {voiceFilled ? (
                  <><Check size={13} /> Form filled from voice</>
                ) : (
                  <><Mic size={13} /> Quick log — dictate your case</>
                )}
              </div>
              <VoiceTextarea
                value={voiceTranscript}
                onChange={setVoiceTranscript}
                placeholder='e.g. "Did a lap chole today with Dr. Chen, robotic, I was console surgeon, 90 minutes, uncomplicated"'
                disabled={voiceParsing}
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleVoiceParse();
                  }
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                  ⌘↵ to fill form · review below before submitting
                </div>
                <button
                  onClick={handleVoiceParse}
                  disabled={voiceParsing || !voiceTranscript.trim()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 14px",
                    background: voiceParsing
                      ? "rgba(168,85,247,0.16)"
                      : "linear-gradient(135deg, rgba(168,85,247,0.16), rgba(59,130,246,0.16))",
                    border: "1px solid rgba(168,85,247,0.35)",
                    borderRadius: 6,
                    color: voiceParsing ? "var(--muted)" : "#c4b5fd",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor:
                      voiceParsing || !voiceTranscript.trim()
                        ? "not-allowed"
                        : "pointer",
                    fontFamily: "inherit",
                    opacity: !voiceTranscript.trim() && !voiceParsing ? 0.5 : 1,
                  }}
                >
                  <Sparkles size={11} />
                  {voiceParsing ? "Parsing…" : "Fill form"}
                </button>
              </div>
              {voiceError && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    color: "#fca5a5",
                    lineHeight: 1.4,
                  }}
                >
                  {voiceError}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">Basic Information</h2>
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Specialty *</label>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {SPECIALTIES.map((spec) => (
                  <button
                    key={spec.slug}
                    type="button"
                    onClick={() => updateForm({ specialtySlug: spec.slug, specialtyName: spec.name, procedureName: "" })}
                    style={{
                      flexShrink: 0,
                      padding: "6px 12px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 500,
                      border: "1px solid",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                      background: form.specialtySlug === spec.slug ? "#1a1a2e" : "#16161f",
                      borderColor: form.specialtySlug === spec.slug ? "#2563eb" : "#1e2130",
                      color: form.specialtySlug === spec.slug ? "#f1f5f9" : "#94a3b8",
                    }}
                  >
                    {spec.icon} {spec.name.replace(" Surgery", "").replace("/ Otolaryngology", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Procedure */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Procedure *</label>
              <ProcedurePicker
                procedures={specialtyProcedures}
                value={form.procedureName || ""}
                onChange={(name, proc) => {
                  const rawApproach = proc.approaches[0] ?? '';
                  const approach = (rawApproach.toUpperCase().replace(/ /g, '_') || 'OPEN') as SurgicalApproach;
                  updateForm({
                    procedureName: name,
                    procedureCategory: proc.category || null,
                    surgicalApproach: approach,
                    difficultyScore: proc.complexityTier + 1,
                  });
                }}
              />
            </div>

            {/* Case Date */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Case Date *</label>
              <input
                type="date"
                value={form.caseDate instanceof Date ? form.caseDate.toISOString().split("T")[0] : ""}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => updateForm({ caseDate: new Date(e.target.value) })}
                className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Role *</label>
              <div className="flex gap-2">
                {["First Surgeon", "Assist", "Observer"].map((r) => (
                  <button
                    key={r}
                    onClick={() => updateForm({ role: r })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                      form.role === r
                        ? "bg-[#1a1a2e] border-[#2563eb] text-[#3b82f6]"
                        : "bg-[#16161f] border-[#1e2130] text-[#94a3b8] hover:border-[#252838]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Attending Surgeon */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Attending Surgeon</label>
              <input
                type="text"
                placeholder="e.g. Dr. Smith"
                value={form.attendingLabel || ""}
                onChange={(e) => updateForm({ attendingLabel: e.target.value })}
                className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            {/* Hospital / Institution */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Hospital / Institution</label>
              <input
                type="text"
                placeholder="e.g. Toronto General Hospital"
                value={form.institutionSite || ""}
                onChange={(e) => updateForm({ institutionSite: e.target.value })}
                className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Diagnosis / Indication</label>
              <input
                type="text"
                placeholder="e.g. Bladder cancer, BPH..."
                value={form.diagnosisCategory || ""}
                onChange={(e) => updateForm({ diagnosisCategory: e.target.value })}
                className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            {/* Autonomy */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Autonomy Level *</label>
              <div className="space-y-2">
                {AUTONOMY_LEVELS.map((al) => (
                  <button
                    key={al.value}
                    onClick={() => updateForm({ autonomyLevel: al.value as AutonomyLevel })}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-150 border text-left ${
                      form.autonomyLevel === al.value
                        ? "bg-[#1a1a2e] border-[#2563eb]"
                        : "bg-[#16161f] border-[#1e2130] hover:border-[#252838]"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: al.color }}
                    />
                    <div>
                      <p className={`font-medium ${form.autonomyLevel === al.value ? "text-[#f1f5f9]" : "text-[#94a3b8]"}`}>
                        {al.label}
                      </p>
                      <p className="text-xs text-[#64748b] mt-0.5">{al.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Operative Details ── */}
        {step === 1 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold text-[#f1f5f9]">Operative Details</h2>

            {/* Surgical Approach */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Surgical Approach</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {SURGICAL_APPROACHES.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => updateForm({ surgicalApproach: a.value as SurgicalApproach })}
                    className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                      form.surgicalApproach === a.value
                        ? "bg-[#1a1a2e] border-[#2563eb] text-[#f1f5f9]"
                        : "bg-[#16161f] border-[#1e2130] text-[#94a3b8] hover:border-[#252838]"
                    }`}
                  >
                    <div className="text-base mb-0.5">{a.icon}</div>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Robotic timing — only for robotic cases */}
            {(form.surgicalApproach === "ROBOTIC") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Console Time (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    placeholder="e.g. 155"
                    value={form.consoleTimeMinutes || ""}
                    onChange={(e) => updateForm({ consoleTimeMinutes: parseInt(e.target.value) || undefined })}
                    className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Docking Time (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    placeholder="e.g. 15"
                    value={form.dockingTimeMinutes || ""}
                    onChange={(e) => updateForm({ dockingTimeMinutes: parseInt(e.target.value) || undefined })}
                    className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
              </div>
            )}

            {/* Difficulty Score */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                Difficulty Score: <span className="text-[#f1f5f9] font-semibold">
                  {DIFFICULTY_SCORES.find(d => d.value === form.difficultyScore)?.label || "Moderate"}
                </span>
              </label>
              <div className="flex gap-2">
                {DIFFICULTY_SCORES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => updateForm({ difficultyScore: d.value })}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-150 border ${
                      form.difficultyScore === d.value
                        ? "border-current opacity-100"
                        : "bg-[#16161f] border-[#1e2130] text-[#64748b] opacity-60 hover:opacity-80"
                    }`}
                    style={form.difficultyScore === d.value ? { color: d.color, borderColor: d.color, backgroundColor: `${d.color}15` } : {}}
                  >
                    {d.value}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#64748b] mt-1">
                {DIFFICULTY_SCORES.find(d => d.value === form.difficultyScore)?.description}
              </p>
            </div>

            {/* Patient Age */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Patient Age</label>
              <input
                type="number"
                min={0}
                max={120}
                placeholder="e.g. 58"
                value={patientAgeDisplay}
                onChange={(e) => {
                  const val = e.target.value;
                  setPatientAgeDisplay(val);
                  const age = parseInt(val);
                  if (!age) { updateForm({ patientAgeBin: "UNKNOWN" as AgeBin }); return; }
                  if (age < 18) updateForm({ patientAgeBin: "UNDER_18" as AgeBin });
                  else if (age <= 30) updateForm({ patientAgeBin: "AGE_18_30" as AgeBin });
                  else if (age <= 45) updateForm({ patientAgeBin: "AGE_31_45" as AgeBin });
                  else if (age <= 60) updateForm({ patientAgeBin: "AGE_46_60" as AgeBin });
                  else if (age <= 75) updateForm({ patientAgeBin: "AGE_61_75" as AgeBin });
                  else updateForm({ patientAgeBin: "OVER_75" as AgeBin });
                }}
                className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
              <p className="text-xs text-[#64748b] mt-1">Grouped for analytics — exact age not stored</p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. complex anatomy, teaching, bilateral..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  className="flex-1 bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-[#16161f] border border-[#1e2130] text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg text-sm transition-colors"
                >
                  Add
                </button>
              </div>
              {form.tags && form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-0.5 bg-[#1a1a2e] border border-[#2563eb]/30 text-[#3b82f6] rounded-full text-xs"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-[#ef4444] transition-colors">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Outcomes & Notes ── */}
        {step === 2 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold text-[#f1f5f9]">Outcomes & Notes</h2>

            {/* Outcome */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Outcome</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OUTCOME_CATEGORIES.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => updateForm({ outcomeCategory: o.value as OutcomeCategory })}
                    className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 border text-left ${
                      form.outcomeCategory === o.value
                        ? "border-current"
                        : "bg-[#16161f] border-[#1e2130] text-[#94a3b8] hover:border-[#252838]"
                    }`}
                    style={form.outcomeCategory === o.value ? { color: o.color, borderColor: o.color, backgroundColor: `${o.color}15` } : {}}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Complication */}
            {form.outcomeCategory !== "UNCOMPLICATED" && (
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Complication Type</label>
                <select
                  value={form.complicationCategory || "NONE"}
                  onChange={(e) => updateForm({ complicationCategory: e.target.value as ComplicationCategory })}
                  className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                >
                  {COMPLICATION_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Conversion */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.conversionOccurred || false}
                  onChange={(e) => updateForm({ conversionOccurred: e.target.checked })}
                  className="w-4 h-4 rounded border-[#1e2130] bg-[#16161f] accent-[#2563eb]"
                />
                <div>
                  <p className="text-sm font-medium text-[#f1f5f9]">Conversion occurred</p>
                  <p className="text-xs text-[#64748b]">e.g. laparoscopic to open</p>
                </div>
              </label>
            </div>

            {/* PHIA Notice */}
            <div className="flex items-start gap-3 p-3 bg-[#1a1a26] border border-[#252838] rounded-lg">
              <Shield className="w-4 h-4 text-[#2563eb] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#94a3b8]">
                <span className="font-medium text-[#f1f5f9]">PHIA Reminder:</span> Do not enter patient names, health card numbers, MRNs, dates of birth, or any other identifying information. Notes are screened automatically.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                Operative Notes <span className="text-[#64748b] font-normal">(optional, no PHI)</span>
              </label>
              <textarea
                value={form.notes || ""}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Key technical steps, challenges, learning points... (no patient identifiers)"
                rows={4}
                className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
              />
              {notesValidation.warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {notesValidation.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-[#f59e0b]">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reflection */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                Personal Reflection <span className="text-[#64748b] font-normal">(optional)</span>
              </label>
              <textarea
                value={form.reflection || ""}
                onChange={(e) => updateForm({ reflection: e.target.value })}
                placeholder="What did you learn? What would you do differently?"
                rows={3}
                className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 3 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold text-[#f1f5f9]">Review & Submit</h2>

            {/* Summary */}
            <div className="bg-[#16161f] border border-[#1e2130] rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[#64748b] text-xs">Procedure</p>
                  <p className="text-[#f1f5f9] font-medium mt-0.5">{form.procedureName}</p>
                </div>
                <div>
                  <p className="text-[#64748b] text-xs">Date</p>
                  <p className="text-[#f1f5f9] font-medium mt-0.5">
                    {form.caseDate instanceof Date ? form.caseDate.toLocaleDateString("en-CA") : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748b] text-xs">Role</p>
                  <p className="text-[#f1f5f9] font-medium mt-0.5">{form.role}</p>
                </div>
                <div>
                  <p className="text-[#64748b] text-xs">Autonomy</p>
                  <p className="text-[#f1f5f9] font-medium mt-0.5">
                    {AUTONOMY_LEVELS.find(a => a.value === form.autonomyLevel)?.label}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748b] text-xs">Approach</p>
                  <p className="text-[#f1f5f9] font-medium mt-0.5">{form.surgicalApproach}</p>
                </div>
                <div>
                  <p className="text-[#64748b] text-xs">Difficulty</p>
                  <p className="text-[#f1f5f9] font-medium mt-0.5">
                    {DIFFICULTY_SCORES.find(d => d.value === form.difficultyScore)?.label} ({form.difficultyScore}/5)
                  </p>
                </div>
                <div>
                  <p className="text-[#64748b] text-xs">Outcome</p>
                  <p className="text-[#f1f5f9] font-medium mt-0.5">
                    {OUTCOME_CATEGORIES.find(o => o.value === form.outcomeCategory)?.label}
                  </p>
                </div>
                {form.diagnosisCategory && (
                  <div>
                    <p className="text-[#64748b] text-xs">Diagnosis</p>
                    <p className="text-[#f1f5f9] font-medium mt-0.5">{form.diagnosisCategory}</p>
                  </div>
                )}
              </div>
              {form.notes && (
                <div className="pt-3 border-t border-[#1e2130]">
                  <p className="text-[#64748b] text-xs mb-1">Operative Notes</p>
                  <p className="text-[#94a3b8] text-xs whitespace-pre-wrap">{form.notes}</p>
                </div>
              )}
            </div>

            {/* Benchmark Opt-in */}
            <div className="p-4 bg-[#1a1a2e] border border-[#2563eb]/30 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.benchmarkOptIn || false}
                  onChange={(e) => updateForm({ benchmarkOptIn: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-[#1e2130] bg-[#16161f] accent-[#2563eb]"
                />
                <div>
                  <p className="text-sm font-medium text-[#f1f5f9]">Contribute to anonymized benchmarks</p>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Your anonymized operative data helps generate national benchmarks for all trainees.
                  </p>
                </div>
              </label>
            </div>

            {/* Public toggle */}
            <div className="p-4 bg-[#16161f] border border-[#1e2130] rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic || false}
                  onChange={(e) => updateForm({ isPublic: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-[#1e2130] bg-[#16161f] accent-[#2563eb]"
                />
                <div>
                  <p className="text-sm font-medium text-[#f1f5f9]">Share to social feed</p>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Visible to your friends on Hippo (no patient details shared)
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1e2130]">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#16161f] border border-[#1e2130] text-[#94a3b8] rounded-lg text-sm disabled:opacity-30 hover:text-[#f1f5f9] hover:border-[#252838] transition-all duration-150"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {/* Quick Log — available on step 0 once essentials are filled */}
            {step === 0 && canAdvance() && (
              <button
                onClick={handleQuickSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-[#16161f] border border-[#10b981]/40 text-[#10b981] font-medium rounded-lg text-sm hover:bg-[#10b981]/10 transition-all duration-150 active:scale-95"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-[#10b981]/30 border-t-[#10b981] rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Quick Log
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-2 px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium rounded-lg text-sm disabled:opacity-40 transition-all duration-150 active:scale-95"
              >
                {step === 0 ? "Add More Details" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-medium rounded-lg text-sm disabled:opacity-40 transition-all duration-150 active:scale-95"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Log Case
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Portalled Modals (rendered outside scrollable content) ── */}
      {portalRoot && createPortal(
        <>
          {/* Celebration Modal */}
          {celebration && (
            <CelebrationModal
              milestones={celebration.milestones}
              prs={celebration.prs}
              onClose={() => {
                setCelebration(null);
                setShowEpaSuggestions(true);
              }}
            />
          )}

          {/* EPA Suggestion Sheet */}
          {showEpaSuggestions && (
            <EpaSuggestionSheet
              suggestions={epaSuggestions}
              onSelect={handleEpaSelect}
              onSkip={handleEpaSkip}
              loading={epaSuggestionsLoading}
            />
          )}

          {/* EPA Observation Form Modal */}
          {selectedEpaSuggestion && (
            <>
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0, 0, 0, 0.7)",
                  backdropFilter: "blur(4px)",
                  zIndex: 1002,
                }}
                onClick={() => {
                  setSelectedEpaSuggestion(null);
                  router.push("/cases");
                }}
              />
              <div
                style={{
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 1003,
                  maxWidth: 720,
                  width: "94vw",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  background: "#0f1825",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "28px 28px 24px",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                }}
              >
                <EpaObservationForm
                  epaId={selectedEpaSuggestion.epaId}
                  epaTitle={selectedEpaSuggestion.epaTitle}
                  specialtySlug={form.specialtySlug}
                  trainingSystem={profile?.trainingCountry === "CA" ? "RCPSC" : "ACGME"}
                  prefillData={savedCaseId ? {
                    caseLogId: savedCaseId,
                    caseDate: form.caseDate,
                    procedureName: form.procedureName,
                    attendingLabel: form.attendingLabel || undefined,
                  } : undefined}
                  onSubmit={handleEpaObservationSubmit}
                  onCancel={() => {
                    setSelectedEpaSuggestion(null);
                    router.push("/cases");
                  }}
                  onSaveDraft={handleEpaObservationDraft}
                />
              </div>
            </>
          )}
        </>,
        portalRoot,
      )}
    </div>
  );
}
