-- ─────────────────────────────────────────────────────────────────────────────
-- RLS BASELINE — deny all access via Supabase's PostgREST auth roles.
--
-- Context: Hippo's runtime reads/writes through Prisma as the `postgres` role,
-- which has BYPASSRLS. PostgREST (Supabase's auto-generated REST API) uses
-- the `anon` and `authenticated` roles. We never use PostgREST directly, but
-- if the anon key ever leaks it would expose every row by default.
--
-- This migration:
--   1. Enables RLS on every table.
--   2. Creates a single default policy per table that denies access to the
--      `anon` and `authenticated` roles (USING false, WITH CHECK false).
--   3. Leaves Prisma (`postgres`, superuser, BYPASSRLS) unaffected — the app
--      continues to work exactly as before.
--
-- Future hardening (tracked in the risk checklist): move Prisma off the
-- superuser role and write real per-user policies against auth.uid(). That
-- is a bigger project because Prisma has to pass the JWT through as a GUC on
-- every query. For now this baseline prevents direct PostgREST access as a
-- defense-in-depth layer.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'users',
    'legal_acceptances',
    'user_dictation_styles',
    'profiles',
    'specialties',
    'procedure_definitions',
    'case_logs',
    'milestones',
    'personal_records',
    'friend_requests',
    'friendships',
    'feed_events',
    'quotes',
    'user_favorite_quotes',
    'user_quote_history',
    'scheduled_cases',
    'follows',
    'portfolio_cases',
    'pearls',
    'pearl_likes',
    'pearl_saves',
    'pearl_comments',
    'pearl_reactions',
    'pearl_endorsements',
    'poll_votes',
    'epa_observations',
    'attending_notifications',
    'audit_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Skip tables that don't exist yet (planned features).
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      RAISE NOTICE 'Skipping RLS for %.% — table does not exist yet', 'public', t;
      CONTINUE;
    END IF;

    -- Enable RLS. ALTER is idempotent when already enabled.
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Drop any pre-existing baseline policy so this migration is re-runnable.
    EXECUTE format('DROP POLICY IF EXISTS hippo_deny_anon_authenticated ON public.%I', t);

    -- Deny all access to the anon + authenticated roles. Prisma (postgres)
    -- is a superuser and bypasses RLS entirely, so the app still works.
    EXECUTE format(
      'CREATE POLICY hippo_deny_anon_authenticated ON public.%I
        AS RESTRICTIVE
        FOR ALL
        TO anon, authenticated
        USING (false)
        WITH CHECK (false)',
      t
    );
  END LOOP;
END
$$;
