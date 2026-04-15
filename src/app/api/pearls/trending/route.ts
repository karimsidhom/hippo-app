import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

// Trending = weighted engagement over the last 7 days within the viewer's
// specialty (if set). Weighting: attending endorsements count x4, structured
// reactions x1.5, comments x2, saves x1, likes x0.5. Small recency boost so
// fresh content bubbles even with less total engagement.

const SPECIALTY_WEIGHT = {
  endorse: 4,
  reaction: 1.5,
  comment: 2,
  save: 1,
  like: 0.5,
};

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: { specialty: true },
  });
  const specialty = req.nextUrl.searchParams.get("specialty") ?? profile?.specialty ?? null;
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "5"), 20);

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const pearls = await db.pearl.findMany({
    where: {
      isPublished: true,
      createdAt: { gte: since },
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
    take: 100, // shortlist, then rank in memory
  });

  // Same-specialty pearls first, then cross-specialty.
  const scored = pearls
    .map((p) => {
      const ageHours = (Date.now() - p.createdAt.getTime()) / (60 * 60 * 1000);
      const recency = Math.max(0, 1 - ageHours / (24 * 7));
      const engagement =
        p.endorseCount * SPECIALTY_WEIGHT.endorse +
        p.reactionCount * SPECIALTY_WEIGHT.reaction +
        p.commentCount * SPECIALTY_WEIGHT.comment +
        p.saveCount * SPECIALTY_WEIGHT.save +
        p.likeCount * SPECIALTY_WEIGHT.like;
      const specialtyMatch = specialty && p.author.profile?.specialty === specialty ? 1.5 : 1;
      return {
        pearl: p,
        score: engagement * specialtyMatch * (1 + recency),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json({
    items: scored.map(({ pearl, score }) => ({ ...pearl, trendScore: Math.round(score * 10) / 10 })),
  });
}
