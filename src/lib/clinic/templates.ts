// Hippo Clinic — built-in templates.
//
// Templates are clinician-facing scaffolds; they don't constrain the AI to
// produce a fixed structure. Every clinic note still defaults to the
// 4-paragraph model (see prompts.ts) — templates layer specialty-specific
// hints and surface structured fields for direct entry.
//
// Built-ins live here in code so they ship with the app. User-customised
// templates override these by `key` from `clinic_templates` in the DB.

import type { ClinicTemplateDefinition } from "./types";

const yesNo = ["Yes", "No", "Not discussed"];

// ─── Urology (priority specialty for the founder) ────────────────────────
const UROLOGY: ClinicTemplateDefinition[] = [
  {
    key: "urology.elevated-psa",
    name: "Elevated PSA",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "Document PSA values and trend over time, free PSA / PSA density if available.",
      "Note family history of prostate cancer and ethnicity.",
      "Ask about LUTS, hematuria, prior biopsies, prior MRI.",
      "Capture risk category (low/intermediate/high) only if explicitly discussed.",
    ],
    structuredFields: [
      { key: "psaTrend", label: "PSA trend", type: "trend", placeholder: "e.g. 4.2 → 5.1 → 5.6 ng/mL" },
      { key: "dre", label: "DRE finding", type: "text", placeholder: "e.g. Smooth, no nodules" },
      { key: "familyHx", label: "Family Hx prostate ca", type: "select", options: yesNo },
      { key: "priorBiopsy", label: "Prior biopsy", type: "select", options: yesNo },
      { key: "mri", label: "Prostate MRI / PI-RADS", type: "text", placeholder: "PI-RADS 3 lesion at..." },
    ],
  },
  {
    key: "urology.prostate-cancer-as",
    name: "Prostate cancer — Active surveillance",
    specialty: "Urology",
    noteType: "FOLLOW_UP",
    hints: [
      "Document Gleason / Grade Group, latest PSA, and AS triggers (PSA velocity, PI-RADS upgrade, biopsy upgrade).",
      "Capture symptom status, repeat MRI/biopsy interval.",
    ],
    structuredFields: [
      { key: "gradeGroup", label: "Grade Group", type: "select", options: ["1", "2", "3", "4", "5"] },
      { key: "psaTrend", label: "PSA trend", type: "trend" },
      { key: "lastMri", label: "Last MRI / PI-RADS", type: "text" },
      { key: "lastBiopsy", label: "Last biopsy date / result", type: "text" },
    ],
  },
  {
    key: "urology.bph-luts",
    name: "BPH / LUTS",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "Capture IPSS, QoL, PVR, uroflow when available.",
      "Document medical therapy attempted (alpha blocker, 5-ARI, beta-3 agonist, anticholinergic).",
    ],
    structuredFields: [
      { key: "ipss", label: "IPSS", type: "number" },
      { key: "qol", label: "QoL", type: "number" },
      { key: "pvr", label: "PVR (mL)", type: "number" },
      { key: "uroflow", label: "Qmax (mL/s)", type: "number" },
      { key: "therapyTried", label: "Prior therapy", type: "text" },
    ],
  },
  {
    key: "urology.hematuria",
    name: "Hematuria (gross / micro)",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "Distinguish gross vs microscopic, painful vs painless.",
      "Capture risk factors (smoking, occupational, age) and prior workup (CT-U, cysto, cytology).",
    ],
    structuredFields: [
      { key: "type", label: "Type", type: "select", options: ["Gross", "Microscopic", "Both"] },
      { key: "ctUrogram", label: "CT urogram", type: "text" },
      { key: "cystoscopy", label: "Cystoscopy", type: "text" },
      { key: "cytology", label: "Urine cytology", type: "text" },
    ],
  },
  {
    key: "urology.kidney-stones",
    name: "Kidney stones",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "Document size, location, laterality, hydronephrosis grade.",
      "Capture stone analysis history, metabolic workup, and 24-hr urine when available.",
    ],
    structuredFields: [
      { key: "size", label: "Size (mm)", type: "number" },
      { key: "location", label: "Location", type: "text", placeholder: "e.g. Left distal ureter" },
      { key: "hydro", label: "Hydronephrosis", type: "select", options: ["None", "Mild", "Moderate", "Severe"] },
      { key: "stoneAnalysis", label: "Stone analysis", type: "text" },
      { key: "metabolic", label: "24-hr urine / metabolic", type: "text" },
    ],
  },
  {
    key: "urology.recurrent-uti",
    name: "Recurrent UTI",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "Number of episodes/year, organism, sensitivities, post-coital pattern.",
      "Document upper-tract imaging, PVR, cysto findings if performed.",
    ],
    structuredFields: [
      { key: "episodesYear", label: "Episodes / year", type: "number" },
      { key: "organism", label: "Predominant organism", type: "text" },
      { key: "imaging", label: "US / CT findings", type: "text" },
      { key: "pvr", label: "PVR (mL)", type: "number" },
    ],
  },
  {
    key: "urology.testicular-mass",
    name: "Testicular mass",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "Onset, painful vs painless, scrotal US findings, tumour markers (AFP/β-hCG/LDH).",
    ],
    structuredFields: [
      { key: "side", label: "Side", type: "select", options: ["Left", "Right", "Bilateral"] },
      { key: "us", label: "Scrotal US", type: "text" },
      { key: "afp", label: "AFP", type: "number" },
      { key: "bhcg", label: "β-hCG", type: "number" },
      { key: "ldh", label: "LDH", type: "number" },
    ],
  },
  {
    key: "urology.ed",
    name: "Erectile dysfunction",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "SHIM / IIEF-5 score, vascular vs neurogenic vs psychogenic features, prior PDE5i trials.",
      "Comorbidities: diabetes, cardiovascular disease, depression, hypogonadism (AM testosterone).",
    ],
    structuredFields: [
      { key: "shim", label: "SHIM / IIEF-5", type: "number" },
      { key: "amTesto", label: "AM testosterone", type: "text" },
      { key: "pde5", label: "Prior PDE5i", type: "text" },
    ],
  },
  {
    key: "urology.peyronie",
    name: "Peyronie's disease",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "Onset, pain, curvature direction/degree, plaque palpable, ED component, hourglass deformity.",
    ],
    structuredFields: [
      { key: "curvature", label: "Curvature (°)", type: "number" },
      { key: "direction", label: "Direction", type: "text" },
      { key: "stage", label: "Stage", type: "select", options: ["Active", "Stable"] },
    ],
  },
  {
    key: "urology.incontinence",
    name: "Incontinence",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "Type (stress / urge / mixed / overflow / continuous), pads/day, prior PFMT, prior surgery.",
    ],
    structuredFields: [
      { key: "type", label: "Type", type: "select", options: ["Stress", "Urge", "Mixed", "Overflow", "Continuous"] },
      { key: "padsDay", label: "Pads / day", type: "number" },
    ],
  },
  {
    key: "urology.post-op-turbt",
    name: "Post-op TURBT",
    specialty: "Urology",
    noteType: "POST_OP",
    hints: [
      "TURBT date, pathology (T stage, grade, CIS, muscle present?), perioperative MMC/Gemcitabine.",
      "Cysto plan, intravesical therapy plan (BCG / induction / maintenance).",
    ],
    structuredFields: [
      { key: "pathology", label: "Pathology", type: "text", placeholder: "e.g. HG Ta, no muscle" },
      { key: "cis", label: "CIS", type: "select", options: yesNo },
      { key: "intravesical", label: "Intravesical plan", type: "text" },
    ],
  },
  {
    key: "urology.nmibc-surveillance",
    name: "NMIBC surveillance",
    specialty: "Urology",
    noteType: "CANCER_SURVEILLANCE",
    hints: ["Risk group, last cysto findings, cytology, upper-tract imaging schedule."],
    structuredFields: [
      { key: "riskGroup", label: "Risk group", type: "select", options: ["Low", "Intermediate", "High", "Very high"] },
      { key: "lastCysto", label: "Last cystoscopy", type: "text" },
    ],
  },
  {
    key: "urology.renal-mass",
    name: "Renal mass",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "Size, complexity (RENAL/PADUA), enhancement pattern, mets workup, baseline renal function.",
    ],
    structuredFields: [
      { key: "size", label: "Size (cm)", type: "number" },
      { key: "side", label: "Side", type: "select", options: ["Left", "Right", "Bilateral"] },
      { key: "renalScore", label: "RENAL score", type: "number" },
    ],
  },
  {
    key: "urology.hydronephrosis",
    name: "Hydronephrosis",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "Side, grade, etiology suspected, renal function, MAG3 / Lasix renogram if performed.",
    ],
    structuredFields: [
      { key: "side", label: "Side", type: "select", options: ["Left", "Right", "Bilateral"] },
      { key: "grade", label: "Grade", type: "select", options: ["1", "2", "3", "4"] },
      { key: "mag3", label: "MAG3 / renogram", type: "text" },
    ],
  },
  {
    key: "urology.circumcision",
    name: "Circumcision / phimosis",
    specialty: "Urology",
    noteType: "PROCEDURE_COUNSELLING",
    hints: ["Indication (phimosis, recurrent balanitis, etc), prior topical steroid trial, consent specifics."],
  },
  {
    key: "urology.vasectomy",
    name: "Vasectomy consult",
    specialty: "Urology",
    noteType: "PROCEDURE_COUNSELLING",
    hints: [
      "Age, partner status, reproductive history, irreversibility counselling, post-vasectomy semen analysis plan.",
    ],
  },
  {
    key: "urology.infertility",
    name: "Male infertility consult",
    specialty: "Urology",
    noteType: "NEW_CONSULT",
    hints: [
      "Duration of attempts, prior pregnancies, semen analyses, hormonal panel, varicocele.",
    ],
    structuredFields: [
      { key: "semenAnalysis", label: "Semen analysis", type: "text" },
      { key: "fsh", label: "FSH", type: "number" },
      { key: "lh", label: "LH", type: "number" },
      { key: "testo", label: "Testosterone", type: "number" },
    ],
  },
];

// ─── Generic specialty templates ────────────────────────────────────────
const GENERIC: ClinicTemplateDefinition[] = [
  { key: "general.new-consult",  name: "New consult",  specialty: "General",       noteType: "NEW_CONSULT" },
  { key: "general.follow-up",    name: "Follow-up",    specialty: "General",       noteType: "FOLLOW_UP" },
  { key: "general.results-review", name: "Results review", specialty: "General",   noteType: "RESULTS_REVIEW" },
  { key: "family-medicine.visit",  name: "Family Medicine visit", specialty: "Family Medicine", noteType: "NEW_CONSULT" },
  { key: "internal-medicine.visit", name: "Internal Medicine visit", specialty: "Internal Medicine", noteType: "NEW_CONSULT" },
  { key: "general-surgery.consult", name: "General Surgery consult", specialty: "General Surgery", noteType: "NEW_CONSULT" },
  { key: "pediatrics.visit", name: "Pediatrics visit", specialty: "Pediatrics", noteType: "NEW_CONSULT" },
  { key: "ob-gyn.visit", name: "OB/GYN visit", specialty: "OB/GYN", noteType: "NEW_CONSULT" },
  { key: "psychiatry.visit", name: "Psychiatry visit", specialty: "Psychiatry", noteType: "NEW_CONSULT" },
  { key: "orthopedics.visit", name: "Orthopedics visit", specialty: "Orthopedics", noteType: "NEW_CONSULT" },
  { key: "ent.visit", name: "ENT visit", specialty: "ENT", noteType: "NEW_CONSULT" },
  { key: "dermatology.visit", name: "Dermatology visit", specialty: "Dermatology", noteType: "NEW_CONSULT" },
  { key: "neurology.visit", name: "Neurology visit", specialty: "Neurology", noteType: "NEW_CONSULT" },
  { key: "cardiology.visit", name: "Cardiology visit", specialty: "Cardiology", noteType: "NEW_CONSULT" },
  { key: "respirology.visit", name: "Respirology visit", specialty: "Respirology", noteType: "NEW_CONSULT" },
  { key: "endocrinology.visit", name: "Endocrinology visit", specialty: "Endocrinology", noteType: "NEW_CONSULT" },
];

export const BUILTIN_CLINIC_TEMPLATES: ClinicTemplateDefinition[] = [
  ...GENERIC,
  ...UROLOGY,
];

export function findTemplate(key: string | null | undefined): ClinicTemplateDefinition | null {
  if (!key) return null;
  return BUILTIN_CLINIC_TEMPLATES.find((t) => t.key === key) ?? null;
}

export const NOTE_TYPE_LABELS: Record<string, string> = {
  NEW_CONSULT: "New consult",
  FOLLOW_UP: "Follow-up",
  POST_OP: "Post-op visit",
  CANCER_SURVEILLANCE: "Cancer surveillance",
  RESULTS_REVIEW: "Results review",
  PROCEDURE_COUNSELLING: "Procedure counselling",
  MEDICATION_FOLLOW_UP: "Medication follow-up",
  DISCHARGE_FOLLOW_UP: "Discharge follow-up",
  CUSTOM: "Custom",
};
