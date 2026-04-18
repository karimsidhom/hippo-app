import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

// Surgeon-native structured reactions. One user may leave multiple KINDS on
// the same pearl (a pearl can be both "clean technique" and "saved me") but
// not the same kind twice — handled by the unique constraint.
// Not exported — Next 16 forbids non-standard exports from route files.
// If another module ever needs this list, move it to src/lib/pearls/.
const REACTION_KINDS = [
  "technique",
  "saved",
  "teaching",
  "warning",
  "seen",
] as const;
type ReactionKind = (typeof REACTION_KINDS)[number];

function isValidKind(k: unknown): k is ReactionKind {
  return typeof k === "string" && (REACTION_KINDS as readonly string[]).includes(k);
}

async function resync(pearlId: string) {
  const count = await db.pearlReaction.count({ where: { pearlId } });
  await db.pearl.update({
    where: { id: pearlId },
    data: { reactionCount: count },
  });
  return count;
}

async function breakdown(pearlId: string) {
  const grouped = await db.pearlReaction.groupBy({
    by: ["kind"],
    where: { pearlId },
    _count: { kind: true },
  });
  return Object.fromEntries(
    REACTION_KINDS.map((k) => [
      k,
      grouped.find((g) => g.kind === k)?._count.kind ?? 0,
    ]),
  );
}

/** POST /api/pearls/:id/reactions — add reaction { kind } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { kind } = await req.json().catch(() => ({ kind: null }));
  if (!isValidKind(kind)) {
    return NextResponse.json(
      { error: `kind must be one of: ${REACTION_KINDS.join(", ")}` },
      { status: 400 },
    );
  }

  await db.pearlReaction.upsert({
    where: { pearlId_userId_kind: { pearlId: id, userId: user.id, kind } },
    create: { pearlId: id, userId: user.id, kind },
    update: {},
  });

  const total = await resync(id);
  return NextResponse.json({
    ok: true,
    total,
    kinds: await breakdown(id),
  });
}

/** DELETE /api/pearls/:id/reactions?kind=xxx — remove reaction */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const kind = req.nextUrl.searchParams.get("kind");
  if (!isValidKind(kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  await db.pearlReaction.deleteMany({
    where: { pearlId: id, userId: user.id, kind },
  });

  const total = await resync(id);
  return NextResponse.json({
    ok: true,
    total,
    kinds: await breakdown(id),
  });
}

/** GET /api/pearls/:id/reactions — breakdown + viewer state */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const [kinds, mine] = await Promise.all([
    breakdown(id),
    db.pearlReaction.findMany({
      where: { pearlId: id, userId: user.id },
      select: { kind: true },
    }),
  ]);
  return NextResponse.json({
    kinds,
    mine: mine.map((r) => r.kind),
  });
}
