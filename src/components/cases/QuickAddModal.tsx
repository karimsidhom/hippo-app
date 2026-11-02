"use client";

import { useState, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useCases } from "@/hooks/useCases";
import { useMilestones } from "@/hooks/useMilestones";
import { useUser } from "@/hooks/useUser";
import { CelebrationModal } from "@/components/shared/CelebrationModal";
import { ProcedurePicker } from "@/components/shared/ProcedurePicker";
import { EpaSuggestionSheet } from "@/components/epa/EpaSuggestionSheet";
import { EpaObservationForm } from "@/components/epa/EpaObservationForm";
import { EpaDeliveryConfirmation, type EpaDeliveryInfo } from "@/components/epa/EpaDeliveryConfirmation";
import { checkMilestones, checkPersonalRecords } from "@/lib/milestones";
import { SPECIALTIES, AUTONOMY_LEVELS, SURGICAL_APPROACHES, OUTCOME_CATEGORIES, COMPLICATION_CATEGORIES } from "@/lib/constants";
import { validateNotes } from "@/lib/phia";
import { getProceduresBySpecialty } from "@/lib/procedureLibrary";
import type { Procedure } from "@/lib/procedureLibrary";
import type {
  SurgicalApproach, AutonomyLevel, OutcomeCategory,
  ComplicationCategory, AgeBin, Milestone, PersonalRecord,
  EpaSuggestion, EpaObservationInput,
} from "@/lib/types";
import { X, Check, AlertTriangle, LockKeyhole } from "lucide-react";
import { isSmsnaProfile, resolveTrainingSystem, SMSNA_SPECIALTY_SLUG, SMSNA_SPECIALTY_NAME } from "@/lib/smsna/gate";
import { getSmsnaProcedures, getSmsnaCategoryForProcedure, SMSNA_CATEGORIES } from "@/lib/smsna/taxonomy";
import { OprsObservationForm } from "@/components/smsna/OprsObservationForm";
import "./quick-add.css";
import { useDialogFocus } from "@/hooks/useDialogFocus";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
}

function ageToAgeBin(age: number): AgeBin {
  if (age < 18) return "UNDER_18";
  if (age <= 30) return "AGE_18_30";
  if (age <= 45) return "AGE_31_45";
  if (age <= 60) return "AGE_46_60";
  if (age <= 75) return "AGE_61_75";
  return "OVER_75";
}

const todayStr = () => new Date().toISOString().split("T")[0];

export function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  const formId = useId();
  const fieldId = (name: string) => `${formId}-${name}`;
  const { cases, addCaseAsync } = useCases();
  const { milestones, personalRecords, addMilestone } = useMilestones();
  const { user, profile } = useUser();

  const [specialtySlug, setSpecialtySlug] = useState("urology");
  const [procedureName, setProcedureName] = useState("");
  const [caseDate, setCaseDate] = useState(todayStr());
  const [role, setRole] = useState("First Surgeon");
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>("SUPERVISOR_PRESENT");
  const [approach, setApproach] = useState<SurgicalApproach>("ROBOTIC");
  const [duration, setDuration] = useState("");
  const [attendingLabel, setAttendingLabel] = useState("");
  const [institutionSite, setInstitutionSite] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [diagnosisCategory, setDiagnosisCategory] = useState("");
  const [difficultyScore, setDifficultyScore] = useState(3);
  const [outcomeCategory, setOutcomeCategory] = useState<OutcomeCategory>("UNCOMPLICATED");
  const [complicationCategory, setComplicationCategory] = useState<ComplicationCategory>("NONE");
  const [conversionOccurred, setConversionOccurred] = useState(false);
  const [notes, setNotes] = useState("");
  const [reflection, setReflection] = useState("");
  const [notesValidation, setNotesValidation] = useState<{ safe: boolean; warnings: string[] }>({ safe: true, warnings: [] });
  const [submitting, setSubmitting] = useState(false);
  const [celebration, setCelebration] = useState<{
    milestones: Milestone[];
    prs: PersonalRecord[];
  } | null>(null);

  // ── EPA suggestion flow state ──
  const [epaSuggestions, setEpaSuggestions] = useState<EpaSuggestion[]>([]);
  const [epaSuggestionsLoading, setEpaSuggestionsLoading] = useState(false);
  const [epaNote, setEpaNote] = useState<string | null>(null);
  const [showEpaSuggestions, setShowEpaSuggestions] = useState(false);
  const [selectedEpaSuggestion, setSelectedEpaSuggestion] = useState<EpaSuggestion | null>(null);
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null);
  const [savedProcedureName, setSavedProcedureName] = useState("");
  const [savedAttending, setSavedAttending] = useState("");
  const [savedCaseDate, setSavedCaseDate] = useState<Date>(new Date());
  // Inline error shown inside the EPA/OPRS form on a failed create/submit —
  // previously console-only, so a resident could get a 400 and never know.
  const [epaSubmitError, setEpaSubmitError] = useState<string | null>(null);
  // Post-submit delivery confirmation. Closing the modal is deferred until
  // this is dismissed so the resident actually sees who was notified.
  const [epaDelivery, setEpaDelivery] = useState<{ info: EpaDeliveryInfo; assessorName: string } | null>(null);

  // SMSNA fellows never see EPA suggestions — they go straight to the OPRS form.
  const [showOprs, setShowOprs] = useState(false);

  const dialogRef = useDialogFocus<HTMLDivElement>(
    open && !showEpaSuggestions && !selectedEpaSuggestion && !celebration && !showOprs && !epaDelivery,
  );

  // Portal root for rendering EPA modals above everything
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalRoot(document.getElementById("portal-root"));
  }, []);
  const observationDialogRef = useDialogFocus<HTMLDivElement>(!!selectedEpaSuggestion && !!portalRoot);

  // Do NOT initialise useState from `profile` — it hydrates async, so this
  // is recomputed every render instead.
  const isSmsna = isSmsnaProfile(profile);
  const effectiveSlug = isSmsna ? SMSNA_SPECIALTY_SLUG : specialtySlug;

  // A case is SMSNA-graded when the fellow pathway is active OR the SMSNA
  // specialty chip is selected for this case — SMSNA is a pickable section
  // like any other specialty.
  const caseIsSmsna = isSmsna || effectiveSlug === SMSNA_SPECIALTY_SLUG;

  const procedures = caseIsSmsna ? getSmsnaProcedures() : getProceduresBySpecialty(effectiveSlug);

  const handleProcedureChange = (name: string, proc: Procedure) => {
    setProcedureName(name);
    if (proc.approaches[0]) {
      setApproach(proc.approaches[0].toUpperCase() as SurgicalApproach);
    }
  };

  const handleSubmit = async () => {
    if (!procedureName) return;
    setSubmitting(true);

    // Save info for EPA form prefill before resetting
    setSavedProcedureName(procedureName);
    setSavedAttending(attendingLabel.trim());
    setSavedCaseDate(caseDate ? new Date(caseDate) : new Date());

    try {
      const ageBin: AgeBin = patientAge
        ? ageToAgeBin(parseInt(patientAge))
        : "UNKNOWN";

      const newCase = await addCaseAsync({
        userId: user?.id ?? "",
        specialtyId: effectiveSlug,
        specialtyName: caseIsSmsna ? SMSNA_SPECIALTY_NAME : SPECIALTIES.find((s) => s.slug === effectiveSlug)?.name,
        procedureDefinitionId: null,
        procedureName,
        procedureCategory: null,
        surgicalApproach: approach,
        role,
        autonomyLevel,
        difficultyScore,
        operativeDurationMinutes: duration ? parseInt(duration) : null,
        consoleTimeMinutes: null,
        dockingTimeMinutes: null,
        attendingLabel: attendingLabel.trim() || null,
        institutionSite: institutionSite.trim() || null,
        outcomeCategory,
        complicationCategory,
        patientAgeBin: ageBin,
        diagnosisCategory: diagnosisCategory.trim() || null,
        conversionOccurred,
        notes: notes.trim() || null,
        reflection: reflection.trim() || null,
        caseDate: caseDate ? new Date(caseDate) : new Date(),
        benchmarkOptIn: true,
        isPublic: false,
        tags: [],
      });

      if (newCase) {
        // Check milestones (non-blocking)
        const allCasesWithNew = [...cases, newCase];
        const newMilestones = checkMilestones(user?.id || "u1", newCase, allCasesWithNew, milestones);
        const newPRs = checkPersonalRecords(user?.id || "u1", newCase, allCasesWithNew, personalRecords);
        for (const m of newMilestones) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, ...rest } = m;
          addMilestone(rest);
        }

        // Get real case ID for EPA suggestions
        const realCaseId = newCase.id.startsWith('tmp_') ? null : newCase.id;
        if (realCaseId) {
          setSavedCaseId(realCaseId);
        }

        setSubmitting(false);

        // SMSNA cases never see EPA suggestions — the EPA framework
        // doesn't apply to them. Go straight to the OPRS grading form
        // instead (mirrors log/page.tsx's EPA-suggestion skip).
        if (caseIsSmsna) {
          setShowOprs(true);
          return;
        }

        // ALWAYS show EPA suggestions — this is the critical flow.
        // If we have a real caseLogId, use it; otherwise send inline case
        // details so the sheet still shows something useful instead of
        // spinning forever.
        setShowEpaSuggestions(true);
        setEpaSuggestionsLoading(true);

        try {
          const reqBody: Record<string, unknown> = realCaseId
            ? { caseLogId: realCaseId }
            : {
                caseDetails: {
                  procedureName,
                  procedureCategory: null,
                  surgicalApproach: approach,
                  role,
                  autonomyLevel,
                  difficultyScore,
                  diagnosisCategory: diagnosisCategory.trim() || null,
                  attendingLabel: attendingLabel.trim() || null,
                  outcomeCategory,
                  notes: notes.trim() || null,
                  specialtyId: effectiveSlug,
                },
              };
          const res = await fetch("/api/epa/ai-suggest", {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(reqBody),
          });
          if (res.ok) {
            const json = await res.json();
            console.log('[QuickAdd EPA] ai-suggest response:', {
              suggestionCount: Array.isArray(json.suggestions) ? json.suggestions.length : 0,
              note: json.note,
              diagnostics: json.diagnostics,
            });
            setEpaSuggestions(Array.isArray(json.suggestions) ? json.suggestions : []);
            setEpaNote(typeof json.note === "string" ? json.note : null);
          } else {
            const errText = await res.text();
            console.error('[QuickAdd EPA] API error:', res.status, errText);
            setEpaNote(
              res.status === 401
                ? "You need to be signed in to see EPA suggestions."
                : "Couldn't load EPA suggestions right now. You can link an EPA from this case later.",
            );
          }
        } catch (err) {
          console.error('[QuickAdd EPA] Fetch error:', err);
          setEpaNote("Couldn't reach the EPA suggestion service. Check your connection.");
        }
        setEpaSuggestionsLoading(false);
      }
    } catch (e) {
      console.error('[QuickAdd] Submit error:', e);
      setSubmitting(false);
      // Still show the next grading step even on a case-save error.
      if (caseIsSmsna) {
        setShowOprs(true);
      } else {
        setShowEpaSuggestions(true);
        setEpaSuggestionsLoading(false);
      }
    }
  };

  /** Handle user selecting an EPA suggestion */
  const handleEpaSelect = (suggestion: EpaSuggestion) => {
    setEpaSubmitError(null);
    setSelectedEpaSuggestion(suggestion);
    setShowEpaSuggestions(false);
  };

  /** Handle skipping EPA suggestions */
  const handleEpaSkip = () => {
    setShowEpaSuggestions(false);
    setSelectedEpaSuggestion(null);
    onClose();
    resetForm();
  };

  /** Handle EPA observation form submission */
  const handleEpaObservationSubmit = async (data: EpaObservationInput) => {
    setEpaSubmitError(null);
    try {
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
      const createBody = await createRes.json().catch(() => null);
      if (!createRes.ok) {
        throw new Error(createBody?.error ?? "Failed to create observation");
      }
      const observation = createBody;

      // Submit the observation
      const submitRes = await fetch(`/api/epa/observations/${observation.id}/submit`, {
        method: "POST",
        credentials: "include",
      });
      const submitBody = await submitRes.json().catch(() => null);
      if (!submitRes.ok) {
        throw new Error(submitBody?.error ?? "Failed to submit observation");
      }

      // Hold the modal open (as the delivery-confirmation portal) so the
      // resident sees who was notified and how — full close/reset happens
      // once they dismiss it.
      setSelectedEpaSuggestion(null);
      setEpaDelivery({
        info: submitBody?.delivery ?? { channel: "none", emailSent: false },
        assessorName: data.assessorName,
      });
    } catch (err) {
      console.error("EPA observation submit failed:", err);
      setEpaSubmitError(
        err instanceof Error ? err.message : "Failed to submit observation. Please try again.",
      );
    }
  };

  /** Handle EPA observation save as draft */
  const handleEpaObservationDraft = async (data: EpaObservationInput) => {
    setEpaSubmitError(null);
    try {
      const res = await fetch("/api/epa/observations", {
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
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "Failed to save draft");
      }
      setSelectedEpaSuggestion(null);
      onClose();
      resetForm();
    } catch (err) {
      console.error("EPA observation draft save failed:", err);
      setEpaSubmitError(
        err instanceof Error ? err.message : "Failed to save draft. Please try again.",
      );
    }
  };

  /** Dismiss the delivery confirmation and finish closing the modal. */
  const finishAfterEpaDelivery = () => {
    setEpaDelivery(null);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSpecialtySlug("urology");
    setProcedureName("");
    setCaseDate(todayStr());
    setRole("First Surgeon");
    setAutonomyLevel("SUPERVISOR_PRESENT");
    setApproach("ROBOTIC");
    setDuration("");
    setAttendingLabel("");
    setInstitutionSite("");
    setPatientAge("");
    setDiagnosisCategory("");
    setDifficultyScore(3);
    setOutcomeCategory("UNCOMPLICATED");
    setComplicationCategory("NONE");
    setConversionOccurred(false);
    setNotes("");
    setReflection("");
    setNotesValidation({ safe: true, warnings: [] });
    // Reset EPA state
    setEpaSuggestions([]);
    setEpaSuggestionsLoading(false);
    setEpaNote(null);
    setShowEpaSuggestions(false);
    setSelectedEpaSuggestion(null);
    setSavedCaseId(null);
    setSavedProcedureName("");
    setSavedAttending("");
    setSavedCaseDate(new Date());
    setShowOprs(false);
    setEpaSubmitError(null);
    setEpaDelivery(null);
  };

  if (!open && !showEpaSuggestions && !selectedEpaSuggestion && !showOprs && !epaDelivery) return null;

  // ── Post-submit delivery confirmation ──
  // Rendered on its own so the resident sees who was actually notified even
  // after the case form itself has gone away. The toast self-positions.
  if (epaDelivery && portalRoot) {
    return createPortal(
      <EpaDeliveryConfirmation
        delivery={epaDelivery.info}
        assessorName={epaDelivery.assessorName}
        onClose={finishAfterEpaDelivery}
      />,
      portalRoot,
    );
  }


  // ── EPA Suggestion Sheet (rendered via portal, above everything) ──
  if (showEpaSuggestions && portalRoot) {
    return createPortal(
      <EpaSuggestionSheet
        suggestions={epaSuggestions}
        note={epaNote}
        onSelect={handleEpaSelect}
        onSkip={handleEpaSkip}
        loading={epaSuggestionsLoading}
      />,
      portalRoot,
    );
  }

  // ── EPA Observation Form (rendered via portal) ──
  if (selectedEpaSuggestion && portalRoot) {
    const userSpecialtySlug = (() => {
      if (!profile?.specialty) return specialtySlug;
      const found = SPECIALTIES.find(s => s.name === profile.specialty || s.slug === profile.specialty);
      return found?.slug ?? specialtySlug;
    })();

    return createPortal(
      <div ref={observationDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="EPA observation" style={{
        position: "fixed",
        inset: 0,
        zIndex: 1002,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Backdrop */}
        <div
          onClick={() => { setSelectedEpaSuggestion(null); onClose(); resetForm(); }}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
          }}
        />
        {/* Form container */}
        <div
          ref={(el) => { if (el) el.scrollTop = 0; }}
          style={{
            position: "relative",
            zIndex: 1,
            width: "95vw",
            maxWidth: 720,
            maxHeight: "85vh",
            overflowY: "auto",
            borderRadius: 16,
            background: "var(--bg-1)",
            border: "1px solid var(--border-mid)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            margin: "auto",
          }}>
          <EpaObservationForm
            epaId={selectedEpaSuggestion.epaId}
            epaTitle={selectedEpaSuggestion.epaTitle}
            specialtySlug={userSpecialtySlug}
            trainingSystem={resolveTrainingSystem(profile, "RCPSC")}
            prefillData={{
              caseLogId: savedCaseId || "",
              caseDate: savedCaseDate,
              procedureName: savedProcedureName,
              attendingLabel: savedAttending || undefined,
            }}
            onSubmit={handleEpaObservationSubmit}
            onCancel={() => { setSelectedEpaSuggestion(null); onClose(); resetForm(); }}
            onSaveDraft={handleEpaObservationDraft}
          />
          {epaSubmitError && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                margin: "0 20px 20px",
                padding: "10px 12px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.5,
                color: "#fca5a5",
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1 }}>{epaSubmitError}</span>
            </div>
          )}
        </div>
      </div>,
      portalRoot,
    );
  }

  // ── OPRS Observation Form (SMSNA — rendered via portal) ──
  if (caseIsSmsna && showOprs && portalRoot) {
    const smsnaCategory =
      getSmsnaCategoryForProcedure(savedProcedureName)
      ?? SMSNA_CATEGORIES.find(c => c.key === "general-office")!;

    return createPortal(
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 1002,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Backdrop */}
        <div
          onClick={() => { setShowOprs(false); onClose(); resetForm(); }}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
          }}
        />
        {/* Form container */}
        <div
          ref={(el) => { if (el) el.scrollTop = 0; }}
          style={{
            position: "relative",
            zIndex: 1,
            width: "95vw",
            maxWidth: 720,
            maxHeight: "85vh",
            overflowY: "auto",
            borderRadius: 16,
            background: "var(--bg-1)",
            border: "1px solid var(--border-mid)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            margin: "auto",
          }}>
          <OprsObservationForm
            categoryKey={smsnaCategory.key}
            categoryName={smsnaCategory.name}
            procedureName={savedProcedureName}
            prefillData={{
              caseLogId: savedCaseId || "",
              caseDate: savedCaseDate,
              procedureName: savedProcedureName,
              attendingLabel: savedAttending || undefined,
            }}
            onSubmit={handleEpaObservationSubmit}
            onCancel={() => { setShowOprs(false); onClose(); resetForm(); }}
            onSaveDraft={handleEpaObservationDraft}
          />
        </div>
      </div>,
      portalRoot,
    );
  }

  // ── Celebration modal (without blocking EPA) ──
  if (celebration) {
    return (
      <CelebrationModal
        milestones={celebration.milestones}
        prs={celebration.prs}
        onClose={() => {
          setCelebration(null);
          onClose();
          resetForm();
        }}
      />
    );
  }

  if (!open) return null;

  return (
    <div className="quick-add">
      <div className="quick-add__backdrop" onClick={onClose} />

      <div
        className="quick-add__panel"
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={fieldId("title")}
        aria-describedby={fieldId("description")}
        aria-busy={submitting}
        onKeyDown={e => {
          // The procedure picker handles Escape itself before it reaches here.
          if (e.key === "Escape") { e.stopPropagation(); onClose(); }
        }}
      >
        <div className="quick-add__grab" aria-hidden="true" />
        <header className="quick-add__header">
          <div>
            <div className="quick-add__eyebrow">Your surgical logbook</div>
            <h2 id={fieldId("title")}>Log a case</h2>
            <p id={fieldId("description")}>Start with the procedure. Add the details that matter.</p>
          </div>
          <button type="button" className="quick-add__close" onClick={onClose} aria-label="Close case form">
            <X size={18} strokeWidth={1.7} />
          </button>
        </header>

        <div className="quick-add__body">
          <section className="quick-add__section" aria-labelledby={fieldId("case-heading")}>
            <div className="quick-add__section-head">
              <span className="quick-add__section-number" aria-hidden="true">01</span>
              <h3 id={fieldId("case-heading")}>The case</h3>
              <span className="quick-add__section-hint">Procedure is required</span>
            </div>
            <div className="quick-add__field">
              <div className="quick-add__label" id={fieldId("specialty-label")}>Specialty</div>
              <div className="quick-add__specialties" role="group" aria-labelledby={fieldId("specialty-label")}>
                {isSmsna ? (
                  <button type="button" className="quick-add__chip" aria-pressed="true" disabled>
                    SMSNA Fellowship
                  </button>
                ) : SPECIALTIES.filter(s => s.slug !== "other").map(s => (
                  <button
                    key={s.slug}
                    type="button"
                    className="quick-add__chip"
                    aria-pressed={specialtySlug === s.slug}
                    onClick={() => { setSpecialtySlug(s.slug); setProcedureName(""); }}
                  >
                    {s.name.replace(" Surgery", "").replace("/ Otolaryngology", "")}
                  </button>
                ))}
              </div>
            </div>
            <div className="quick-add__field" role="group" aria-labelledby={fieldId("procedure-label")}>
              <div className="quick-add__label" id={fieldId("procedure-label")}>Procedure <span className="quick-add__required" aria-label="required">*</span></div>
              <ProcedurePicker procedures={procedures} value={procedureName} onChange={handleProcedureChange} />
            </div>
            <div className="quick-add__grid">
              <div className="quick-add__field">
                <label className="quick-add__label" htmlFor={fieldId("date")}>Date</label>
                <input id={fieldId("date")} type="date" value={caseDate} max={todayStr()} onChange={e => setCaseDate(e.target.value)} className="st-input" />
              </div>
              <div className="quick-add__field">
                <label className="quick-add__label" htmlFor={fieldId("attending")}>Attending surgeon</label>
                <input id={fieldId("attending")} type="text" placeholder="Attending name" value={attendingLabel} onChange={e => setAttendingLabel(e.target.value)} className="st-input" />
              </div>
              <div className="quick-add__field">
                <label className="quick-add__label" htmlFor={fieldId("site")}>Hospital / site</label>
                <input id={fieldId("site")} type="text" placeholder="Hospital or site" value={institutionSite} onChange={e => setInstitutionSite(e.target.value)} className="st-input" />
              </div>
              <div className="quick-add__field">
                <label className="quick-add__label" htmlFor={fieldId("age")}>Patient age</label>
                <input id={fieldId("age")} type="number" min={0} max={120} placeholder="e.g. 58" value={patientAge} onChange={e => setPatientAge(e.target.value)} className="st-input" aria-describedby={fieldId("age-hint")} />
                <p className="quick-add__hint" id={fieldId("age-hint")}>Saved as an age range.</p>
              </div>
            </div>
            <div className="quick-add__field">
              <label className="quick-add__label" htmlFor={fieldId("diagnosis")}>Diagnosis / indication</label>
              <input id={fieldId("diagnosis")} type="text" placeholder="e.g. Bladder cancer, BPH, renal mass" value={diagnosisCategory} onChange={e => setDiagnosisCategory(e.target.value)} className="st-input" />
            </div>
          </section>

          <section className="quick-add__section" aria-labelledby={fieldId("contribution-heading")}>
            <div className="quick-add__section-head">
              <span className="quick-add__section-number" aria-hidden="true">02</span>
              <h3 id={fieldId("contribution-heading")}>Your contribution</h3>
            </div>
            <div className="quick-add__field">
              <div className="quick-add__label" id={fieldId("role-label")}>Role</div>
              <div className="quick-add__choices quick-add__choices--equal" role="group" aria-labelledby={fieldId("role-label")}>
                {["First Surgeon", "Assist", "Observer"].map(r => (
                  <button key={r} type="button" className="quick-add__chip" aria-pressed={role === r} onClick={() => setRole(r)}>{r}</button>
                ))}
              </div>
            </div>
            <div className="quick-add__field">
              <div className="quick-add__label" id={fieldId("autonomy-label")}>Autonomy level</div>
              <div className="quick-add__choices" role="group" aria-labelledby={fieldId("autonomy-label")}>
                {AUTONOMY_LEVELS.map(al => (
                  <button key={al.value} type="button" className="quick-add__chip" aria-pressed={autonomyLevel === al.value} onClick={() => setAutonomyLevel(al.value as AutonomyLevel)}>{al.label}</button>
                ))}
              </div>
            </div>
            <div className="quick-add__field">
              <div className="quick-add__label" id={fieldId("approach-label")}>Approach</div>
              <div className="quick-add__choices" role="group" aria-labelledby={fieldId("approach-label")}>
                {SURGICAL_APPROACHES.map(a => (
                  <button key={a.value} type="button" className="quick-add__chip" aria-pressed={approach === a.value} onClick={() => setApproach(a.value as SurgicalApproach)}>{a.label}</button>
                ))}
              </div>
            </div>
            <div className="quick-add__grid">
              <div className="quick-add__field">
                <label className="quick-add__label" htmlFor={fieldId("duration")}>OR duration <span>(min)</span></label>
                <input id={fieldId("duration")} type="number" min={1} max={1440} placeholder="e.g. 180" value={duration} onChange={e => setDuration(e.target.value)} className="st-input" />
              </div>
              <div className="quick-add__field">
                <div className="quick-add__label" id={fieldId("difficulty-label")}>Difficulty <span>(1–5)</span></div>
                <div className="quick-add__choices quick-add__choices--difficulty" role="group" aria-labelledby={fieldId("difficulty-label")}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" className="quick-add__chip" aria-pressed={difficultyScore === n} aria-label={`Difficulty ${n} of 5`} onClick={() => setDifficultyScore(n)}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="quick-add__section" aria-labelledby={fieldId("outcome-heading")}>
            <div className="quick-add__section-head">
              <span className="quick-add__section-number" aria-hidden="true">03</span>
              <h3 id={fieldId("outcome-heading")}>Outcome</h3>
            </div>
            <div className="quick-add__field">
              <div className="quick-add__label" id={fieldId("outcome-label")}>Case outcome</div>
              <div className="quick-add__choices" role="group" aria-labelledby={fieldId("outcome-label")}>
                {OUTCOME_CATEGORIES.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    className="quick-add__chip"
                    aria-pressed={outcomeCategory === o.value}
                    onClick={() => {
                      setOutcomeCategory(o.value as OutcomeCategory);
                      if (o.value === "UNCOMPLICATED") setComplicationCategory("NONE");
                    }}
                  >{o.label}</button>
                ))}
              </div>
            </div>
            {outcomeCategory !== "UNCOMPLICATED" && (
              <div className="quick-add__field">
                <label className="quick-add__label" htmlFor={fieldId("complication")}>Complication type</label>
                <select id={fieldId("complication")} value={complicationCategory} onChange={e => setComplicationCategory(e.target.value as ComplicationCategory)} className="st-input">
                  {COMPLICATION_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            )}
            <label className="quick-add__checkbox">
              <input type="checkbox" checked={conversionOccurred} onChange={e => setConversionOccurred(e.target.checked)} />
              <span><strong>Conversion occurred</strong><span>e.g. laparoscopic to open</span></span>
            </label>
          </section>

          <section className="quick-add__section" aria-labelledby={fieldId("learning-heading")}>
            <div className="quick-add__section-head">
              <span className="quick-add__section-number" aria-hidden="true">04</span>
              <h3 id={fieldId("learning-heading")}>Notes &amp; learning</h3>
              <span className="quick-add__section-hint">Optional</span>
            </div>
            <div className="quick-add__privacy" id={fieldId("privacy")}>
              <LockKeyhole size={15} strokeWidth={1.7} aria-hidden="true" />
              <p>Keep notes de-identified. Leave out names, birth dates, and patient identifiers.</p>
            </div>
            <div className="quick-add__field">
              <label className="quick-add__label" htmlFor={fieldId("notes")}>Operative notes</label>
              <textarea
                id={fieldId("notes")}
                value={notes}
                onChange={e => {
                  setNotes(e.target.value);
                  if (e.target.value.length > 10) {
                    const result = validateNotes(e.target.value);
                    setNotesValidation({ safe: result.safe, warnings: result.warnings });
                  } else {
                    setNotesValidation({ safe: true, warnings: [] });
                  }
                }}
                placeholder="Key steps, challenges, learning points…"
                rows={3}
                className="st-input"
                aria-describedby={notesValidation.warnings.length ? `${fieldId("privacy")} ${fieldId("notes-warnings")}` : fieldId("privacy")}
              />
              {notesValidation.warnings.length > 0 && (
                <div className="quick-add__warnings" id={fieldId("notes-warnings")} role="status">
                  {notesValidation.warnings.map((w, i) => <p key={i}>&#9888; {w}</p>)}
                </div>
              )}
            </div>
            <div className="quick-add__field">
              <label className="quick-add__label" htmlFor={fieldId("reflection")}>Personal reflection</label>
              <textarea id={fieldId("reflection")} value={reflection} onChange={e => setReflection(e.target.value)} placeholder="What did you learn? What would you do differently?" rows={3} className="st-input" aria-describedby={fieldId("privacy")} />
            </div>
          </section>
        </div>

        <footer className="quick-add__footer">
          <button type="button" className="quick-add__cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="quick-add__save" onClick={handleSubmit} disabled={!procedureName || submitting}>
            {submitting ? <><span className="quick-add__spinner" aria-hidden="true" />Saving…</> : <><Check size={17} strokeWidth={2} />Save case</>}
          </button>
        </footer>
      </div>
    </div>
  );
}
