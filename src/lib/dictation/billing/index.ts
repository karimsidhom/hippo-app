// ---------------------------------------------------------------------------
// Billing overlay — public API
// ---------------------------------------------------------------------------

export type {
  BillingPrompt,
  BillingPromptSeverity,
  ProcedureBillingCode,
  DictationContext,
  ProcedureBillingProfile,
  RenderedBillingOverlay,
} from "./types";

export {
  MB_GLOBAL_SURGICAL_RULES,
  MB_PROCEDURE_LIBRARY,
  resolveBillingKeys,
  getBillingOverlay,
  buildDictationBillingSection,
} from "./manitoba";
