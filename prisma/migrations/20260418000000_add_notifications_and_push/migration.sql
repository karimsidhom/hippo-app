-- Notifications (in-app) + PushSubscription + UserNotificationPreferences
--
-- The existing `AttendingNotification` table stays intact — it owns the
-- outbound-email / public-token review flow. The new `notifications`
-- table is the in-app feed for registered Hippo users only.

-- ─── notifications ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "notifications" (
  "id"                TEXT        PRIMARY KEY,
  "userId"            TEXT        NOT NULL,
  "type"              TEXT        NOT NULL,
  "title"             TEXT        NOT NULL,
  "body"              TEXT,
  "actionUrl"         TEXT,
  "epaObservationId"  TEXT,
  "readAt"            TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "notifications_userId_readAt_createdAt_idx"
  ON "notifications"("userId", "readAt", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx"
  ON "notifications"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_epaObservationId_idx"
  ON "notifications"("epaObservationId");

-- ─── push_subscriptions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id"        TEXT        PRIMARY KEY,
  "userId"    TEXT        NOT NULL,
  "endpoint"  TEXT        NOT NULL,
  "p256dh"    TEXT        NOT NULL,
  "auth"      TEXT        NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsed"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE("endpoint"),
  CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "push_subscriptions_userId_idx"
  ON "push_subscriptions"("userId");

-- ─── user_notification_preferences ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
  "id"                       TEXT        PRIMARY KEY,
  "userId"                   TEXT        NOT NULL,
  "inAppEnabled"             BOOLEAN     NOT NULL DEFAULT true,
  "pushEnabled"              BOOLEAN     NOT NULL DEFAULT true,
  "emailEnabled"             BOOLEAN     NOT NULL DEFAULT true,
  "notifyOnEpaSubmitted"     BOOLEAN     NOT NULL DEFAULT true,
  "notifyOnEpaVerified"      BOOLEAN     NOT NULL DEFAULT true,
  "notifyOnEpaReturned"      BOOLEAN     NOT NULL DEFAULT true,
  "notifyOnBatchSigned"      BOOLEAN     NOT NULL DEFAULT true,
  "soundEnabled"             BOOLEAN     NOT NULL DEFAULT true,
  "hapticsEnabled"           BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_notification_preferences_userId_key" UNIQUE("userId"),
  CONSTRAINT "user_notification_preferences_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
