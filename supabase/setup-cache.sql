-- ── AI content cache ──────────────────────────────────────────────────────────
-- Stores the last AI-generated output per user per content type so pages load
-- instantly from cache and users control when to spend a credit on a refresh.

CREATE TABLE IF NOT EXISTS ai_content_cache (
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type text        NOT NULL,
  content      jsonb       NOT NULL,
  conditions   text[]      NOT NULL DEFAULT '{}',
  generated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_type)
);

ALTER TABLE ai_content_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own cache"
  ON ai_content_cache
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Credits column ─────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 300;

-- Back-fill any existing rows that have NULL (shouldn't happen with DEFAULT but just in case)
UPDATE profiles SET credits = 300 WHERE credits IS NULL;

-- ── Atomic credit decrement ────────────────────────────────────────────────────
-- Returns the new credit balance, or -1 if the user had 0 credits (no deduction).
CREATE OR REPLACE FUNCTION decrement_credits(uid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_credits integer;
BEGIN
  UPDATE profiles
  SET    credits = credits - 1
  WHERE  id = uid
    AND  credits > 0
  RETURNING credits INTO new_credits;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN new_credits;
END;
$$;
