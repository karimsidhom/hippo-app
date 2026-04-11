-- ══════════════════════════════════════════════════════════════════════════
-- Quote Library — Supabase / PostgreSQL Schema
-- ══════════════════════════════════════════════════════════════════════════

-- ── Quotes table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Quote" (
  id               SERIAL PRIMARY KEY,
  quote            TEXT NOT NULL,
  short_quote      TEXT,
  author           TEXT NOT NULL,
  era              TEXT NOT NULL,
  source           TEXT,
  source_confidence TEXT NOT NULL DEFAULT 'medium'
    CHECK (source_confidence IN ('high', 'medium', 'low')),
  themes           TEXT[] NOT NULL DEFAULT '{}',
  category         TEXT NOT NULL
    CHECK (category IN (
      'clinical_wisdom', 'surgeon_mindset', 'leadership', 'patient_care',
      'philosophy', 'resilience', 'excellence', 'teaching', 'reflection',
      'founder_vision'
    )),
  mood             TEXT NOT NULL
    CHECK (mood IN (
      'stoic', 'calm', 'elite', 'visionary', 'disciplined',
      'reflective', 'relentless', 'compassionate'
    )),
  use_case         TEXT[] NOT NULL DEFAULT '{}',
  is_verified      BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quote_author ON "Quote" (author);
CREATE INDEX idx_quote_category ON "Quote" (category);
CREATE INDEX idx_quote_mood ON "Quote" (mood);
CREATE INDEX idx_quote_themes ON "Quote" USING GIN (themes);
CREATE INDEX idx_quote_use_case ON "Quote" USING GIN (use_case);
CREATE INDEX idx_quote_verified ON "Quote" (is_verified);

-- ── User favorite quotes ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "UserFavoriteQuote" (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  quote_id     INTEGER NOT NULL REFERENCES "Quote"(id) ON DELETE CASCADE,
  favorited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, quote_id)
);

CREATE INDEX idx_fav_user ON "UserFavoriteQuote" (user_id);
CREATE INDEX idx_fav_quote ON "UserFavoriteQuote" (quote_id);

-- ── User quote history (for no-repeat rotation) ─────────────────────────

CREATE TABLE IF NOT EXISTS "UserQuoteHistory" (
  id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  quote_id INTEGER NOT NULL REFERENCES "Quote"(id) ON DELETE CASCADE,
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_user ON "UserQuoteHistory" (user_id);
CREATE INDEX idx_history_shown ON "UserQuoteHistory" (shown_at DESC);

-- ── Helper: get next unused quote for a user ─────────────────────────────

CREATE OR REPLACE FUNCTION get_next_unused_quote(p_user_id TEXT)
RETURNS SETOF "Quote" AS $$
BEGIN
  RETURN QUERY
  SELECT q.*
  FROM "Quote" q
  WHERE q.id NOT IN (
    SELECT h.quote_id
    FROM "UserQuoteHistory" h
    WHERE h.user_id = p_user_id
  )
  ORDER BY random()
  LIMIT 1;

  -- If all quotes seen, reset and return random
  IF NOT FOUND THEN
    DELETE FROM "UserQuoteHistory" WHERE user_id = p_user_id;
    RETURN QUERY
    SELECT q.* FROM "Quote" q ORDER BY random() LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ── Helper: quote of the day (deterministic by date) ─────────────────────

CREATE OR REPLACE FUNCTION get_quote_of_the_day()
RETURNS SETOF "Quote" AS $$
DECLARE
  day_of_year INTEGER;
  total_quotes INTEGER;
  target_id INTEGER;
BEGIN
  day_of_year := EXTRACT(DOY FROM CURRENT_DATE)::INTEGER;
  SELECT COUNT(*) INTO total_quotes FROM "Quote";
  IF total_quotes = 0 THEN RETURN; END IF;

  -- Get the quote at position (day_of_year % total)
  SELECT q.id INTO target_id
  FROM "Quote" q
  ORDER BY q.id
  OFFSET (day_of_year % total_quotes)
  LIMIT 1;

  RETURN QUERY SELECT q.* FROM "Quote" q WHERE q.id = target_id;
END;
$$ LANGUAGE plpgsql;
