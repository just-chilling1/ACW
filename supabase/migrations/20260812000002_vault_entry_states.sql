-- Per-user save/used state for Quora + Pinterest Vault entries.
-- entry_id is free-text because entries live in code, not in the database.

CREATE TABLE IF NOT EXISTS vault_entry_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL,
    saved BOOLEAN NOT NULL DEFAULT false,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_vault_entry_states_user_id ON vault_entry_states(user_id);

ALTER TABLE vault_entry_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own vault entry states" ON vault_entry_states;
CREATE POLICY "Users manage own vault entry states"
    ON vault_entry_states FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
