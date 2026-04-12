import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// /api/schedule
//
// GET    — list the current user's scheduled cases (defaults to upcoming,
//          supports ?status=all for the full list).
// POST   — create a new scheduled case.
// ---------------------------------------------------------------------------

const MAX_PROCEDURE_LENGTH = 200;
const MAX_NOTES_LENGTH = 1000;

interface CreateBody {
  procedureName?: unknown;
  attendingLabel?: unknown;
  scheduledAt?: unknown;
  notes?: unknown;
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const status = req.nextUrl.searchParams.get("status") ?? "upcoming";

  const where =
    status === "all"
      ? { userId: user.id }
      : { userId: user.id, status };

  const rows = await db.scheduledCase.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const procedureName =
    typeof body.procedureName === "string"
      ? body.procedureName.trim()
      : "";
  if (!procedureName) {
    return NextResponse.json(
      { error: "Body must include a non-empty `procedureName`" },
      { status: 400 },
    );
  }
  if (procedureName.length > MAX_PROCEDURE_LENGTH) {
    return NextResponse.json(
      { error: `procedureName exceeds ${MAX_PROCEDURE_LENGTH} chars` },
      { status: 413 },
    );
  }

  const scheduledAtRaw =
    typeof body.scheduledAt === "string" ? body.scheduledAt : "";
  if (!scheduledAtRaw) {
    return NextResponse.json(
      { error: "Body must include a `scheduledAt` ISO string" },
      { status: 400 },
    );
  }
  const scheduledAt = new Date(scheduledAtRaw);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json(
      { error: "`scheduledAt` is not a valid date" },
      { status: 400 },
    );
  }

  const attendingLabel =
    typeof body.attendingLabel === "string"
      ? body.attendingLabel.trim().slice(0, 200) || null
      : null;

  const notes =
    typeof body.notes === "string"
      ? body.notes.trim().slice(0, MAX_NOTES_LENGTH) || null
      : null;

  const created = await db.scheduledCase.create({
    data: {
      userId: user.id,
      procedureName,
      attendingLabel,
      scheduledAt,
      notes,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
