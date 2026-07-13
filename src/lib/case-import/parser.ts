// ---------------------------------------------------------------------------
// Multi-format case-log parser
//
// Supports XLSX (multi-sheet), CSV, plain text. PDF is best-effort — we
// extract text but leave structured-row inference to a future LLM-assisted
// pass when the user requests it.
// ---------------------------------------------------------------------------

import readXlsxFile, { type Row } from "read-excel-file/node";
import Papa from "papaparse";

export type ImportFileType = "xlsx" | "csv" | "txt" | "pdf" | "unknown";

export interface ParsedSheet {
  sheetName: string;
  headers: string[];
  rows: Array<Record<string, unknown>>;
}

export interface ParseResult {
  fileType: ImportFileType;
  sheets: ParsedSheet[];
  rawTextSnippet?: string;
  warnings: string[];
}

export function detectFileType(filename: string, mimeType?: string): ImportFileType {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xlsm")) return "xlsx";
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".txt")) return "txt";
  if (lower.endsWith(".pdf")) return "pdf";
  if (mimeType) {
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "xlsx";
    if (mimeType.includes("csv")) return "csv";
    if (mimeType === "text/plain") return "txt";
    if (mimeType.includes("pdf")) return "pdf";
  }
  return "unknown";
}

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------

export async function parseXlsx(buffer: ArrayBuffer | Buffer): Promise<ParseResult> {
  const input = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const sheets: ParsedSheet[] = [];
  const warnings: string[] = [];
  const workbook = await readXlsxFile(input);

  for (const { sheet: sheetName, data: table } of workbook) {
    const [headerRow, ...dataRows] = table.filter((row) => row.some((cell) => cell !== null));

    if (!headerRow || dataRows.length === 0) {
      warnings.push(`Sheet "${sheetName}" is empty.`);
      continue;
    }

    const headers = uniqueHeaders(headerRow);
    const rows = dataRows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])));

    sheets.push({ sheetName, headers, rows });
  }

  return { fileType: "xlsx", sheets, warnings };
}

function uniqueHeaders(row: Row): string[] {
  const counts = new Map<string, number>();
  return row.map((value, index) => {
    const base = String(value ?? "").trim() || `Column ${index + 1}`;
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return count === 1 ? base : `${base} ${count}`;
  });
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function parseCsv(text: string): ParseResult {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (h) => h.trim(),
  });

  const warnings: string[] = [];
  for (const err of result.errors) {
    warnings.push(`CSV parse: ${err.message} (row ${err.row})`);
  }

  const headers = result.meta.fields ?? [];
  return {
    fileType: "csv",
    sheets: [
      {
        sheetName: "Sheet1",
        headers,
        rows: result.data,
      },
    ],
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Plain text
// ---------------------------------------------------------------------------
//
// Best-effort: if the text looks like TSV/CSV, parse with Papa. Otherwise,
// keep the raw text in rawTextSnippet so the import UI can display it for
// the user to copy into manual case entry.
// ---------------------------------------------------------------------------

export function parsePlainText(text: string): ParseResult {
  const warnings: string[] = [];
  const trimmed = text.trim();
  if (!trimmed) {
    return { fileType: "txt", sheets: [], rawTextSnippet: "", warnings: ["Empty file."] };
  }

  // Heuristic: if there are tabs or commas with consistent column counts, try CSV.
  const firstLines = trimmed.split(/\r?\n/).slice(0, 5);
  const hasTabs = firstLines.every((l) => l.includes("\t"));
  const hasCommas = firstLines.every((l) => l.includes(","));
  if (hasTabs || hasCommas) {
    const parsed = Papa.parse<Record<string, unknown>>(trimmed, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      delimiter: hasTabs ? "\t" : ",",
      transformHeader: (h) => h.trim(),
    });
    return {
      fileType: "txt",
      sheets: [
        {
          sheetName: "Sheet1",
          headers: parsed.meta.fields ?? [],
          rows: parsed.data,
        },
      ],
      warnings,
    };
  }

  return {
    fileType: "txt",
    sheets: [],
    rawTextSnippet: trimmed.slice(0, 5000),
    warnings: ["Plain text did not look tabular — preserved as raw text snippet."],
  };
}

// ---------------------------------------------------------------------------
// PDF — best-effort text extraction
// ---------------------------------------------------------------------------
//
// We don't ship pdfjs in this patch; the user uploads a PDF and we return
// the warning so the UI can prompt them to paste the contents instead, or
// upload an Excel/CSV. Hooking pdfjs up later is a one-file change here.
// ---------------------------------------------------------------------------

export function parsePdfStub(): ParseResult {
  return {
    fileType: "pdf",
    sheets: [],
    warnings: [
      "PDF parsing is not yet supported in Hippo. Please export your PDF table to Excel or CSV (most PDF tools have a 'Export to spreadsheet' option) and re-upload.",
    ],
  };
}

// ---------------------------------------------------------------------------
// Top-level dispatch
// ---------------------------------------------------------------------------

export async function parseUpload(
  file: File | Blob,
  filename: string,
  mimeType?: string,
): Promise<ParseResult> {
  const type = detectFileType(filename, mimeType);

  switch (type) {
    case "xlsx": {
      const buf = await file.arrayBuffer();
      return await parseXlsx(buf);
    }
    case "csv": {
      const text = await file.text();
      return parseCsv(text);
    }
    case "txt": {
      const text = await file.text();
      return parsePlainText(text);
    }
    case "pdf":
      return parsePdfStub();
    default:
      return {
        fileType: "unknown",
        sheets: [],
        warnings: [`Unsupported file type "${filename}". Supported: XLSX, CSV, TXT.`],
      };
  }
}
