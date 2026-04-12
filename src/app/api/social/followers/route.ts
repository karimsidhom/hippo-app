import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

/** GET /api/social/followers?userId=xxx — list followers for a user */
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const follows = await db.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true, name: true, image: true,
          profile: { select: { specialty: true, trainingYearLabel: true, institution: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(follows.map((f) => f.follower));
}
