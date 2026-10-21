import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ensureDbUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import type { CCDecision, Prisma } from "@prisma/client";
import { getProgramProgressScope, getProgramResidentProgressAccess, isProgramOwner } from '@/lib/program-auth';
import { loadProgramHistoricalProgress, currentProgramTargets } from '@/lib/epa/program-progress';

// ---------------------------------------------------------------------------
// /api/cc-reviews
//   GET  ?programId=…  — list this program's CC reviews (newest first).
//   POST              — create a new review for a resident at a meeting.
//                       Snapshot the resident's metrics at creation time so
//                       the meeting view is reproducible later.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";
function reply(body: unknown, init: { status?: number } = {}) {
  return NextResponse.json(body, { ...init, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization' } });
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set("Cache-Control", "private, no-store"); return error; }
  await ensureDbUser(user);

  const programId = req.nextUrl.searchParams.get("programId");
  if (!programId) {
    return reply({ error: "programId is required" }, { status: 400 });
  }

  // Caller must be a member of the program OR the resident under review.
  const scope = await getProgramProgressScope(user.id, programId);
  if (!scope) {
    return reply({ error: "Not a member of this program" }, { status: 403 });
  }

  const reviews = await db.cCReview.findMany({
    where: { programId, residentId: { in: scope.residentUserIds } },
    include: {
      resident: { select: { id: true, name: true, email: true, image: true } },
      finalisedBy: { select: { id: true, name: true } },
      _count: { select: { notes: true } },
    },
    orderBy: { meetingDate: "desc" },
  });

  return reply({ reviews });
}

interface CreateReviewBody {
  programId?: string;
  residentId?: string;
  meetingDate?: string;
  cycleLabel?: string;
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) { error.headers.set("Cache-Control", "private, no-store"); return error; }
  await ensureDbUser(user);

  let body: CreateReviewBody;
  try {
    body = (await req.json()) as CreateReviewBody;
  } catch {
    return reply({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.programId || !body.residentId || !body.meetingDate) {
    return reply(
      { error: "programId, residentId, meetingDate are required" },
      { status: 400 },
    );
  }

  const owner = await isProgramOwner(user.id, body.programId);
  if (!owner) {
    return reply(
      { error: "Only program owners can open a CC review." },
      { status: 403 },
    );
  }

  if (!(await getProgramResidentProgressAccess(user.id, body.programId, body.residentId))) {
    return reply({ error: 'Resident is outside this program.' }, { status: 403 });
  }
  const meetingDate = new Date(body.meetingDate);
  if (Number.isNaN(meetingDate.getTime())) return reply({ error: 'Use a valid meeting date.' }, { status: 400 });

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

  const capturedAt = new Date();
  const [history, targets] = await Promise.all([
    loadProgramHistoricalProgress(body.programId, [body.residentId], capturedAt),
    currentProgramTargets(body.programId, capturedAt),
  ]);
  const procedureCounts = targets.length ? await db.caseLog.groupBy({
    by: ['procedureDefinitionId'],
    where: { userId: body.residentId, procedureDefinitionId: { in: targets.map(target => target.procedureDefinitionId) }, caseDate: { lte: capturedAt } },
    _count: { _all: true },
  }) : [];
  const snapshot = {
    capturedAt: capturedAt.toISOString(),
    caseCount,
    epaTotal,
    epaSigned,
    epaPending,
    epaCompletionPct:
      epaTotal === 0 ? 0 : Math.round((epaSigned / epaTotal) * 100),
    recentSignedObservations: recentObs,
    historicalProgress: [...history.entries()].map(([key, value]) => ({ specialty: key.slice(key.indexOf(':') + 1), ...value })),
    agreedProcedureTargets: targets.map(target => {
      const recordedCases = procedureCounts.find(count => count.procedureDefinitionId === target.procedureDefinitionId)?._count._all ?? 0;
      return { ...target, effectiveAt: target.effectiveAt.toISOString(), agreedAt: target.agreedAt.toISOString(), createdAt: target.createdAt.toISOString(), recordedCases, remaining: Math.max(0, target.target - recordedCases), countingBasis: 'all roles; canonical procedure matches only' };
    }),
    countingNote: 'EPA signing percentage is an observation workflow measure. Imported category/minimum-credit progress remains separate; native observations are not automatically added to history.',
  } satisfies Prisma.InputJsonValue;

  const created = await db.cCReview.create({
    data: {
      programId: body.programId,
      residentId: body.residentId,
      meetingDate,
      cycleLabel: body.cycleLabel?.trim() || null,
      snapshot,
      createdById: user.id,
    },
  });

  return reply({ review: created });
}
