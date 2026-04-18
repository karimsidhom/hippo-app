-- ─────────────────────────────────────────────────────────────────────────────
-- RLS for notifications / push_subscriptions / user_notification_preferences
--
-- Follows the pattern set by 20260414010000_add_rls_baseline:
--
--   1. Enable RLS on each new table.
--   2. A RESTRICTIVE deny-all policy for the anon + authenticated roles.
--      Prevents PostgREST-level access if the anon key ever leaks.
--   3. A PERMISSIVE per-user policy that scopes reads/writes to auth.uid().
--      Today this is dormant because Prisma runs as the `postgres` super-
--      user which bypasses RLS entirely. It activates immediately if we
--      later move Prisma off the superuser (tracked in the risk checklist).
--
-- Safe to re-run: drops any pre-existing same-named policies first.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
  col text;
  tables text[] := ARRAY['notifications', 'push_subscriptions', 'user_notification_preferences'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      RAISE NOTICE 'Skipping RLS for %.% — table does not exist', 'public', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Baseline deny (matches the pattern for the rest of the schema).
    EXECUTE format('DROP POLICY IF EXISTS hippo_deny_anon_authenticated ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY hippo_deny_anon_authenticated ON public.%I
        AS RESTRICTIVE
        FOR ALL
        TO anon, authenticated
        USING (false)
        WITH CHECK (false)',
      t
    );

    -- Per-user scoping, dormant under Prisma-as-superuser but ready to
    -- activate when we move to a non-superuser role. Uses auth.uid()
    -- (Supabase's built-in JWT helper).
    EXECUTE format('DROP POLICY IF EXISTS hippo_own_rows ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY hippo_own_rows ON public.%I
        FOR ALL
        TO authenticated
        USING ((auth.uid())::text = "userId")
        WITH CHECK ((auth.uid())::text = "userId")',
      t
    );
  END LOOP;
END
$$;
