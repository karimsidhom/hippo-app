// ---------------------------------------------------------------------------
// Provincial billing region registry
// ---------------------------------------------------------------------------
// Modular structure so we can add a new province without touching consumer
// code. Today only Manitoba has a populated procedure library; the rest are
// scaffolded as empty libraries that the dictation engine will gracefully
// skip until verified data is added.
//
// IMPORTANT: Billing tables are physician-verification material only.
// Hippo never claims these are authoritative. Consumers must show the
// disclaimer text returned by `getRegionDisclaimer(region)`.
// ---------------------------------------------------------------------------

import type { ProcedureBillingProfile, BillingPrompt } from "./types";
import {
  MB_GLOBAL_SURGICAL_RULES,
  MB_PROCEDURE_LIBRARY,
} from "./manitoba";
import {
  BC_GLOBAL_SURGICAL_RULES,
  BC_PROCEDURE_LIBRARY,
} from "./bc";

// Canonical region codes — match Profile.billingRegion column.
export type BillingRegion =
  | "MB" // Manitoba
  | "AB" // Alberta
  | "BC" // British Columbia
  | "SK" // Saskatchewan
  | "ON" // Ontario
  | "QC" // Quebec
  | "NS" // Nova Scotia
  | "NB" // New Brunswick
  | "PE" // Prince Edward Island
  | "NL" // Newfoundland and Labrador
  | "YT" // Yukon
  | "NT" // Northwest Territories
  | "NU"; // Nunavut

export interface RegionMeta {
  code: BillingRegion;
  name: string;
  feeScheduleName: string;
  feeScheduleUrl?: string;
  /** Human-readable status of the procedure library. */
  status: "verified" | "scaffolded" | "not-yet-mapped";
}

export const REGION_REGISTRY: Record<BillingRegion, RegionMeta> = {
  MB: {
    code: "MB",
    name: "Manitoba",
    feeScheduleName: "Manitoba Physician's Manual",
    feeScheduleUrl: "https://www.gov.mb.ca/health/documents/physmanual.pdf",
    status: "verified",
  },
  AB: {
    code: "AB",
    name: "Alberta",
    feeScheduleName: "Alberta Schedule of Medical Benefits (SOMB)",
    feeScheduleUrl: "https://www.alberta.ca/schedule-of-medical-benefits",
    status: "scaffolded",
  },
  BC: {
    code: "BC",
    name: "British Columbia",
    feeScheduleName: "MSC Payment Schedule (BC)",
    feeScheduleUrl:
      "https://www2.gov.bc.ca/gov/content/health/practitioner-professional-resources/msp/physicians/payment-schedules",
    status: "verified",
  },
  SK: {
    code: "SK",
    name: "Saskatchewan",
    feeScheduleName: "Saskatchewan Payment Schedule",
    status: "scaffolded",
  },
  ON: {
    code: "ON",
    name: "Ontario",
    feeScheduleName: "Schedule of Benefits — Physician Services (OHIP SOB)",
    feeScheduleUrl:
      "https://www.ontario.ca/document/schedule-benefits-physician-services-under-health-insurance-act",
    status: "scaffolded",
  },
  QC: {
    code: "QC",
    name: "Quebec",
    feeScheduleName: "Manuel des médecins spécialistes (RAMQ)",
    feeScheduleUrl: "https://www.ramq.gouv.qc.ca/",
    status: "scaffolded",
  },
  NS: {
    code: "NS",
    name: "Nova Scotia",
    feeScheduleName: "MSI Physicians Manual (Nova Scotia)",
    status: "scaffolded",
  },
  NB: {
    code: "NB",
    name: "New Brunswick",
    feeScheduleName: "Medicare Fee Schedule (New Brunswick)",
    status: "scaffolded",
  },
  PE: {
    code: "PE",
    name: "Prince Edward Island",
    feeScheduleName: "Health PEI Master Agreement Schedule",
    status: "scaffolded",
  },
  NL: {
    code: "NL",
    name: "Newfoundland and Labrador",
    feeScheduleName: "MCP Physician's Schedule (NL)",
    status: "scaffolded",
  },
  YT: {
    code: "YT",
    name: "Yukon",
    feeScheduleName: "Yukon Health Care Insurance Plan",
    status: "scaffolded",
  },
  NT: {
    code: "NT",
    name: "Northwest Territories",
    feeScheduleName: "NWT Health Care Plan Physician Schedule",
    status: "scaffolded",
  },
  NU: {
    code: "NU",
    name: "Nunavut",
    feeScheduleName: "Nunavut Health Care Plan Physician Schedule",
    status: "scaffolded",
  },
};

// ---------------------------------------------------------------------------
// Per-region procedure libraries.
//
// New regions: populate these from verified provincial fee schedules with
// physician sign-off, then update REGION_REGISTRY.status to "verified".
// Until then they remain empty objects so the engine skips them safely.
// ---------------------------------------------------------------------------
export const REGION_PROCEDURE_LIBRARIES: Record<
  BillingRegion,
  Record<string, ProcedureBillingProfile>
> = {
  MB: MB_PROCEDURE_LIBRARY,
  AB: {},
  BC: BC_PROCEDURE_LIBRARY,
  SK: {},
  ON: {},
  QC: {},
  NS: {},
  NB: {},
  PE: {},
  NL: {},
  YT: {},
  NT: {},
  NU: {},
};

export const REGION_GLOBAL_RULES: Record<BillingRegion, BillingPrompt[]> = {
  MB: MB_GLOBAL_SURGICAL_RULES,
  AB: [],
  BC: BC_GLOBAL_SURGICAL_RULES,
  SK: [],
  ON: [],
  QC: [],
  NS: [],
  NB: [],
  PE: [],
  NL: [],
  YT: [],
  NT: [],
  NU: [],
};

export function getRegionMeta(region: BillingRegion): RegionMeta {
  return REGION_REGISTRY[region];
}

export function getRegionProcedureLibrary(
  region: BillingRegion,
): Record<string, ProcedureBillingProfile> {
  return REGION_PROCEDURE_LIBRARIES[region] ?? {};
}

export function getRegionGlobalRules(region: BillingRegion): BillingPrompt[] {
  return REGION_GLOBAL_RULES[region] ?? [];
}

export function getRegionDisclaimer(region: BillingRegion): string {
  const meta = REGION_REGISTRY[region];
  const sourceLabel = meta.feeScheduleName ?? `${meta.name} fee schedule`;
  return `Billing suggestions are for documentation support only and must be verified against the current ${sourceLabel} before submission. Hippo does not submit claims and does not replace physician judgement.`;
}

export function isRegionCode(s: unknown): s is BillingRegion {
  return typeof s === "string" && s in REGION_REGISTRY;
}

export const ALL_REGIONS: RegionMeta[] = Object.values(REGION_REGISTRY);
