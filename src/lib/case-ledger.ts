/** The ledger only needs these fields; callers retain their complete case type. */
export interface LedgerCase {
  procedureName: string;
  surgicalApproach: string;
  role: string;
  caseDate: Date | string;
}

export interface LedgerFilters {
  search?: string;
  approach?: string;
  role?: string;
  year?: string;
}

const DEFAULT_ROLES = [
  "Observer",
  "Assistant",
  "First Assistant",
  "Primary Surgeon",
  "Console Surgeon",
  "First Surgeon",
  "First Assist",
  "Second Assist",
  "Teaching Assistant",
];

function caseDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

function normalizedApproach(value: string): string {
  return value.trim().toUpperCase();
}

/** Filter procedure names only, then return a fresh array ordered newest first. */
export function filterLedgerCases<T extends LedgerCase>(
  cases: readonly T[],
  filters: LedgerFilters = {},
): T[] {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const approach = normalizedApproach(filters.approach ?? "All");
  const role = filters.role ?? "All";
  const year = filters.year ?? "All";

  return cases.filter((entry) => {
    if (search && !entry.procedureName.toLowerCase().includes(search)) return false;
    if (approach !== "ALL" && normalizedApproach(entry.surgicalApproach) !== approach) return false;
    // Roles are persisted free-text labels. Preserve exact matching and do not
    // merge distinct labels such as First Surgeon and Primary Surgeon.
    if (role !== "All" && entry.role !== role) return false;
    if (year !== "All" && String(caseDate(entry.caseDate).getFullYear()) !== year) return false;
    return true;
  }).sort((a, b) => {
    const aTime = caseDate(a.caseDate).getTime();
    const bTime = caseDate(b.caseDate).getTime();
    // Invalid imported dates should not disrupt the order of valid cases.
    if (!Number.isFinite(aTime)) return Number.isFinite(bTime) ? 1 : 0;
    if (!Number.isFinite(bTime)) return -1;
    return bTime - aTime;
  });
}

/** Keep legacy choices and include every nonempty stored label verbatim. */
export function getLedgerRoleOptions(cases: readonly Pick<LedgerCase, "role">[]): string[] {
  return [
    "All",
    ...new Set([
      ...DEFAULT_ROLES,
      ...cases.map((entry) => entry.role).filter((role) => role.trim().length > 0 && role !== "All"),
    ]),
  ];
}

export function getLedgerYearOptions(cases: readonly Pick<LedgerCase, "caseDate">[]): string[] {
  const years = cases.map((entry) => caseDate(entry.caseDate).getFullYear()).filter(Number.isFinite);
  return ["All", ...[...new Set(years)].sort((a, b) => b - a).map(String)];
}

interface LedgerSummaryCase {
  operativeDurationMinutes?: number | null;
  autonomyLevel: string;
}

export interface LedgerSummary {
  count: number;
  minutes: number;
  hours: number;
  independentCount: number;
  independentRate: number;
}

/** Independent includes teaching cases; role labels do not determine autonomy. */
export function summarizeLedgerCases<T extends LedgerSummaryCase>(cases: readonly T[]): LedgerSummary {
  let minutes = 0;
  let independentCount = 0;
  for (const entry of cases) {
    const duration = entry.operativeDurationMinutes;
    if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) minutes += duration;
    if (entry.autonomyLevel === "INDEPENDENT" || entry.autonomyLevel === "TEACHING") independentCount++;
  }
  return {
    count: cases.length,
    minutes,
    hours: minutes / 60,
    independentCount,
    independentRate: cases.length ? Math.round((independentCount / cases.length) * 100) : 0,
  };
}
