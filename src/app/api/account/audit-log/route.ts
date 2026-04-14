import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/account/audit-log
 * Returns the current user's audit log, most recent first.
 * Query: ?limit=100 (default 200, max 500), ?cursor=<id>, ?entityType=CaseLog
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 200), 500);
  const cursor = searchParams.get('cursor');
  const entityType = searchParams.get('entityType');

  const logs = await db.auditLog.findMany({
    where: {
      userId: user.id,
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      action: true,
      entityType: true,
      entityId: true,
      ipAddress: true,
      userAgent: true,
      metadata: true,
    },
  });

  return NextResponse.json({
    logs,
    nextCursor: logs.length === limit ? logs[logs.length - 1].id : null,
  });
}
