import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * GET /api/social/friends
 *
 * Returns the list of friends for the current user, with basic stats.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const friendships = await db.friendship.findMany({
    where: {
      OR: [{ user1Id: user.id }, { user2Id: user.id }],
    },
    include: {
      user1: {
        select: {
          id: true, name: true, image: true,
          profile: { select: { specialty: true, trainingYearLabel: true, institution: true, roleType: true } },
          caseLogs: { select: { id: true, caseDate: true, role: true, autonomyLevel: true, operativeDurationMinutes: true } },
        },
      },
      user2: {
        select: {
          id: true, name: true, image: true,
          profile: { select: { specialty: true, trainingYearLabel: true, institution: true, roleType: true } },
          caseLogs: { select: { id: true, caseDate: true, role: true, autonomyLevel: true, operativeDurationMinutes: true } },
        },
      },
    },
  });

  const friends = friendships.map((f) => {
    const friend = f.user1Id === user.id ? f.user2 : f.user1;
    const totalCases = friend.caseLogs.length;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = friend.caseLogs.filter((c) => c.caseDate >= startOfMonth).length;
    const firstSurgeonCases = friend.caseLogs.filter((c) => c.role === 'First Surgeon').length;
    const firstSurgeonRate = totalCases > 0 ? Math.round((firstSurgeonCases / totalCases) * 100) : 0;
    const durations = friend.caseLogs
      .map((c) => c.operativeDurationMinutes)
      .filter(Boolean) as number[];
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    return {
      userId:    friend.id,
      name:      friend.name,
      image:     friend.image,
      specialty: friend.profile?.specialty,
      trainingYearLabel: friend.profile?.trainingYearLabel,
      institution: friend.profile?.institution,
      roleType:  friend.profile?.roleType,
      totalCases,
      thisMonth,
      firstSurgeonRate,
      avgDuration,
      friendshipId: f.id,
      since: f.createdAt,
    };
  });

  return NextResponse.json(friends);
}
