import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/social/feed
 *
 * Returns public feed events from:
 *   1. The authenticated user themselves
 *   2. Their friends (users connected via Friendship)
 *
 * Query params:
 *   - limit (default 50)
 *   - cursor (ISO date — for pagination)
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '50'), 100);
  const cursor = searchParams.get('cursor');

  // Collect IDs of friends
  const friendships = await db.friendship.findMany({
    where: {
      OR: [{ user1Id: user.id }, { user2Id: user.id }],
    },
    select: { user1Id: true, user2Id: true },
  });

  const friendIds = friendships.map((f) =>
    f.user1Id === user.id ? f.user2Id : f.user1Id,
  );

  const feedUserIds = [user.id, ...friendIds];

  const events = await db.feedEvent.findMany({
    where: {
      userId:   { in: feedUserIds },
      isPublic: true,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: { specialty: true, trainingYearLabel: true, roleType: true },
          },
        },
      },
    },
  });

  const nextCursor =
    events.length === limit
      ? events[events.length - 1]!.createdAt.toISOString()
      : null;

  return NextResponse.json({ events, nextCursor });
}
