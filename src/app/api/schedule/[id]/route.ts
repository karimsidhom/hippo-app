import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// /api/schedule/[id]
//
// PATCH  — update a scheduled case (status, notes, etc).
// DELETE — remove a scheduled case entirely.
// ---------------------------------------------------------------------------

interface PatchBody {
  status?: unknown;
  procedureName?: unknown;
  attendingLabel?: unknown;
  scheduledAt?: unknown;
  notes?: unknown;
  caseLogId?: unknown;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await params;
  const existing = await db.scheduledCase.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.status === "string" && ["upcoming", "done", "cancelled"].includes(body.status)) {
    data.status = body.status;
  }
  if (typeof body.procedureName === "string" && body.procedureName.trim()) {
    data.procedureName = body.procedureName.trim().slice(0, 200);
  }
  if (typeof body.attendingLabel === "string") {
    data.attendingLabel = body.attendingLabel.trim().slice(0, 200) || null;
  }
  if (typeof body.scheduledAt === "string") {
    const d = new Date(body.scheduledAt);
    if (!Number.isNaN(d.getTime())) data.scheduledAt = d;
  }
  if (typeof body.notes === "string") {
    data.notes = body.notes.trim().slice(0, 1000) || null;
  }
  if (typeof body.caseLogId === "string") {
    data.caseLogId = body.caseLogId;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const updated = await db.scheduledCase.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const { id } = await params;
  const existing = await db.scheduledCase.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.scheduledCase.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
