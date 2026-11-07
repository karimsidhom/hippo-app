// ---------------------------------------------------------------------------
// Billing overlay types — province-agnostic scaffolding
// ---------------------------------------------------------------------------

export type BillingPromptSeverity = "required" | "recommended" | "conditional";

/** A billing-critical prompt surfaced in the dictation UI. */
export interface BillingPrompt {
  id: string;
  label: string;
  /** The actual instruction text shown to the user. */
  text: string;
  severity: BillingPromptSeverity;
  /** UI color token — red for required, amber for recommended, etc. */
  color: string;
  /** Which tariff codes this prompt relates to. */
  requiredForCodes?: string[];
  /** If present, only show this prompt when the condition is true. */
  condition?: (ctx: DictationContext) => boolean;
}

export interface ProcedureBillingCode {
  code: string;
  label: string;
  fee?: string;
  notes?: string[];
}

/**
 * Runtime context pulled from the CaseLog + optional user toggles.
 * The billing engine evaluates global and per-procedure rules against this.
 */
export interface DictationContext {
  procedureKey: string;
  performedLysisOfAdhesions?: boolean;
  lysisMinutes?: number;
  totalCaseMinutes?: number;
  sameIncisionMultipleProcedures?: boolean;
  separateIncisionMultipleProcedures?: boolean;
  bilateralSameSession?: boolean;
  assistantUsed?: boolean;
  assistantMedicalNecessity?: string;
  additionalProcedureWithin3Weeks?: boolean;
  twoSurgeons?: boolean;
  surgeonFeeApportionmentNote?: string;
  laterality?: "left" | "right" | "bilateral" | "none";
}

export interface ProcedureBillingProfile {
  procedureKey: string;
  displayName: string;
  province: string;
  codes: ProcedureBillingCode[];
  prompts: BillingPrompt[];
  footerRules?: string[];
}

/** The assembled overlay for a given dictation. */
export interface RenderedBillingOverlay {
  visiblePrompts: BillingPrompt[];
  footerText: string;
  billableCodes: ProcedureBillingCode[];
  warnings: string[];
}
