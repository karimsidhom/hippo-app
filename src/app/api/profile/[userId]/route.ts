import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

/** GET /api/profile/:userId — public profile for any user */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { userId } = await params;
  const isOwn = userId === user.id;

  const target = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      profile: {
        select: {
          roleType: true,
          specialty: true,
          subspecialty: true,
          institution: true,
          city: true,
          pgyYear: true,
          trainingYearLabel: true,
          bio: true,
          publicProfile: true,
        },
      },
    },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // If not own profile and not public, return limited info
  if (!isOwn && !target.profile?.publicProfile) {
    return NextResponse.json({
      id: target.id,
      name: target.name,
      image: target.image,
      profile: { publicProfile: false },
      stats: null,
      followerCount: 0,
      followingCount: 0,
      isFollowing: false,
      isOwnProfile: false,
    });
  }

  // Compute stats
  const [cases, followerCount, followingCount, isFollowingRow] = await Promise.all([
    db.caseLog.findMany({
      where: { userId },
      select: {
        operativeDurationMinutes: true,
        autonomyLevel: true,
        procedureName: true,
        caseDate: true,
      },
      orderBy: { caseDate: "desc" },
    }),
    db.follow.count({ where: { followingId: userId } }),
    db.follow.count({ where: { followerId: userId } }),
    isOwn ? null : db.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: userId } },
    }),
  ]);

  // Calculate streak
  let streak = 0;
  if (cases.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [...new Set(cases.map((c) => {
      const d = new Date(c.caseDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a);

    // Check if most recent case is today or yesterday
    const diff = Math.floor((today.getTime() - dates[0]) / 86400000);
    if (diff <= 1) {
      streak = 1;
      for (let i = 1; i < dates.length; i++) {
        const gap = Math.floor((dates[i - 1] - dates[i]) / 86400000);
        if (gap <= 1) streak++;
        else break;
      }
    }
  }

  // Avg OR
  const withDuration = cases.filter((c) => c.operativeDurationMinutes);
  const avgOR = withDuration.length > 0
    ? Math.round(withDuration.reduce((s, c) => s + c.operativeDurationMinutes!, 0) / withDuration.length)
    : 0;

  // Independent rate
  const indepCases = cases.filter((c) => c.autonomyLevel === "INDEPENDENT" || c.autonomyLevel === "TEACHING");
  const independentRate = cases.length > 0 ? Math.round((indepCases.length / cases.length) * 100) : 0;

  // Top procedures
  const procMap: Record<string, number> = {};
  cases.forEach((c) => { procMap[c.procedureName] = (procMap[c.procedureName] || 0) + 1; });
  const topProcedures = Object.entries(procMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json({
    id: target.id,
    name: target.name,
    image: target.image,
    profile: target.profile,
    stats: {
      totalCases: cases.length,
      streak,
      avgORMinutes: avgOR,
      independentRate,
      topProcedures,
    },
    followerCount,
    followingCount,
    isFollowing: !!isFollowingRow,
    isOwnProfile: isOwn,
  });
}
