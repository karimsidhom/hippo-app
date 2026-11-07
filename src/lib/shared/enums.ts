/**
 * Canonical enum values used across web and mobile.
 *
 * These are string-literal unions (not TS enums) so Zod schemas can
 * consume them directly via `z.enum(AUTONOMY_LEVELS)` without an
 * intermediate translation layer. The UI-facing labels live in each
 * platform's theme/components — the values here MUST match the
 * Prisma enum definitions in `prisma/schema.prisma`.
 */

export const AUTONOMY_LEVELS = [
  "OBSERVER",
  "ASSISTANT",
  "SUPERVISOR_PRESENT",
  "INDEPENDENT",
  "TEACHING",
] as const;
export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

export const SURGICAL_APPROACHES = [
  "OPEN",
  "LAPAROSCOPIC",
  "ROBOTIC",
  "ENDOSCOPIC",
  "HYBRID",
  "PERCUTANEOUS",
  "OTHER",
] as const;
export type SurgicalApproach = (typeof SURGICAL_APPROACHES)[number];

export const OUTCOME_CATEGORIES = [
  "UNCOMPLICATED",
  "MINOR_COMPLICATION",
  "MAJOR_COMPLICATION",
  "REOPERATION",
  "DEATH",
  "UNKNOWN",
] as const;
export type OutcomeCategory = (typeof OUTCOME_CATEGORIES)[number];

export const AGE_BINS = [
  "UNDER_18",
  "AGE_18_30",
  "AGE_31_45",
  "AGE_46_60",
  "AGE_61_75",
  "OVER_75",
  "UNKNOWN",
] as const;
export type AgeBin = (typeof AGE_BINS)[number];

export const SURGEON_ROLES = [
  "Primary Surgeon",
  "Console Surgeon",
  "First Surgeon",
  "Assistant",
  "Observer",
  "Teaching Assistant",
] as const;
export type SurgeonRole = (typeof SURGEON_ROLES)[number];

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

/**
 * Map a numeric age to the canonical AgeBin. Keep in sync with the
 * server-side mapping in `/api/cases/route.ts` and the client-side
 * helper in `QuickAddModal.tsx` — mobile uses this same function.
 */
export function ageToBin(age: number | null | undefined): AgeBin {
  if (age == null || Number.isNaN(age)) return "UNKNOWN";
  if (age < 18) return "UNDER_18";
  if (age <= 30) return "AGE_18_30";
  if (age <= 45) return "AGE_31_45";
  if (age <= 60) return "AGE_46_60";
  if (age <= 75) return "AGE_61_75";
  return "OVER_75";
}
