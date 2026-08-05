-- Tighten RLS: authenticated users only for app data tables.
-- Apply in Supabase SQL editor or via CLI.

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select" ON search_history;
DROP POLICY IF EXISTS "Allow anon insert" ON search_history;

CREATE POLICY "Users read own search history"
    ON search_history FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users insert own search history"
    ON search_history FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select" ON analysis_results;
DROP POLICY IF EXISTS "Allow anon insert" ON analysis_results;

CREATE POLICY "Authenticated read analysis cache"
    ON analysis_results FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated insert analysis cache"
    ON analysis_results FOR INSERT
    TO authenticated
    WITH CHECK (true);

ALTER TABLE keyword_variations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select" ON keyword_variations;
DROP POLICY IF EXISTS "Allow anon insert" ON keyword_variations;

CREATE POLICY "Authenticated read keyword variations"
    ON keyword_variations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated insert keyword variations"
    ON keyword_variations FOR INSERT
    TO authenticated
    WITH CHECK (true);

ALTER TABLE generated_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select" ON generated_replies;
DROP POLICY IF EXISTS "Allow anon insert" ON generated_replies;

CREATE POLICY "Authenticated read generated replies"
    ON generated_replies FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated insert generated replies"
    ON generated_replies FOR INSERT
    TO authenticated
    WITH CHECK (true);
