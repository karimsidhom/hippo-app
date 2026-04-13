"use client";

import { useState } from "react";
import type { EpaObservationInput, EpaAchievementLevel } from "@/lib/types";

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

const SETTINGS = ["OR", "Clinic", "Ward", "Simulation", "Other"];
const COMPLEXITIES = ["Low", "Moderate", "High"];
const ASSESSOR_ROLES = ["Staff Surgeon", "Fellow", "Senior Resident"];

function getStageColor(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTP")) return "#10b981";
  if (id.startsWith("TD")) return "#6366f1";
  if (id.startsWith("C")) return "#0ea5e9";
  if (id.startsWith("F")) return "#f59e0b";
  return "#0ea5e9";
}

// ── Shared input styles ──────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  background: "var(--bg-2)",
  border: "1px solid var(--border-mid)",
  borderRadius: 8,
  color: "var(--text-1)",
  fontSize: 13,
  outline: "none",
  transition: "border-color .15s",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-2)",
  marginBottom: 5,
};

const sectionStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-mid)",
  borderRadius: 12,
  padding: 18,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "var(--text-1)",
  margin: "0 0 14px",
};

function formatDateForInput(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function EpaObservationForm({
  epaId,
  epaTitle,
  specialtySlug,
  trainingSystem,
  prefillData,
  onSubmit,
  onCancel,
  onSaveDraft,
}: EpaObservationFormProps) {
  const stageColor = getStageColor(epaId);

  const [observationDate, setObservationDate] = useState(
    prefillData?.caseDate
      ? formatDateForInput(prefillData.caseDate)
      : formatDateForInput(new Date())
  );
  const [setting, setSetting] = useState("OR");
  const [complexity, setComplexity] = useState("Moderate");
  const [assessorName, setAssessorName] = useState(
    prefillData?.attendingLabel ?? ""
  );
  const [assessorRole, setAssessorRole] = useState("Staff Surgeon");
  const [assessorEmail, setAssessorEmail] = useState("");
  const [achievement, setAchievement] = useState<EpaAchievementLevel | "">("");
  const [observationNotes, setObservationNotes] = useState("");
  const [strengthsNotes, setStrengthsNotes] = useState("");
  const [improvementNotes, setImprovementNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  function buildInput(): EpaObservationInput {
    return {
      caseLogId: prefillData?.caseLogId,
      epaId,
      epaTitle,
      specialtySlug,
      trainingSystem,
      observationDate: new Date(observationDate),
      setting,
      complexity,
      assessorName,
      assessorRole,
      assessorEmail: assessorEmail || undefined,
      achievement: achievement || undefined,
      observationNotes: observationNotes || undefined,
      strengthsNotes: strengthsNotes || undefined,
      improvementNotes: improvementNotes || undefined,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assessorName.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(buildInput());
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    try {
      await onSaveDraft(buildInput());
    } finally {
      setSavingDraft(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 600,
      }}
    >
      {/* ── Section 1: Observation Details ──────────────────────────────── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Observation Details</h3>

        {/* EPA badge + title (read-only) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            padding: "10px 12px",
            background: "var(--bg-3)",
            borderRadius: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: stageColor,
              fontFamily: "'Geist Mono', monospace",
              background: `${stageColor}15`,
              padding: "2px 7px",
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            {epaId}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-1)",
            }}
          >
            {epaTitle}
          </span>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={observationDate}
            onChange={(e) => setObservationDate(e.target.value)}
            style={{
              ...inputStyle,
              colorScheme: "dark",
            }}
          />
        </div>

        {/* Setting */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Setting</label>
          <select
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            style={inputStyle}
          >
            {SETTINGS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Complexity */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Complexity</label>
          <select
            value={complexity}
            onChange={(e) => setComplexity(e.target.value)}
            style={inputStyle}
          >
            {COMPLEXITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Linked case (if prefillData) */}
        {prefillData && (
          <div>
            <label style={labelStyle}>Linked Case</label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: "var(--bg-3)",
                borderRadius: 8,
                border: "1px solid var(--border-mid)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-3)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-1)",
                  }}
                >
                  {prefillData.procedureName}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {new Date(prefillData.caseDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Assessor ────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Assessor</h3>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Assessor Name</label>
          <input
            type="text"
            value={assessorName}
            onChange={(e) => setAssessorName(e.target.value)}
            placeholder="Dr. Jane Smith"
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Assessor Role</label>
          <select
            value={assessorRole}
            onChange={(e) => setAssessorRole(e.target.value)}
            style={inputStyle}
          >
            {ASSESSOR_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Assessor Email</label>
          <input
            type="email"
            value={assessorEmail}
            onChange={(e) => setAssessorEmail(e.target.value)}
            placeholder="jane.smith@hospital.edu"
            style={inputStyle}
          />
          <p
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              margin: "4px 0 0",
            }}
          >
            Optional — enter to send for electronic sign-off
          </p>
        </div>
      </div>

      {/* ── Section 3: Assessment ──────────────────────────────────────── */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Assessment</h3>

        {/* Achievement toggle buttons */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Achievement</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setAchievement("NOT_ACHIEVED")}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                border:
                  achievement === "NOT_ACHIEVED"
                    ? "2px solid #64748b"
                    : "1px solid var(--border-mid)",
                background:
                  achievement === "NOT_ACHIEVED"
                    ? "#64748b15"
                    : "var(--bg-3)",
                color:
                  achievement === "NOT_ACHIEVED"
                    ? "#94a3b8"
                    : "var(--text-3)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              Not Yet Achieved
            </button>
            <button
              type="button"
              onClick={() => setAchievement("ACHIEVED")}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 8,
                border:
                  achievement === "ACHIEVED"
                    ? "2px solid #10b981"
                    : "1px solid var(--border-mid)",
                background:
                  achievement === "ACHIEVED" ? "#10b98115" : "var(--bg-3)",
                color:
                  achievement === "ACHIEVED" ? "#10b981" : "var(--text-3)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              Achieved
            </button>
          </div>
        </div>

        {/* Observation Notes */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Observation Notes</label>
          <textarea
            value={observationNotes}
            onChange={(e) => setObservationNotes(e.target.value)}
            placeholder="Describe what was observed..."
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Strengths */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Strengths</label>
          <textarea
            value={strengthsNotes}
            onChange={(e) => setStrengthsNotes(e.target.value)}
            placeholder="Areas of strong performance..."
            rows={2}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Areas for Improvement */}
        <div>
          <label style={labelStyle}>Areas for Improvement</label>
          <textarea
            value={improvementNotes}
            onChange={(e) => setImprovementNotes(e.target.value)}
            placeholder="Opportunities for growth..."
            rows={2}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingTop: 4,
        }}
      >
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={savingDraft}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid var(--border-mid)",
            background: "transparent",
            color: "var(--text-2)",
            fontSize: 13,
            fontWeight: 600,
            cursor: savingDraft ? "not-allowed" : "pointer",
            opacity: savingDraft ? 0.6 : 1,
            transition: "all .15s",
          }}
        >
          {savingDraft ? "Saving..." : "Save Draft"}
        </button>

        <button
          type="submit"
          disabled={submitting || !assessorName.trim()}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor:
              submitting || !assessorName.trim() ? "not-allowed" : "pointer",
            opacity: submitting || !assessorName.trim() ? 0.6 : 1,
            transition: "all .15s",
          }}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          style={{
            marginLeft: "auto",
            padding: "10px 16px",
            background: "transparent",
            border: "none",
            color: "var(--text-3)",
            fontSize: 13,
            cursor: "pointer",
            transition: "color .15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-3)";
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
