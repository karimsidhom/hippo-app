import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Notification preferences — one row per user (upsert on write).
//
// GET  returns the current prefs (creates defaults if missing).
// PUT  partial-updates; unspecified fields are left alone.
// ---------------------------------------------------------------------------

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const prefs = await db.userNotificationPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  return NextResponse.json({ preferences: prefs });
}

const UpdateSchema = z.object({
  inAppEnabled:          z.boolean().optional(),
  pushEnabled:           z.boolean().optional(),
  emailEnabled:          z.boolean().optional(),
  notifyOnEpaSubmitted:  z.boolean().optional(),
  notifyOnEpaVerified:   z.boolean().optional(),
  notifyOnEpaReturned:   z.boolean().optional(),
  notifyOnBatchSigned:   z.boolean().optional(),
  // Per-digest toggles — added with the Stage-2 digest sprint.
  weeklyResidentDigest:  z.boolean().optional(),
  weeklyAttendingDigest: z.boolean().optional(),
  weeklyPdDigest:        z.boolean().optional(),
  ccMeetingPrepDigest:   z.boolean().optional(),
  soundEnabled:          z.boolean().optional(),
  hapticsEnabled:        z.boolean().optional(),
});

export async function PUT(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const prefs = await db.userNotificationPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ preferences: prefs });
}
