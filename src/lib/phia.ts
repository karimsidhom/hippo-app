/**
 * PHIA (Personal Health Information Act) / Privacy compliance helpers
 * Designed for Canadian medical compliance (Ontario PHIA / PIPEDA)
 * Also covers HIPAA patterns for US-based users
 */

import type { CaseLog } from "./types";

// ============================================================
// PATTERNS FOR PHI DETECTION
// ============================================================

// Health card number patterns (Ontario OHIP: XXXX-XXX-XXX-XX)
const OHIP_PATTERN = /\b\d{4}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{2}\b/g;

// Generic health card number (various provinces)
const HEALTH_CARD_GENERIC = /\b[A-Z]{0,4}\d{4,12}[A-Z]{0,2}\b/g;

// PHIN-like patterns (###-###-#### format - 10 digit PHN)
const PHIN_PATTERN = /\b\d{3}[-\s]\d{3}[-\s]\d{4}\b/g;

// Social Insurance Number (SIN) pattern: XXX-XXX-XXX
const SIN_PATTERN = /\b\d{3}[-\s]\d{3}[-\s]\d{3}\b/g;

// MRN (Medical Record Number) - typically 6-10 digit sequences or labelled
const MRN_LABELLED = /\b(mrn|medical\s*record\s*(number|no|#)?|chart\s*(number|no|#)?|patient\s*(id|number|no|#)?)\s*:?\s*[A-Z0-9\-]{4,15}/gi;

// Date of birth patterns (when combined with other PHI indicators)
const DOB_LABELLED = /\b(dob|date\s*of\s*birth|born)\s*:?\s*\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/gi;

// Phone number patterns
const PHONE_PATTERN = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

// Email pattern
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b/g;

// Address fragments (street numbers + name patterns)
const ADDRESS_PATTERN = /\b\d{1,5}\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Boulevard|Blvd|Lane|Ln|Court|Ct|Way|Place|Pl)\b/gi;

// Postal code (Canadian: A1A 1A1)
const POSTAL_CODE_PATTERN = /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi;

// US Zip code (not PHI alone but context-sensitive)
const ZIP_CODE_PATTERN = /\b\d{5}(-\d{4})?\b/g;

// Name patterns - "Patient John Smith" or "Pt: John Smith" type references
const PATIENT_NAME_LABELLED = /\b(patient|pt|subject)\s*:?\s*[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}/gi;

// Insurance/policy number patterns
const INSURANCE_PATTERN = /\b(insurance|policy|group)\s*(number|no|#|id)\s*:?\s*[A-Z0-9\-]{5,20}/gi;

// ============================================================
// BLOCKED TERMS AND PHRASES
// ============================================================

const BLOCKED_TERMS = [
  // Direct PHI references
  "mrn:", "medical record number", "chart number", "patient id:",
  "health card", "ohip number", "phn:", "personal health number",
  "date of birth:", "dob:", "social insurance", "sin:",
  // PHI disclosure patterns
  "patient name", "patient's name", "pt name",
  "patient address", "home address", "lives at",
  "phone number", "cell number", "home phone",
  "next of kin", "emergency contact",
  "insurance number", "policy number",
  // Canadian-specific PHI
  "ohip", "health card number", "provincial health",
  "manitoba health", "alberta health", "bc health",
];

const RISKY_PHRASES = [
  // Phrases that, in context, could identify the patient
  "the patient is from",
  "patient lives in",
  "patient works at",
  "patient is a",
  "unique presentation", // OK on its own, but may lead to identification in small communities
  "only case of",
  "first in canada",
  "first in ontario",
  "news story",
  "published case",
  "conference abstract",
];

// ============================================================
// SCRUBBING FUNCTIONS
// ============================================================

/**
 * Replaces detected PHI patterns with [REDACTED] tokens
 */
export function scrubNotes(text: string): string {
  if (!text || text.trim().length === 0) return text;

  let scrubbed = text;

  // Replace specific patterns
  scrubbed = scrubbed.replace(OHIP_PATTERN, "[HEALTH-CARD-REDACTED]");
  scrubbed = scrubbed.replace(PHIN_PATTERN, "[PHN-REDACTED]");
  scrubbed = scrubbed.replace(SIN_PATTERN, "[SIN-REDACTED]");
  scrubbed = scrubbed.replace(MRN_LABELLED, "[MRN-REDACTED]");
  scrubbed = scrubbed.replace(DOB_LABELLED, "[DOB-REDACTED]");
  scrubbed = scrubbed.replace(PHONE_PATTERN, "[PHONE-REDACTED]");
  scrubbed = scrubbed.replace(EMAIL_PATTERN, "[EMAIL-REDACTED]");
  scrubbed = scrubbed.replace(ADDRESS_PATTERN, "[ADDRESS-REDACTED]");
  scrubbed = scrubbed.replace(POSTAL_CODE_PATTERN, "[POSTAL-REDACTED]");
  scrubbed = scrubbed.replace(PATIENT_NAME_LABELLED, "[PATIENT-NAME-REDACTED]");
  scrubbed = scrubbed.replace(INSURANCE_PATTERN, "[INSURANCE-REDACTED]");

  return scrubbed;
}

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validates notes/text for PHI content
 * Returns safe status, warnings, and a scrubbed version
 */
export function validateNotes(text: string): { safe: boolean; warnings: string[]; scrubbed: string } {
  if (!text || text.trim().length === 0) {
    return { safe: true, warnings: [], scrubbed: text };
  }

  const warnings: string[] = [];
  const lowerText = text.toLowerCase();

  // Check OHIP pattern
  if (OHIP_PATTERN.test(text)) {
    warnings.push("Possible health card number detected");
    OHIP_PATTERN.lastIndex = 0;
  }

  // Check PHIN pattern
  if (PHIN_PATTERN.test(text)) {
    warnings.push("Possible personal health number (PHN) detected in ###-###-#### format");
    PHIN_PATTERN.lastIndex = 0;
  }

  // Check MRN
  if (MRN_LABELLED.test(text)) {
    warnings.push("Possible medical record number (MRN) reference detected");
    MRN_LABELLED.lastIndex = 0;
  }

  // Check DOB
  if (DOB_LABELLED.test(text)) {
    warnings.push("Possible date of birth reference detected");
    DOB_LABELLED.lastIndex = 0;
  }

  // Check phone numbers
  if (PHONE_PATTERN.test(text)) {
    warnings.push("Possible phone number detected");
    PHONE_PATTERN.lastIndex = 0;
  }

  // Check email
  if (EMAIL_PATTERN.test(text)) {
    warnings.push("Email address detected — remove before saving");
    EMAIL_PATTERN.lastIndex = 0;
  }

  // Check address
  if (ADDRESS_PATTERN.test(text)) {
    warnings.push("Possible street address detected");
    ADDRESS_PATTERN.lastIndex = 0;
  }

  // Check patient name labelled
  if (PATIENT_NAME_LABELLED.test(text)) {
    warnings.push("Possible patient name reference detected");
    PATIENT_NAME_LABELLED.lastIndex = 0;
  }

  // Check blocked terms
  for (const term of BLOCKED_TERMS) {
    if (lowerText.includes(term.toLowerCase())) {
      warnings.push(`Blocked term detected: "${term}" — please rephrase`);
    }
  }

  // Check risky phrases
  for (const phrase of RISKY_PHRASES) {
    if (lowerText.includes(phrase.toLowerCase())) {
      warnings.push(`Potentially identifying phrase: "${phrase}"`);
    }
  }

  // SIN check
  if (SIN_PATTERN.test(text)) {
    const found = text.match(SIN_PATTERN);
    if (found) {
      warnings.push("Possible Social Insurance Number (SIN) format detected");
    }
    SIN_PATTERN.lastIndex = 0;
  }

  const scrubbed = scrubNotes(text);
  const safe = warnings.length === 0;

  return { safe, warnings, scrubbed };
}

/**
 * Checks if a case log is safe to publish to public feed
 */
export function isSafeForPublicFeed(caseLog: Partial<CaseLog>): boolean {
  if (caseLog.notes) {
    const { safe } = validateNotes(caseLog.notes);
    if (!safe) return false;
  }

  if (caseLog.reflection) {
    const { safe } = validateNotes(caseLog.reflection);
    if (!safe) return false;
  }

  if (caseLog.attendingLabel) {
    // Don't expose attending names in public feed
    if (caseLog.attendingLabel.length > 0) return false;
  }

  if (caseLog.institutionSite) {
    // Floor-level institution is OK, but specific room/suite info is not
    const risky = /suite\s*\d+|room\s*\d+|OR\s*\d+|operating\s*room\s*\d+/i;
    if (risky.test(caseLog.institutionSite)) return false;
  }

  return true;
}

/**
 * Checks if a metric is safe to include in leaderboard
 */
export function isSafeForLeaderboard(metric: string): boolean {
  const safemetrics = [
    "total_cases",
    "procedure_count",
    "autonomy_score",
    "improvement_rate",
    "efficiency_trend",
    "volume",
    "streak",
  ];
  return safemetrics.includes(metric.toLowerCase());
}

/**
 * Transforms a case log for safe export (removes all identifiers)
 */
export function exportSafeTransform(caseLog: CaseLog): Partial<CaseLog> {
  return {
    id: caseLog.id,
    specialtyName: caseLog.specialtyName,
    procedureName: caseLog.procedureName,
    procedureCategory: caseLog.procedureCategory,
    surgicalApproach: caseLog.surgicalApproach,
    role: caseLog.role,
    autonomyLevel: caseLog.autonomyLevel,
    difficultyScore: caseLog.difficultyScore,
    operativeDurationMinutes: caseLog.operativeDurationMinutes,
    consoleTimeMinutes: caseLog.consoleTimeMinutes,
    dockingTimeMinutes: caseLog.dockingTimeMinutes,
    patientAgeBin: caseLog.patientAgeBin,
    diagnosisCategory: caseLog.diagnosisCategory,
    outcomeCategory: caseLog.outcomeCategory,
    complicationCategory: caseLog.complicationCategory,
    conversionOccurred: caseLog.conversionOccurred,
    tags: caseLog.tags,
    caseDate: caseLog.caseDate,
    // Explicitly excluded: userId, attendingLabel, institutionSite, notes (raw), reflection (raw)
    notes: caseLog.notes ? scrubNotes(caseLog.notes) : null,
    reflection: caseLog.reflection ? scrubNotes(caseLog.reflection) : null,
  };
}

/**
 * Validates a full case log before saving
 */
export function validateCaseForSave(caseLog: Partial<CaseLog>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!caseLog.procedureName?.trim()) {
    errors.push("Procedure name is required");
  }

  if (!caseLog.caseDate) {
    errors.push("Case date is required");
  } else {
    const date = new Date(caseLog.caseDate);
    const now = new Date();
    if (date > now) {
      errors.push("Case date cannot be in the future");
    }
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    if (date < twoYearsAgo) {
      warnings.push("Case date is more than 2 years ago — please verify");
    }
  }

  if (caseLog.notes) {
    const { warnings: noteWarnings } = validateNotes(caseLog.notes);
    warnings.push(...noteWarnings);
  }

  if (caseLog.reflection) {
    const { warnings: reflWarnings } = validateNotes(caseLog.reflection);
    warnings.push(...reflWarnings);
  }

  if (caseLog.operativeDurationMinutes !== undefined && caseLog.operativeDurationMinutes !== null) {
    if (caseLog.operativeDurationMinutes < 1) {
      errors.push("Operative duration must be at least 1 minute");
    }
    if (caseLog.operativeDurationMinutes > 1440) {
      warnings.push("Operative duration exceeds 24 hours — please verify");
    }
  }

  if (caseLog.difficultyScore !== undefined) {
    if (caseLog.difficultyScore < 1 || caseLog.difficultyScore > 5) {
      errors.push("Difficulty score must be between 1 and 5");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generates a privacy-safe display name for leaderboard use
 * e.g., "Dr. Alex Chen" → "Dr. A.C." or "Resident (PGY-4)"
 */
export function getPrivacySafeName(
  name: string | null,
  roleType: string | null,
  pgyYear: number | null,
  isPublic: boolean
): string {
  if (!isPublic) {
    if (roleType && pgyYear) {
      const label = roleType === "RESIDENT" ? `Resident (PGY-${pgyYear})` :
                    roleType === "FELLOW" ? `Fellow (Yr ${pgyYear - 5})` :
                    "Staff Surgeon";
      return label;
    }
    return "Anonymous Surgeon";
  }

  if (name) {
    // Return initials format for semi-public display
    const parts = name.replace("Dr. ", "").replace("Dr ", "").trim().split(" ");
    if (parts.length >= 2) {
      return `Dr. ${parts[0][0]}.${parts[parts.length - 1][0]}.`;
    }
    return name;
  }

  return "Anonymous Surgeon";
}
