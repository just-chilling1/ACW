-- Quora + Pinterest Vault: generated kits (Instant-style)

CREATE TABLE IF NOT EXISTS vault_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_url TEXT NOT NULL DEFAULT '',
    offer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    niche_id TEXT NOT NULL DEFAULT 'make_money_online',
    name TEXT NOT NULL DEFAULT 'Untitled Vault Kit',
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'building', 'ready', 'failed')),
    build_progress JSONB NOT NULL DEFAULT '{"completedStages":[]}'::jsonb,
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_id UUID NOT NULL REFERENCES vault_kits(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'post'
        CHECK (type IN ('post')),
    platform TEXT NOT NULL
        CHECK (platform IN ('quora', 'pinterest')),
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    angle TEXT NOT NULL DEFAULT '',
    why TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'ready'
        CHECK (status IN ('ready', 'used', 'saved')),
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_kits_user_id ON vault_kits(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_kits_status ON vault_kits(status);
CREATE INDEX IF NOT EXISTS idx_vault_assets_kit_id ON vault_assets(kit_id);
CREATE INDEX IF NOT EXISTS idx_vault_assets_platform ON vault_assets(platform);

ALTER TABLE vault_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own vault kits" ON vault_kits;
CREATE POLICY "Users manage own vault kits"
    ON vault_kits FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own vault assets" ON vault_assets;
CREATE POLICY "Users manage own vault assets"
    ON vault_assets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM vault_kits k
            WHERE k.id = vault_assets.kit_id
            AND k.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vault_kits k
            WHERE k.id = vault_assets.kit_id
            AND k.user_id = auth.uid()
        )
    );
