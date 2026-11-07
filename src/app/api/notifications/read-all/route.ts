import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

// POST /api/notifications/read-all
// Marks every unread notification for this user as read in one go. Used
// when the user opens the notifications sheet — the "clear all dots"
// gesture residents expect.

export async function POST() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const now = new Date();
  const { count } = await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: now },
  });

  return NextResponse.json({ ok: true, markedRead: count, unreadCount: 0 });
}
