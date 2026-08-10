-- DFY Campaign Builder: campaigns, opportunities, saved offers, FK wiring

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Untitled Campaign',
    offer_url TEXT NOT NULL,
    offer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    audience_mode TEXT NOT NULL DEFAULT 'auto',
    channels JSONB NOT NULL DEFAULT '["everywhere"]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'building', 'ready', 'failed')),
    build_progress JSONB NOT NULL DEFAULT '{}'::jsonb,
    strategy JSONB NOT NULL DEFAULT '{}'::jsonb,
    score INTEGER,
    score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    primary_keyword TEXT,
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    context TEXT NOT NULL DEFAULT '',
    engagement TEXT,
    relevance_score INTEGER NOT NULL DEFAULT 0,
    intent_score INTEGER NOT NULL DEFAULT 0,
    opportunity_score INTEGER NOT NULL DEFAULT 0,
    label TEXT NOT NULL DEFAULT 'good'
        CHECK (label IN ('excellent', 'strong', 'good', 'low')),
    why_selected TEXT NOT NULL DEFAULT '',
    recommended_approach TEXT NOT NULL DEFAULT '',
    recommended_reply TEXT NOT NULL DEFAULT '',
    alternative_replies JSONB NOT NULL DEFAULT '[]'::jsonb,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dfy_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Saved Offer',
    snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_opportunities_campaign_id ON campaign_opportunities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dfy_offers_user_id ON dfy_offers(user_id);

-- Wire existing campaign_assets / campaign_actions to campaigns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'campaign_assets_campaign_id_fkey'
    ) THEN
        ALTER TABLE campaign_assets
            ADD CONSTRAINT campaign_assets_campaign_id_fkey
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'campaign_actions_campaign_id_fkey'
    ) THEN
        ALTER TABLE campaign_actions
            ADD CONSTRAINT campaign_actions_campaign_id_fkey
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfy_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own campaigns" ON campaigns;
CREATE POLICY "Users manage own campaigns"
    ON campaigns FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own campaign opportunities" ON campaign_opportunities;
CREATE POLICY "Users manage own campaign opportunities"
    ON campaign_opportunities FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = campaign_opportunities.campaign_id
            AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = campaign_opportunities.campaign_id
            AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users manage own dfy offers" ON dfy_offers;
CREATE POLICY "Users manage own dfy offers"
    ON dfy_offers FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own campaign assets" ON campaign_assets;
CREATE POLICY "Users manage own campaign assets"
    ON campaign_assets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = campaign_assets.campaign_id
            AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = campaign_assets.campaign_id
            AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users manage own campaign actions" ON campaign_actions;
CREATE POLICY "Users manage own campaign actions"
    ON campaign_actions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = campaign_actions.campaign_id
            AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = campaign_actions.campaign_id
            AND c.user_id = auth.uid()
        )
    );
