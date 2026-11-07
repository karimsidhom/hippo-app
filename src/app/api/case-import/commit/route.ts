import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { parseUpload } from "@/lib/case-import/parser";
import { commitImport, type RowDecision } from "@/lib/case-import/commit";
import type { HippoField } from "@/lib/case-import/mapping";

// ---------------------------------------------------------------------------
// /api/case-import/commit
//
// Multipart form with:
//   - file: the original spreadsheet (re-uploaded; not stored on disk)
//   - batchId: the CaseLogImportBatch.id from the preview step
//   - mapping: JSON-encoded { hippoField -> sourceColumn }
//   - sheetName: which xlsx sheet to commit
//   - redactColumns: JSON-encoded string[] of source columns to redact
//   - rowDecisions: JSON-encoded { rowNumber -> RowDecision }
//
// Returns: ImportSummary
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
    return NextResponse.json({ error: "Expected multipart form" }, { status: 400 });
  }

  const file = formData.get("file");
  const batchId = (formData.get("batchId") as string | null) ?? "";
  const mappingRaw = (formData.get("mapping") as string | null) ?? "{}";
  const sheetName = (formData.get("sheetName") as string | null) ?? null;
  const redactRaw = (formData.get("redactColumns") as string | null) ?? "[]";
  const decisionsRaw = (formData.get("rowDecisions") as string | null) ?? "{}";

  if (!(file instanceof Blob) || !batchId) {
    return NextResponse.json(
      { error: "Missing file or batchId" },
      { status: 400 },
    );
  }

  // Verify batch ownership.
  const batch = await db.caseLogImportBatch.findUnique({
    where: { id: batchId },
  });
  if (!batch || batch.userId !== user.id) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }
  if (batch.status === "COMMITTED") {
    return NextResponse.json(
      { error: "Batch already committed" },
      { status: 409 },
    );
  }

  let mapping: Partial<Record<HippoField, string>>;
  try {
    mapping = JSON.parse(mappingRaw);
  } catch {
    return NextResponse.json({ error: "Invalid mapping JSON" }, { status: 400 });
  }

  let redactColumns: Set<string>;
  try {
    const arr: string[] = JSON.parse(redactRaw);
    redactColumns = new Set(arr);
  } catch {
    redactColumns = new Set();
  }

  let rowDecisions: Record<number, RowDecision>;
  try {
    rowDecisions = JSON.parse(decisionsRaw);
  } catch {
    rowDecisions = {};
  }

  const filename = (file as File).name ?? "upload.xlsx";
  const parsed = await parseUpload(file, filename, (file as File).type);
  const sheet =
    parsed.sheets.find((s) => s.sheetName === sheetName) ?? parsed.sheets[0];

  if (!sheet) {
    return NextResponse.json(
      { error: "No rows found in upload" },
      { status: 400 },
    );
  }

  const summary = await commitImport({
    db,
    userId: user.id,
    batchId,
    parsedRows: sheet.rows,
    mapping,
    redactColumns,
    rowDecisions,
  });

  return NextResponse.json({
    batchId,
    summary,
  });
}
