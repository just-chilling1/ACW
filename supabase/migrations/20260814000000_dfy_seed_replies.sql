-- DFY Hybrid Replies: seeded library + custom reply requests

CREATE TABLE IF NOT EXISTS dfy_seed_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    niche TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'Reddit',
    subreddit TEXT,
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL,
    engagement INTEGER NOT NULL DEFAULT 0,
    verified_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dfy_seed_posts_url ON dfy_seed_posts (url);
CREATE INDEX IF NOT EXISTS idx_dfy_seed_posts_niche_active ON dfy_seed_posts (niche, active);

CREATE TABLE IF NOT EXISTS dfy_seed_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES dfy_seed_posts(id) ON DELETE CASCADE,
    niche TEXT NOT NULL,
    style TEXT NOT NULL DEFAULT 'helpful',
    body TEXT NOT NULL DEFAULT '',
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dfy_seed_replies_niche ON dfy_seed_replies (niche);
CREATE INDEX IF NOT EXISTS idx_dfy_seed_replies_post_id ON dfy_seed_replies (post_id);

CREATE TABLE IF NOT EXISTS dfy_reply_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    niche TEXT NOT NULL,
    ideal_customer TEXT NOT NULL DEFAULT '',
    problem_solved TEXT NOT NULL DEFAULT '',
    offer_url TEXT NOT NULL,
    offer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'building', 'ready', 'failed')),
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dfy_reply_requests_user_id ON dfy_reply_requests (user_id);

CREATE TABLE IF NOT EXISTS dfy_generated_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES dfy_reply_requests(id) ON DELETE CASCADE,
    platform TEXT NOT NULL DEFAULT 'Reddit',
    url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    context TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    style TEXT NOT NULL DEFAULT 'helpful',
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dfy_generated_replies_request_id ON dfy_generated_replies (request_id);

-- RLS
ALTER TABLE dfy_seed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfy_seed_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfy_reply_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfy_generated_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read seed posts" ON dfy_seed_posts;
CREATE POLICY "Authenticated read seed posts"
    ON dfy_seed_posts FOR SELECT
    TO authenticated
    USING (active = true);

DROP POLICY IF EXISTS "Authenticated read seed replies" ON dfy_seed_replies;
CREATE POLICY "Authenticated read seed replies"
    ON dfy_seed_replies FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users manage own reply requests" ON dfy_reply_requests;
CREATE POLICY "Users manage own reply requests"
    ON dfy_reply_requests FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own generated replies" ON dfy_generated_replies;
CREATE POLICY "Users manage own generated replies"
    ON dfy_generated_replies FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM dfy_reply_requests r
            WHERE r.id = dfy_generated_replies.request_id
            AND r.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dfy_reply_requests r
            WHERE r.id = dfy_generated_replies.request_id
            AND r.user_id = auth.uid()
        )
    );
