import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

// "Weekly digest, but in the feed." The user rejected email digests in favor
// of a single in-feed rail that shows the top 3 pearls from the past 7 days
// in their specialty. Same ranking as /trending but locked to 3 and oriented
// around "what you missed this week."

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: { specialty: true },
  });
  const specialty = req.nextUrl.searchParams.get("specialty") ?? profile?.specialty ?? null;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const pearls = await db.pearl.findMany({
    where: {
      isPublished: true,
      createdAt: { gte: since },
      ...(specialty ? { author: { profile: { specialty } } } : {}),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: { select: { specialty: true, trainingYearLabel: true, roleType: true } },
        },
      },
    },
    take: 50,
  });

  // Rank on total engagement (endorsements weighted heaviest).
  const ranked = pearls
    .map((p) => ({
      pearl: p,
      score: p.endorseCount * 4 + p.reactionCount * 1.5 + p.commentCount * 2 + p.saveCount + p.likeCount * 0.5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return NextResponse.json({
    weekOf: since.toISOString(),
    specialty,
    items: ranked.map(({ pearl }) => pearl),
  });
}
