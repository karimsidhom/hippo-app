import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { reattributeAssignments } from "@/lib/rotations";

// ---------------------------------------------------------------------------
// /api/rotations/assignments
//   POST   — assign yourself (or, for OWNER program members, another
//            resident) to a rotation across a date range.
//   DELETE — remove an assignment.
//
// Both operations re-attribute the affected user's CaseLog +
// EpaObservation rows immediately so the rotation dashboard never lags.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

interface CreateAssignmentBody {
  rotationId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  blockLabel?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let body: CreateAssignmentBody;
  try {
    body = (await req.json()) as CreateAssignmentBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.rotationId || !body.startDate || !body.endDate) {
    return NextResponse.json(
      { error: "rotationId, startDate, endDate are required" },
      { status: 400 },
    );
  }

  // Resolve the target user. Default = self. If the caller is asking to
  // assign someone else, they must be an OWNER of the program.
  const targetUserId = body.userId ?? user.id;
  if (targetUserId !== user.id) {
    const rotation = await db.rotation.findUnique({
      where: { id: body.rotationId },
      select: { programId: true },
    });
    if (!rotation) {
      return NextResponse.json({ error: "Rotation not found" }, { status: 404 });
    }
    const member = await db.programMember.findFirst({
      where: { programId: rotation.programId, userId: user.id, role: "OWNER" },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Only program owners can assign other residents." },
        { status: 403 },
      );
    }
  }

  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (start > end) {
    return NextResponse.json(
      { error: "startDate must be on or before endDate" },
      { status: 400 },
    );
  }

  const created = await db.rotationAssignment.create({
    data: {
      rotationId: body.rotationId,
      userId: targetUserId,
      startDate: start,
      endDate: end,
      blockLabel: body.blockLabel?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  });

  // Best-effort re-attribution. We don't fail the request if this throws
  // because the assignment row is the source of truth and the next
  // dashboard load will re-attribute lazily anyway.
  try {
    await reattributeAssignments(targetUserId);
  } catch (err) {
    console.warn("[rotations] reattribute failed", err);
  }

  return NextResponse.json({ assignment: created });
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const assignment = await db.rotationAssignment.findUnique({
    where: { id },
    include: { rotation: { select: { programId: true } } },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (assignment.userId !== user.id) {
    const member = await db.programMember.findFirst({
      where: {
        programId: assignment.rotation.programId,
        userId: user.id,
        role: "OWNER",
      },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Only the assigned resident or a program owner can delete this." },
        { status: 403 },
      );
    }
  }

  const targetUserId = assignment.userId;
  await db.rotationAssignment.delete({ where: { id } });

  try {
    await reattributeAssignments(targetUserId);
  } catch (err) {
    console.warn("[rotations] reattribute on delete failed", err);
  }

  return NextResponse.json({ ok: true });
}
