// ---------------------------------------------------------------------------
// EPA Sub-Requirement Parser & Tracker
// ---------------------------------------------------------------------------
// Parses the human-readable complexityRequirements strings from EPA
// definitions into structured, trackable requirements, then evaluates
// logged observations against them.
// ---------------------------------------------------------------------------

import type { EpaDefinition } from "./data";

// ── Types ────────────────────────────────────────────────────────────────────

export type SubReqType =
  | "technique"       // "At least 3 standard electrocautery"
  | "complexity"      // "At least 3 high complexity"
  | "assessor"        // "At least 2 different assessors"
  | "scenario"        // "At least 1 nephrostomy tube" / "At least 1 JP removal"
  | "general";        // fallback

export interface ParsedSubRequirement {
  /** Original requirement text from EPA definition */
  rawText: string;
  type: SubReqType;
  /** Minimum count required */
  minCount: number;
  /** What to match against — e.g., "high" for complexity, "standard electrocautery" for technique */
  matchValue: string;
  /** Friendly label for the UI */
  label: string;
}

export interface SubRequirementProgress {
  requirement: ParsedSubRequirement;
  current: number;
  met: boolean;
}

export interface EpaSubRequirementSummary {
  epaId: string;
  totalObservations: number;
  targetCount: number;
  subRequirements: SubRequirementProgress[];
  allSubReqsMet: boolean;
  /** Requirements that still need work */
  remaining: SubRequirementProgress[];
}

// ── Observation shape (minimal for tracking) ────────────────────────────────

export interface ObservationForTracking {
  epaId: string;
  complexity?: string | null;
  technique?: string | null;
  assessorName: string;
  setting?: string | null;
  status?: string;
}

// ── Parser ──────────────────────────────────────────────────────────────────

const COUNT_REGEX = /at\s+least\s+(\d+)/i;
const HIGH_COMPLEXITY_REGEX = /high\s+complexity/i;
const LOW_COMPLEXITY_REGEX = /low\s+complexity/i;
const ASSESSOR_REGEX = /different\s+assessors?/i;

/**
 * Parse a single complexityRequirements string into a structured object.
 */
function parseRequirement(
  text: string,
  techniqueOptions: string[],
): ParsedSubRequirement {
  const countMatch = text.match(COUNT_REGEX);
  const minCount = countMatch ? parseInt(countMatch[1]) : 1;

  // Check for assessor diversity requirement
  if (ASSESSOR_REGEX.test(text)) {
    return {
      rawText: text,
      type: "assessor",
      minCount,
      matchValue: "unique_assessors",
      label: `${minCount}+ different assessors`,
    };
  }

  // Check for complexity-level requirement
  if (HIGH_COMPLEXITY_REGEX.test(text)) {
    return {
      rawText: text,
      type: "complexity",
      minCount,
      matchValue: "High",
      label: `${minCount}+ high complexity`,
    };
  }
  if (LOW_COMPLEXITY_REGEX.test(text)) {
    return {
      rawText: text,
      type: "complexity",
      minCount,
      matchValue: "Low",
      label: `${minCount}+ low complexity`,
    };
  }

  // Check if it matches a known technique option
  const matchedTechnique = techniqueOptions.find((t) =>
    text.toLowerCase().includes(t.toLowerCase()),
  );
  if (matchedTechnique) {
    return {
      rawText: text,
      type: "technique",
      minCount,
      matchValue: matchedTechnique,
      label: `${minCount}+ ${matchedTechnique.toLowerCase()}`,
    };
  }

  // Check for scenario-specific keywords (e.g., "nephrostomy tube", "JP removal")
  // Strip the "At least N" prefix and use the remaining as the scenario label
  const scenarioText = text
    .replace(COUNT_REGEX, "")
    .replace(/^\s*(of\s+)?/i, "")
    .replace(/uncomplicated\s+/i, "")
    .trim();

  if (scenarioText.length > 2) {
    return {
      rawText: text,
      type: "scenario",
      minCount,
      matchValue: scenarioText.toLowerCase(),
      label: `${minCount}+ ${scenarioText.toLowerCase()}`,
    };
  }

  // Fallback
  return {
    rawText: text,
    type: "general",
    minCount,
    matchValue: text.toLowerCase(),
    label: text,
  };
}

/**
 * Parse all complexityRequirements for an EPA definition.
 */
export function parseSubRequirements(
  epa: EpaDefinition,
): ParsedSubRequirement[] {
  if (!epa.complexityRequirements || epa.complexityRequirements.length === 0) {
    return [];
  }
  return epa.complexityRequirements.map((text) =>
    parseRequirement(text, epa.techniqueOptions || []),
  );
}

// ── Tracker ─────────────────────────────────────────────────────────────────

/**
 * Evaluate observations against an EPA's sub-requirements.
 */
export function trackSubRequirements(
  epa: EpaDefinition,
  observations: ObservationForTracking[],
): EpaSubRequirementSummary {
  const subreqs = parseSubRequirements(epa);
  const relevant = observations.filter(
    (obs) => obs.epaId === epa.id && obs.status !== "RETURNED",
  );

  const progress: SubRequirementProgress[] = subreqs.map((req) => {
    let current = 0;

    switch (req.type) {
      case "complexity":
        current = relevant.filter(
          (obs) =>
            obs.complexity?.toLowerCase() === req.matchValue.toLowerCase(),
        ).length;
        break;

      case "technique":
        current = relevant.filter(
          (obs) =>
            obs.technique?.toLowerCase() === req.matchValue.toLowerCase(),
        ).length;
        break;

      case "assessor": {
        const uniqueAssessors = new Set(
          relevant.map((obs) => obs.assessorName.trim().toLowerCase()),
        );
        current = uniqueAssessors.size;
        break;
      }

      case "scenario": {
        // Match against technique or setting or observation notes
        const matchLower = req.matchValue.toLowerCase();
        current = relevant.filter((obs) => {
          const t = obs.technique?.toLowerCase() || "";
          const s = obs.setting?.toLowerCase() || "";
          return t.includes(matchLower) || s.includes(matchLower);
        }).length;
        break;
      }

      default:
        current = relevant.length;
    }

    return {
      requirement: req,
      current,
      met: current >= req.minCount,
    };
  });

  return {
    epaId: epa.id,
    totalObservations: relevant.length,
    targetCount: epa.targetCaseCount,
    subRequirements: progress,
    allSubReqsMet: progress.every((p) => p.met),
    remaining: progress.filter((p) => !p.met),
  };
}

/**
 * Get a human-readable summary of what's still needed for an EPA.
 */
export function getSubReqGapSummary(
  summary: EpaSubRequirementSummary,
): string[] {
  const gaps: string[] = [];

  // Overall count
  if (summary.totalObservations < summary.targetCount) {
    const needed = summary.targetCount - summary.totalObservations;
    gaps.push(
      `${needed} more observation${needed !== 1 ? "s" : ""} needed (${summary.totalObservations}/${summary.targetCount})`,
    );
  }

  // Sub-requirement gaps
  for (const prog of summary.remaining) {
    const needed = prog.requirement.minCount - prog.current;
    gaps.push(
      `${needed} more ${prog.requirement.label.replace(/^\d+\+\s*/, "")} needed (${prog.current}/${prog.requirement.minCount})`,
    );
  }

  return gaps;
}
