import type {
  CaseLog,
  CaseStats,
  OperativeTimeStats,
  LearningCurvePoint,
  MonthlyVolume,
  WeeklyHeatmapDay,
  RoleProgressionPoint,
  BenchmarkData,
} from "./types";

// ============================================================
// UTILITY HELPERS
// ============================================================

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// ============================================================
// CORE STATS
// ============================================================

export function getCaseStats(cases: CaseLog[]): CaseStats {
  cases = cases ?? [];
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfWeekDate = startOfWeek(now);

  const thisMonth = cases.filter((c) => new Date(c.caseDate) >= startOfMonth).length;
  const thisYear = cases.filter((c) => new Date(c.caseDate) >= startOfYear).length;
  const thisWeek = cases.filter((c) => new Date(c.caseDate) >= startOfWeekDate).length;

  const bySpecialty: Record<string, number> = {};
  const byProcedure: Record<string, number> = {};
  const byRole: Record<string, number> = {};
  const byAutonomy: Record<string, number> = {};
  const byApproach: Record<string, number> = {};
  const byOutcome: Record<string, number> = {};

  let totalDifficulty = 0;
  let firstSurgeonCount = 0;
  let independentCount = 0;

  for (const c of cases) {
    // By specialty
    const specName = c.specialtyName || "Unknown";
    bySpecialty[specName] = (bySpecialty[specName] || 0) + 1;

    // By procedure
    byProcedure[c.procedureName] = (byProcedure[c.procedureName] || 0) + 1;

    // By role
    byRole[c.role] = (byRole[c.role] || 0) + 1;

    // By autonomy
    byAutonomy[c.autonomyLevel] = (byAutonomy[c.autonomyLevel] || 0) + 1;

    // By approach
    byApproach[c.surgicalApproach] = (byApproach[c.surgicalApproach] || 0) + 1;

    // By outcome
    byOutcome[c.outcomeCategory] = (byOutcome[c.outcomeCategory] || 0) + 1;

    // Counts
    totalDifficulty += c.difficultyScore;
    if (c.role === "First Surgeon") firstSurgeonCount++;
    if (c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING") {
      independentCount++;
    }
  }

  return {
    total: cases.length,
    thisMonth,
    thisYear,
    thisWeek,
    bySpecialty,
    byProcedure,
    byRole,
    byAutonomy,
    byApproach,
    byOutcome,
    firstSurgeonRate: cases.length > 0 ? (firstSurgeonCount / cases.length) * 100 : 0,
    independentRate: cases.length > 0 ? (independentCount / cases.length) * 100 : 0,
    avgDifficultyScore: cases.length > 0 ? totalDifficulty / cases.length : 0,
  };
}

// ============================================================
// OPERATIVE TIME STATS
// ============================================================

export function getOperativeTimeStats(cases: CaseLog[]): OperativeTimeStats {
  cases = cases ?? [];
  const allDurations = cases
    .filter((c) => c.operativeDurationMinutes && c.operativeDurationMinutes > 0)
    .map((c) => c.operativeDurationMinutes!);

  const byProcedure: Record<string, { median: number; mean: number; count: number; trend: number[] }> = {};

  // Group by procedure
  const procedureMap: Record<string, number[]> = {};
  for (const c of cases) {
    if (c.operativeDurationMinutes && c.operativeDurationMinutes > 0) {
      if (!procedureMap[c.procedureName]) {
        procedureMap[c.procedureName] = [];
      }
      procedureMap[c.procedureName].push(c.operativeDurationMinutes);
    }
  }

  for (const [procName, durations] of Object.entries(procedureMap)) {
    // Calculate trend (last 5 cases vs first 5 cases)
    const trend = durations.slice(-5);
    byProcedure[procName] = {
      median: median(durations),
      mean: mean(durations),
      count: durations.length,
      trend,
    };
  }

  return {
    median: median(allDurations),
    mean: mean(allDurations),
    min: allDurations.length > 0 ? Math.min(...allDurations) : 0,
    max: allDurations.length > 0 ? Math.max(...allDurations) : 0,
    byProcedure,
  };
}

// ============================================================
// LEARNING CURVE DATA
// ============================================================

export function getLearningCurveData(
  cases: CaseLog[],
  procedureName: string
): LearningCurvePoint[] {
  cases = cases ?? [];
  const procedureCases = cases
    .filter((c) => c.procedureName === procedureName && c.operativeDurationMinutes && c.operativeDurationMinutes > 0)
    .sort((a, b) => new Date(a.caseDate).getTime() - new Date(b.caseDate).getTime());

  return procedureCases.map((c, i) => ({
    caseNumber: i + 1,
    duration: c.operativeDurationMinutes!,
    date: new Date(c.caseDate),
    autonomyLevel: c.autonomyLevel,
    difficultyScore: c.difficultyScore,
  }));
}

/**
 * Calculate a logarithmic trend line for learning curve visualization
 * y = a * ln(x) + b
 */
export function getLearningCurveTrendLine(
  points: LearningCurvePoint[]
): { x: number; y: number }[] {
  if (points.length < 3) return points.map((p) => ({ x: p.caseNumber, y: p.duration }));

  // Logarithmic regression: y = a * ln(x) + b
  const n = points.length;
  const lnX = points.map((p) => Math.log(p.caseNumber));
  const y = points.map((p) => p.duration);

  const sumLnX = lnX.reduce((s, v) => s + v, 0);
  const sumY = y.reduce((s, v) => s + v, 0);
  const sumLnXY = lnX.reduce((s, v, i) => s + v * y[i], 0);
  const sumLnX2 = lnX.reduce((s, v) => s + v * v, 0);

  const a = (n * sumLnXY - sumLnX * sumY) / (n * sumLnX2 - sumLnX * sumLnX);
  const b = (sumY - a * sumLnX) / n;

  // Generate smooth trend line
  const maxX = points[points.length - 1].caseNumber;
  const trendPoints: { x: number; y: number }[] = [];
  for (let x = 1; x <= maxX; x++) {
    trendPoints.push({ x, y: Math.max(0, a * Math.log(x) + b) });
  }

  return trendPoints;
}

// ============================================================
// MONTHLY VOLUME
// ============================================================

export function getMonthlyVolume(cases: CaseLog[]): MonthlyVolume[] {
  cases = cases ?? [];
  const monthMap: Record<string, number> = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (const c of cases) {
    const d = new Date(c.caseDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = (monthMap[key] || 0) + 1;
  }

  // Build last 12 months
  const result: MonthlyVolume[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      count: monthMap[key] || 0,
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  return result;
}

// ============================================================
// WEEKLY HEATMAP
// ============================================================

export function getWeeklyHeatmapData(cases: CaseLog[]): WeeklyHeatmapDay[] {
  const caseDates: Record<string, number> = {};
  for (const c of cases) {
    const d = new Date(c.caseDate);
    const key = d.toISOString().split("T")[0];
    caseDates[key] = (caseDates[key] || 0) + 1;
  }

  // Build last 52 weeks
  const result: WeeklyHeatmapDay[] = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 364); // 52 weeks back
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    const dateString = d.toISOString().split("T")[0];
    result.push({
      date: new Date(d),
      count: caseDates[dateString] || 0,
      dateString,
    });
  }

  return result;
}

// ============================================================
// ROLE PROGRESSION
// ============================================================

export function getRoleProgression(cases: CaseLog[]): RoleProgressionPoint[] {
  cases = cases ?? [];
  const monthMap: Record<
    string,
    { OBSERVER: number; ASSISTANT: number; SUPERVISOR_PRESENT: number; INDEPENDENT: number; TEACHING: number }
  > = {};

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (const c of cases) {
    const d = new Date(c.caseDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap[key]) {
      monthMap[key] = { OBSERVER: 0, ASSISTANT: 0, SUPERVISOR_PRESENT: 0, INDEPENDENT: 0, TEACHING: 0 };
    }
    monthMap[key][c.autonomyLevel] = (monthMap[key][c.autonomyLevel] || 0) + 1;
  }

  // Build last 12 months
  const result: RoleProgressionPoint[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const data = monthMap[key] || { OBSERVER: 0, ASSISTANT: 0, SUPERVISOR_PRESENT: 0, INDEPENDENT: 0, TEACHING: 0 };
    result.push({
      month: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
      ...data,
    });
  }

  return result;
}

// ============================================================
// APPROACH DISTRIBUTION
// ============================================================

export function getApproachDistribution(cases: CaseLog[]): { approach: string; count: number; percentage: number }[] {
  cases = cases ?? [];
  const approachMap: Record<string, number> = {};
  for (const c of cases) {
    approachMap[c.surgicalApproach] = (approachMap[c.surgicalApproach] || 0) + 1;
  }

  const total = cases.length;
  return Object.entries(approachMap)
    .sort(([, a], [, b]) => b - a)
    .map(([approach, count]) => ({
      approach,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

// ============================================================
// AUTONOMY PROGRESSION
// ============================================================

export function getAutonomyProgression(cases: CaseLog[]): {
  month: string;
  avgAutonomyScore: number;
  independentRate: number;
}[] {
  const autonomyScoreMap: Record<string, { totalScore: number; total: number; independent: number }> = {
    OBSERVER: { totalScore: 1, total: 0, independent: 0 },
    ASSISTANT: { totalScore: 2, total: 0, independent: 0 },
    SUPERVISOR_PRESENT: { totalScore: 3, total: 0, independent: 0 },
    INDEPENDENT: { totalScore: 4, total: 0, independent: 0 },
    TEACHING: { totalScore: 5, total: 0, independent: 0 },
  };

  const monthMap: Record<string, { totalScore: number; count: number; independentCount: number }> = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (const c of cases) {
    const d = new Date(c.caseDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap[key]) {
      monthMap[key] = { totalScore: 0, count: 0, independentCount: 0 };
    }
    const score = autonomyScoreMap[c.autonomyLevel]?.totalScore || 1;
    monthMap[key].totalScore += score;
    monthMap[key].count++;
    if (c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING") {
      monthMap[key].independentCount++;
    }
  }

  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const data = monthMap[key] || { totalScore: 0, count: 0, independentCount: 0 };
    return {
      month: monthNames[d.getMonth()],
      avgAutonomyScore: data.count > 0 ? data.totalScore / data.count : 0,
      independentRate: data.count > 0 ? (data.independentCount / data.count) * 100 : 0,
    };
  });
}

// ============================================================
// OPERATIVE TIME TREND
// ============================================================

export function getOperativeTimeTrend(
  cases: CaseLog[],
  procedureName?: string
): { month: string; avgDuration: number; caseCount: number }[] {
  const filteredCases = procedureName
    ? cases.filter((c) => c.procedureName === procedureName)
    : cases;

  const monthMap: Record<string, { totalDuration: number; count: number }> = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (const c of filteredCases) {
    if (!c.operativeDurationMinutes) continue;
    const d = new Date(c.caseDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap[key]) {
      monthMap[key] = { totalDuration: 0, count: 0 };
    }
    monthMap[key].totalDuration += c.operativeDurationMinutes;
    monthMap[key].count++;
  }

  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const data = monthMap[key] || { totalDuration: 0, count: 0 };
    return {
      month: monthNames[d.getMonth()],
      avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
      caseCount: data.count,
    };
  });
}

// ============================================================
// WEAK EXPOSURE AREAS
// ============================================================

export interface WeakExposureArea {
  category: string;
  specialtySlug: string;
  count: number;
  benchmark: number;
  gap: number;
  severity: "critical" | "moderate" | "minor";
}

export function getWeakExposureAreas(
  cases: CaseLog[],
  expectedBenchmarks: Record<string, number>
): WeakExposureArea[] {
  const categoryCounts: Record<string, number> = {};
  for (const c of cases) {
    const cat = c.procedureCategory || "Unknown";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const areas: WeakExposureArea[] = [];
  for (const [category, expected] of Object.entries(expectedBenchmarks)) {
    const actual = categoryCounts[category] || 0;
    const gap = expected - actual;
    if (gap > 0) {
      areas.push({
        category,
        specialtySlug: "urology",
        count: actual,
        benchmark: expected,
        gap,
        severity: gap >= expected * 0.7 ? "critical" : gap >= expected * 0.4 ? "moderate" : "minor",
      });
    }
  }

  return areas.sort((a, b) => b.gap - a.gap);
}

// ============================================================
// SPECIALTY BREAKDOWN
// ============================================================

export function getSpecialtyBreakdown(cases: CaseLog[]): {
  specialty: string;
  count: number;
  percentage: number;
  avgDuration: number;
  color: string;
}[] {
  const specialtyColors: Record<string, string> = {
    Urology: "#2563eb",
    "General Surgery": "#10b981",
    "Orthopedic Surgery": "#f59e0b",
    "Cardiothoracic Surgery": "#ef4444",
    Neurosurgery: "#8b5cf6",
  };

  const specMap: Record<string, { count: number; totalDuration: number }> = {};
  for (const c of cases) {
    const spec = c.specialtyName || "Unknown";
    if (!specMap[spec]) specMap[spec] = { count: 0, totalDuration: 0 };
    specMap[spec].count++;
    specMap[spec].totalDuration += c.operativeDurationMinutes || 0;
  }

  const total = cases.length;
  return Object.entries(specMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([specialty, data]) => ({
      specialty,
      count: data.count,
      percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
      avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
      color: specialtyColors[specialty] || "#6366f1",
    }));
}

// ============================================================
// PERCENTILE CALCULATION (for benchmarks)
// ============================================================

export function getUserPercentile(userValue: number, benchmarkValues: number[]): number {
  if (benchmarkValues.length === 0) return 50;
  const below = benchmarkValues.filter((v) => v >= userValue).length; // faster is better
  return Math.round((below / benchmarkValues.length) * 100);
}

export function getPercentileLabel(percentile: number): string {
  if (percentile >= 90) return "Top 10%";
  if (percentile >= 75) return "Top 25%";
  if (percentile >= 50) return "Above Median";
  if (percentile >= 25) return "Below Median";
  return "Bottom 25%";
}
