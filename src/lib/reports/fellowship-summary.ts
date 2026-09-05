/**
 * Fellowship Summary: the table every fellowship, match and job application
 * asks for, built once from the case log so the resident never retypes it.
 *
 *   category  x  role (PRIMARY / ASSIST / OBSERVER / TEACHING ...)  x  year
 *
 * Pure: takes PHIA-safe rows (already passed through exportSafeTransform)
 * and returns plain arrays the Excel route writes as a sheet. Also produces
 * the autonomy split that SSMR / SMSNA / endourology forms ask for.
 */

export interface SummaryCase {
  caseDate?: Date | string | null;
  procedureCategory?: string | null;
  procedureName?: string | null;
  role?: string | null;
  autonomyLevel?: string | null;
}

export interface FellowshipSummary {
  years: number[];
  roles: string[];
  /** One row per category: { category, total, byRole: {role: n}, byYear: {year: n} } */
  rows: {
    category: string;
    total: number;
    byRole: Record<string, number>;
    byYear: Record<number, number>;
  }[];
  totals: { total: number; byRole: Record<string, number>; byYear: Record<number, number> };
  autonomy: { level: string; count: number; percent: number }[];
  topProcedures: { procedureName: string; count: number }[];
}

const UNCATEGORIZED = 'Uncategorized';

export function buildFellowshipSummary(cases: SummaryCase[], topN = 15): FellowshipSummary {
  const yearSet = new Set<number>();
  const roleSet = new Set<string>();
  const byCat = new Map<string, { total: number; byRole: Record<string, number>; byYear: Record<number, number> }>();
  const totals = { total: 0, byRole: {} as Record<string, number>, byYear: {} as Record<number, number> };
  const autonomy = new Map<string, number>();
  const procs = new Map<string, number>();

  for (const c of cases) {
    const d = c.caseDate ? new Date(c.caseDate) : null;
    const year = d && !Number.isNaN(d.getTime()) ? d.getFullYear() : 0;
    const role = (c.role ?? 'Unknown').toString().trim() || 'Unknown';
    const cat = (c.procedureCategory ?? '').toString().trim() || UNCATEGORIZED;
    const auto = (c.autonomyLevel ?? 'Unknown').toString().trim() || 'Unknown';
    const proc = (c.procedureName ?? '').toString().trim();

    if (year) yearSet.add(year);
    roleSet.add(role);

    const row = byCat.get(cat) ?? { total: 0, byRole: {}, byYear: {} };
    row.total += 1;
    row.byRole[role] = (row.byRole[role] ?? 0) + 1;
    if (year) row.byYear[year] = (row.byYear[year] ?? 0) + 1;
    byCat.set(cat, row);

    totals.total += 1;
    totals.byRole[role] = (totals.byRole[role] ?? 0) + 1;
    if (year) totals.byYear[year] = (totals.byYear[year] ?? 0) + 1;
    autonomy.set(auto, (autonomy.get(auto) ?? 0) + 1);
    if (proc) procs.set(proc, (procs.get(proc) ?? 0) + 1);
  }

  const rows = [...byCat.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));

  const n = Math.max(1, totals.total);
  return {
    years: [...yearSet].sort(),
    roles: [...roleSet].sort(),
    rows,
    totals,
    autonomy: [...autonomy.entries()]
      .map(([level, count]) => ({ level, count, percent: Math.round((count / n) * 1000) / 10 }))
      .sort((a, b) => b.count - a.count),
    topProcedures: [...procs.entries()]
      .map(([procedureName, count]) => ({ procedureName, count }))
      .sort((a, b) => b.count - a.count || a.procedureName.localeCompare(b.procedureName))
      .slice(0, topN),
  };
}
