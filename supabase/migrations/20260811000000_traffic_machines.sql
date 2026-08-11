-- Traffic Machine (Automated Profits): per-user machine state and activations

CREATE TABLE IF NOT EXISTS traffic_machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_url TEXT NOT NULL DEFAULT '',
    offer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    audience_niche TEXT NOT NULL DEFAULT 'not_sure',
    goal TEXT NOT NULL DEFAULT 'visitors'
        CHECK (goal IN ('visitors', 'clicks', 'sales', 'passive')),
    stage TEXT NOT NULL DEFAULT 'discover'
        CHECK (stage IN ('discover', 'activate', 'grow', 'optimize')),
    status TEXT NOT NULL DEFAULT 'setup'
        CHECK (status IN ('setup', 'building', 'ready')),
    plan JSONB NOT NULL DEFAULT '{"days":[]}'::jsonb,
    experiments JSONB NOT NULL DEFAULT '[]'::jsonb,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS traffic_machine_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES traffic_machines(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'needs_attention', 'dismissed')),
    activated_at TIMESTAMPTZ,
    promotion_kit JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (machine_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_traffic_machines_user_id ON traffic_machines(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_machine_activations_machine_id ON traffic_machine_activations(machine_id);

ALTER TABLE traffic_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_machine_activations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own traffic machines" ON traffic_machines;
CREATE POLICY "Users manage own traffic machines"
    ON traffic_machines FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own traffic activations" ON traffic_machine_activations;
CREATE POLICY "Users manage own traffic activations"
    ON traffic_machine_activations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM traffic_machines tm
            WHERE tm.id = traffic_machine_activations.machine_id
            AND tm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM traffic_machines tm
            WHERE tm.id = traffic_machine_activations.machine_id
            AND tm.user_id = auth.uid()
        )
    );
