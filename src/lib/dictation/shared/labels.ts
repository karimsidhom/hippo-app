import type {
  SurgicalApproach,
  AutonomyLevel,
  AgeBin,
  OutcomeCategory,
  ComplicationCategory,
} from "@/lib/types";

export const AGE_BIN_LABELS: Record<AgeBin, string> = {
  UNDER_18: "pediatric (< 18 years)",
  AGE_18_30: "18–30 years",
  AGE_31_45: "31–45 years",
  AGE_46_60: "46–60 years",
  AGE_61_75: "61–75 years",
  OVER_75: "> 75 years",
  UNKNOWN: "age unknown",
};

export const AUTONOMY_LABELS: Record<AutonomyLevel, string> = {
  OBSERVER: "Observer only",
  ASSISTANT: "First assistant",
  SUPERVISOR_PRESENT: "Primary surgeon with attending present",
  INDEPENDENT: "Independent operator",
  TEACHING: "Teaching / supervising trainee",
};

export const APPROACH_LABELS: Record<SurgicalApproach, string> = {
  ROBOTIC: "Robotic-assisted laparoscopic",
  LAPAROSCOPIC: "Laparoscopic",
  OPEN: "Open",
  ENDOSCOPIC: "Endoscopic",
  HYBRID: "Hybrid (open/minimally invasive)",
  PERCUTANEOUS: "Percutaneous",
  OTHER: "Other",
};

export const OUTCOME_LABELS: Record<OutcomeCategory, string> = {
  UNCOMPLICATED: "Uncomplicated",
  MINOR_COMPLICATION: "Minor complication",
  MAJOR_COMPLICATION: "Major complication",
  REOPERATION: "Reoperation required",
  DEATH: "Death",
  UNKNOWN: "Unknown",
};

export const COMPLICATION_LABELS: Record<ComplicationCategory, string> = {
  NONE: "None",
  BLEEDING: "Bleeding",
  INFECTION: "Infection",
  ORGAN_INJURY: "Organ injury",
  ANASTOMOTIC_LEAK: "Anastomotic leak",
  DVT_PE: "DVT / Pulmonary embolism",
  ILEUS: "Ileus",
  CONVERSION: "Conversion to open",
  READMISSION: "Readmission",
  OTHER: "Other",
};
