-- Per-user "mark Facebook post done" tracking for Instant Income seeded posts.
-- post_id is a stable catalog id (e.g. fb-wl-01), not a DB foreign key.

CREATE TABLE IF NOT EXISTS instant_post_completions (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id TEXT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_instant_post_completions_user
    ON instant_post_completions (user_id);

CREATE INDEX IF NOT EXISTS idx_instant_post_completions_post
    ON instant_post_completions (post_id);

ALTER TABLE instant_post_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own instant post completions" ON instant_post_completions;
CREATE POLICY "Users manage own instant post completions"
    ON instant_post_completions FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
