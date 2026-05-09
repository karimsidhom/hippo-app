// ---------------------------------------------------------------------------
// CSV helpers for accreditation report exports.
//
// Excel quirks the helper has to handle so the file opens cleanly when
// the programme coordinator double-clicks it on a Windows machine:
//   • UTF-8 BOM at the top so Excel doesn't show "Pétaín" instead of
//     "Pétain". Without the BOM, Excel mis-detects the encoding and
//     accents come through garbled.
//   • CRLF line endings (matches Windows expectations).
//   • Quote any cell containing a comma, quote, or newline. Double up
//     embedded quotes per RFC 4180.
//   • A leading apostrophe is prepended to cells that start with =, +,
//     -, @ to defuse formula-injection (a real risk when an
//     accreditation reviewer opens the CSV in Excel).
// ---------------------------------------------------------------------------

const BOM = "﻿";
const CRLF = "\r\n";

export interface CsvColumn<Row> {
  /** Header text shown to the reviewer. */
  header: string;
  /** How to extract / format the cell value from a row. */
  value: (row: Row) => string | number | boolean | null | undefined | Date;
}

export function buildCsv<Row>(
  columns: CsvColumn<Row>[],
  rows: Row[],
): string {
  const headerLine = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => escapeCell(formatValue(col.value(row))))
        .join(","),
    )
    .join(CRLF);
  return BOM + headerLine + CRLF + body + CRLF;
}

function formatValue(
  v: string | number | boolean | null | undefined | Date,
): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return "";
    return v.toISOString().slice(0, 10); // YYYY-MM-DD
  }
  return String(v);
}

function escapeCell(raw: string): string {
  // Formula-injection defence: if the cell starts with =, +, -, or @
  // it could be interpreted as a formula by Excel. Prepend an
  // apostrophe so the cell renders as text.
  let v = raw;
  if (/^[=+\-@]/.test(v)) {
    v = "'" + v;
  }
  // Quote when the cell contains a quote, comma, or newline.
  if (/[,"\n\r]/.test(v)) {
    v = '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

/**
 * Build a `Content-Disposition` header value for the download.
 * Browsers truncate non-ASCII filenames in the unquoted form; the
 * `filename*` extension passes UTF-8 cleanly.
 */
export function csvAttachmentDisposition(filename: string): string {
  const safe = filename.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, "-");
  const utf8 = encodeURIComponent(filename);
  return `attachment; filename="${safe}"; filename*=UTF-8''${utf8}`;
}

/** Standard CSV response shape used by every report endpoint. */
export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": csvAttachmentDisposition(filename),
      "Cache-Control": "no-store",
    },
  });
}
