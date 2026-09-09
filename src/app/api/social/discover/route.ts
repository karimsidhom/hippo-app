import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

/**
 * GET /api/social/discover?q=search&limit=50
 *
 * Lists every public profile so colleagues can be found and added as
 * friends — not just searched for. Defaults to 50 results (max 100),
 * ordered by name so paging is stable. Each user carries their
 * friendStatus relative to the current viewer (none / pending_sent /
 * pending_received / friends) plus isFollowing, so the Community page
 * can render the right action button without a second round trip.
 */
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const requestedLimit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);
  const limit = Math.min(Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 50, 100);

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
          allowFriendRequests: true,
        },
      },
      _count: {
        select: {
          followers: true,
          caseLogs: true,
        },
      },
    },
    orderBy: [{ name: { sort: "asc", nulls: "last" } }],
    take: limit,
  });

  const ids = users.map((u) => u.id);

  const [followedRows, friendships, pendingRequests] = await Promise.all([
    db.follow.findMany({
      where: { followerId: user.id, followingId: { in: ids } },
      select: { followingId: true },
    }),
    ids.length > 0
      ? db.friendship.findMany({
          where: {
            OR: [
              { user1Id: user.id, user2Id: { in: ids } },
              { user2Id: user.id, user1Id: { in: ids } },
            ],
          },
        })
      : Promise.resolve([]),
    ids.length > 0
      ? db.friendRequest.findMany({
          where: {
            status: "PENDING",
            OR: [
              { fromUserId: user.id, toUserId: { in: ids } },
              { toUserId: user.id, fromUserId: { in: ids } },
            ],
          },
        })
      : Promise.resolve([]),
  ]);

  const followedIds = new Set(followedRows.map((f) => f.followingId));

  const friendshipByOther = new Map<string, string>();
  friendships.forEach((f) => {
    const otherId = f.user1Id === user.id ? f.user2Id : f.user1Id;
    friendshipByOther.set(otherId, f.id);
  });

  const requestByOther = new Map<string, { id: string; direction: "sent" | "received" }>();
  pendingRequests.forEach((r) => {
    if (r.fromUserId === user.id) {
      requestByOther.set(r.toUserId, { id: r.id, direction: "sent" });
    } else {
      requestByOther.set(r.fromUserId, { id: r.id, direction: "received" });
    }
  });

  const results = users.map((u) => {
    let friendStatus: FriendStatus = "none";
    let requestId: string | undefined;
    let friendshipId: string | undefined;

    const existingFriendshipId = friendshipByOther.get(u.id);
    const existingRequest = requestByOther.get(u.id);

    if (existingFriendshipId) {
      friendStatus = "friends";
      friendshipId = existingFriendshipId;
    } else if (existingRequest) {
      friendStatus = existingRequest.direction === "sent" ? "pending_sent" : "pending_received";
      requestId = existingRequest.id;
    }

    return {
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
      friendStatus,
      requestId,
      friendshipId,
      allowFriendRequests: u.profile?.allowFriendRequests ?? true,
    };
  });

  return NextResponse.json(results);
}
