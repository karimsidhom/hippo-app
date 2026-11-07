import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

// Poll votes. One vote per user per pearl; re-POSTing with a new optionId
// updates the vote (we use an upsert under the unique constraint).
//
// Results are returned as a simple breakdown keyed by optionId, plus a
// per-PGY demographic breakdown because "how residents vs attendings
// answered" is one of the most interesting angles for the feed.

interface PollOption { id: string; label: string }

async function loadPoll(pearlId: string) {
  const pearl = await db.pearl.findUnique({
    where: { id: pearlId },
    select: { pollOptions: true, postType: true },
  });
  if (!pearl || pearl.postType !== "poll" || !pearl.pollOptions) return null;
  const options = pearl.pollOptions as unknown as PollOption[];
  if (!Array.isArray(options) || options.length === 0) return null;
  return options;
}

async function tally(pearlId: string, options: PollOption[]) {
  const grouped = await db.pollVote.groupBy({
    by: ["optionId"],
    where: { pearlId },
    _count: { optionId: true },
  });
  const byOption = Object.fromEntries(
    options.map((o) => [o.id, grouped.find((g) => g.optionId === o.id)?._count.optionId ?? 0]),
  );
  const total = Object.values(byOption).reduce((a, b) => a + b, 0);

  // PGY-year breakdown for richer feed insight. Collapse "not a resident"
  // into a single bucket so attending/PD votes don't leak roles per-user.
  const votes = await db.pollVote.findMany({
    where: { pearlId },
    include: {
      user: {
        select: { profile: { select: { pgyYear: true, roleType: true } } },
      },
    },
  });
  const byPgy: Record<string, Record<string, number>> = {};
  for (const v of votes) {
    const p = v.user.profile;
    const bucket = p?.roleType === "RESIDENT" || p?.roleType === "FELLOW"
      ? `PGY-${p.pgyYear ?? "?"}`
      : "Attending+";
    byPgy[bucket] = byPgy[bucket] ?? {};
    byPgy[bucket][v.optionId] = (byPgy[bucket][v.optionId] ?? 0) + 1;
  }

  return { byOption, total, byPgy };
}

/** POST /api/pearls/:id/vote  body: { optionId } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { optionId } = await req.json().catch(() => ({ optionId: null }));
  if (typeof optionId !== "string" || !optionId) {
    return NextResponse.json({ error: "optionId required" }, { status: 400 });
  }

  const options = await loadPoll(id);
  if (!options) {
    return NextResponse.json({ error: "Not a poll" }, { status: 400 });
  }
  if (!options.some((o) => o.id === optionId)) {
    return NextResponse.json({ error: "Unknown option" }, { status: 400 });
  }

  await db.pollVote.upsert({
    where: { pearlId_userId: { pearlId: id, userId: user.id } },
    create: { pearlId: id, userId: user.id, optionId },
    update: { optionId },
  });

  return NextResponse.json({ ok: true, ...(await tally(id, options)), myVote: optionId });
}

/** GET /api/pearls/:id/vote — current tally (safe to expose) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const options = await loadPoll(id);
  if (!options) {
    return NextResponse.json({ error: "Not a poll" }, { status: 400 });
  }
  const mine = await db.pollVote.findUnique({
    where: { pearlId_userId: { pearlId: id, userId: user.id } },
    select: { optionId: true },
  });
  return NextResponse.json({
    options,
    ...(await tally(id, options)),
    myVote: mine?.optionId ?? null,
  });
}
