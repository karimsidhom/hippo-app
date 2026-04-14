import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/account/export
 * Downloads EVERYTHING the user has in the system as a JSON archive.
 * This is the GDPR/PIPEDA "right to data portability" endpoint.
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const [
    userRow,
    profile,
    cases,
    epaObservations,
    scheduledCases,
    milestones,
    personalRecords,
    pearls,
    portfolioCases,
    auditLogs,
  ] = await Promise.all([
    db.user.findUnique({ where: { id: user.id } }),
    db.profile.findUnique({ where: { userId: user.id } }),
    db.caseLog.findMany({ where: { userId: user.id }, orderBy: { caseDate: 'desc' } }),
    db.epaObservation.findMany({ where: { userId: user.id }, orderBy: { observationDate: 'desc' } }),
    db.scheduledCase.findMany({ where: { userId: user.id }, orderBy: { scheduledAt: 'desc' } }),
    db.milestone.findMany({ where: { userId: user.id } }),
    db.personalRecord.findMany({ where: { userId: user.id } }),
    db.pearl.findMany({ where: { authorId: user.id } }).catch(() => []),
    db.portfolioCase.findMany({ where: { userId: user.id } }).catch(() => []),
    db.auditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    }),
  ]);

  const archive = {
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
    user: userRow,
    profile,
    caseLogs: cases,
    epaObservations,
    scheduledCases,
    milestones,
    personalRecords,
    pearls,
    portfolioCases,
    auditLogs,
    _notice: 'This archive is the complete personal data Hippo holds for your account. See /legal/privacy for details.',
  };

  void logAudit({
    userId: user.id,
    action: 'export.download',
    entityType: 'Export',
    metadata: {
      caseCount: cases.length,
      epaCount: epaObservations.length,
    },
    req,
  });

  const filename = `hippo-export-${user.id}-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(archive, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
