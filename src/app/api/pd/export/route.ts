import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/pd/export?format=csv
 * Exports a CSV summary of all residents in the program.
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  // Verify PD role
  const pdProfile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!pdProfile || pdProfile.roleType !== 'PROGRAM_DIRECTOR') {
    return NextResponse.json(
      { error: 'Access denied. Program Director role required.' },
      { status: 403 },
    );
  }

  if (!pdProfile.institution) {
    return NextResponse.json(
      { error: 'No institution set.' },
      { status: 400 },
    );
  }

  const format = req.nextUrl.searchParams.get('format') || 'csv';

  // Find all residents/fellows at the same institution
  const profiles = await db.profile.findMany({
    where: {
      institution: pdProfile.institution,
      userId: { not: user.id },
      roleType: { in: ['RESIDENT', 'FELLOW'] },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = await Promise.all(
    profiles.map(async (profile) => {
      const userId = profile.userId;

      const [totalCases, casesThisMonth, signedEpas, pendingEpas, lastCase] =
        await Promise.all([
          db.caseLog.count({ where: { userId } }),
          db.caseLog.count({ where: { userId, caseDate: { gte: startOfMonth } } }),
          db.epaObservation.count({ where: { userId, status: 'SIGNED' } }),
          db.epaObservation.count({
            where: { userId, status: { in: ['DRAFT', 'SUBMITTED', 'PENDING_REVIEW'] } },
          }),
          db.caseLog.findFirst({
            where: { userId },
            orderBy: { caseDate: 'desc' },
            select: { caseDate: true },
          }),
        ]);

      return {
        name: profile.user.name || 'Unknown',
        pgy: profile.pgyYear ?? '',
        specialty: profile.specialty || '',
        totalCases,
        thisMonth: casesThisMonth,
        epaSigned: signedEpas,
        epaPending: pendingEpas,
        lastActive: lastCase?.caseDate
          ? lastCase.caseDate.toISOString().slice(0, 10)
          : 'Never',
      };
    }),
  );

  if (format === 'json') {
    return NextResponse.json(rows);
  }

  // CSV export
  const headers = [
    'Name',
    'PGY',
    'Specialty',
    'Total Cases',
    'This Month',
    'EPA Signed',
    'EPA Pending',
    'Last Active',
  ];

  const csvLines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        `"${r.name}"`,
        r.pgy,
        `"${r.specialty}"`,
        r.totalCases,
        r.thisMonth,
        r.epaSigned,
        r.epaPending,
        r.lastActive,
      ].join(','),
    ),
  ];

  const csv = csvLines.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="program-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
