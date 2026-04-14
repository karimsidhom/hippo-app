"use client";

import { useState, useMemo, useEffect } from "react";
import type { EpaObservationInput, EpaAchievementLevel, CriterionRating } from "@/lib/types";
import { getSpecialtyEpaData } from "@/lib/epa/data";
import type { EpaDefinition } from "@/lib/epa/data";

interface EpaObservationFormProps {
  epaId: string;
  epaTitle: string;
  specialtySlug: string;
  trainingSystem: string;
  prefillData?: {
    caseLogId: string;
    caseDate: Date;
    procedureName: string;
    attendingLabel?: string;
  };
  onSubmit: (data: EpaObservationInput) => Promise<void>;
  onCancel: () => void;
  onSaveDraft: (data: EpaObservationInput) => Promise<void>;
}

const BASIS_OF_ASSESSMENT = [
  "Direct observation",
  "Case review",
  "Simulation",
  "Multi-source feedback",
  "Chart-stimulated recall",
  "Other",
];
const ASSESSOR_ROLES = ["Staff Physician", "Fellow", "Senior Resident", "Other Health Professional"];
const COMPLEXITIES = ["Low", "Normal", "High"];

// Entrustment scale matching Entrada / Royal College standard
const ENTRUSTMENT_OPTIONS = [
  { value: 0, label: "Not observed", short: "N/O", color: "#94a3b8" },
  { value: 1, label: "I had to do", short: "1", color: "#ef4444" },
  { value: 2, label: "I had to talk them through", short: "2", color: "#f97316" },
  { value: 3, label: "I had to prompt them from time to time", short: "3", color: "#eab308" },
  { value: 4, label: "I needed to be there in the room just in case", short: "4", color: "#22c55e" },
  { value: 5, label: "I did not need to be there", short: "5", color: "#10b981" },
];

function getStageColor(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTP")) return "#10b981";
  if (id.startsWith("TD")) return "#6366f1";
  if (id.startsWith("C")) return "#0ea5e9";
  if (id.startsWith("F")) return "#f59e0b";
  return "#0ea5e9";
}

function getStageLabel(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTP")) return "Transition to Practice";
  if (id.startsWith("TD")) return "Transition to Discipline";
  if (id.startsWith("C")) return "Core of Discipline";
  if (id.startsWith("F")) return "Foundations";
  return "EPA";
}

// ── Shared styles (theme-aware via CSS variables) ──
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", background: "var(--surface)",
  border: "1px solid var(--border-mid)", borderRadius: 8, color: "var(--text)",
  fontSize: 14, outline: "none", transition: "border-color .15s", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 6,
};
const sectionStyle: React.CSSProperties = {
  background: "var(--bg-2)", border: "1px solid var(--border-mid)", borderRadius: 12, padding: 20,
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: "0 0 16px",
  letterSpacing: "-0.01em",
};

function formatDateForInput(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function EpaObservationForm({
  epaId, epaTitle, specialtySlug, trainingSystem,
  prefillData, onSubmit, onCancel, onSaveDraft,
}: EpaObservationFormProps) {
  const stageColor = getStageColor(epaId);
  const stageLabel = getStageLabel(epaId);
  const isRCPSC = trainingSystem === "RCPSC";

  // Load EPA data
  const epaDefinition = useMemo(() => {
    const data = getSpecialtyEpaData(specialtySlug, isRCPSC ? "CA" : "US");
    return data?.epas.find((e) => e.id === epaId);
  }, [specialtySlug, isRCPSC, epaId]);

  const observationCriteria = epaDefinition?.observationCriteria || [];
  const techniqueOptions = epaDefinition?.techniqueOptions || [];

  // ── Form state ──
  const [observationDate, setObservationDate] = useState(
    prefillData?.caseDate ? formatDateForInput(prefillData.caseDate) : formatDateForInput(new Date())
  );
  const [assessorRole, setAssessorRole] = useState("Staff Physician");
  const [assessorName, setAssessorName] = useState(prefillData?.attendingLabel ?? "");
  const [assessorEmail, setAssessorEmail] = useState("");
  const [basisOfAssessment, setBasisOfAssessment] = useState("Direct observation");
  const [complexity, setComplexity] = useState("Normal");
  const [technique, setTechnique] = useState(techniqueOptions[0] || "");

  // Per-criterion entrustment ratings (Entrada-style)
  const [criteriaRatings, setCriteriaRatings] = useState<CriterionRating[]>(
    () => observationCriteria.map((label, i) => ({
      criterionId: `${epaId}-C${i + 1}`,
      label,
      entrustmentRating: null,
      comment: "",
    }))
  );

  // Overall O-Score
  const [overallEntrustment, setOverallEntrustment] = useState<number | null>(null);
  const [achievement, setAchievement] = useState<EpaAchievementLevel | "">("");

  // Narrative feedback — "Continue, Change, Consider" format
  const [commentsOptional, setCommentsOptional] = useState("");
  const [continueNotes, setContinueNotes] = useState("");
  const [changeNotes, setChangeNotes] = useState("");
  const [considerNotes, setConsiderNotes] = useState("");

  // Safety flags
  const [safetyConcern, setSafetyConcern] = useState(false);
  const [professionalismConcern, setProfessionalismConcern] = useState(false);
  const [concernDetails, setConcernDetails] = useState("");

  // Send via Hippo toggle
  const [sendViaHippo, setSendViaHippo] = useState(false);

  // ── Sign-off mode: pick a Hippo user (in-app) OR email a non-user ──
  const [signOffMode, setSignOffMode] = useState<"none" | "in_app" | "email">("none");

  // In-app picker state
  type PickedAssessor = { id: string; name: string | null; email: string; role: string | null; institution: string | null };
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerResults, setPickerResults] = useState<PickedAssessor[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickedAssessor, setPickedAssessor] = useState<PickedAssessor | null>(null);

  useEffect(() => {
    if (signOffMode !== "in_app" || pickedAssessor) return;
    const q = pickerQuery.trim();
    if (q.length < 2) { setPickerResults([]); return; }
    setPickerLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/assessors/search?q=${encodeURIComponent(q)}`)
        .then(r => r.ok ? r.json() : { assessors: [] })
        .then(d => setPickerResults(d.assessors ?? []))
        .catch(() => setPickerResults([]))
        .finally(() => setPickerLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [pickerQuery, signOffMode, pickedAssessor]);

  // When an in-app assessor is picked, sync into form fields the backend uses.
  useEffect(() => {
    if (pickedAssessor) {
      setAssessorName(pickedAssessor.name ?? pickedAssessor.email);
      setAssessorEmail(pickedAssessor.email);
    }
  }, [pickedAssessor]);

  // Live lookup: is this email a Hippo user? Drives the in-app vs email UX.
  const [assessorLookup, setAssessorLookup] = useState<
    { isHippoUser: boolean; isAssessor?: boolean; name?: string | null } | null
  >(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  useEffect(() => {
    const email = assessorEmail.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setAssessorLookup(null);
      return;
    }
    setLookupLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/assessors/lookup?email=${encodeURIComponent(email)}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { setAssessorLookup(d); })
        .catch(() => setAssessorLookup(null))
        .finally(() => setLookupLoading(false));
    }, 350); // debounce
    return () => clearTimeout(t);
  }, [assessorEmail]);

  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  function updateCriterionRating(index: number, rating: number | null) {
    setCriteriaRatings((prev) =>
      prev.map((cr, i) => (i === index ? { ...cr, entrustmentRating: rating } : cr))
    );
  }

  function updateCriterionComment(index: number, comment: string) {
    setCriteriaRatings((prev) =>
      prev.map((cr, i) => (i === index ? { ...cr, comment } : cr))
    );
  }

  function handleOverallEntrustment(score: number) {
    setOverallEntrustment(score);
    setAchievement(score >= 4 ? "ACHIEVED" : "NOT_ACHIEVED");
  }

  function buildInput(): EpaObservationInput {
    // Build strengths/improvement from continue/change/consider
    const strengthsNotes = continueNotes || undefined;
    const improvementNotes = [changeNotes, considerNotes].filter(Boolean).join("\n") || undefined;

    return {
      caseLogId: prefillData?.caseLogId,
      epaId, epaTitle, specialtySlug, trainingSystem,
      observationDate: new Date(observationDate),
      setting: basisOfAssessment,
      complexity,
      technique: technique || undefined,
      assessorName, assessorRole,
      assessorEmail: assessorEmail || undefined,
      achievement: achievement || undefined,
      entrustmentScore: overallEntrustment ?? undefined,
      observationNotes: commentsOptional || undefined,
      strengthsNotes,
      improvementNotes,
      criteriaRatings: criteriaRatings.length > 0 ? criteriaRatings : undefined,
      safetyConcern,
      professionalismConcern,
      concernDetails: concernDetails || undefined,
      sendViaHippo: sendViaHippo || undefined,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assessorName.trim()) return;
    setSubmitting(true);
    try { await onSubmit(buildInput()); }
    finally { setSubmitting(false); }
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    try { await onSaveDraft(buildInput()); }
    finally { setSavingDraft(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 700 }}>

      {/* ── EPA Header ──────────────────────────────────────────────── */}
      <div style={{
        padding: "16px 18px", background: `${stageColor}06`,
        border: `1px solid ${stageColor}20`, borderRadius: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: stageColor,
            fontFamily: "'Geist Mono', monospace",
            background: `${stageColor}15`, padding: "3px 10px", borderRadius: 6,
          }}>
            {epaId}
          </span>
          <span style={{ fontSize: 9, fontWeight: 600, color: stageColor, textTransform: "uppercase", letterSpacing: ".5px", opacity: 0.7 }}>
            {stageLabel}
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", lineHeight: 1.4, marginBottom: 8 }}>
          {epaTitle}
        </div>

        {/* Key features */}
        {epaDefinition?.keyFeatures && epaDefinition.keyFeatures.length > 0 && (
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, marginBottom: 8 }}>
            <strong style={{ color: "#cbd5e1" }}>Key Features:</strong>
            <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
              {epaDefinition.keyFeatures.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}

        {/* Collection requirements */}
        {epaDefinition && (
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
            Collect <strong style={{ color: "#cbd5e1" }}>{epaDefinition.targetCaseCount}</strong> observations of achievement
            {epaDefinition.complexityRequirements && epaDefinition.complexityRequirements.length > 0 && (
              <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                {epaDefinition.complexityRequirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── Assessment Context ──────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Assessor's Role */}
          <div>
            <label style={labelStyle}>Assessor&apos;s Role</label>
            <select value={assessorRole} onChange={(e) => setAssessorRole(e.target.value)} style={inputStyle}>
              {ASSESSOR_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Assessor Name */}
          <div>
            <label style={labelStyle}>Assessor Name *</label>
            <input type="text" value={assessorName} onChange={(e) => setAssessorName(e.target.value)}
              placeholder="Dr. Jane Smith" style={inputStyle} required />
          </div>

          {/* Basis of Assessment */}
          <div>
            <label style={labelStyle}>Basis of Assessment</label>
            <select value={basisOfAssessment} onChange={(e) => setBasisOfAssessment(e.target.value)} style={inputStyle}>
              {BASIS_OF_ASSESSMENT.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Case Complexity */}
          <div>
            <label style={labelStyle}>Case Complexity</label>
            <select value={complexity} onChange={(e) => setComplexity(e.target.value)} style={inputStyle}>
              {COMPLEXITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Technique (if applicable) */}
          {techniqueOptions.length > 0 && (
            <div>
              <label style={labelStyle}>Technique</label>
              <select value={technique} onChange={(e) => setTechnique(e.target.value)} style={inputStyle}>
                {techniqueOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" value={observationDate} onChange={(e) => setObservationDate(e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }} />
          </div>

        </div>

        {/* ── Send for Sign-off — picker block ──────────────────────── */}
        <div style={{
          marginTop: 16,
          padding: "16px",
          background: "var(--bg-2)",
          border: "1px solid var(--border-mid)",
          borderRadius: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
              Send for sign-off
            </div>
            <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>
              Optional \u2014 you can also request later
            </span>
          </div>

          {/* Mode selector — three big choice cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            <ChoiceCard
              active={signOffMode === "in_app"}
              activeColor="#10b981"
              icon={"\uD83D\uDCAC"}
              label="Send in Hippo"
              sub="Pick an attending"
              onClick={() => { setSignOffMode("in_app"); setPickedAssessor(null); setAssessorEmail(""); }}
            />
            <ChoiceCard
              active={signOffMode === "email"}
              activeColor="#2563eb"
              icon={"\u2709\uFE0F"}
              label="Email invite"
              sub="365-day link"
              onClick={() => { setSignOffMode("email"); setPickedAssessor(null); setPickerQuery(""); }}
            />
            <ChoiceCard
              active={signOffMode === "none"}
              activeColor="#64748b"
              icon={"\uD83D\uDCBE"}
              label="Save only"
              sub="No sign-off yet"
              onClick={() => { setSignOffMode("none"); setPickedAssessor(null); setAssessorEmail(""); setPickerQuery(""); }}
            />
          </div>

          {/* In-app picker */}
          {signOffMode === "in_app" && (
            <div>
              {pickedAssessor ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px",
                  background: "rgba(16,185,129,.08)",
                  border: "1px solid rgba(16,185,129,.3)",
                  borderRadius: 8,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(16,185,129,.15)", color: "#10b981",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>
                    {(pickedAssessor.name || pickedAssessor.email).slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                      {pickedAssessor.name || pickedAssessor.email}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {pickedAssessor.email}
                      {pickedAssessor.role ? ` \u00B7 ${pickedAssessor.role.replace("_", " ").toLowerCase()}` : ""}
                      {pickedAssessor.institution ? ` \u00B7 ${pickedAssessor.institution}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPickedAssessor(null); setPickerQuery(""); setAssessorEmail(""); }}
                    style={{
                      padding: "4px 10px", fontSize: 11, fontWeight: 600,
                      background: "transparent", color: "var(--text-2)",
                      border: "1px solid var(--border-mid)", borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Search by name or email\u2026"
                    style={inputStyle}
                    autoFocus
                  />
                  <div style={{ marginTop: 8, maxHeight: 220, overflowY: "auto" }}>
                    {pickerLoading && (
                      <div style={{ padding: 12, fontSize: 12, color: "var(--text-3)" }}>
                        Searching{"\u2026"}
                      </div>
                    )}
                    {!pickerLoading && pickerQuery.trim().length >= 2 && pickerResults.length === 0 && (
                      <div style={{
                        padding: 12, fontSize: 12, color: "var(--text-3)",
                        background: "var(--surface)", borderRadius: 6,
                      }}>
                        No assessors found. Try the email invite option instead.
                      </div>
                    )}
                    {pickerResults.map(a => (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => setPickedAssessor(a)}
                        style={{
                          display: "flex", width: "100%", alignItems: "center", gap: 10,
                          padding: "10px 12px",
                          background: "var(--surface)",
                          border: "1px solid var(--border-mid)",
                          borderRadius: 8,
                          textAlign: "left", cursor: "pointer",
                          marginBottom: 6, fontFamily: "inherit",
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "var(--surface2)", color: "var(--text-2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>
                          {(a.name || a.email).slice(0, 1).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                            {a.name || a.email}
                          </div>
                          <div style={{
                            fontSize: 11, color: "var(--text-3)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {a.email}
                            {a.role ? ` \u00B7 ${a.role.replace("_", " ").toLowerCase()}` : ""}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>
                    {"They\u2019ll get an in-app notification in their Sign-Offs inbox (with email backup)."}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Email invite */}
          {signOffMode === "email" && (
            <div>
              <input
                type="email"
                value={assessorEmail}
                onChange={(e) => setAssessorEmail(e.target.value)}
                placeholder="jane.smith@hospital.edu"
                style={inputStyle}
                autoFocus
              />
              {assessorEmail.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(assessorEmail.trim()) && (
                <div style={{
                  marginTop: 8, padding: "8px 10px",
                  background: "var(--surface)",
                  border: "1px solid var(--border-mid)",
                  borderRadius: 6,
                  fontSize: 11, color: "var(--text-3)",
                }}>
                  {lookupLoading
                    ? <>Checking{"\u2026"}</>
                    : assessorLookup?.isHippoUser
                      ? <><span style={{ color: "#10b981", fontWeight: 700 }}>{"\u2713"}</span>{" "}This email matches a Hippo user \u2014 we\u2019ll route as in-app + email backup.</>
                      : <>We\u2019ll email a secure sign-off link valid for 12 months. No login needed.</>
                  }
                </div>
              )}
            </div>
          )}

          {signOffMode === "none" && (
            <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
              The observation will be saved as a draft. You can request sign-off later from your EPA list.
            </div>
          )}
        </div>

        {/* Linked case */}
        {prefillData && (
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Linked Case</label>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", background: "#0c1219",
              borderRadius: 8, border: "1px solid var(--border-mid)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{prefillData.procedureName}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(prefillData.caseDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CanMEDS Milestones / Per-Criterion Entrustment Ratings ── */}
      {isRCPSC && criteriaRatings.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>CanMEDS Milestones</h3>

          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr repeat(6, 52px)",
            gap: 0,
            fontSize: 10,
            fontWeight: 700,
            color: "#cbd5e1",
            textAlign: "center",
            padding: "6px 0 10px",
            borderBottom: "2px solid var(--border-mid)",
            marginBottom: 2,
          }}>
            <div style={{ textAlign: "left", fontSize: 11, color: "#94a3b8" }}>Criterion</div>
            {ENTRUSTMENT_OPTIONS.map((opt) => (
              <div key={opt.value} style={{ lineHeight: 1.3, padding: "0 2px", color: opt.color }}>
                {opt.value === 0 ? "Not observed" : opt.label}
              </div>
            ))}
          </div>

          {/* Criteria rows */}
          {criteriaRatings.map((cr, idx) => (
            <div key={cr.criterionId}>
              {/* Rating row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr repeat(6, 52px)",
                gap: 0,
                alignItems: "center",
                padding: "12px 6px",
                borderBottom: "1px solid var(--border-mid)",
                background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)",
                borderRadius: 6,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "var(--text)",
                  lineHeight: 1.4, paddingRight: 12,
                }}>
                  {cr.label}
                </div>
                {ENTRUSTMENT_OPTIONS.map((opt) => {
                  const selected = cr.entrustmentRating === opt.value;
                  return (
                    <div key={opt.value} style={{ display: "flex", justifyContent: "center" }}>
                      <button
                        type="button"
                        onClick={() => updateCriterionRating(idx, selected ? null : opt.value)}
                        style={{
                          width: 22, height: 22, borderRadius: "50%",
                          border: selected ? `2px solid ${opt.color}` : "2px solid var(--border-mid)",
                          background: selected ? opt.color : "transparent",
                          cursor: "pointer", transition: "all .12s",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {selected && (
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Comment field per criterion */}
              <div style={{ padding: "6px 0 4px" }}>
                <input
                  type="text"
                  value={cr.comment || ""}
                  onChange={(e) => updateCriterionComment(idx, e.target.value)}
                  placeholder="Comment"
                  style={{
                    width: "100%", padding: "7px 10px",
                    background: "#0c1219", border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 6, color: "#cbd5e1", fontSize: 12,
                    outline: "none", fontStyle: "italic",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Overall Entrustment / O-Score ────────────────────────────── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          {isRCPSC
            ? "Please rate the resident\u2019s overall performance on this EPA based on the milestones above."
            : "Assessment"}
        </h3>

        {isRCPSC ? (
          <>
            {/* Horizontal O-Score selection matching Entrada layout */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 6,
              marginBottom: 16,
            }}>
              {ENTRUSTMENT_OPTIONS.filter((o) => o.value >= 1).map((opt) => {
                const selected = overallEntrustment === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleOverallEntrustment(opt.value)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      padding: "14px 6px", borderRadius: 10,
                      border: selected ? `2px solid ${opt.color}` : "1px solid var(--border-mid)",
                      background: selected ? `${opt.color}10` : "var(--bg-3)",
                      cursor: "pointer", transition: "all .15s",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: selected ? opt.color : "#111a25",
                      border: selected ? "none" : "2px solid var(--border-mid)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {selected && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: selected ? 700 : 500,
                      color: selected ? opt.color : "var(--text-2)",
                      textAlign: "center", lineHeight: 1.3,
                    }}>
                      {opt.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Derived achievement */}
            {overallEntrustment !== null && (
              <div style={{
                padding: "8px 12px", borderRadius: 8, marginBottom: 14,
                background: achievement === "ACHIEVED" ? "#10b98110" : "#64748b10",
                border: `1px solid ${achievement === "ACHIEVED" ? "#10b98130" : "#64748b30"}`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: achievement === "ACHIEVED" ? "#10b981" : "#64748b",
                }} />
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: achievement === "ACHIEVED" ? "#10b981" : "#94a3b8",
                }}>
                  {achievement === "ACHIEVED"
                    ? "Achieved \u2014 Entrustment criteria met (O-Score \u2265 4)"
                    : "Not Yet Achieved \u2014 Further development needed (O-Score < 4)"}
                </span>
              </div>
            )}
          </>
        ) : (
          /* ACGME simple achieved/not achieved */
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(["NOT_ACHIEVED", "ACHIEVED"] as const).map((val) => {
              const isAch = val === "ACHIEVED";
              const sel = achievement === val;
              return (
                <button key={val} type="button" onClick={() => setAchievement(val)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8,
                    border: sel ? `2px solid ${isAch ? "#10b981" : "#64748b"}` : "1px solid var(--border-mid)",
                    background: sel ? (isAch ? "#10b98115" : "#64748b15") : "var(--bg-3)",
                    color: sel ? (isAch ? "#10b981" : "#94a3b8") : "var(--text-3)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                  }}
                >
                  {isAch ? "Achieved" : "Not Yet Achieved"}
                </button>
              );
            })}
          </div>
        )}

        {/* Comments (optional) */}
        <div>
          <label style={labelStyle}>Comments (optional)</label>
          <textarea
            value={commentsOptional}
            onChange={(e) => setCommentsOptional(e.target.value)}
            placeholder="Additional comments on overall performance..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* ── Continue, Change, Consider ──────────────────────────────── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Continue, Change, Consider</h3>

        {/* Continue */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ ...labelStyle, color: "#10b981" }}>
            Continue — What should the resident keep doing?
          </label>
          <textarea
            value={continueNotes}
            onChange={(e) => setContinueNotes(e.target.value)}
            placeholder="Strengths and behaviours to continue..."
            rows={2}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        {/* Change */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ ...labelStyle, color: "#f59e0b" }}>
            Change — What should the resident do differently?
          </label>
          <textarea
            value={changeNotes}
            onChange={(e) => setChangeNotes(e.target.value)}
            placeholder="Areas for specific change or improvement..."
            rows={2}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        {/* Consider */}
        <div>
          <label style={{ ...labelStyle, color: "#0ea5e9" }}>
            Consider — What should the resident think about?
          </label>
          <textarea
            value={considerNotes}
            onChange={(e) => setConsiderNotes(e.target.value)}
            placeholder="Things to reflect on or explore further..."
            rows={2}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* ── Safety / Professionalism Flags ──────────────────────────── */}
      <div style={{
        ...sectionStyle,
        borderColor: (safetyConcern || professionalismConcern) ? "#ef444440" : "rgba(255,255,255,0.08)",
        background: (safetyConcern || professionalismConcern) ? "#ef444408" : "var(--bg-3)",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1", marginBottom: 10 }}>
          Flags
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: (safetyConcern || professionalismConcern) ? 10 : 0 }}>
          <label style={{
            display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12,
            color: safetyConcern ? "#ef4444" : "var(--text-3)", fontWeight: safetyConcern ? 600 : 400,
          }}>
            <input type="checkbox" checked={safetyConcern} onChange={(e) => setSafetyConcern(e.target.checked)}
              style={{ accentColor: "#ef4444" }} />
            Patient Safety Concern
          </label>
          <label style={{
            display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12,
            color: professionalismConcern ? "#ef4444" : "var(--text-3)", fontWeight: professionalismConcern ? 600 : 400,
          }}>
            <input type="checkbox" checked={professionalismConcern} onChange={(e) => setProfessionalismConcern(e.target.checked)}
              style={{ accentColor: "#ef4444" }} />
            Professionalism Concern
          </label>
        </div>
        {(safetyConcern || professionalismConcern) && (
          <textarea
            value={concernDetails} onChange={(e) => setConcernDetails(e.target.value)}
            placeholder="Please describe the concern..."
            rows={2}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", borderColor: "#ef444440" }}
          />
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
        <button type="button" onClick={handleSaveDraft} disabled={savingDraft}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border-mid)",
            background: "var(--surface2)", color: "var(--text-1)", fontSize: 13, fontWeight: 600,
            cursor: savingDraft ? "not-allowed" : "pointer", opacity: savingDraft ? 0.6 : 1,
            transition: "all .15s",
          }}>
          {savingDraft ? "Saving..." : "Save Draft"}
        </button>

        <button type="submit" disabled={submitting || !assessorName.trim()}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: stageColor, color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: (submitting || !assessorName.trim()) ? "not-allowed" : "pointer",
            opacity: (submitting || !assessorName.trim()) ? 0.6 : 1, transition: "all .15s",
          }}>
          {submitting
            ? "Submitting..."
            : assessorLookup?.isHippoUser
              ? "Send to Attending (in-app)"
              : assessorEmail
                ? "Submit & Email for Sign-off"
                : "Submit Observation"}
        </button>

        <button type="button" onClick={onCancel}
          style={{
            marginLeft: "auto", padding: "10px 16px", background: "transparent",
            border: "none", color: "var(--text-2)", fontSize: 13, cursor: "pointer",
            transition: "color .15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function ChoiceCard({
  active, activeColor, icon, label, sub, onClick,
}: {
  active: boolean;
  activeColor: string;
  icon: string;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 8px",
        borderRadius: 8,
        border: active ? `1px solid ${activeColor}` : "1px solid var(--border-mid)",
        background: active ? `${activeColor}20` : "var(--surface)",
        color: active ? activeColor : "var(--text-1)",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        transition: "all .15s",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{label}</span>
      <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 500 }}>{sub}</span>
    </button>
  );
}
