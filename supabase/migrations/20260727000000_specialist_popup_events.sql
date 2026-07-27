-- Tracks Start-Up Specialist popup CTA clicks.
-- Run in the shared Supabase project (SQL Editor). Safe to run multiple times.
CREATE TABLE IF NOT EXISTS public.specialist_popup_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event text NOT NULL,
    user_id uuid,
    country text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS specialist_popup_events_event_created_idx
    ON public.specialist_popup_events (event, created_at);

ALTER TABLE public.specialist_popup_events ENABLE ROW LEVEL SECURITY;

-- Inserts come from the app (anon key via the tracking API route).
-- No select policy: counts are read from the Supabase dashboard only.
DROP POLICY IF EXISTS "Allow anon insert" ON public.specialist_popup_events;
CREATE POLICY "Allow anon insert" ON public.specialist_popup_events
    FOR INSERT WITH CHECK (true);

-- Example queries:
--   Total clicks:  SELECT count(*) FROM specialist_popup_events WHERE event = 'cta_call_click';
--   Per day:       SELECT date_trunc('day', created_at) AS day, count(*)
--                  FROM specialist_popup_events WHERE event = 'cta_call_click'
--                  GROUP BY 1 ORDER BY 1 DESC;
