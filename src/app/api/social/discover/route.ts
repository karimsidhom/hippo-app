import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

/**
 * GET /api/social/discover?q=search&limit=20
 * Search for users by name, specialty, or institution.
 * Returns public profiles the current user hasn't followed yet.
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 50);

  // Build where clause
  const where: Record<string, unknown> = {
    id: { not: user.id },
    profile: {
      publicProfile: true,
    },
  };

  // If there's a search query, match name, specialty, or institution
  if (q.length > 0) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { profile: { specialty: { contains: q, mode: "insensitive" } } },
      { profile: { institution: { contains: q, mode: "insensitive" } } },
      { profile: { city: { contains: q, mode: "insensitive" } } },
    ];
  }

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      image: true,
      profile: {
        select: {
          specialty: true,
          subspecialty: true,
          institution: true,
          trainingYearLabel: true,
          pgyYear: true,
          city: true,
          bio: true,
        },
      },
      _count: {
        select: {
          followers: true,
          caseLogs: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Check which ones the current user already follows
  const followedIds = new Set(
    (await db.follow.findMany({
      where: {
        followerId: user.id,
        followingId: { in: users.map((u) => u.id) },
      },
      select: { followingId: true },
    })).map((f) => f.followingId)
  );

  const results = users.map((u) => ({
    id: u.id,
    name: u.name,
    image: u.image,
    specialty: u.profile?.specialty || null,
    subspecialty: u.profile?.subspecialty || null,
    institution: u.profile?.institution || null,
    trainingYearLabel: u.profile?.trainingYearLabel || null,
    city: u.profile?.city || null,
    bio: u.profile?.bio || null,
    followerCount: u._count.followers,
    caseCount: u._count.caseLogs,
    isFollowing: followedIds.has(u.id),
  }));

  return NextResponse.json(results);
}
