import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  parseUpload,
  detectFileType,
  type ParseResult,
} from "@/lib/case-import/parser";
import { autoMapColumns } from "@/lib/case-import/mapping";
import { detectPii } from "@/lib/case-import/pii";

// ---------------------------------------------------------------------------
// /api/case-import/preview
//
// Multipart upload of a single Excel/CSV/TXT/PDF file. The server:
//   1. Parses the file (multi-sheet xlsx supported).
//   2. Auto-maps columns to Hippo CaseLog fields.
//   3. Flags possible PII columns/values.
//   4. Creates a CaseLogImportBatch row with status=PARSED.
//   5. Returns the parsed sheets + mapping + PII flags + batch id.
//
// The user reviews the preview, optionally adjusts the mapping + redactions,
// then POSTs to /api/case-import/commit with the batchId + final mapping.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form upload" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const filename =
    (formData.get("filename") as string | null) ??
    ((file as File).name ?? "upload.xlsx");
  const sheetName = (formData.get("sheetName") as string | null) ?? null;

  // 25 MB hard limit on uploads — protects the parser + DB.
  const MAX_BYTES = 25 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB > 25 MB)` },
      { status: 413 },
    );
  }

  const fileType = detectFileType(filename, (file as File).type);
  let parsed: ParseResult;
  try {
    parsed = await parseUpload(file, filename, (file as File).type);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed" },
      { status: 400 },
    );
  }

  // Pick the requested sheet (first by default).
  const sheet =
    parsed.sheets.find((s) => s.sheetName === sheetName) ?? parsed.sheets[0];

  if (!sheet) {
    // No structured rows — still create a batch so the UI can show the warning.
    const batch = await db.caseLogImportBatch.create({
      data: {
        userId: user.id,
        filename,
        fileType,
        status: "FAILED",
        warnings: parsed.warnings,
      },
    });
    return NextResponse.json({
      batchId: batch.id,
      fileType,
      sheets: parsed.sheets.map((s) => ({ name: s.sheetName, rows: s.rows.length })),
      headers: [],
      mapping: {},
      unmappedColumns: [],
      previewRows: [],
      piiFlags: [],
      warnings: parsed.warnings,
      rawTextSnippet: parsed.rawTextSnippet,
    });
  }

  const { mapping, unmappedColumns } = autoMapColumns(sheet.headers);
  const piiFlags = detectPii(sheet.headers, sheet.rows);

  // Persist a batch row in PARSED state so we can commit later.
  const batch = await db.caseLogImportBatch.create({
    data: {
      userId: user.id,
      filename,
      fileType,
      sheetName: sheet.sheetName,
      status: "PREVIEW",
      totalRows: sheet.rows.length,
      rawColumnNames: sheet.headers,
      columnMapping: mapping as object,
      warnings: parsed.warnings,
    },
  });

  return NextResponse.json({
    batchId: batch.id,
    fileType,
    sheets: parsed.sheets.map((s) => ({ name: s.sheetName, rows: s.rows.length })),
    sheetName: sheet.sheetName,
    headers: sheet.headers,
    mapping,
    unmappedColumns,
    // Preview the first 50 rows only — the full parse is re-done at commit.
    previewRows: sheet.rows.slice(0, 50),
    totalRows: sheet.rows.length,
    piiFlags,
    warnings: parsed.warnings,
  });
}
