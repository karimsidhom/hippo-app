"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCases } from "@/hooks/useCases";
import { useMilestones } from "@/hooks/useMilestones";
import { useUser } from "@/hooks/useUser";
import { CelebrationModal } from "@/components/shared/CelebrationModal";
import { ProcedurePicker } from "@/components/shared/ProcedurePicker";
import { EpaSuggestionSheet } from "@/components/epa/EpaSuggestionSheet";
import { EpaObservationForm } from "@/components/epa/EpaObservationForm";
import { PostComposer } from "@/components/social/PostComposer";
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
import { X, Check } from "lucide-react";

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
  const [shareAsPearl, setShareAsPearl] = useState(false);

  // Portal root for rendering EPA modals above everything
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalRoot(document.getElementById("portal-root"));
  }, []);

  const procedures = getProceduresBySpecialty(specialtySlug);

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
        specialtyId: specialtySlug,
        specialtyName: SPECIALTIES.find((s) => s.slug === specialtySlug)?.name,
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
                  specialtyId: specialtySlug,
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
            setEpaSuggestions(json.suggestions ?? []);
            setEpaNote(typeof json.note === "string" ? json.note : null);
          } else {
            const errText = await res.text();
            console.error('[QuickAdd EPA] API error:', res.status, errText);
            setEpaNote("Couldn't load EPA suggestions right now. You can link an EPA from this case later.");
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
      // Still show EPA suggestions even on error
      setShowEpaSuggestions(true);
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
    onClose();
    resetForm();
  };

  /** Handle EPA observation form submission */
  const handleEpaObservationSubmit = async (data: EpaObservationInput) => {
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
      if (!createRes.ok) throw new Error("Failed to create observation");
      const observation = await createRes.json();

      // Submit the observation
      await fetch(`/api/epa/observations/${observation.id}/submit`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("EPA observation submit failed:", err);
    }
    setSelectedEpaSuggestion(null);
    onClose();
    resetForm();
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
    setShareAsPearl(false);
  };

  if (!open && !showEpaSuggestions && !selectedEpaSuggestion && !shareAsPearl) return null;

  // ── PostComposer (Share as pearl from the Next-steps banner) ──
  if (shareAsPearl && portalRoot) {
    return createPortal(
      <PostComposer
        open={true}
        source={savedCaseId ? { kind: "case", caseId: savedCaseId } : { kind: "blank" }}
        onClose={() => { setShareAsPearl(false); onClose(); resetForm(); }}
        onPublished={() => { setShareAsPearl(false); onClose(); resetForm(); }}
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
        onShareAsPearl={savedCaseId ? () => { setShowEpaSuggestions(false); setShareAsPearl(true); } : undefined}
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
            trainingSystem="RCPSC"
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
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        maxWidth: 540,
        background: "var(--surface)",
        borderRadius: "14px 14px 0 0",
        border: "1px solid var(--border-mid)",
        borderBottom: "none",
        display: "flex",
        flexDirection: "column",
        maxHeight: "92vh",
        animation: "slideUp .25s ease",
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "var(--border-mid)", borderRadius: 2, margin: "12px auto 0", flexShrink: 0 }} />

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px 12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-.3px" }}>Log a Case</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>All fields except procedure are optional</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted)", flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 18px" }}>

          {/* ── Specialty ── */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label">Specialty</div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
              {SPECIALTIES.filter(s => s.slug !== "other").map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => { setSpecialtySlug(s.slug); setProcedureName(""); }}
                  style={{
                    flexShrink: 0,
                    padding: "5px 11px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    border: "1px solid",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    background: specialtySlug === s.slug ? "var(--primary-dim)" : "transparent",
                    borderColor: specialtySlug === s.slug ? "var(--primary)" : "var(--border)",
                    color: specialtySlug === s.slug ? "var(--primary-hi)" : "var(--muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.icon} {s.name.replace(" Surgery", "").replace("/ Otolaryngology", "")}
                </button>
              ))}
            </div>
          </div>

          {/* ── Procedure ── */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label">Procedure <span className="req">*</span></div>
            <ProcedurePicker
              procedures={procedures}
              value={procedureName}
              onChange={handleProcedureChange}
            />
          </div>

          {/* ── Date + Attending row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div>
              <div className="form-label">Date</div>
              <input
                type="date"
                value={caseDate}
                max={todayStr()}
                onChange={e => setCaseDate(e.target.value)}
                className="st-input"
                style={{ fontSize: 13, padding: "9px 11px" }}
              />
            </div>
            <div>
              <div className="form-label">Attending Surgeon</div>
              <input
                type="text"
                placeholder="Dr. Smith"
                value={attendingLabel}
                onChange={e => setAttendingLabel(e.target.value)}
                className="st-input"
                style={{ fontSize: 13, padding: "9px 11px" }}
              />
            </div>
          </div>

          {/* ── Hospital + Patient Age row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div>
              <div className="form-label">Hospital / Site</div>
              <input
                type="text"
                placeholder="Toronto General"
                value={institutionSite}
                onChange={e => setInstitutionSite(e.target.value)}
                className="st-input"
                style={{ fontSize: 13, padding: "9px 11px" }}
              />
            </div>
            <div>
              <div className="form-label">Patient Age</div>
              <input
                type="number"
                min={0}
                max={120}
                placeholder="e.g. 58"
                value={patientAge}
                onChange={e => setPatientAge(e.target.value)}
                className="st-input"
                style={{ fontSize: 13, padding: "9px 11px" }}
              />
            </div>
          </div>

          {/* ── Diagnosis ── */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label">Diagnosis / Indication</div>
            <input
              type="text"
              placeholder="e.g. Bladder cancer, BPH, Renal mass…"
              value={diagnosisCategory}
              onChange={e => setDiagnosisCategory(e.target.value)}
              className="st-input"
              style={{ fontSize: 13, padding: "9px 11px" }}
            />
          </div>

          {/* ── Role ── */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label">Role</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["First Surgeon", "Assist", "Observer"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 500,
                    border: "1px solid",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s",
                    background: role === r ? "var(--primary-dim)" : "transparent",
                    borderColor: role === r ? "var(--primary)" : "var(--border)",
                    color: role === r ? "var(--primary-hi)" : "var(--muted)",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* ── Autonomy ── */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label">Autonomy Level</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {AUTONOMY_LEVELS.map((al) => (
                <button
                  key={al.value}
                  onClick={() => setAutonomyLevel(al.value as AutonomyLevel)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    border: "1px solid",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s",
                    background: autonomyLevel === al.value ? `${al.color}15` : "transparent",
                    borderColor: autonomyLevel === al.value ? al.color : "var(--border)",
                    color: autonomyLevel === al.value ? al.color : "var(--muted)",
                  }}
                >
                  {al.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Approach ── */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label">Approach</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {SURGICAL_APPROACHES.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setApproach(a.value as SurgicalApproach)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    border: "1px solid",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s",
                    background: approach === a.value ? "var(--primary-dim)" : "transparent",
                    borderColor: approach === a.value ? "var(--primary)" : "var(--border)",
                    color: approach === a.value ? "var(--primary-hi)" : "var(--muted)",
                  }}
                >
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── OR Duration + Difficulty ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <div>
              <div className="form-label">OR Duration (min)</div>
              <input
                type="number"
                min={1}
                max={1440}
                placeholder="e.g. 180"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="st-input"
                style={{ fontSize: 13, padding: "9px 11px" }}
              />
            </div>
            <div>
              <div className="form-label">Difficulty (1–5)</div>
              <div style={{ display: "flex", gap: 4, height: 40, alignItems: "center" }}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onClick={() => setDifficultyScore(n)}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 6,
                      border: "1px solid",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 600,
                      transition: "all .15s",
                      background: difficultyScore === n ? "var(--primary-dim)" : "transparent",
                      borderColor: difficultyScore === n ? "var(--primary)" : "var(--border)",
                      color: difficultyScore === n ? "var(--primary-hi)" : "var(--muted)",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="scalpel-line" style={{ margin: "16px 0" }} />

          {/* ── Outcome ── */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label">Outcome</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {OUTCOME_CATEGORIES.map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    setOutcomeCategory(o.value as OutcomeCategory);
                    if (o.value === "UNCOMPLICATED") setComplicationCategory("NONE");
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    border: "1px solid",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all .15s",
                    background: outcomeCategory === o.value ? `${o.color}15` : "transparent",
                    borderColor: outcomeCategory === o.value ? o.color : "var(--border)",
                    color: outcomeCategory === o.value ? o.color : "var(--muted)",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Complication Type (conditional) ── */}
          {outcomeCategory !== "UNCOMPLICATED" && (
            <div style={{ marginBottom: 16 }}>
              <div className="form-label">Complication Type</div>
              <select
                value={complicationCategory}
                onChange={(e) => setComplicationCategory(e.target.value as ComplicationCategory)}
                className="st-input"
                style={{ fontSize: 13, padding: "9px 11px" }}
              >
                {COMPLICATION_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── Conversion ── */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={conversionOccurred}
                onChange={(e) => setConversionOccurred(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Conversion occurred</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>e.g. laparoscopic to open</div>
              </div>
            </label>
          </div>

          {/* ── Divider ── */}
          <div className="scalpel-line" style={{ margin: "16px 0" }} />

          {/* ── Notes ── */}
          <div style={{ marginBottom: 16 }}>
            <div className="form-label">Operative Notes <span style={{ color: "var(--text-3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(no PHI)</span></div>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (e.target.value.length > 10) {
                  const result = validateNotes(e.target.value);
                  setNotesValidation({ safe: result.safe, warnings: result.warnings });
                } else {
                  setNotesValidation({ safe: true, warnings: [] });
                }
              }}
              placeholder="Key steps, challenges, learning points..."
              rows={3}
              className="st-input"
              style={{ fontSize: 13, padding: "9px 11px", resize: "none", lineHeight: 1.5 }}
            />
            {notesValidation.warnings.length > 0 && (
              <div style={{ marginTop: 6 }}>
                {notesValidation.warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: 11, color: "var(--warning)", display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    &#9888; {w}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Reflection ── */}
          <div style={{ marginBottom: 8 }}>
            <div className="form-label">Personal Reflection <span style={{ color: "var(--text-3)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></div>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did you learn? What would you do differently?"
              rows={3}
              className="st-input"
              style={{ fontSize: 13, padding: "9px 11px", resize: "none", lineHeight: 1.5 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          gap: 10,
          padding: "14px 18px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
          paddingBottom: "max(14px, env(safe-area-inset-bottom))",
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--muted)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!procedureName || submitting}
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px",
              background: procedureName && !submitting ? "var(--primary)" : "var(--surface2)",
              border: "none",
              borderRadius: 10,
              color: procedureName && !submitting ? "#fff" : "var(--muted)",
              fontSize: 14,
              fontWeight: 600,
              cursor: procedureName && !submitting ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "all .15s",
            }}
          >
            {submitting ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                Saving…
              </>
            ) : (
              <>
                <Check size={16} />
                Save Case
              </>
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
