-- Per-user customized Quora/Pinterest Vault entries (single-entry packs).

CREATE TABLE IF NOT EXISTS vault_entry_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_entry_id TEXT NOT NULL,
    niche_id TEXT NOT NULL,
    affiliate_link TEXT NOT NULL,
    offer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    entry JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, source_entry_id, affiliate_link)
);

CREATE INDEX IF NOT EXISTS idx_vault_entry_packs_user_id
    ON vault_entry_packs(user_id);

CREATE INDEX IF NOT EXISTS idx_vault_entry_packs_user_created
    ON vault_entry_packs(user_id, created_at DESC);

ALTER TABLE vault_entry_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own vault entry packs" ON vault_entry_packs;
CREATE POLICY "Users manage own vault entry packs"
    ON vault_entry_packs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
