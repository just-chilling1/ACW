-- Instant Income: promotion kits, assets, feedback

CREATE TABLE IF NOT EXISTS promotion_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_url TEXT NOT NULL DEFAULT '',
    offer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    name TEXT NOT NULL DEFAULT 'Untitled Kit',
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'building', 'ready', 'failed')),
    build_progress JSONB NOT NULL DEFAULT '{"completedStages":[]}'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '{}'::jsonb,
    quick_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
    checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotion_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_id UUID NOT NULL REFERENCES promotion_kits(id) ON DELETE CASCADE,
    type TEXT NOT NULL
        CHECK (type IN ('post', 'hook', 'reply', 'cta', 'angle')),
    platform TEXT NOT NULL DEFAULT 'General',
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    angle TEXT NOT NULL DEFAULT '',
    cta TEXT NOT NULL DEFAULT '',
    why TEXT NOT NULL DEFAULT '',
    include_link BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'ready'
        CHECK (status IN ('ready', 'used', 'saved')),
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotion_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kit_id UUID NOT NULL REFERENCES promotion_kits(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES promotion_assets(id) ON DELETE SET NULL,
    result TEXT NOT NULL DEFAULT 'not_sure'
        CHECK (result IN ('yes', 'no', 'not_sure')),
    signals JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotion_kits_user_id ON promotion_kits(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_kits_status ON promotion_kits(status);
CREATE INDEX IF NOT EXISTS idx_promotion_assets_kit_id ON promotion_assets(kit_id);
CREATE INDEX IF NOT EXISTS idx_promotion_assets_type ON promotion_assets(type);
CREATE INDEX IF NOT EXISTS idx_promotion_feedback_kit_id ON promotion_feedback(kit_id);
CREATE INDEX IF NOT EXISTS idx_promotion_feedback_user_id ON promotion_feedback(user_id);

ALTER TABLE promotion_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own promotion kits" ON promotion_kits;
CREATE POLICY "Users manage own promotion kits"
    ON promotion_kits FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own promotion assets" ON promotion_assets;
CREATE POLICY "Users manage own promotion assets"
    ON promotion_assets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM promotion_kits k
            WHERE k.id = promotion_assets.kit_id
            AND k.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM promotion_kits k
            WHERE k.id = promotion_assets.kit_id
            AND k.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users manage own promotion feedback" ON promotion_feedback;
CREATE POLICY "Users manage own promotion feedback"
    ON promotion_feedback FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
