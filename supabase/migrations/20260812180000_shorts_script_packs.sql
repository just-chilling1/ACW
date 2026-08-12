-- Per-user customized Shorts Vault scripts (single-script packs).

CREATE TABLE IF NOT EXISTS shorts_script_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_script_id TEXT NOT NULL,
    niche_id TEXT NOT NULL,
    affiliate_link TEXT NOT NULL,
    offer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    script JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, source_script_id, affiliate_link)
);

CREATE INDEX IF NOT EXISTS idx_shorts_script_packs_user_id
    ON shorts_script_packs(user_id);

CREATE INDEX IF NOT EXISTS idx_shorts_script_packs_user_created
    ON shorts_script_packs(user_id, created_at DESC);

ALTER TABLE shorts_script_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own shorts script packs" ON shorts_script_packs;
CREATE POLICY "Users manage own shorts script packs"
    ON shorts_script_packs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
