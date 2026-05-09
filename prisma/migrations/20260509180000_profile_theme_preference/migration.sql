-- ============================================================================
-- Profile.theme — cross-device theme preference sync.
--
-- localStorage["hippo-theme"] remains the synchronous fast-path read for the
-- bootstrap script in <head>; this column is the canonical cross-device
-- value that ThemeContext writes back to via /api/profile and that
-- /api/auth/me hands the client on every login.
-- ============================================================================

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'dark';
