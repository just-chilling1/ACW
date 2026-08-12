# Strategy digest — instant-income-speed

## Categories tried
- architecture: 1 kept (parallel LLM + batch insert + UX copy)
- data-handling / algorithm: absorbed into the same change

## Key learnings
- Kit build latency was dominated by sequential LLM stages, not page JS.
- Content generators are independent and safe to `Promise.all`.
- Row-by-row Supabase inserts were a secondary but real cost; batching by type is enough.
- Quick plan does not need an LLM call for the Instant Income linear flow.

## Current best
- estimated_wall_seconds: 49.72 → 8.2 (−83%)
- llm_waves: 6 → 1
- db_insert_round_trips: 43 → 5

## Frontier
- Live end-to-end timing against RapidAPI (optional, needs env).
- Quality judge pass on sample affiliate offers (future loop).
