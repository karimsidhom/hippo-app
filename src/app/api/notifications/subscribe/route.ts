import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { z } from "zod";

// ---------------------------------------------------------------------------
// POST   /api/notifications/subscribe   — register a PushSubscription
// DELETE /api/notifications/subscribe   — unregister (body: { endpoint })
//
// The client passes the serialised PushSubscription from
// navigator.serviceWorker.pushManager.subscribe(). We store it keyed by
// `endpoint` (globally unique per device+browser). Re-subscribing from the
// same device is a no-op thanks to the unique constraint + upsert.
//
// Security: the user must be authenticated. We intentionally DON'T tie
// subscriptions to a device fingerprint — if a logged-out user somehow
// posts here, requireAuth rejects them.
// ---------------------------------------------------------------------------

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid subscription", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { endpoint, keys, userAgent } = parsed.data;

  // Upsert by endpoint — if this device already subscribed (maybe under a
  // different logged-in user on the same browser), rebind it to the
  // current user. Keys can change on resubscribe, so update them too.
  const row = await db.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent ?? null,
    },
    update: {
      userId: user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent ?? null,
      lastUsed: new Date(),
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}

const UnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function DELETE(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UnsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await db.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
