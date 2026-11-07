import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/notifications/push";

// ---------------------------------------------------------------------------
// POST /api/notifications/test-push
//
// Self-service diagnostic for the push pipeline. Sends a push to every
// registered subscription for the caller and returns a JSON breakdown of
// what happened:
//
//   {
//     vapidConfigured:   boolean,  // are the server env vars set?
//     subscriptionCount: number,   // how many devices has this user registered?
//     delivered:         number,   // how many accepted the payload
//     note:              string,   // human explanation
//   }
//
// When push isn't working, the returned JSON tells the user exactly where
// the chain broke — no log-diving required.
// ---------------------------------------------------------------------------

export async function POST() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const vapidConfigured = Boolean(
    process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );

  const subs = await db.pushSubscription.count({ where: { userId: user.id } });

  if (!vapidConfigured) {
    return NextResponse.json({
      vapidConfigured: false,
      subscriptionCount: subs,
      delivered: 0,
      note: "VAPID keys are not set on the server. Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and NEXT_PUBLIC_VAPID_PUBLIC_KEY in Vercel env then redeploy.",
    });
  }

  if (subs === 0) {
    return NextResponse.json({
      vapidConfigured: true,
      subscriptionCount: 0,
      delivered: 0,
      note: "You don't have any push subscriptions registered on this user. Tap 'Enable push on this device' first, then retry.",
    });
  }

  const delivered = await sendPushToUser(user.id, {
    title: "Push works 🎉",
    body: "This is a test from Hippo. If you see this, your notifications are wired up.",
    url: "/notifications",
    tag: "test-push",
  });

  return NextResponse.json({
    vapidConfigured: true,
    subscriptionCount: subs,
    delivered,
    note: delivered > 0
      ? `Sent to ${delivered} device${delivered === 1 ? "" : "s"}. You should see a banner appear within a few seconds. If not, check iOS Focus mode and that you're running Hippo from the home screen (not a Safari tab).`
      : "Server accepted the request but delivered to 0 devices. Likely causes: stale subscription (try disabling + re-enabling push), browser offline, or push service returned 410/404.",
  });
}
