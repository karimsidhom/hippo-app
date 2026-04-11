import type { CaseLog, Milestone, PersonalRecord, MilestoneType, StreakInfo } from "./types";
import { MILESTONE_THRESHOLDS } from "./constants";

// ============================================================
// MILESTONE DEFINITIONS
// ============================================================

export interface MilestoneDefinition {
  key: string;
  type: MilestoneType;
  title: string;
  description: string;
  badgeKey: string;
  emoji: string;
  color: string;
  check: (cases: CaseLog[], procedureName?: string) => boolean;
  getValue: (cases: CaseLog[], procedureName?: string) => number;
}

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  // Total case milestones
  ...MILESTONE_THRESHOLDS.TOTAL_CASES.map((threshold) => ({
    key: `total_${threshold}`,
    type: "TOTAL_CASES" as MilestoneType,
    title: threshold === 1 ? "First Case Logged!" :
           threshold === 5 ? "Getting Started" :
           threshold === 10 ? "Hitting Stride" :
           threshold === 25 ? "Quarter Century" :
           threshold === 50 ? "Half Century" :
           threshold === 100 ? "Centurion" :
           threshold === 200 ? "Elite Surgeon" :
           "Legendary",
    description: `Logged ${threshold} total cases`,
    badgeKey: `total_${threshold}`,
    emoji: threshold >= 100 ? "👑" : threshold >= 50 ? "💎" : threshold >= 25 ? "🏆" : "⭐",
    color: threshold >= 100 ? "#f59e0b" : threshold >= 50 ? "#6366f1" : "#2563eb",
    check: (cases: CaseLog[]) => cases.length >= threshold,
    getValue: (cases: CaseLog[]) => cases.length,
  })),

  // Procedure-specific milestones (RARP example — generated dynamically)
  {
    key: "first_independent",
    type: "AUTONOMY_UNLOCK" as MilestoneType,
    title: "First Independent Case!",
    description: "Completed your first independent procedure",
    badgeKey: "first_independent",
    emoji: "🎖️",
    color: "#10b981",
    check: (cases: CaseLog[]) =>
      cases.some((c) => c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING"),
    getValue: (cases: CaseLog[]) =>
      cases.filter((c) => c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING").length,
  },
  {
    key: "first_teaching",
    type: "AUTONOMY_UNLOCK" as MilestoneType,
    title: "Teaching Role Unlocked!",
    description: "First case in a teaching capacity",
    badgeKey: "first_teaching",
    emoji: "🎓",
    color: "#6366f1",
    check: (cases: CaseLog[]) => cases.some((c) => c.autonomyLevel === "TEACHING"),
    getValue: (cases: CaseLog[]) =>
      cases.filter((c) => c.autonomyLevel === "TEACHING").length,
  },
  {
    key: "independent_10",
    type: "INDEPENDENT_CASES" as MilestoneType,
    title: "10 Independent Cases",
    description: "Reached 10 cases with full independence",
    badgeKey: "independent_10",
    emoji: "🦅",
    color: "#10b981",
    check: (cases: CaseLog[]) =>
      cases.filter((c) => c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING").length >= 10,
    getValue: (cases: CaseLog[]) =>
      cases.filter((c) => c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING").length,
  },
  {
    key: "independent_25",
    type: "INDEPENDENT_CASES" as MilestoneType,
    title: "25 Independent Cases",
    description: "Reached 25 cases with full independence",
    badgeKey: "independent_25",
    emoji: "🦅",
    color: "#10b981",
    check: (cases: CaseLog[]) =>
      cases.filter((c) => c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING").length >= 25,
    getValue: (cases: CaseLog[]) =>
      cases.filter((c) => c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING").length,
  },
  // Streak milestones
  ...MILESTONE_THRESHOLDS.STREAK_DAYS.map((days) => ({
    key: `streak_${days}`,
    type: "STREAK" as MilestoneType,
    title: `${days}-Day Logging Streak`,
    description: `Logged cases for ${days} consecutive days`,
    badgeKey: `streak_${days}`,
    emoji: "🔥",
    color: "#ef4444",
    check: (cases: CaseLog[]) => getStreak(cases).currentStreak >= days,
    getValue: (cases: CaseLog[]) => getStreak(cases).currentStreak,
  })),
];

// ============================================================
// STREAK CALCULATION
// ============================================================

export function getStreak(cases: CaseLog[]): StreakInfo {
  cases = cases ?? [];
  if (cases.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastLogDate: null };
  }

  // Get unique dates (by calendar day)
  const dateStrings = new Set(
    cases.map((c) => new Date(c.caseDate).toISOString().split("T")[0])
  );
  const sortedDates = Array.from(dateStrings).sort();

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Calculate longest streak
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak (must include today or yesterday)
  const lastDate = sortedDates[sortedDates.length - 1];
  if (lastDate !== today && lastDate !== yesterday) {
    currentStreak = 0;
  } else {
    currentStreak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const curr = new Date(sortedDates[i + 1]);
      const prev = new Date(sortedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastLogDate: cases.length > 0 ? new Date(sortedDates[sortedDates.length - 1]) : null,
  };
}

// ============================================================
// MILESTONE CHECKING
// ============================================================

/**
 * Given the user's new case and all cases (including the new one),
 * returns any newly unlocked milestones
 */
export function checkMilestones(
  userId: string,
  newCase: CaseLog,
  allCases: CaseLog[],
  existingMilestones: Milestone[]
): Milestone[] {
  allCases = allCases ?? [];
  existingMilestones = existingMilestones ?? [];
  const existingKeys = new Set(existingMilestones.map((m) => m.badgeKey));
  const unlockedMilestones: Milestone[] = [];

  for (const def of MILESTONE_DEFINITIONS) {
    if (existingKeys.has(def.badgeKey)) continue;

    if (def.check(allCases)) {
      unlockedMilestones.push({
        id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: def.type,
        procedureName: null,
        value: def.getValue(allCases),
        achievedAt: new Date(),
        badgeKey: def.badgeKey,
      });
    }
  }

  // Check procedure-specific milestones
  const procedureCases = allCases.filter((c) => c.procedureName === newCase.procedureName);
  for (const threshold of MILESTONE_THRESHOLDS.PROCEDURE_COUNT) {
    const key = `${newCase.procedureName.toLowerCase().replace(/\s+/g, "_")}_${threshold}`;
    if (existingKeys.has(key)) continue;
    if (procedureCases.length >= threshold) {
      unlockedMilestones.push({
        id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: "PROCEDURE_COUNT",
        procedureName: newCase.procedureName,
        value: procedureCases.length,
        achievedAt: new Date(),
        badgeKey: key,
      });
    }
  }

  // Check autonomy unlock for specific procedure
  if (
    newCase.autonomyLevel === "INDEPENDENT" ||
    newCase.autonomyLevel === "TEACHING"
  ) {
    const procKey = `${newCase.procedureName.toLowerCase().replace(/\s+/g, "_")}_independent`;
    if (!existingKeys.has(procKey)) {
      const prevCases = allCases.filter(
        (c) =>
          c.procedureName === newCase.procedureName &&
          (c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING") &&
          c.id !== newCase.id
      );
      if (prevCases.length === 0) {
        unlockedMilestones.push({
          id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          type: "AUTONOMY_UNLOCK",
          procedureName: newCase.procedureName,
          value: 1,
          achievedAt: new Date(),
          badgeKey: procKey,
        });
      }
    }
  }

  return unlockedMilestones;
}

// ============================================================
// PERSONAL RECORD CHECKING
// ============================================================

/**
 * Checks if the new case sets any personal records
 */
export function checkPersonalRecords(
  userId: string,
  newCase: CaseLog,
  allCases: CaseLog[],
  existingPRs: PersonalRecord[]
): PersonalRecord[] {
  allCases = allCases ?? [];
  existingPRs = existingPRs ?? [];
  const newPRs: PersonalRecord[] = [];

  if (!newCase.operativeDurationMinutes || newCase.operativeDurationMinutes <= 0) {
    return newPRs;
  }

  // Filter to same procedure, with a valid duration
  const sameProcedureCases = allCases.filter(
    (c) =>
      c.procedureName === newCase.procedureName &&
      c.operativeDurationMinutes &&
      c.operativeDurationMinutes > 0 &&
      c.id !== newCase.id
  );

  if (sameProcedureCases.length === 0) {
    // First case for this procedure
    newPRs.push({
      id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      procedureName: newCase.procedureName,
      recordType: "FIRST_CASE",
      value: newCase.operativeDurationMinutes,
      previousValue: null,
      achievedAt: new Date(),
    });
    return newPRs;
  }

  // Check fastest time PR
  const minDuration = Math.min(...sameProcedureCases.map((c) => c.operativeDurationMinutes!));
  const existingFastestPR = existingPRs.find(
    (pr) => pr.procedureName === newCase.procedureName && pr.recordType === "FASTEST_TIME"
  );

  if (newCase.operativeDurationMinutes < minDuration) {
    newPRs.push({
      id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      procedureName: newCase.procedureName,
      recordType: "FASTEST_TIME",
      value: newCase.operativeDurationMinutes,
      previousValue: existingFastestPR?.value ?? minDuration,
      achievedAt: new Date(),
    });
  }

  return newPRs;
}

// ============================================================
// MILESTONE PROGRESS
// ============================================================

export interface MilestoneProgress {
  key: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  current: number;
  target: number;
  percentage: number;
  achieved: boolean;
}

/**
 * Returns progress toward each milestone
 */
export function getMilestoneProgress(
  cases: CaseLog[],
  existingMilestones: Milestone[]
): MilestoneProgress[] {
  cases = cases ?? [];
  existingMilestones = existingMilestones ?? [];
  const achievedKeys = new Set(existingMilestones.map((m) => m.badgeKey));

  // Build progress for total case milestones
  const totalCases = cases.length;
  const thresholds = MILESTONE_THRESHOLDS.TOTAL_CASES;

  // Find next unachieved threshold
  const nextThreshold = thresholds.find((t) => totalCases < t);
  const prevThreshold = [...thresholds].reverse().find((t) => totalCases >= t) || 0;

  const progress: MilestoneProgress[] = [];

  // Next total cases milestone
  if (nextThreshold) {
    progress.push({
      key: `total_${nextThreshold}`,
      title: `${nextThreshold} Total Cases`,
      description: `Log ${nextThreshold - totalCases} more cases to reach this milestone`,
      emoji: "📊",
      color: "#2563eb",
      current: totalCases,
      target: nextThreshold,
      percentage: Math.round((totalCases / nextThreshold) * 100),
      achieved: false,
    });
  }

  // Independence progress
  const independentCases = cases.filter(
    (c) => c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING"
  ).length;
  const nextIndepThreshold = MILESTONE_THRESHOLDS.INDEPENDENT_CASES.find(
    (t) => independentCases < t
  );
  if (nextIndepThreshold) {
    progress.push({
      key: `independent_${nextIndepThreshold}`,
      title: `${nextIndepThreshold} Independent Cases`,
      description: `${nextIndepThreshold - independentCases} more independent cases needed`,
      emoji: "🦅",
      color: "#10b981",
      current: independentCases,
      target: nextIndepThreshold,
      percentage: Math.round((independentCases / nextIndepThreshold) * 100),
      achieved: false,
    });
  }

  // Streak progress
  const streak = getStreak(cases);
  const nextStreakThreshold = MILESTONE_THRESHOLDS.STREAK_DAYS.find(
    (t) => streak.currentStreak < t
  );
  if (nextStreakThreshold) {
    progress.push({
      key: `streak_${nextStreakThreshold}`,
      title: `${nextStreakThreshold}-Day Streak`,
      description: `${nextStreakThreshold - streak.currentStreak} more days to reach this streak`,
      emoji: "🔥",
      color: "#ef4444",
      current: streak.currentStreak,
      target: nextStreakThreshold,
      percentage: Math.round((streak.currentStreak / nextStreakThreshold) * 100),
      achieved: false,
    });
  }

  // Top procedure count progress
  const procedureCounts: Record<string, number> = {};
  cases.forEach((c) => {
    procedureCounts[c.procedureName] = (procedureCounts[c.procedureName] || 0) + 1;
  });

  const topProcedure = Object.entries(procedureCounts).sort(([, a], [, b]) => b - a)[0];
  if (topProcedure) {
    const [procName, count] = topProcedure;
    const nextProcThreshold = MILESTONE_THRESHOLDS.PROCEDURE_COUNT.find((t) => count < t);
    if (nextProcThreshold) {
      progress.push({
        key: `proc_${procName.toLowerCase().replace(/\s+/g, "_")}_${nextProcThreshold}`,
        title: `${nextProcThreshold}× ${procName.split(" ").slice(0, 3).join(" ")}`,
        description: `${nextProcThreshold - count} more cases to reach this milestone`,
        emoji: "🔬",
        color: "#6366f1",
        current: count,
        target: nextProcThreshold,
        percentage: Math.round((count / nextProcThreshold) * 100),
        achieved: false,
      });
    }
  }

  return progress.slice(0, 4); // Return top 4 in-progress milestones
}

/**
 * Formats a milestone for display
 */
export function formatMilestone(milestone: Milestone): {
  title: string;
  description: string;
  emoji: string;
  color: string;
} {
  const def = MILESTONE_DEFINITIONS.find((d) => d.badgeKey === milestone.badgeKey);
  if (def) {
    return {
      title: def.title,
      description: def.description,
      emoji: def.emoji,
      color: def.color,
    };
  }

  // Generate from badgeKey if definition not found
  if (milestone.type === "PROCEDURE_COUNT" && milestone.procedureName) {
    return {
      title: `${milestone.value}× ${milestone.procedureName.split(" ").slice(0, 3).join(" ")}`,
      description: `Logged ${milestone.value} ${milestone.procedureName} cases`,
      emoji: "🔬",
      color: "#6366f1",
    };
  }

  if (milestone.type === "AUTONOMY_UNLOCK" && milestone.procedureName) {
    return {
      title: `First Independent ${milestone.procedureName.split(" ").slice(-1)[0]}`,
      description: `Achieved independence in ${milestone.procedureName}`,
      emoji: "🎖️",
      color: "#10b981",
    };
  }

  return {
    title: `Milestone: ${milestone.badgeKey}`,
    description: `Value: ${milestone.value}`,
    emoji: "⭐",
    color: "#6366f1",
  };
}
