import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

/** POST /api/social/follow — follow a user */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { targetUserId } = await req.json();
  if (!targetUserId || targetUserId === user.id) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  // Check target exists
  const target = await db.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Upsert to avoid duplicate errors
  await db.follow.upsert({
    where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
    create: { followerId: user.id, followingId: targetUserId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

/** DELETE /api/social/follow — unfollow a user */
export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { targetUserId } = await req.json();
  if (!targetUserId) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  await db.follow.deleteMany({
    where: { followerId: user.id, followingId: targetUserId },
  });

  return NextResponse.json({ ok: true });
}
