-- ============================================================================
-- Per-digest notification preferences.
--
-- Adds four toggles to user_notification_preferences so a Hippo user can
-- separately opt in / out of:
--   • the resident weekly summary
--   • the attending weekly "EPAs awaiting your sign-off" digest
--   • the PD weekly cohort digest
--   • the 1-week-before CC meeting prep email
--
-- Defaults are all-on — opt-out, not opt-in. A user can switch any of
-- them off in Settings → Notifications without affecting the others.
-- ============================================================================

ALTER TABLE "user_notification_preferences"
  ADD COLUMN "weeklyResidentDigest"  BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE "user_notification_preferences"
  ADD COLUMN "weeklyAttendingDigest" BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE "user_notification_preferences"
  ADD COLUMN "weeklyPdDigest"        BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE "user_notification_preferences"
  ADD COLUMN "ccMeetingPrepDigest"   BOOLEAN NOT NULL DEFAULT TRUE;
