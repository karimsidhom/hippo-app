/**
 * Excel export using ExcelJS
 * All exports use exportSafeTransform — no PHI identifiers
 */

import type { CaseLog, Milestone, PersonalRecord, BenchmarkData, User } from "./types";
import { exportSafeTransform } from "./phia";

// Lazy-load ExcelJS to avoid SSR issues
// In production, import directly; for build safety we use dynamic approach
type ExcelJSType = typeof import("exceljs");

async function getExcelJS(): Promise<ExcelJSType> {
  const ExcelJS = await import("exceljs");
  return ExcelJS;
}

// ============================================================
// SHARED STYLES
// ============================================================

const HEADER_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FF1A1A2E" },
};

const HEADER_FONT = {
  bold: true,
  color: { argb: "FFF1F5F9" },
  size: 11,
  name: "Calibri",
};

const ACCENT_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FF2563EB" },
};

const BORDER_STYLE = {
  top: { style: "thin" as const, color: { argb: "FF1E2130" } },
  left: { style: "thin" as const, color: { argb: "FF1E2130" } },
  bottom: { style: "thin" as const, color: { argb: "FF1E2130" } },
  right: { style: "thin" as const, color: { argb: "FF1E2130" } },
};

const CELL_FONT = {
  size: 10,
  name: "Calibri",
  color: { argb: "FF1E293B" },
};

function applyHeaderRow(row: import("exceljs").Row): void {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  row.height = 24;
}

function applyDataRow(row: import("exceljs").Row, isAlternate: boolean): void {
  row.eachCell((cell) => {
    cell.font = CELL_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
    if (isAlternate) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
    }
  });
  row.height = 18;
}

// ============================================================
// SHEET 1: FULL CASE LOG
// ============================================================

export async function exportFullCaseLog(
  cases: CaseLog[],
  user: Partial<User>,
  workbook?: import("exceljs").Workbook
): Promise<import("exceljs").Workbook> {
  const ExcelJS = await getExcelJS();
  const wb = workbook || new ExcelJS.Workbook();

  wb.creator = "Hippo";
  wb.created = new Date();
  wb.modified = new Date();
  wb.properties.date1904 = false;

  const ws = wb.addWorksheet("Case Log", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
    },
    views: [{ state: "frozen", ySplit: 2 }],
  });

  // Title row
  ws.mergeCells("A1:R1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `Hippo Case Log — ${user.name || "Surgeon"} — Exported ${new Date().toLocaleDateString("en-CA")}`;
  titleCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" }, name: "Calibri" };
  titleCell.fill = ACCENT_FILL;
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 30;

  // Headers
  const headers = [
    "Date", "Procedure", "Category", "Specialty", "Approach",
    "Role", "Autonomy", "Difficulty", "OR Time (min)", "Console Time (min)",
    "Docking Time (min)", "Patient Age Group", "Diagnosis Category",
    "Outcome", "Complication", "Conversion", "Tags", "Notes (scrubbed)"
  ];

  const headerRow = ws.addRow(headers);
  applyHeaderRow(headerRow);

  // Column widths
  const colWidths = [12, 40, 20, 20, 15, 15, 20, 10, 12, 14, 14, 18, 22, 20, 22, 10, 25, 40];
  colWidths.forEach((width, i) => {
    ws.getColumn(i + 1).width = width;
  });

  // Data rows
  const safeCases = cases.map(exportSafeTransform);
  safeCases.forEach((c, index) => {
    const row = ws.addRow([
      c.caseDate ? new Date(c.caseDate).toLocaleDateString("en-CA") : "",
      c.procedureName || "",
      c.procedureCategory || "",
      c.specialtyName || "",
      c.surgicalApproach || "",
      c.role || "",
      c.autonomyLevel?.replace(/_/g, " ") || "",
      c.difficultyScore || "",
      c.operativeDurationMinutes || "",
      c.consoleTimeMinutes || "",
      c.dockingTimeMinutes || "",
      c.patientAgeBin?.replace(/_/g, " ").replace("AGE ", "") || "",
      c.diagnosisCategory || "",
      c.outcomeCategory?.replace(/_/g, " ") || "",
      c.complicationCategory?.replace(/_/g, " ") || "",
      c.conversionOccurred ? "Yes" : "No",
      Array.isArray(c.tags) ? c.tags.join(", ") : "",
      c.notes || "",
    ]);
    applyDataRow(row, index % 2 === 0);
  });

  // Auto-filter
  ws.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2 + safeCases.length, column: headers.length },
  };

  return wb;
}

// ============================================================
// SHEET 2: ANNUAL SUMMARY
// ============================================================

export async function exportAnnualSummary(
  cases: CaseLog[],
  year: number,
  user: Partial<User>,
  workbook?: import("exceljs").Workbook
): Promise<import("exceljs").Workbook> {
  const ExcelJS = await getExcelJS();
  const wb = workbook || new ExcelJS.Workbook();

  const yearCases = cases.filter((c) => new Date(c.caseDate).getFullYear() === year);
  const ws = wb.addWorksheet(`Annual Summary ${year}`);

  // Title
  ws.mergeCells("A1:F1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `Hippo Annual Summary — ${year} — ${user.name || "Surgeon"}`;
  titleCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" }, name: "Calibri" };
  titleCell.fill = ACCENT_FILL;
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 30;

  ws.addRow([]);

  // Summary stats
  const statsHeaders = ws.addRow(["Metric", "Value"]);
  applyHeaderRow(statsHeaders);
  ws.getColumn(1).width = 40;
  ws.getColumn(2).width = 20;

  const totalCases = yearCases.length;
  const firstSurgeonCases = yearCases.filter((c) => c.role === "First Surgeon").length;
  const independentCases = yearCases.filter(
    (c) => c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING"
  ).length;
  const avgDuration = yearCases.reduce((s, c) => s + (c.operativeDurationMinutes || 0), 0) / (totalCases || 1);
  const complications = yearCases.filter((c) => c.outcomeCategory !== "UNCOMPLICATED").length;

  const statsData = [
    ["Total Cases", totalCases],
    ["First Surgeon Cases", firstSurgeonCases],
    ["First Surgeon Rate", `${Math.round((firstSurgeonCases / (totalCases || 1)) * 100)}%`],
    ["Independent / Teaching Cases", independentCases],
    ["Independence Rate", `${Math.round((independentCases / (totalCases || 1)) * 100)}%`],
    ["Average OR Time (min)", Math.round(avgDuration)],
    ["Cases with Complications", complications],
    ["Complication Rate", `${Math.round((complications / (totalCases || 1)) * 100)}%`],
  ];

  statsData.forEach(([metric, value], i) => {
    const row = ws.addRow([metric, value]);
    applyDataRow(row, i % 2 === 0);
  });

  ws.addRow([]);

  // Procedure breakdown
  const procBreakdownHeader = ws.addRow(["Procedure", "Count", "First Surgeon", "Independent", "Avg OR Time (min)"]);
  applyHeaderRow(procBreakdownHeader);
  ws.getColumn(3).width = 18;
  ws.getColumn(4).width = 15;
  ws.getColumn(5).width = 18;

  const procedureMap: Record<string, { count: number; firstSurgeon: number; independent: number; totalDuration: number }> = {};
  for (const c of yearCases) {
    if (!procedureMap[c.procedureName]) {
      procedureMap[c.procedureName] = { count: 0, firstSurgeon: 0, independent: 0, totalDuration: 0 };
    }
    procedureMap[c.procedureName].count++;
    if (c.role === "First Surgeon") procedureMap[c.procedureName].firstSurgeon++;
    if (c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING") procedureMap[c.procedureName].independent++;
    procedureMap[c.procedureName].totalDuration += c.operativeDurationMinutes || 0;
  }

  Object.entries(procedureMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .forEach(([proc, data], i) => {
      const row = ws.addRow([
        proc,
        data.count,
        data.firstSurgeon,
        data.independent,
        Math.round(data.totalDuration / data.count),
      ]);
      applyDataRow(row, i % 2 === 0);
    });

  return wb;
}

// ============================================================
// SHEET 3: MILESTONES
// ============================================================

export async function exportMilestones(
  milestones: Milestone[],
  prs: PersonalRecord[],
  user: Partial<User>,
  workbook?: import("exceljs").Workbook
): Promise<import("exceljs").Workbook> {
  const ExcelJS = await getExcelJS();
  const wb = workbook || new ExcelJS.Workbook();

  const ws = wb.addWorksheet("Milestones & PRs");

  ws.mergeCells("A1:E1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `Hippo Milestones — ${user.name || "Surgeon"}`;
  titleCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" }, name: "Calibri" };
  titleCell.fill = ACCENT_FILL;
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 30;

  ws.addRow([]);

  // Milestones
  const milestoneHeader = ws.addRow(["Badge Key", "Type", "Procedure", "Value", "Date Achieved"]);
  applyHeaderRow(milestoneHeader);

  milestones.forEach((m, i) => {
    const row = ws.addRow([
      m.badgeKey,
      m.type.replace(/_/g, " "),
      m.procedureName || "—",
      m.value,
      new Date(m.achievedAt).toLocaleDateString("en-CA"),
    ]);
    applyDataRow(row, i % 2 === 0);
  });

  ws.addRow([]);

  // Personal Records
  const prHeader = ws.addRow(["Procedure", "Record Type", "Value (min)", "Previous (min)", "Date Achieved"]);
  applyHeaderRow(prHeader);

  prs.forEach((pr, i) => {
    const row = ws.addRow([
      pr.procedureName,
      pr.recordType.replace(/_/g, " "),
      pr.value,
      pr.previousValue ?? "—",
      new Date(pr.achievedAt).toLocaleDateString("en-CA"),
    ]);
    applyDataRow(row, i % 2 === 0);
  });

  ws.getColumn(1).width = 45;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 16;
  ws.getColumn(5).width = 16;

  return wb;
}

// ============================================================
// SHEET 4: BENCHMARKS
// ============================================================

export async function exportBenchmarks(
  benchmarks: BenchmarkData[],
  user: Partial<User>,
  workbook?: import("exceljs").Workbook
): Promise<import("exceljs").Workbook> {
  const ExcelJS = await getExcelJS();
  const wb = workbook || new ExcelJS.Workbook();

  const ws = wb.addWorksheet("Benchmarks");

  ws.mergeCells("A1:I1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `Hippo Benchmark Comparison — ${user.name || "Surgeon"}`;
  titleCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" }, name: "Calibri" };
  titleCell.fill = ACCENT_FILL;
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 30;

  const headers = ws.addRow([
    "Procedure", "Specialty", "Approach",
    "P10 (min)", "P25 (min)", "Median (min)", "P75 (min)", "P90 (min)",
    "Your Time (min)", "Your Percentile", "Sample Size"
  ]);
  applyHeaderRow(headers);

  benchmarks.forEach((b, i) => {
    const row = ws.addRow([
      b.procedureName,
      b.specialty,
      b.approach || "All",
      b.p10,
      b.p25,
      b.p50,
      b.p75,
      b.p90,
      b.userValue ?? "—",
      b.userPercentile ? `${b.userPercentile}th %ile` : "—",
      b.sampleSize,
    ]);
    applyDataRow(row, i % 2 === 0);
  });

  const colWidths = [45, 20, 15, 12, 12, 14, 12, 12, 14, 16, 12];
  colWidths.forEach((width, i) => {
    ws.getColumn(i + 1).width = width;
  });

  return wb;
}

// ============================================================
// FULL WORKBOOK
// ============================================================

export async function createWorkbook(
  cases: CaseLog[],
  milestones: Milestone[],
  prs: PersonalRecord[],
  benchmarks: BenchmarkData[],
  user: Partial<User>,
  year?: number
): Promise<Buffer> {
  const ExcelJS = await getExcelJS();
  const wb = new ExcelJS.Workbook();

  wb.creator = "Hippo";
  wb.created = new Date();
  wb.modified = new Date();
  wb.company = "Hippo";

  const currentYear = year || new Date().getFullYear();

  await exportFullCaseLog(cases, user, wb);
  await exportAnnualSummary(cases, currentYear, user, wb);
  await exportMilestones(milestones, prs, user, wb);
  if (benchmarks.length > 0) {
    await exportBenchmarks(benchmarks, user, wb);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
