import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/pd/residents/:userId/summary
 *
 * Consolidated summary for the PD resident detail view. Returns everything
 * needed to render KPIs, a 12-week case-volume sparkline, autonomy
 * distribution (last 30d vs prior 30d), the EPA heatmap data, and recent
 * pearls in a single round-trip.
 *
 * Gated on PROGRAM_DIRECTOR role + same institution as the target resident.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  // PD role check
  const pdProfile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!pdProfile || pdProfile.roleType !== 'PROGRAM_DIRECTOR') {
    return NextResponse.json(
      { error: 'Access denied. Program Director role required.' },
      { status: 403 },
    );
  }
  if (!pdProfile.institution) {
    return NextResponse.json(
      { error: 'No institution set on your profile.' },
      { status: 400 },
    );
  }

  const { userId: targetUserId } = await params;

  // Target must exist and belong to the same institution.
  const targetProfile = await db.profile.findUnique({
    where: { userId: targetUserId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  if (
    !targetProfile ||
    targetProfile.institution !== pdProfile.institution
  ) {
    return NextResponse.json(
      { error: 'Resident not found in your institution.' },
      { status: 404 },
    );
  }

  // ── Date windows ─────────────────────────────────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  // Compute the 12-week window as 12 calendar weeks ending this week (Mon).
  const weeks: { weekStart: string; end: Date; count: number }[] = [];
  const currentWeekStart = new Date(now);
  const dow = currentWeekStart.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  currentWeekStart.setDate(currentWeekStart.getDate() + mondayOffset);
  currentWeekStart.setHours(0, 0, 0, 0);
  for (let i = 11; i >= 0; i--) {
    const start = new Date(currentWeekStart);
    start.setDate(currentWeekStart.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    weeks.push({ weekStart: start.toISOString().slice(0, 10), end, count: 0 });
  }
  const twelveWeekStart = weeks[0] ? new Date(weeks[0].weekStart) : currentWeekStart;

  // ── Parallel DB fan-out ──────────────────────────────────────────────────
  const [
    totalCases,
    casesThisMonth,
    epaSigned,
    epaPending,
    lastCase,
    casesForSparkline,
    autonomyCases,
    epaObservationsRaw,
    recentPearls,
    endorsementsReceived,
  ] = await Promise.all([
    db.caseLog.count({ where: { userId: targetUserId } }),
    db.caseLog.count({
      where: { userId: targetUserId, caseDate: { gte: startOfMonth } },
    }),
    db.epaObservation.count({
      where: { userId: targetUserId, status: 'SIGNED' },
    }),
    db.epaObservation.count({
      where: {
        userId: targetUserId,
        status: { in: ['DRAFT', 'SUBMITTED', 'PENDING_REVIEW'] },
      },
    }),
    db.caseLog.findFirst({
      where: { userId: targetUserId },
      orderBy: { caseDate: 'desc' },
      select: { caseDate: true },
    }),
    db.caseLog.findMany({
      where: { userId: targetUserId, caseDate: { gte: twelveWeekStart } },
      select: { caseDate: true },
    }),
    db.caseLog.findMany({
      where: { userId: targetUserId, caseDate: { gte: sixtyDaysAgo } },
      select: { caseDate: true, autonomyLevel: true },
    }),
    db.epaObservation.findMany({
      where: { userId: targetUserId },
      select: {
        epaId: true,
        status: true,
        signedAt: true,
        entrustmentScore: true,
        observationDate: true,
      },
      orderBy: { observationDate: 'desc' },
    }),
    db.pearl.findMany({
      where: { authorId: targetUserId, isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        endorseCount: true,
        reactionCount: true,
        createdAt: true,
      },
    }),
    db.pearlEndorsement.count({
      where: { pearl: { authorId: targetUserId } },
    }),
  ]);

  // Bucket the sparkline cases into their matching week.
  for (const c of casesForSparkline) {
    const d = new Date(c.caseDate);
    for (const w of weeks) {
      const ws = new Date(w.weekStart);
      if (d >= ws && d < w.end) {
        w.count += 1;
        break;
      }
    }
  }

  // Autonomy distribution — recent 30d vs prior 30d (days 60 → 30).
  const autonomyRecent: Record<string, number> = {};
  const autonomyPrior: Record<string, number> = {};
  for (const c of autonomyCases) {
    const d = new Date(c.caseDate);
    const bucket = d >= thirtyDaysAgo ? autonomyRecent : autonomyPrior;
    const key = c.autonomyLevel;
    bucket[key] = (bucket[key] || 0) + 1;
  }

  return NextResponse.json({
    resident: {
      id: targetProfile.user.id,
      name: targetProfile.user.name,
      email: targetProfile.user.email,
      image: targetProfile.user.image,
      specialty: targetProfile.specialty,
      pgyYear: targetProfile.pgyYear,
      trainingYearLabel: targetProfile.trainingYearLabel,
      trainingCountry: targetProfile.trainingCountry,
      institution: targetProfile.institution,
      roleType: targetProfile.roleType,
    },
    stats: {
      totalCases,
      casesThisMonth,
      epaSigned,
      epaPending,
      endorsementsReceived,
      lastCaseDate: lastCase?.caseDate ?? null,
    },
    casesByWeek: weeks.map((w) => ({ weekStart: w.weekStart, count: w.count })),
    autonomyRecent,
    autonomyPrior,
    epaObservations: epaObservationsRaw.map((o) => ({
      epaId: o.epaId,
      status: o.status,
      signedAt: o.signedAt,
      entrustmentScore: o.entrustmentScore,
      observationDate: o.observationDate,
    })),
    recentPearls,
  });
}
