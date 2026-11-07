// ---------------------------------------------------------------------------
// Dictation preferences — typed accessors and role-based defaults.
// ---------------------------------------------------------------------------
//
// Storage:  Profile table columns (see prisma/schema.prisma).
// Reading:  /api/dictation/preferences (GET) returns DictationPreferences.
// Writing:  /api/dictation/preferences (PUT) accepts a partial.
//
// Role-based defaults:
//   - Resident: billing OFF, complete dictation, missing-field prompts ON
//   - Attending: billing ON only after a region is picked, otherwise OFF
//   - Anyone with no region selected: billing forced OFF in render
// ---------------------------------------------------------------------------

import type { BillingRegion } from "./billing";
import { isRegionCode } from "./billing";

export type DictationLength = "complete" | "extra-detailed" | "brief";
export type DictationTone =
  | "standard"
  | "academic"
  | "concise-attending"
  | "resident-teaching";
export type PostopPlanInclusion = "always" | "if-entered";

export interface DictationPreferences {
  length: DictationLength;
  tone: DictationTone;
  billingEnabled: boolean;
  billingRegion: BillingRegion | null;
  teachingPearlsEnabled: boolean;
  missingFieldPromptsEnabled: boolean;
  postopPlanInclusion: PostopPlanInclusion;
}

export const DEFAULT_DICTATION_PREFERENCES: DictationPreferences = {
  length: "complete",
  tone: "standard",
  billingEnabled: false,
  billingRegion: null,
  teachingPearlsEnabled: false,
  missingFieldPromptsEnabled: true,
  postopPlanInclusion: "always",
};

export type RoleType =
  | "RESIDENT"
  | "FELLOW"
  | "STAFF"
  | "ATTENDING"
  | "PROGRAM_DIRECTOR";

/**
 * Compute the "as if first-onboarded" defaults for a role.
 * Used when the Profile row was created before the dictation columns existed
 * and the consumer wants sensible initial values.
 */
export function defaultPreferencesForRole(
  role: RoleType | null | undefined,
): DictationPreferences {
  if (role === "ATTENDING" || role === "STAFF" || role === "PROGRAM_DIRECTOR") {
    return {
      ...DEFAULT_DICTATION_PREFERENCES,
      // Attendings get billing ON by default — but it stays gated on
      // billingRegion being non-null when actually rendering.
      billingEnabled: true,
    };
  }
  // Residents + fellows: billing OFF until they explicitly turn it on.
  return { ...DEFAULT_DICTATION_PREFERENCES, billingEnabled: false };
}

/**
 * The runtime gate for whether the dictation engine should append billing
 * sections. False if billing is OFF, region is unset, or region code is
 * malformed. Use this — never `prefs.billingEnabled` directly.
 */
export function shouldRenderBilling(prefs: DictationPreferences): boolean {
  if (!prefs.billingEnabled) return false;
  if (!prefs.billingRegion) return false;
  if (!isRegionCode(prefs.billingRegion)) return false;
  return true;
}

/**
 * Map a raw Profile row (from Prisma) into a DictationPreferences shape.
 * Tolerates missing columns / nulls so existing rows keep working.
 */
export interface RawProfilePreferenceFields {
  dictationLength?: string | null;
  dictationTone?: string | null;
  billingEnabled?: boolean | null;
  billingRegion?: string | null;
  teachingPearlsEnabled?: boolean | null;
  missingFieldPromptsEnabled?: boolean | null;
  postopPlanInclusion?: string | null;
  roleType?: RoleType | string | null;
}

function asLength(v: unknown): DictationLength {
  if (v === "extra-detailed" || v === "brief" || v === "complete") return v;
  return "complete";
}
function asTone(v: unknown): DictationTone {
  if (
    v === "standard" ||
    v === "academic" ||
    v === "concise-attending" ||
    v === "resident-teaching"
  )
    return v;
  return "standard";
}
function asPostop(v: unknown): PostopPlanInclusion {
  if (v === "always" || v === "if-entered") return v;
  return "always";
}

export function preferencesFromProfile(
  row: RawProfilePreferenceFields | null | undefined,
): DictationPreferences {
  if (!row) return { ...DEFAULT_DICTATION_PREFERENCES };

  const role = (row.roleType as RoleType) ?? "RESIDENT";
  const base = defaultPreferencesForRole(role);

  return {
    length: asLength(row.dictationLength) ?? base.length,
    tone: asTone(row.dictationTone) ?? base.tone,
    billingEnabled:
      typeof row.billingEnabled === "boolean"
        ? row.billingEnabled
        : base.billingEnabled,
    billingRegion: isRegionCode(row.billingRegion)
      ? (row.billingRegion as BillingRegion)
      : null,
    teachingPearlsEnabled:
      typeof row.teachingPearlsEnabled === "boolean"
        ? row.teachingPearlsEnabled
        : base.teachingPearlsEnabled,
    missingFieldPromptsEnabled:
      typeof row.missingFieldPromptsEnabled === "boolean"
        ? row.missingFieldPromptsEnabled
        : base.missingFieldPromptsEnabled,
    postopPlanInclusion:
      asPostop(row.postopPlanInclusion) ?? base.postopPlanInclusion,
  };
}

// Disclaimer copy reused by the settings UI + appended to billing sections.
export const BILLING_DISCLAIMER =
  "Billing suggestions are for documentation support only and must be verified against the current provincial fee schedule.";
