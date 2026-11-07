import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

// "Who to follow" suggestions, grouped:
//   • Same program/institution
//   • Same specialty attendings
//   • Same specialty PGY peers
// Excludes users you already follow, yourself, and anyone with a private profile.

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "12"), 30);

  const me = await db.profile.findUnique({
    where: { userId: user.id },
    select: { specialty: true, institution: true, pgyYear: true, roleType: true },
  });

  const alreadyFollowing = await db.follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });
  const excludeIds = [...alreadyFollowing.map((f) => f.followingId), user.id];

  // Fetch a pool of candidates biased by specialty/program, then segment.
  const candidates = await db.user.findMany({
    where: {
      id: { notIn: excludeIds },
      profile: {
        publicProfile: true,
        specialty: me?.specialty ?? undefined,
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
      profile: {
        select: { specialty: true, institution: true, pgyYear: true, roleType: true, trainingYearLabel: true },
      },
      _count: { select: { followers: true, pearls: true } },
    },
    orderBy: [{ pearls: { _count: "desc" } }, { followers: { _count: "desc" } }],
    take: 80,
  });

  const sameProgram = candidates.filter(
    (c) => me?.institution && c.profile?.institution === me.institution,
  );
  const attendings = candidates.filter(
    (c) =>
      c.profile?.roleType === "ATTENDING" ||
      c.profile?.roleType === "STAFF" ||
      c.profile?.roleType === "PROGRAM_DIRECTOR",
  );
  const pgyPeers = candidates.filter(
    (c) =>
      (c.profile?.roleType === "RESIDENT" || c.profile?.roleType === "FELLOW") &&
      me?.pgyYear &&
      c.profile?.pgyYear === me.pgyYear,
  );

  const dedup = (list: typeof candidates) => {
    const seen = new Set<string>();
    return list.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  };

  return NextResponse.json({
    sameProgram: dedup(sameProgram).slice(0, limit),
    attendings: dedup(attendings).slice(0, limit),
    pgyPeers: dedup(pgyPeers).slice(0, limit),
  });
}
