import { db } from "@/lib/db";
import { sendPushToUser, type PushPayload } from "./push";
import type { NotificationType } from "./types";

// ---------------------------------------------------------------------------
// createNotification — the single entry point for writing a notification.
//
// One function, one guarantee: calling this does NOT throw. Notifications
// are a UX nicety; a failure here must never roll back the primary action
// (e.g. the EPA sign itself). We catch everything and log.
//
// What it does (in order):
//   1. Read the user's notification preferences — respect opt-outs.
//   2. Write a row to `notifications` (the in-app feed).
//   3. Fan out via web-push to every registered device for that user.
//
// What it returns:
//   The created row, or null if the user opted out or the write failed.
// ---------------------------------------------------------------------------

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  actionUrl?: string;
  epaObservationId?: string;
  /**
   * Skip the preference gate — used for critical system messages. We
   * default to false; almost every caller should leave this false so
   * users remain in control of what hits their phone.
   */
  force?: boolean;
}

/**
 * Resolves a notification `type` against the per-user preferences. Returns
 * true if we should proceed, false if the user opted out of this event.
 *
 * When preferences don't exist yet (new users), we treat all events as
 * enabled — residents need to know when their EPA is signed by default.
 */
async function isAllowed(
  userId: string,
  type: NotificationType,
): Promise<{ inApp: boolean; push: boolean }> {
  const prefs = await db.userNotificationPreferences.findUnique({
    where: { userId },
  }).catch(() => null);

  if (!prefs) return { inApp: true, push: true };

  // Per-event toggles. If the event isn't mapped below, fall through to
  // the channel master toggles.
  let eventEnabled = true;
  switch (type) {
    case "epa.awaiting_review":
      eventEnabled = prefs.notifyOnEpaSubmitted;
      break;
    case "epa.verified":
      eventEnabled = prefs.notifyOnEpaVerified;
      break;
    case "epa.returned":
      eventEnabled = prefs.notifyOnEpaReturned;
      break;
    case "epa.batch_signed":
      eventEnabled = prefs.notifyOnBatchSigned;
      break;
    case "epa.reminder":
      // Reminders are always considered opted-in if in-app is on —
      // they're the gentlest touch.
      eventEnabled = true;
      break;
  }

  return {
    inApp: prefs.inAppEnabled && eventEnabled,
    push: prefs.pushEnabled && eventEnabled,
  };
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<{ id: string } | null> {
  const { userId, type, title, body, actionUrl, epaObservationId, force } = input;

  const gate = force
    ? { inApp: true, push: true }
    : await isAllowed(userId, type).catch(() => ({ inApp: true, push: true }));

  if (!gate.inApp && !gate.push) return null;

  // 1. In-app row. Written even if push is disabled, so the bell icon
  //    and /notifications page reflect the event.
  let row: { id: string } | null = null;
  if (gate.inApp) {
    try {
      row = await db.notification.create({
        data: {
          userId,
          type,
          title,
          body: body ?? null,
          actionUrl: actionUrl ?? null,
          epaObservationId: epaObservationId ?? null,
        },
        select: { id: true },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[createNotification] in-app write failed:", err);
    }
  }

  // 2. Push fan-out. Fire-and-forget so it can't slow down the primary
  //    HTTP response.
  if (gate.push) {
    const payload: PushPayload = {
      title,
      body,
      url: actionUrl ?? "/notifications",
      // Tag groups duplicate pushes (e.g. repeated awaiting-review from
      // the same resident). Collapse on type + epa.
      tag: epaObservationId ? `${type}:${epaObservationId}` : type,
      data: { type, epaObservationId },
    };
    void sendPushToUser(userId, payload).catch(err => {
      // eslint-disable-next-line no-console
      console.warn("[createNotification] push fan-out failed:", err);
    });
  }

  return row;
}
