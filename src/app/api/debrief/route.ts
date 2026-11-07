import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { parseDebrief } from "@/lib/debrief/parse";
import type { StructuredDebrief } from "@/lib/debrief/types";

// ---------------------------------------------------------------------------
// /api/debrief
//
// POST   — Parse a raw debrief into { wentWell, doBetter, workOn } via
//          Claude Opus 4.6. Does NOT persist — the client shows the parsed
//          result, lets the resident edit, then calls PATCH to save.
//          Body: { caseId: string, raw: string }
//
// PATCH  — Save a (possibly user-edited) structured debrief to CaseLog.reflection.
//          Body: { caseId: string, debrief: StructuredDebrief }
//
// This split-route shape lets the user correct the AI's summary before
// committing it — the same ergonomics as the dictation Polish + Save flow.
// ---------------------------------------------------------------------------

const MAX_RAW_LENGTH = 4_000;

interface ParseBody {
  caseId?: unknown;
  raw?: unknown;
}

interface SaveBody {
  caseId?: unknown;
  debrief?: unknown;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let body: ParseBody;
  try {
    body = (await req.json()) as ParseBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const caseId = typeof body.caseId === "string" ? body.caseId : "";
  const raw = typeof body.raw === "string" ? body.raw.trim() : "";
  if (!caseId) {
    return NextResponse.json(
      { error: "Body must include a `caseId` string" },
      { status: 400 },
    );
  }
  if (!raw) {
    return NextResponse.json(
      { error: "Body must include a non-empty `raw` string" },
      { status: 400 },
    );
  }
  if (raw.length > MAX_RAW_LENGTH) {
    return NextResponse.json(
      { error: `\`raw\` exceeds the ${MAX_RAW_LENGTH}-character limit` },
      { status: 413 },
    );
  }

  // Ownership check — the client sends caseId but the row could belong to
  // someone else. Load it, verify userId, and use it for context.
  const row = await db.caseLog.findFirst({
    where: { id: caseId, userId: user.id },
    select: {
      procedureName: true,
      role: true,
      caseDate: true,
    },
  });
  if (!row) {
    return NextResponse.json(
      { error: "Case not found or not owned by caller" },
      { status: 404 },
    );
  }

  const result = await parseDebrief({
    raw,
    context: {
      procedureName: row.procedureName,
      role: row.role,
      caseDate: row.caseDate.toISOString(),
    },
  });

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let body: SaveBody;
  try {
    body = (await req.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const caseId = typeof body.caseId === "string" ? body.caseId : "";
  if (!caseId) {
    return NextResponse.json(
      { error: "Body must include a `caseId` string" },
      { status: 400 },
    );
  }

  const debriefInput = body.debrief as Record<string, unknown> | undefined;
  if (!debriefInput || typeof debriefInput !== "object") {
    return NextResponse.json(
      { error: "Body must include a `debrief` object" },
      { status: 400 },
    );
  }
  const wentWell =
    typeof debriefInput.wentWell === "string" ? debriefInput.wentWell : "";
  const doBetter =
    typeof debriefInput.doBetter === "string" ? debriefInput.doBetter : "";
  const workOn =
    typeof debriefInput.workOn === "string" ? debriefInput.workOn : "";

  if (!wentWell && !doBetter && !workOn) {
    return NextResponse.json(
      { error: "Debrief must have at least one non-empty field" },
      { status: 400 },
    );
  }

  // Ownership check.
  const existing = await db.caseLog.findFirst({
    where: { id: caseId, userId: user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Case not found or not owned by caller" },
      { status: 404 },
    );
  }

  const debrief: StructuredDebrief = {
    v: 2,
    wentWell: wentWell.slice(0, 1000),
    doBetter: doBetter.slice(0, 1000),
    workOn: workOn.slice(0, 1000),
    raw:
      typeof debriefInput.raw === "string"
        ? debriefInput.raw.slice(0, MAX_RAW_LENGTH)
        : undefined,
    createdAt: new Date().toISOString(),
  };

  await db.caseLog.update({
    where: { id: caseId },
    data: { reflection: JSON.stringify(debrief) },
  });

  return NextResponse.json({ ok: true, debrief });
}
