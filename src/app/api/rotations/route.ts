import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { summariseAssignments } from "@/lib/rotations";
import type { Prisma, RotationCategory } from "@prisma/client";

// ---------------------------------------------------------------------------
// /api/rotations
//   GET  — list rotations + the caller's own assignments + per-assignment
//          counts (cases + EPA observations) for the rotation dashboard.
//   POST — create a rotation. Programs only (must be a ProgramMember).
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  // The user's own assignments + counts.
  const summaries = await summariseAssignments(user.id);

  // Rotations the user has access to: any rotation in any program they're
  // a member of, plus rotations they have an assignment to (covers staff
  // who aren't formal program members).
  const memberships = await db.programMember.findMany({
    where: { userId: user.id },
    select: { programId: true },
  });
  const programIds = memberships.map((m) => m.programId);

  const rotations = await db.rotation.findMany({
    where: programIds.length > 0 ? { programId: { in: programIds } } : { id: "__none__" },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    rotations,
    assignments: summaries.map((s) => ({
      id: s.assignment.id,
      rotationId: s.rotation.id,
      rotationName: s.rotation.name,
      rotationColour: s.rotation.colour,
      shortName: s.rotation.shortName,
      blockLabel: s.assignment.blockLabel,
      startDate: s.assignment.startDate,
      endDate: s.assignment.endDate,
      caseCount: s.caseCount,
      observationCount: s.observationCount,
      notes: s.assignment.notes,
    })),
  });
}

interface CreateRotationBody {
  programId?: string;
  name?: string;
  shortName?: string;
  specialty?: string;
  category?: RotationCategory;
  description?: string;
  colour?: string;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let body: CreateRotationBody;
  try {
    body = (await req.json()) as CreateRotationBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.programId || !body.name) {
    return NextResponse.json(
      { error: "programId and name are required" },
      { status: 400 },
    );
  }

  // Must be a member of the program — OWNER or MEMBER (we don't
  // distinguish further yet; faculty permissions land in Wave 2 polish).
  const member = await db.programMember.findFirst({
    where: { programId: body.programId, userId: user.id },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member of this program" }, { status: 403 });
  }

  const created = await db.rotation.create({
    data: {
      programId: body.programId,
      name: body.name.trim(),
      shortName: body.shortName?.trim() || null,
      specialty: body.specialty?.trim() || null,
      category: body.category ?? "CORE",
      description: body.description?.trim() || null,
      colour: body.colour?.trim() || null,
    } satisfies Prisma.RotationUncheckedCreateInput,
  });

  return NextResponse.json({ rotation: created });
}
