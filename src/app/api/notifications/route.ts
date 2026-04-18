import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/notifications
//
// Returns this user's recent in-app notifications plus the current unread
// count. Used by:
//   - The top-nav bell badge (fetch on layout mount, poll loosely).
//   - The /notifications page (list view).
//
// Query params:
//   ?limit=50         (cap 100) — how many rows to return
//   ?cursor=<id>      — simple cursor for pagination (createdAt-keyed)
//   ?unreadOnly=true  — filter to unread only
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const rawLimit = Number(searchParams.get("limit") ?? "30");
  const limit = Math.min(Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 30), 100);
  const cursor = searchParams.get("cursor");
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const [rows, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        actionUrl: true,
        epaObservationId: true,
        readAt: true,
        createdAt: true,
      },
    }),
    db.notification.count({
      where: { userId: user.id, readAt: null },
    }),
  ]);

  return NextResponse.json({
    notifications: rows,
    unreadCount,
    nextCursor: rows.length === limit ? rows[rows.length - 1].id : null,
  });
}
