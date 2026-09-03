// SMSNA fellowship pathway — single source of truth for the gating predicate.
//
// No-migration decision (see reports/v-smsna/01-architect-report.md §2): the
// SMSNA sexual medicine fellowship pathway is stored by reusing the existing
// `Profile.trainingCountry` column with the sentinel value "SMSNA". Every
// SMSNA-specific behaviour in the app must be gated through `isSmsnaProfile`
// so non-SMSNA users (trainingCountry "US" / "CA" / null) see byte-identical
// behaviour to before this feature existed.

/** Sentinel value stored in `Profile.trainingCountry` for SMSNA fellows. */
export const SMSNA_TRAINING_SYSTEM = "SMSNA";
/** Specialty slug used for SMSNA case logs — its procedures are never added to PROCEDURE_LIBRARY. */
export const SMSNA_SPECIALTY_SLUG = "smsna";
/** Specialty display name for SMSNA case logs (`CaseLog.specialtyName` + the SPECIALTIES entry). */
export const SMSNA_SPECIALTY_NAME = "Andrology";

/** True when this profile's training pathway is the SMSNA sexual medicine fellowship. */
export function isSmsnaProfile(p?: { trainingCountry?: string | null } | null): boolean {
  return p?.trainingCountry === SMSNA_TRAINING_SYSTEM;
}

/**
 * Resolve the assessment framework ("trainingSystem") for a profile.
 *
 * Before SMSNA existed, this was two near-duplicate inline ternaries with a
 * pre-existing inconsistency for a null/undefined `trainingCountry`:
 *   - log/page.tsx:        trainingCountry === "CA" ? "RCPSC" : "ACGME"   (null → ACGME)
 *   - QuickAddModal.tsx:    trainingCountry === "US" ? "ACGME" : "RCPSC"   (null → RCPSC)
 * Both agree on the explicit cases ("CA" → RCPSC, "US" → ACGME); they only
 * disagree on the null/undefined fallback. To keep every existing call site
 * byte-identical, `fallback` lets each caller pass its own historical
 * default — log/page.tsx passes "ACGME" (its default), QuickAddModal.tsx
 * passes "RCPSC" (its default). Neither call site needs to change its
 * fallback behaviour for the users who exist today.
 */
export function resolveTrainingSystem(
  p?: { trainingCountry?: string | null } | null,
  fallback: "ACGME" | "RCPSC" = "ACGME",
): "SMSNA" | "RCPSC" | "ACGME" {
  const country = p?.trainingCountry;
  if (country === SMSNA_TRAINING_SYSTEM) return "SMSNA";
  if (country === "CA") return "RCPSC";
  if (country === "US") return "ACGME";
  return fallback;
}
