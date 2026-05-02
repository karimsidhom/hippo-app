// ---------------------------------------------------------------------------
// Billing overlay — public API
// ---------------------------------------------------------------------------
//
// Modular structure (per the dictation engine spec):
//   - billingRegion          → BillingRegion enum (regions.ts)
//   - billingEnabled         → consumer-side flag (Profile.billingEnabled)
//   - billingCodeLibrary     → REGION_PROCEDURE_LIBRARIES (regions.ts)
//   - procedureToBillingMap  → resolveBillingKeys()  (manitoba.ts for now)
//   - billingDocumentationPrompts → BillingPrompt[]  (regions.ts + manitoba.ts)
//
// Today only Manitoba has a verified procedure library. Other provinces are
// scaffolded as empty libraries so the engine returns nothing rather than
// hard-coding inaccurate codes. To add a region, populate the library in
// `regions.ts` and flip `RegionMeta.status` to "verified".
// ---------------------------------------------------------------------------

import type { ProcedureBillingProfile, BillingPrompt, ProcedureBillingCode, RenderedBillingOverlay, DictationContext } from "./types";
import {
  REGION_REGISTRY,
  REGION_PROCEDURE_LIBRARIES,
  REGION_GLOBAL_RULES,
  ALL_REGIONS,
  getRegionMeta,
  getRegionProcedureLibrary,
  getRegionGlobalRules,
  getRegionDisclaimer,
  isRegionCode,
} from "./regions";
import type { BillingRegion } from "./regions";
import {
  resolveBillingKeys,
  getBillingOverlay,
  buildDictationBillingSection,
  MB_GLOBAL_SURGICAL_RULES,
  MB_PROCEDURE_LIBRARY,
} from "./manitoba";

export type {
  BillingPrompt,
  BillingPromptSeverity,
  ProcedureBillingCode,
  DictationContext,
  ProcedureBillingProfile,
  RenderedBillingOverlay,
} from "./types";

export type { BillingRegion } from "./regions";

export {
  // Manitoba-specific (legacy direct exports — kept for back-compat)
  MB_GLOBAL_SURGICAL_RULES,
  MB_PROCEDURE_LIBRARY,
  resolveBillingKeys,
  getBillingOverlay,
  buildDictationBillingSection,
  // Region registry
  REGION_REGISTRY,
  REGION_PROCEDURE_LIBRARIES,
  REGION_GLOBAL_RULES,
  ALL_REGIONS,
  getRegionMeta,
  getRegionProcedureLibrary,
  getRegionGlobalRules,
  getRegionDisclaimer,
  isRegionCode,
};

// ---------------------------------------------------------------------------
// Region-aware overlay
//
// Used by the dictation pipeline when billing is enabled. Returns "" when:
//   - `region` is null/undefined  (user hasn't picked a province)
//   - the region's procedure library is empty / no codes match
//   - none of the global rules fire
// This keeps dictations clean for users who haven't opted in.
// ---------------------------------------------------------------------------

export interface RegionalOverlayInput {
  region: BillingRegion | null | undefined;
  procedureKeys: string[];
  ctx: DictationContext;
}

export function getRegionalBillingOverlay(
  input: RegionalOverlayInput,
): RenderedBillingOverlay | null {
  const { region, procedureKeys, ctx } = input;
  if (!region || !isRegionCode(region)) return null;

  const library = getRegionProcedureLibrary(region);
  const globalRules = getRegionGlobalRules(region);

  // Bail early if nothing's registered for this region — avoids emitting
  // empty "Billing / Documentation Support" sections for scaffolded provinces.
  if (Object.keys(library).length === 0 && globalRules.length === 0) {
    return null;
  }

  const visiblePrompts: BillingPrompt[] = [];
  const billableCodes: ProcedureBillingCode[] = [];
  const warnings: string[] = [];

  for (const globalPrompt of globalRules) {
    if (!globalPrompt.condition || globalPrompt.condition(ctx)) {
      visiblePrompts.push(globalPrompt);
    }
  }

  for (const key of procedureKeys) {
    const profile = library[key];
    if (!profile) continue;

    for (const prompt of profile.prompts) {
      if (!prompt.condition || prompt.condition(ctx)) {
        visiblePrompts.push(prompt);
      }
    }

    for (const code of profile.codes) {
      // Adhesiolysis time gating (Manitoba-specific but harmless in other libraries)
      if (code.code === "3500") {
        if (ctx.performedLysisOfAdhesions && (ctx.lysisMinutes ?? 0) >= 30) {
          billableCodes.push(code);
        }
        continue;
      }
      if (code.code === "3501") {
        if (ctx.performedLysisOfAdhesions && (ctx.lysisMinutes ?? 0) > 30) {
          billableCodes.push(code);
        }
        continue;
      }
      billableCodes.push(code);
    }
  }

  if (ctx.performedLysisOfAdhesions) {
    if (!ctx.totalCaseMinutes) {
      warnings.push("Missing total surgical case time for adhesiolysis billing support.");
    }
    if (!ctx.lysisMinutes) {
      warnings.push("Missing total time spent performing lysis of adhesions.");
    }
  }

  if (
    visiblePrompts.length === 0 &&
    billableCodes.length === 0 &&
    warnings.length === 0
  ) {
    return null;
  }

  const footerText = buildRegionalFooter(region, billableCodes, warnings);
  return { visiblePrompts, footerText, billableCodes, warnings };
}

function buildRegionalFooter(
  region: BillingRegion,
  codes: ProcedureBillingCode[],
  warnings: string[],
): string {
  const meta = getRegionMeta(region);
  const codeLines = codes.length
    ? codes.map((c) => `- ${c.code}: ${c.label}${c.fee ? ` ($${c.fee})` : ""}`).join("\n")
    : `- No verified ${meta.name} codes auto-attached for this procedure yet.`;

  const warningLines = warnings.length
    ? "\n\nDocumentation review warnings:\n" + warnings.map((w) => `- ${w}`).join("\n")
    : "";

  return `${meta.name} Billing — ${meta.feeScheduleName}\n${codeLines}${warningLines}`;
}

// ---------------------------------------------------------------------------
// Build the in-dictation "Billing / Documentation Support" section.
// Returns "" when there is nothing to show (region missing, library empty,
// or no rules fire). Output is plain text and copy/paste-friendly.
// ---------------------------------------------------------------------------
export interface BuildSupportSectionInput {
  region: BillingRegion | null | undefined;
  procedureKeys: string[];
  ctx: DictationContext;
}

export function buildBillingSupportSection(
  input: BuildSupportSectionInput,
): string {
  const overlay = getRegionalBillingOverlay(input);
  if (!overlay) return "";
  if (
    overlay.billableCodes.length === 0 &&
    overlay.visiblePrompts.length === 0 &&
    overlay.warnings.length === 0
  ) {
    return "";
  }

  const region = input.region as BillingRegion;
  const meta = getRegionMeta(region);
  const lines: string[] = [];

  lines.push("");
  lines.push("--- BILLING / DOCUMENTATION SUPPORT ---");
  lines.push(
    `Region: ${meta.name}. Suggestions only — verify against the current ${meta.feeScheduleName} before submission.`,
  );
  lines.push("");

  if (overlay.billableCodes.length > 0) {
    lines.push("Suggested codes:");
    for (const code of overlay.billableCodes) {
      lines.push(`  ${code.code} — ${code.label}${code.fee ? ` ($${code.fee})` : ""}`);
      if (code.notes) {
        for (const note of code.notes) {
          lines.push(`    Note: ${note}`);
        }
      }
    }
    lines.push("");
  }

  if (overlay.visiblePrompts.length > 0) {
    lines.push("Documentation prompts:");
    for (const prompt of overlay.visiblePrompts) {
      lines.push(`  • ${prompt.label}: ${prompt.text}`);
    }
    lines.push("");
  }

  if (overlay.warnings.length > 0) {
    lines.push("Review warnings:");
    for (const w of overlay.warnings) {
      lines.push(`  * ${w}`);
    }
    lines.push("");
  }

  lines.push("Disclaimer: " + getRegionDisclaimer(region));
  return lines.join("\n");
}
