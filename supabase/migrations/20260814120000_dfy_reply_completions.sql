-- Per-user "mark reply done" tracking for DFY seeded replies

CREATE TABLE IF NOT EXISTS dfy_reply_completions (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reply_id UUID NOT NULL REFERENCES dfy_seed_replies(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, reply_id)
);

CREATE INDEX IF NOT EXISTS idx_dfy_reply_completions_user
    ON dfy_reply_completions (user_id);

CREATE INDEX IF NOT EXISTS idx_dfy_reply_completions_reply
    ON dfy_reply_completions (reply_id);

ALTER TABLE dfy_reply_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own reply completions" ON dfy_reply_completions;
CREATE POLICY "Users manage own reply completions"
    ON dfy_reply_completions FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
