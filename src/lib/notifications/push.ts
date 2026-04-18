import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// push — server-side web-push fan-out.
//
// Responsibilities:
//   - Read VAPID keys from env (lazily, so missing keys don't crash boot).
//   - Send a payload to all of a user's registered push subscriptions.
//   - Prune dead subscriptions on 404/410 (the endpoint has been retired).
//
// What this does NOT do:
//   - Decide WHETHER to push — that's createNotification()'s call, which
//     consults UserNotificationPreferences.
//   - Format the payload — the caller passes a ready-to-ship JSON blob.
//
// iOS caveat (critical):
//   Web push on iOS only works when the PWA is installed to the home
//   screen AND iOS 16.4+. In Safari proper, registering a subscription
//   silently fails. That check happens at subscribe time on the client;
//   this server module just sends whatever endpoints it's been given.
// ---------------------------------------------------------------------------

let configured = false;
let configuredOk = false;

/**
 * Lazily configure web-push with VAPID keys. Reads from:
 *   VAPID_PUBLIC_KEY    (also exposed as NEXT_PUBLIC_VAPID_PUBLIC_KEY for the client)
 *   VAPID_PRIVATE_KEY   (server-only)
 *   VAPID_SUBJECT       (mailto:noreply@yourdomain.com — required by RFC)
 *
 * If any are missing, configuration silently fails; sendPush() becomes a
 * no-op. This keeps the server bootable in dev/test without VAPID setup.
 */
function ensureConfigured(): boolean {
  if (configured) return configuredOk;
  configured = true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@hippomedicine.com";

  if (!publicKey || !privateKey) {
    // Log once at configuration time; subsequent sends fail silently.
    // eslint-disable-next-line no-console
    console.warn(
      "[push] VAPID keys not set — push notifications disabled. Generate with `npx web-push generate-vapid-keys` and set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY.",
    );
    configuredOk = false;
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configuredOk = true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[push] failed to configure VAPID:", err);
    configuredOk = false;
  }
  return configuredOk;
}

export interface PushPayload {
  /** Notification title (shown bold on the OS notification). */
  title: string;
  /** Body text; keep under ~120 chars for iOS truncation. */
  body?: string;
  /** Absolute or root-relative URL to open when the user taps. */
  url?: string;
  /**
   * Collapse key — two pushes with the same tag replace each other in the
   * tray. Use for "reminder" streams you don't want to stack up.
   */
  tag?: string;
  /** Optional extra context; reaches the SW for custom behaviour. */
  data?: Record<string, unknown>;
}

/**
 * Send a push payload to every endpoint registered for `userId`. Returns
 * the number of successful deliveries. Silently drops if VAPID isn't
 * configured.
 *
 * Dead subscriptions (404/410) are removed from the DB so we don't keep
 * trying to deliver to retired endpoints — this is how the web-push spec
 * expects us to handle unregistered devices.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;

  const subs = await db.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return 0;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "/",
    tag: payload.tag,
    data: payload.data,
  });

  let delivered = 0;
  await Promise.all(
    subs.map(async sub => {
      const target: WebPushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(target, body, {
          TTL: 60 * 60 * 24, // hold for 24h if device is offline
          urgency: "normal",
        });
        delivered += 1;
        // Opportunistically update lastUsed so we can later expire stale
        // subscriptions. Fire-and-forget.
        void db.pushSubscription
          .update({ where: { id: sub.id }, data: { lastUsed: new Date() } })
          .catch(() => { /* non-fatal */ });
      } catch (err: unknown) {
        const status =
          typeof err === "object" && err !== null && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;

        // 404 = unknown; 410 = gone. Either way, prune.
        if (status === 404 || status === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => { /* already gone */ });
          return;
        }
        // Other errors (e.g. 413 payload too large, 429 throttle) we log
        // but keep the subscription — they're transient.
        // eslint-disable-next-line no-console
        console.warn("[push] sendNotification failed:", status, err);
      }
    }),
  );

  return delivered;
}
