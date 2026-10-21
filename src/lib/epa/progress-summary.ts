import type { HistoricalEpaRecord, HistoricalEpaSnapshot } from "./historical-progress";
import { SPECIALTIES } from "@/lib/constants";

export type EpaCreditUnit = "observation" | "logbook" | "collated_report" | "teaching_encounter" | "submission";
export interface EpaCreditComponent { code: string; parentCode: string; required: number; unit: EpaCreditUnit }
export interface HistoricalProgressSummary {
  categories: { completed: number; remaining: number; total: number; unknown: number };
  individual: {
    creditedMinimum: number | null;
    requiredMinimum: number | null;
    remainingMaximum: number | null;
    additionalBeyondMinimum: number | null;
    minimumFurtherRequired: number | null;
    actualCompleted: null;
    countsAreMinimums: true;
  };
  frameworkVersion: string | null;
  sourceReviewDate: string | null;
  limitations: string[];
}

export const UROLOGY_PROGRESS_FRAMEWORK_VERSION = "RCPSC Urology 2023 v2.0 / committee progress targets";

export function normalizeProgressSpecialty(value: string): string {
  const key = value.trim().toLowerCase();
  return SPECIALTIES.find(specialty => specialty.slug === key || specialty.name.toLowerCase() === key)?.slug ?? key.replace(/\s+/g, "-");
}

// Verified against the Royal College v2 assessment plans, by component:
// https://www.royalcollege.ca/content/dam/documents/ibd/urology/epa-guide-urology-v2-e.pdf
// One logbook/report/submission is one requirement credit, never its case or
// observer count. C12A=10 and C13A=12 also match the supplied committee targets.
const observationTargets: Record<string, number> = {
  TD1: 3, TD2: 2, TD3: 1, TD4: 2,
  F1: 5, F2: 3, F3: 3, F4A: 20, F4B: 3, F5: 5, F6: 10, F7: 3, F8: 5,
  C1: 15, C2: 10, C3: 2, C4: 6,
  C5A: 10, C6A: 10, C7A: 3, C8A: 10, C9A: 10, C10A: 5, C11A: 3,
  C12A: 10, C13A: 12, C14A: 15, C15A: 7, C15B: 1, C16: 3,
  C17: 10, C18A: 15, C18B: 15, C19A: 2, C21: 1,
  TTP1: 3, TTP2: 2, TTP3A: 3, TTP4: 2,
};
function parentCode(code: string) { return code.replace(/^((?:TD|F|C|TTP)\d+)[AB]$/, "$1"); }
export const UROLOGY_CREDIT_COMPONENTS: readonly EpaCreditComponent[] = [
  ...Object.entries(observationTargets).map(([code, required]) => ({ code, parentCode: parentCode(code), required, unit: "observation" as const })),
  ...Array.from({ length: 10 }, (_, index) => ({ code: `C${index + 5}B`, parentCode: `C${index + 5}`, required: 1, unit: "logbook" as const })),
  { code: "C19B", parentCode: "C19", required: 1, unit: "collated_report" },
  { code: "TTP3B", parentCode: "TTP3", required: 1, unit: "collated_report" },
  { code: "C20", parentCode: "C20", required: 2, unit: "teaching_encounter" },
  // The committee report specifies one submission for each of these two EPAs.
  { code: "TTP5", parentCode: "TTP5", required: 1, unit: "submission" },
  { code: "TTP6", parentCode: "TTP6", required: 1, unit: "submission" },
];

function genericCategoryStatuses(snapshot: HistoricalEpaSnapshot) {
  const statuses = new Map(snapshot.all_parent_epas.map(parent => [parent.code.toUpperCase(), parent.completion_status]));
  for (const record of snapshot.records) {
    const code = record.code.toUpperCase();
    if (code === "C5B-C13B") continue;
    const parent = parentCode(code);
    if (snapshot.all_parent_epas.some(item => item.code.toUpperCase() === parent)) continue;
    const previous = statuses.get(parent);
    statuses.set(parent, previous === "outstanding" || previous === "in_progress" || record.completion_status === "outstanding" || record.completion_status === "in_progress"
      ? "outstanding" : previous === "unknown" || record.completion_status === "unknown" ? "unknown" : "complete");
  }
  return statuses;
}
function categoryCounts(statuses: Map<string, string>) {
  const values = [...statuses.values()];
  return {
    completed: values.filter(status => status === "complete").length,
    remaining: values.filter(status => status === "outstanding" || status === "in_progress").length,
    total: values.length,
    unknown: values.filter(status => status !== "complete" && status !== "outstanding" && status !== "in_progress").length,
  };
}
const unknownIndividual = (): HistoricalProgressSummary["individual"] => ({
  creditedMinimum: null, requiredMinimum: null, remainingMaximum: null,
  additionalBeyondMinimum: null, minimumFurtherRequired: null,
  actualCompleted: null, countsAreMinimums: true,
});

function totalCriterion(record: HistoricalEpaRecord) {
  return record.criteria.find(criterion => criterion.is_total === true || criterion.criterion_id?.endsWith(":total") ||
    /^(overall requirement|total observation threshold|logbook submission)$/i.test(criterion.criterion));
}

/** Summary credits describe satisfied minimum requirements, not assessment history. */
export function summarizeHistoricalProgress(snapshot: HistoricalEpaSnapshot, specialty = "urology"): HistoricalProgressSummary {
  const statuses = genericCategoryStatuses(snapshot);
  const base: HistoricalProgressSummary = {
    categories: categoryCounts(statuses), individual: unknownIndividual(), frameworkVersion: null,
    sourceReviewDate: snapshot.source.review_date ?? null, limitations: [],
  };
  if (normalizeProgressSpecialty(specialty) !== "urology") {
    base.limitations.push("Individual credits are unavailable until this specialty has a verified component framework.");
    return base;
  }
  base.frameworkVersion = UROLOGY_PROGRESS_FRAMEWORK_VERSION;
  const parents = new Set(UROLOGY_CREDIT_COMPONENTS.map(component => component.parentCode));
  for (const parent of parents) {
    if (!statuses.has(parent)) statuses.set(parent, snapshot.interpretation.unlisted_epa_status === "complete" ? "complete" : "unknown");
  }
  base.categories = categoryCounts(statuses);
  const records = new Map<string, HistoricalEpaRecord>();
  for (const record of snapshot.records) {
    const code = record.code.toUpperCase();
    if (records.has(code)) {
      base.limitations.push("Duplicate component identifiers prevent a reliable individual-credit total.");
      return base;
    }
    records.set(code, record);
  }
  const knownCodes = new Set(UROLOGY_CREDIT_COMPONENTS.map(component => component.code));
  if ([...records.keys()].some(code => code !== "C5B-C13B" && !knownCodes.has(code))) {
    base.limitations.push("Some imported components do not match the verified framework; their credits need reconciliation.");
    return base;
  }
  if ([...statuses.keys()].some(code => !parents.has(code))) {
    base.limitations.push("Some imported categories do not match the verified framework; their credits need reconciliation.");
    return base;
  }

  let credited = 0, required = 0, further = 0, additional = 0;
  let futureUnknown = false, inferredCounts = false;
  const sharedLogbook = records.get("C5B-C13B");
  for (const component of UROLOGY_CREDIT_COMPONENTS) {
    required += component.required;
    const shared = component.unit === "logbook" && /^C(?:[5-9]|1[0-3])B$/.test(component.code) ? sharedLogbook : undefined;
    const record = records.get(component.code) ?? shared;
    if (!record) {
      if (statuses.get(component.parentCode) === "complete" || snapshot.interpretation.unlisted_criterion_status === "complete") {
        credited += component.required;
        inferredCounts = true;
        continue;
      }
      base.limitations.push(`The completion state of ${component.code} is unavailable; individual totals need reconciliation.`);
      return base;
    }
    if (record.overall_required !== component.required) {
      base.limitations.push(`The ${component.code} target differs from the verified framework; reconcile or agree the target before counting it.`);
      return base;
    }
    const total = totalCriterion(record);
    if (total && total.required !== component.required) {
      base.limitations.push(`The ${component.code} total criterion has a different target; individual totals need reconciliation.`);
      return base;
    }
    const done = record.overall_done ?? total?.done ?? null;
    if (record.overall_done !== null && total?.done !== null && total?.done !== undefined && record.overall_done !== total.done) {
      base.limitations.push(`The ${component.code} actual counts conflict; individual totals need reconciliation.`);
      return base;
    }
    const thresholdMet = total?.completion_status === "complete" || record.completion_status === "complete";
    if (thresholdMet && done !== null && done < component.required) {
      base.limitations.push(`The ${component.code} completed threshold conflicts with its count; individual totals need reconciliation.`);
      return base;
    }
    const componentCredit = thresholdMet ? component.required : Math.min(done ?? 0, component.required);
    credited += componentCredit;
    if (done === null) inferredCounts = true;
    const baselineGap = component.required - componentCredit;
    let explicitGap: number | null = thresholdMet ? 0 : done !== null ? Math.max(component.required - done, 0) : null;
    if (total?.remaining !== null && total?.remaining !== undefined) explicitGap = Math.max(explicitGap ?? 0, total.remaining);

    if (component.unit === "observation") {
      for (const criterion of record.criteria) {
        if (criterion === total || criterion.completion_status === "complete" || criterion.depth && criterion.depth > 0 || criterion.parent_criterion_id) continue;
        if (!/^(observations?|achievements?|assessors?)$/i.test(criterion.unit)) continue;
        const gap = criterion.remaining ?? (criterion.done !== null ? Math.max(criterion.required - criterion.done, 0) : null);
        if (gap !== null) explicitGap = Math.max(explicitGap ?? 0, gap);
      }
    } else if (component.required === 1 && (record.completion_status === "outstanding" || record.completion_status === "in_progress")) {
      // A pending binary submission/report is one credit, even if the source
      // omits its actual count. A shared logbook can satisfy nine B credits.
      explicitGap = 1;
    }
    if (record.completion_status === "complete" && explicitGap !== null && explicitGap > 0) {
      base.limitations.push(`The ${component.code} completion status conflicts with a remaining requirement.`);
      return base;
    }
    if (explicitGap === null) futureUnknown = true;
    else {
      further += explicitGap;
      additional += Math.max(explicitGap - baselineGap, 0);
    }
  }
  base.individual = {
    creditedMinimum: credited, requiredMinimum: required, remainingMaximum: required - credited,
    additionalBeyondMinimum: futureUnknown ? null : additional,
    minimumFurtherRequired: futureUnknown ? null : further,
    actualCompleted: null, countsAreMinimums: true,
  };
  base.limitations.push("Credits are capped at each required minimum. They are not the actual number of assessments submitted or signed; native observations are not added to this historical snapshot.");
  if (inferredCounts) base.limitations.push("Completed omitted components and completed thresholds with blank counts receive their required minimum credits; actual counts remain unknown.");
  if (sharedLogbook) base.limitations.push("The shared C5B–C13B evidence can satisfy nine separate Part B credits. It is not nine separate logbook uploads.");
  if (futureUnknown) base.limitations.push("Some remaining counts are unavailable, so the further-credit estimate cannot be determined.");
  else base.limitations.push("Further credits use the largest applicable gap within each component. Case mix can require more; overlapping criteria, logbook case totals and collated feedback raters are not added together.");
  return base;
}
