import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

// POST /api/notifications/[id]/read
// Marks a single notification as read. Idempotent — re-calling does nothing
// harmful. Returns the new unread count so the bell badge can update
// without a second fetch.

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // updateMany scopes the update to rows owned by this user, so a
  // malformed id from another user is a no-op rather than a 403 leak.
  await db.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  const unreadCount = await db.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return NextResponse.json({ ok: true, unreadCount });
}
