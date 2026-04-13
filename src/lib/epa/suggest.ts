// ---------------------------------------------------------------------------
// EPA Suggestion Engine
// Given a case log, ranks and suggests the most relevant EPAs to tag
// ---------------------------------------------------------------------------

import type { CaseLog } from "@/lib/types";
import type { EpaDefinition, SpecialtyEpaData } from "./data";

// ── Output Interface ───────────────────────────────────────────────────────

export interface EpaSuggestion {
  epaId: string;
  epaTitle: string;
  confidence: "high" | "medium" | "low";
  score: number;
  matchReasons: string[];
  currentProgress: { observations: number; targetCount: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Tokenize a string into lowercase words by splitting on spaces, hyphens,
 * slashes, parentheses, and other common delimiters.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-\/\(\),;:]+/)
    .filter((w) => w.length > 0);
}

/**
 * Count the number of overlapping tokens between two token sets.
 */
function tokenOverlap(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter((token) => setB.has(token)).length;
}

// ── Approach keywords mapped from SurgicalApproach enum values ─────────

const APPROACH_KEYWORDS: Record<string, string[]> = {
  LAPAROSCOPIC: ["laparoscopic", "laparoscopy"],
  ROBOTIC: ["robotic", "robot"],
  ENDOSCOPIC: ["endoscopic", "endoscopy"],
  OPEN: ["open"],
  HYBRID: ["hybrid"],
  PERCUTANEOUS: ["percutaneous"],
};

// ── Scoring Logic ──────────────────────────────────────────────────────────

/**
 * Score how well a case matches an EPA definition.
 * Returns a 0-100 score with human-readable match reasons.
 */
function scoreMatch(
  caseLog: CaseLog,
  epa: EpaDefinition,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const caseName = caseLog.procedureName.toLowerCase();
  const caseNameTokens = tokenize(caseLog.procedureName);

  // ── 1. Procedure name match (0-50 points) ──────────────────────────────

  let bestProcScore = 0;
  let bestProcReason = "";

  for (const proc of epa.relatedProcedures) {
    const procLower = proc.toLowerCase();

    // Exact match (case-insensitive)
    if (caseName === procLower) {
      if (bestProcScore < 50) {
        bestProcScore = 50;
        bestProcReason = `Exact procedure match: "${proc}"`;
      }
      continue;
    }

    // Substring match: case name contains the procedure or vice versa
    if (caseName.includes(procLower) || procLower.includes(caseName)) {
      if (bestProcScore < 35) {
        bestProcScore = 35;
        bestProcReason = `Substring procedure match: "${proc}"`;
      }
      continue;
    }

    // Partial word overlap
    const procTokens = tokenize(proc);
    const overlap = tokenOverlap(caseNameTokens, procTokens);
    if (overlap > 0 && bestProcScore < 20) {
      bestProcScore = 20;
      bestProcReason = `Partial word overlap with: "${proc}" (${overlap} word${overlap > 1 ? "s" : ""})`;
    }
  }

  if (bestProcScore > 0) {
    score += bestProcScore;
    reasons.push(bestProcReason);
  }

  // ── 2. Category alignment (0-15 points) ────────────────────────────────

  const epaTitleTokens = tokenize(epa.title);
  const allProcTokens = epa.relatedProcedures.flatMap(tokenize);
  const combinedEpaTokens = [...new Set([...epaTitleTokens, ...allProcTokens])];

  let categoryScore = 0;

  if (caseLog.procedureCategory) {
    const catTokens = tokenize(caseLog.procedureCategory);
    const catOverlap = tokenOverlap(catTokens, combinedEpaTokens);
    if (catOverlap > 0) {
      categoryScore = Math.min(15, catOverlap * 5);
    }
  }

  if (caseLog.diagnosisCategory) {
    const diagTokens = tokenize(caseLog.diagnosisCategory);
    const diagOverlap = tokenOverlap(diagTokens, combinedEpaTokens);
    if (diagOverlap > 0) {
      categoryScore = Math.max(categoryScore, Math.min(15, diagOverlap * 5));
    }
  }

  if (categoryScore > 0) {
    score += categoryScore;
    reasons.push(
      `Category alignment (${categoryScore} pts): procedure/diagnosis category overlaps with EPA scope`,
    );
  }

  // ── 3. Autonomy-stage alignment (0-10 points) ──────────────────────────

  const epaIdUpper = epa.id.toUpperCase();
  const autonomy = caseLog.autonomyLevel;

  const isFoundations = epaIdUpper.startsWith("F");
  const isCoreOrTTP =
    epaIdUpper.startsWith("C") ||
    epaIdUpper.startsWith("TTP") ||
    epaIdUpper.startsWith("TD");

  const isEarlyAutonomy =
    autonomy === "OBSERVER" || autonomy === "ASSISTANT";
  const isAdvancedAutonomy =
    autonomy === "INDEPENDENT" || autonomy === "TEACHING";

  if ((isEarlyAutonomy && isFoundations) || (isAdvancedAutonomy && isCoreOrTTP)) {
    score += 10;
    reasons.push(
      `Autonomy-stage alignment: ${autonomy} matches ${isFoundations ? "Foundations" : "Core/TTP"} EPA`,
    );
  }

  // ── 4. Approach relevance (0-10 points) ────────────────────────────────

  const approachKeywords = APPROACH_KEYWORDS[caseLog.surgicalApproach] ?? [];
  if (approachKeywords.length > 0) {
    const epaTitleLower = epa.title.toLowerCase();
    const allProcText = epa.relatedProcedures
      .map((p) => p.toLowerCase())
      .join(" ");

    const approachMatch = approachKeywords.some(
      (kw) => epaTitleLower.includes(kw) || allProcText.includes(kw),
    );

    if (approachMatch) {
      score += 10;
      reasons.push(
        `Approach relevance: EPA references ${caseLog.surgicalApproach.toLowerCase()} approach`,
      );
    }
  }

  return { score, reasons };
}

// ── Main Suggestion Function ───────────────────────────────────────────────

/**
 * Given a case log and specialty EPA data, return ranked EPA suggestions.
 * Also takes existing observation counts to prioritize EPAs with gaps.
 */
export function suggestEpasForCase(
  caseLog: CaseLog,
  epaData: SpecialtyEpaData,
  existingObservationCounts?: Record<string, number>,
): EpaSuggestion[] {
  const scored: Array<{
    epa: EpaDefinition;
    score: number;
    reasons: string[];
  }> = [];

  for (const epa of epaData.epas) {
    const { score, reasons } = scoreMatch(caseLog, epa);

    // ── 5. Gap priority (0-15 points) ──────────────────────────────────
    let gapPoints = 0;
    const observations = existingObservationCounts?.[epa.id] ?? 0;
    const target = epa.targetCaseCount;

    if (target > 0) {
      const ratio = observations / target;
      gapPoints = Math.max(0, Math.min(15, Math.round(15 * (1 - ratio))));
    }

    const totalScore = score + gapPoints;
    const allReasons = [...reasons];
    if (gapPoints > 0) {
      allReasons.push(
        `Gap priority (+${gapPoints} pts): ${observations}/${target} observations completed`,
      );
    }

    scored.push({ epa, score: totalScore, reasons: allReasons });
  }

  // Filter out EPAs with no meaningful match
  const meaningful = scored.filter((s) => s.score >= 15);

  // Sort by score descending
  meaningful.sort((a, b) => b.score - a.score);

  // Take top 5 and map to output interface
  return meaningful.slice(0, 5).map((s) => {
    const observations = existingObservationCounts?.[s.epa.id] ?? 0;
    const confidence: EpaSuggestion["confidence"] =
      s.score >= 60 ? "high" : s.score >= 35 ? "medium" : "low";

    return {
      epaId: s.epa.id,
      epaTitle: s.epa.title,
      confidence,
      score: s.score,
      matchReasons: s.reasons,
      currentProgress: {
        observations,
        targetCount: s.epa.targetCaseCount,
      },
    };
  });
}
