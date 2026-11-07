// ---------------------------------------------------------------------------
// EPA & Milestone Auto-Mapping Engine
// Maps case logs to EPAs and computes milestone progress
// ---------------------------------------------------------------------------

import type { CaseLog, AutonomyLevel } from "@/lib/types";
import type { SpecialtyEpaData, EpaDefinition } from "./data";
import type { ParsedSubRequirement } from "./subreqs";
import { parseSubRequirements } from "./subreqs";

// ── Output Interfaces ───────────────────────────────────────────────────────

export interface EpaProgress {
  epaId: string;
  title: string;
  totalCases: number;
  targetCases: number;
  percentComplete: number;
  byAutonomy: Record<string, number>;
  estimatedLevel: number;
  matchedCases: string[];
  /** Parsed sub-requirements from the EPA definition (for UI display) */
  subRequirements: ParsedSubRequirement[];
  /** Whether this EPA has sub-requirements beyond just a case count */
  hasSubRequirements: boolean;
}

export interface MilestoneProgress {
  milestoneId: string;
  domain: string;
  title: string;
  estimatedLevel: number;
  evidenceCases: number;
}

export interface EpaDashboardData {
  specialty: string;
  epaProgress: EpaProgress[];
  milestoneProgress: MilestoneProgress[];
  overallLevel: number;
  gaps: { epaId: string; title: string; needed: number }[];
  strengths: { epaId: string; title: string; cases: number }[];
}

// ── Autonomy weights for level estimation ───────────────────────────────────

const AUTONOMY_WEIGHTS: Record<AutonomyLevel, number> = {
  OBSERVER: 1,
  ASSISTANT: 2,
  SUPERVISOR_PRESENT: 3,
  INDEPENDENT: 4,
  TEACHING: 5,
};

// ── Core matching logic ─────────────────────────────────────────────────────

/**
 * Check whether a case's procedureName matches any of the EPA's
 * relatedProcedures patterns. Uses case-insensitive substring matching
 * so that partial matches work (e.g., "cholecystectomy" matches a case
 * named "Laparoscopic Cholecystectomy").
 */
function caseMatchesEpa(caseLog: CaseLog, epa: EpaDefinition): boolean {
  const name = caseLog.procedureName.toLowerCase();
  return epa.relatedProcedures.some((pattern) =>
    name.includes(pattern.toLowerCase()),
  );
}

/**
 * Estimate a milestone level (1-5) from the autonomy distribution of
 * matched cases.
 *
 * Logic:
 *  - Mostly OBSERVER                                    -> Level 1
 *  - Mix of ASSISTANT / SUPERVISOR_PRESENT              -> Level 2
 *  - Mostly SUPERVISOR_PRESENT                          -> Level 3
 *  - Mostly INDEPENDENT                                 -> Level 4
 *  - Majority INDEPENDENT + some TEACHING               -> Level 5
 */
function estimateLevelFromAutonomy(
  byAutonomy: Record<string, number>,
): number {
  const total = Object.values(byAutonomy).reduce((s, v) => s + v, 0);
  if (total === 0) return 1;

  let weightedSum = 0;
  for (const [level, count] of Object.entries(byAutonomy)) {
    const weight = AUTONOMY_WEIGHTS[level as AutonomyLevel] ?? 1;
    weightedSum += weight * count;
  }
  const avg = weightedSum / total;

  // Map weighted average to milestone levels
  if (avg < 1.5) return 1;
  if (avg < 2.5) return 2;
  if (avg < 3.5) return 3;
  if (avg < 4.3) return 4;
  return 5;
}

// ── Main computation function ───────────────────────────────────────────────

export function computeEpaProgress(
  cases: CaseLog[],
  specialty: SpecialtyEpaData,
): EpaDashboardData {
  // --- EPA progress ---
  const epaProgress: EpaProgress[] = specialty.epas.map((epa) => {
    const matched = cases.filter((c) => caseMatchesEpa(c, epa));
    const byAutonomy: Record<string, number> = {};
    const matchedIds: string[] = [];

    for (const c of matched) {
      byAutonomy[c.autonomyLevel] = (byAutonomy[c.autonomyLevel] ?? 0) + 1;
      matchedIds.push(c.id);
    }

    const totalCases = matched.length;
    const percentComplete = Math.min(
      100,
      Math.round((totalCases / epa.targetCaseCount) * 100),
    );

    const subreqs = parseSubRequirements(epa);

    return {
      epaId: epa.id,
      title: epa.title,
      totalCases,
      targetCases: epa.targetCaseCount,
      percentComplete,
      byAutonomy,
      estimatedLevel: estimateLevelFromAutonomy(byAutonomy),
      matchedCases: matchedIds,
      subRequirements: subreqs,
      hasSubRequirements: subreqs.length > 0,
    };
  });

  // --- Milestone progress ---
  // For each milestone, gather the union of cases from all EPAs that reference it,
  // then estimate a level from the combined autonomy distribution.
  const milestoneProgress: MilestoneProgress[] = specialty.milestones.map(
    (milestone) => {
      const relevantEpas = specialty.epas.filter((epa) =>
        epa.relatedMilestones.includes(milestone.id),
      );

      // Collect unique case IDs across all relevant EPAs
      const seenCaseIds = new Set<string>();
      const combinedAutonomy: Record<string, number> = {};

      for (const epa of relevantEpas) {
        for (const c of cases) {
          if (caseMatchesEpa(c, epa) && !seenCaseIds.has(c.id)) {
            seenCaseIds.add(c.id);
            combinedAutonomy[c.autonomyLevel] =
              (combinedAutonomy[c.autonomyLevel] ?? 0) + 1;
          }
        }
      }

      return {
        milestoneId: milestone.id,
        domain: milestone.domain,
        title: milestone.title,
        estimatedLevel: estimateLevelFromAutonomy(combinedAutonomy),
        evidenceCases: seenCaseIds.size,
      };
    },
  );

  // --- Overall level (weighted average of milestone levels) ---
  const overallLevel =
    milestoneProgress.length > 0
      ? Math.round(
          (milestoneProgress.reduce((s, m) => s + m.estimatedLevel, 0) /
            milestoneProgress.length) *
            10,
        ) / 10
      : 1;

  // --- Gaps: EPAs with < 50% of target case count ---
  const gaps = epaProgress
    .filter((ep) => ep.percentComplete < 50)
    .map((ep) => ({
      epaId: ep.epaId,
      title: ep.title,
      needed: ep.targetCases - ep.totalCases,
    }))
    .sort((a, b) => b.needed - a.needed);

  // --- Strengths: EPAs sorted by case count descending, top entries ---
  const strengths = [...epaProgress]
    .filter((ep) => ep.totalCases > 0)
    .sort((a, b) => b.totalCases - a.totalCases)
    .slice(0, 5)
    .map((ep) => ({
      epaId: ep.epaId,
      title: ep.title,
      cases: ep.totalCases,
    }));

  return {
    specialty: specialty.specialty,
    epaProgress,
    milestoneProgress,
    overallLevel,
    gaps,
    strengths,
  };
}

// ── Utility exports ─────────────────────────────────────────────────────────

/**
 * Given a single case, return all EPA IDs it maps to.
 * Useful for showing EPA tags on individual case log entries.
 */
export function getEpasForCase(
  caseLog: CaseLog,
  specialty: SpecialtyEpaData,
): string[] {
  return specialty.epas
    .filter((epa) => caseMatchesEpa(caseLog, epa))
    .map((epa) => epa.id);
}

/**
 * Given a single case, return all milestone IDs it contributes to
 * (via the EPAs it matches).
 */
export function getMilestonesForCase(
  caseLog: CaseLog,
  specialty: SpecialtyEpaData,
): string[] {
  const matchedEpas = specialty.epas.filter((epa) =>
    caseMatchesEpa(caseLog, epa),
  );
  const milestoneIds = new Set<string>();
  for (const epa of matchedEpas) {
    for (const mId of epa.relatedMilestones) {
      milestoneIds.add(mId);
    }
  }
  return Array.from(milestoneIds);
}
