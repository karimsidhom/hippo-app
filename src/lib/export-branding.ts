// ---------------------------------------------------------------------------
// Export branding — shared helpers for Excel workbooks.
//
// Every Hippo-generated export (case log, EPA observations, portfolio) must
// carry consistent branding: the HIPPO™ wordmark, the Hippo Medicine Inc.
// copyright/trademark line, a cover sheet with the resident's identity, and
// a signature + certification block at the end of each workbook.
//
// Resident PDs (and future Competence Committees) shouldn't be able to tell
// whether they're looking at a case log or an EPA summary — both should
// feel like pages out of the same formal training record.
//
// This file centralises:
//   1. Brand colour + font tokens used across both exports.
//   2. addCoverSheet() — first worksheet in every workbook.
//   3. addBrandedHeaderRow() — the two-row HIPPO™ wordmark block that sits
//      above the data grid on every data sheet.
//   4. addCertificationBlock() — the resident's signature + certification
//      statement that goes at the bottom of each data sheet.
//
// The image-less wordmark approach is intentional. Embedding a rasterised
// SVG into ExcelJS worked but added a `sharp` dependency + a build step we
// don't need. A teal bold wordmark with the ™ symbol reads as unmistakably
// "Hippo" to anyone who's seen the app — and renders identically in Excel,
// Numbers, LibreOffice, and Google Sheets.
// ---------------------------------------------------------------------------

import type { Worksheet, Workbook } from "exceljs";

// ── Brand tokens ────────────────────────────────────────────────────────
// Keep these in lockstep with src/app/globals.css and mobile/src/theme/tokens.ts.

export const BRAND = {
  /** Primary surgical teal — the single accent across every Hippo surface. */
  TEAL: "FF0EA5E9", // Excel uses ARGB hex; prefix is alpha.
  TEAL_DARK: "FF0284C7",
  TEAL_LIGHT: "FFE0F2FE",
  /** Neutral greys used for secondary labels and borders. */
  INK: "FF0F172A",
  INK_2: "FF334155",
  MUTED: "FF64748B",
  HAIRLINE: "FFE2E8F0",
  ZEBRA: "FFF8FAFC",
  WHITE: "FFFFFFFF",
} as const;

/**
 * The Hippo wordmark. Used at the top of every branded sheet and on the
 * cover page. The ™ belongs inline with the word — never absent.
 *
 * We spell it with a zero-width joiner between "HIPPO" and "™" so some
 * spreadsheet tools don't break the superscript onto its own line.
 */
export const HIPPO_WORDMARK = "HIPPO\u2009\u2122"; // thin space before ™

/** Full legal mark for copyright/footer lines. */
export const HIPPO_TRADEMARK_LINE =
  "Hippo\u2122 is a trademark of Hippo Medicine Inc.";

/** Standard copyright line with dynamic year. */
export function copyrightLine(): string {
  return `\u00A9 ${new Date().getFullYear()} Hippo Medicine Inc. All rights reserved.`;
}

// ── Resident metadata ───────────────────────────────────────────────────

export interface ResidentExportMeta {
  residentName: string;
  residentEmail: string;
  pgyYear: number | null;
  trainingYearLabel: string | null;
  specialty: string | null;
  subspecialty: string | null;
  institution: string | null;
  trainingCountry: string | null;
  exportType: "Surgical Case Log" | "EPA Observation Record" | "Portfolio";
  /** Optional date range this export covers. Leave null for "all time". */
  dateRangeFrom: Date | null;
  dateRangeTo: Date | null;
  /** Total rows included — shown on cover for transparency. */
  totalRecords: number;
}

// ── Cover sheet ────────────────────────────────────────────────────────

/**
 * Add a formal cover sheet as the FIRST worksheet of the workbook. Matches
 * the look of an RCPSC / ACGME submission page: big wordmark at top, the
 * resident's training identity below, a certification statement, and a
 * signature line.
 *
 * Call this BEFORE adding any data sheets so it lands at position 1.
 */
export function addCoverSheet(
  workbook: Workbook,
  meta: ResidentExportMeta,
): Worksheet {
  const ws = workbook.addWorksheet("Cover", {
    properties: { tabColor: { argb: BRAND.TEAL } },
    views: [{ showGridLines: false, showRowColHeaders: false }],
  });

  // Two columns: a narrow left gutter + a wide content column. Matches the
  // "formal memo" feel PDs are used to from their institutional letterhead.
  ws.columns = [
    { width: 6 }, // A — gutter
    { width: 90 }, // B — content
  ];

  // ── Row 1-2: wordmark (giant teal HIPPO™) ────────────────────────────
  ws.getCell("B2").value = HIPPO_WORDMARK;
  ws.getCell("B2").font = {
    name: "Arial",
    size: 48,
    bold: true,
    color: { argb: BRAND.TEAL },
  };
  ws.getRow(2).height = 56;

  // ── Row 3: tagline ────────────────────────────────────────────────────
  ws.getCell("B3").value = "Surgical case logging, EPA tracking, and competency analytics.";
  ws.getCell("B3").font = {
    name: "Arial",
    size: 11,
    color: { argb: BRAND.MUTED },
    italic: true,
  };
  ws.getRow(3).height = 18;

  // ── Row 4: hairline divider ──────────────────────────────────────────
  ws.getCell("B4").value = "";
  ws.getCell("B4").border = {
    bottom: { style: "thin", color: { argb: BRAND.TEAL } },
  };
  ws.getRow(4).height = 8;

  // ── Row 5-6: document title ──────────────────────────────────────────
  ws.getCell("B6").value = meta.exportType.toUpperCase();
  ws.getCell("B6").font = {
    name: "Arial",
    size: 10,
    bold: true,
    color: { argb: BRAND.MUTED },
  };
  ws.getCell("B6").alignment = { horizontal: "left" };
  ws.getRow(6).height = 14;

  ws.getCell("B7").value = `${meta.residentName || meta.residentEmail} — Official Record`;
  ws.getCell("B7").font = {
    name: "Arial",
    size: 20,
    bold: true,
    color: { argb: BRAND.INK },
  };
  ws.getRow(7).height = 28;

  ws.getCell("B9").value = "Trainee information";
  ws.getCell("B9").font = {
    name: "Arial",
    size: 9,
    bold: true,
    color: { argb: BRAND.MUTED },
  };
  ws.getRow(9).height = 14;

  // ── Two-column key/value block inside column B ───────────────────────
  // We draw it as real rows so PDs can select+copy the values. No formula
  // gymnastics — just a clean labeled grid.
  const fields: Array<[string, string]> = [
    ["Name", meta.residentName || "—"],
    ["Email", meta.residentEmail || "—"],
    [
      "Training year",
      meta.trainingYearLabel ||
        (meta.pgyYear != null ? `PGY-${meta.pgyYear}` : "—"),
    ],
    [
      "Specialty",
      [meta.specialty, meta.subspecialty].filter(Boolean).join(" — ") || "—",
    ],
    ["Institution", meta.institution || "—"],
    ["Training system", trainingSystemLabel(meta.trainingCountry)],
    ["Period covered", formatDateRange(meta.dateRangeFrom, meta.dateRangeTo)],
    ["Records included", String(meta.totalRecords)],
    ["Generated", new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })],
  ];

  let rowIdx = 10;
  for (const [label, value] of fields) {
    const row = ws.getRow(rowIdx);
    row.height = 20;
    // Render label + value as a single string with a tab so columns align
    // without requiring additional worksheet columns (which would throw
    // off the clean 1-gutter + 1-content layout).
    ws.getCell(`B${rowIdx}`).value = {
      richText: [
        {
          text: `${label.padEnd(18, " ")}`,
          font: {
            name: "Courier New",
            size: 10,
            color: { argb: BRAND.MUTED },
            bold: true,
          },
        },
        {
          text: value,
          font: {
            name: "Arial",
            size: 11,
            color: { argb: BRAND.INK },
          },
        },
      ],
    };
    ws.getCell(`B${rowIdx}`).alignment = { vertical: "middle" };
    rowIdx += 1;
  }

  // ── Certification statement ───────────────────────────────────────────
  rowIdx += 1;
  ws.getCell(`B${rowIdx}`).value = "Certification";
  ws.getCell(`B${rowIdx}`).font = {
    name: "Arial",
    size: 9,
    bold: true,
    color: { argb: BRAND.MUTED },
  };
  ws.getRow(rowIdx).height = 14;
  rowIdx += 1;

  ws.getCell(`B${rowIdx}`).value =
    "I certify that the records contained in this export accurately reflect my " +
    "operative and educational experience as entered into the Hippo training " +
    "platform. No patient-identifying information (names, medical record " +
    "numbers, or dates of birth) is included in this document — all fields " +
    "were scrubbed at export per PHIA / HIPAA guidelines.";
  ws.getCell(`B${rowIdx}`).font = {
    name: "Arial",
    size: 10,
    color: { argb: BRAND.INK_2 },
  };
  ws.getCell(`B${rowIdx}`).alignment = { wrapText: true, vertical: "top" };
  ws.getRow(rowIdx).height = 58;
  rowIdx += 2;

  // ── Signature + date lines ────────────────────────────────────────────
  ws.getCell(`B${rowIdx}`).value = {
    richText: [
      {
        text: "Resident signature:  ",
        font: { name: "Arial", size: 10, bold: true, color: { argb: BRAND.INK } },
      },
      {
        text: "_".repeat(42),
        font: { name: "Arial", size: 10, color: { argb: BRAND.MUTED } },
      },
      {
        text: "        Date:  ",
        font: { name: "Arial", size: 10, bold: true, color: { argb: BRAND.INK } },
      },
      {
        text: "_".repeat(18),
        font: { name: "Arial", size: 10, color: { argb: BRAND.MUTED } },
      },
    ],
  };
  ws.getRow(rowIdx).height = 22;
  rowIdx += 2;

  ws.getCell(`B${rowIdx}`).value = {
    richText: [
      {
        text: "Supervisor / PD signature:  ",
        font: { name: "Arial", size: 10, bold: true, color: { argb: BRAND.INK } },
      },
      {
        text: "_".repeat(36),
        font: { name: "Arial", size: 10, color: { argb: BRAND.MUTED } },
      },
      {
        text: "        Date:  ",
        font: { name: "Arial", size: 10, bold: true, color: { argb: BRAND.INK } },
      },
      {
        text: "_".repeat(18),
        font: { name: "Arial", size: 10, color: { argb: BRAND.MUTED } },
      },
    ],
  };
  ws.getRow(rowIdx).height = 22;

  // ── Footer: trademark + copyright ─────────────────────────────────────
  rowIdx += 4;
  ws.getCell(`B${rowIdx}`).value = HIPPO_TRADEMARK_LINE;
  ws.getCell(`B${rowIdx}`).font = {
    name: "Arial",
    size: 9,
    color: { argb: BRAND.MUTED },
    italic: true,
  };
  rowIdx += 1;
  ws.getCell(`B${rowIdx}`).value = copyrightLine();
  ws.getCell(`B${rowIdx}`).font = {
    name: "Arial",
    size: 9,
    color: { argb: BRAND.MUTED },
  };
  rowIdx += 1;
  ws.getCell(`B${rowIdx}`).value = "hippomedicine.com";
  ws.getCell(`B${rowIdx}`).font = {
    name: "Arial",
    size: 9,
    color: { argb: BRAND.TEAL },
    underline: true,
  };

  return ws;
}

// ── Branded header row on data sheets ──────────────────────────────────

/**
 * Puts a two-row branded banner at the top of a data worksheet, above the
 * column headers. The first row holds the HIPPO™ wordmark; the second row
 * holds the sheet subtitle + the export date.
 *
 * Call this AFTER `ws.columns = [...]` so we know how wide the merge range
 * should be.
 */
export function addBrandedHeaderRow(
  ws: Worksheet,
  subtitle: string,
): void {
  const lastColLetter = columnLetter(ws.columnCount);
  const mergeRange = `A1:${lastColLetter}1`;
  const subtitleRange = `A2:${lastColLetter}2`;

  ws.mergeCells(mergeRange);
  ws.getCell("A1").value = {
    richText: [
      {
        text: HIPPO_WORDMARK,
        font: {
          name: "Arial",
          size: 20,
          bold: true,
          color: { argb: BRAND.TEAL },
        },
      },
      {
        text: "   Hippo Medicine Inc.",
        font: {
          name: "Arial",
          size: 11,
          color: { argb: BRAND.MUTED },
        },
      },
    ],
  };
  ws.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 32;
  ws.getCell("A1").border = {
    bottom: { style: "thin", color: { argb: BRAND.TEAL } },
  };

  ws.mergeCells(subtitleRange);
  ws.getCell("A2").value = {
    richText: [
      {
        text: subtitle,
        font: {
          name: "Arial",
          size: 11,
          bold: true,
          color: { argb: BRAND.INK },
        },
      },
      {
        text: `    Generated ${new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`,
        font: { name: "Arial", size: 10, color: { argb: BRAND.MUTED } },
      },
    ],
  };
  ws.getCell("A2").alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(2).height = 20;
}

// ── Certification block at the bottom of each data sheet ───────────────

/**
 * Appends a signature + certification block after the last data row so the
 * sheet ends with something a resident can sign and hand to their PD.
 */
export function addCertificationBlock(
  ws: Worksheet,
  residentName: string,
): void {
  // Leave a blank row as breathing space.
  ws.addRow([]);
  ws.addRow([]);

  const nRow = ws.addRow([
    "I certify that the records above accurately reflect my operative / " +
      "educational experience. No patient identifiers are included.",
  ]);
  nRow.font = { italic: true, size: 10, color: { argb: BRAND.INK_2 } };
  nRow.alignment = { wrapText: true, vertical: "top" };
  nRow.height = 28;

  ws.addRow([]);

  const sigRow = ws.addRow([
    `Resident: ${residentName}`,
    "",
    "Signature: ____________________",
    "",
    "Date: ______________",
  ]);
  sigRow.font = { size: 10, bold: true, color: { argb: BRAND.INK } };
  sigRow.height = 22;

  ws.addRow([]);

  const trademarkRow = ws.addRow([HIPPO_TRADEMARK_LINE]);
  trademarkRow.font = { italic: true, size: 9, color: { argb: BRAND.MUTED } };

  const copyRow = ws.addRow([copyrightLine()]);
  copyRow.font = { size: 9, color: { argb: BRAND.MUTED } };
}

// ── Helpers ────────────────────────────────────────────────────────────

function trainingSystemLabel(country: string | null): string {
  if (country === "CA") return "RCPSC (Royal College of Physicians and Surgeons of Canada)";
  if (country === "US") return "ACGME (Accreditation Council for Graduate Medical Education)";
  return "—";
}

function formatDateRange(from: Date | null, to: Date | null): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  if (!from && !to) return "All time";
  if (from && to) return `${fmt(from)} — ${fmt(to)}`;
  if (from) return `${fmt(from)} — present`;
  return `Up to ${fmt(to!)}`;
}

/**
 * Convert a 1-based column index into its Excel letter (1 → A, 27 → AA).
 * ExcelJS exposes `ws.columnCount` but gives us no built-in converter.
 */
function columnLetter(n: number): string {
  let s = "";
  let v = n;
  while (v > 0) {
    const rem = (v - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    v = Math.floor((v - 1) / 26);
  }
  return s || "A";
}
