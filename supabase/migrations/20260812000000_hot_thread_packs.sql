-- Shared daily hot-thread packs (global per niche / UTC day).

CREATE TABLE IF NOT EXISTS hot_thread_packs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    niche_id text NOT NULL,
    pack_date date NOT NULL,
    items jsonb NOT NULL DEFAULT '[]'::jsonb,
    refreshed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (niche_id, pack_date)
);

CREATE INDEX IF NOT EXISTS hot_thread_packs_niche_refreshed_idx
    ON hot_thread_packs (niche_id, refreshed_at DESC);

ALTER TABLE hot_thread_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read hot thread packs" ON hot_thread_packs;
DROP POLICY IF EXISTS "Authenticated insert hot thread packs" ON hot_thread_packs;
DROP POLICY IF EXISTS "Authenticated update hot thread packs" ON hot_thread_packs;

CREATE POLICY "Authenticated read hot thread packs"
    ON hot_thread_packs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated insert hot thread packs"
    ON hot_thread_packs FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated update hot thread packs"
    ON hot_thread_packs FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
