import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

/** POST /api/pearls/:id/like — like a pearl */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  await db.$transaction([
    db.pearlLike.upsert({
      where: { pearlId_userId: { pearlId: id, userId: user.id } },
      create: { pearlId: id, userId: user.id },
      update: {},
    }),
    db.pearl.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
    }),
  ]);

  // Re-count to keep accurate (handles double-like edge cases)
  const count = await db.pearlLike.count({ where: { pearlId: id } });
  await db.pearl.update({ where: { id }, data: { likeCount: count } });

  return NextResponse.json({ ok: true, likeCount: count });
}

/** DELETE /api/pearls/:id/like — unlike a pearl */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  await db.pearlLike.deleteMany({
    where: { pearlId: id, userId: user.id },
  });

  const count = await db.pearlLike.count({ where: { pearlId: id } });
  await db.pearl.update({ where: { id }, data: { likeCount: count } });

  return NextResponse.json({ ok: true, likeCount: count });
}
