import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import type { CCDecision, Prisma } from "@prisma/client";
import { PROGRAM_STAFF_ROLES, roleIsProgramStaff } from "@/lib/program-auth";

// ---------------------------------------------------------------------------
// /api/cc-reviews
//   GET  ?programId=…  — list this program's CC reviews (newest first).
//   POST              — create a new review for a resident at a meeting.
//                       Snapshot the resident's metrics at creation time so
//                       the meeting view is reproducible later.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  const programId = req.nextUrl.searchParams.get("programId");
  if (!programId) {
    return NextResponse.json({ error: "programId is required" }, { status: 400 });
  }

  // Staff read every review in the program. Any other member, a resident
  // included, reads only the reviews about themselves: this used to hand
  // every member the whole program's reviews.
  const member = await db.programMember.findFirst({
    where: { programId, userId: user.id },
  });
  if (!member) {
    return NextResponse.json({ error: "Not a member of this program" }, { status: 403 });
  }

  const reviews = await db.cCReview.findMany({
    where: roleIsProgramStaff(member.role) ? { programId } : { programId, residentId: user.id },
    include: {
      resident: { select: { id: true, name: true, email: true, image: true } },
      finalisedBy: { select: { id: true, name: true } },
      _count: { select: { notes: true } },
    },
    orderBy: { meetingDate: "desc" },
  });

  return NextResponse.json({ reviews });
}

interface CreateReviewBody {
  programId?: string;
  residentId?: string;
  meetingDate?: string;
  cycleLabel?: string;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await ensureDbUser(user);

  let body: CreateReviewBody;
  try {
    body = (await req.json()) as CreateReviewBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.programId || !body.residentId || !body.meetingDate) {
    return NextResponse.json(
      { error: "programId, residentId, meetingDate are required" },
      { status: 400 },
    );
  }

  const staff = await db.programMember.findFirst({
    where: { programId: body.programId, userId: user.id, role: { in: [...PROGRAM_STAFF_ROLES] } },
  });
  if (!staff) {
    return NextResponse.json(
      { error: "Only program staff can open a CC review." },
      { status: 403 },
    );
  }

  // Build the snapshot — case count, EPA totals, MSF aggregate stub.
  const [caseCount, epaCounts, recentObs] = await Promise.all([
    db.caseLog.count({ where: { userId: body.residentId } }),
    db.epaObservation.groupBy({
      by: ["status"],
      where: { userId: body.residentId },
      _count: { _all: true },
    }),
    db.epaObservation.findMany({
      where: { userId: body.residentId, status: "SIGNED" },
      orderBy: { signedAt: "desc" },
      take: 5,
      select: {
        id: true,
        epaId: true,
        epaTitle: true,
        achievement: true,
        entrustmentScore: true,
        signedAt: true,
        assessorName: true,
      },
    }),
  ]);
  const epaTotal = epaCounts.reduce((s, r) => s + r._count._all, 0);
  const epaSigned =
    epaCounts.find((r) => r.status === "SIGNED")?._count._all ?? 0;
  const epaPending =
    epaCounts.find((r) => r.status === "PENDING_REVIEW")?._count._all ?? 0;

  const snapshot = {
    capturedAt: new Date().toISOString(),
    caseCount,
    epaTotal,
    epaSigned,
    epaPending,
    epaCompletionPct:
      epaTotal === 0 ? 0 : Math.round((epaSigned / epaTotal) * 100),
    recentSignedObservations: recentObs,
  } satisfies Prisma.InputJsonValue;

  const created = await db.cCReview.create({
    data: {
      programId: body.programId,
      residentId: body.residentId,
      meetingDate: new Date(body.meetingDate),
      cycleLabel: body.cycleLabel?.trim() || null,
      snapshot,
      createdById: user.id,
    },
  });

  return NextResponse.json({ review: created });
}
