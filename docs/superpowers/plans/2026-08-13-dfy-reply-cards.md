# DFY Reply Cards Implementation Plan

> **For agentic workers:** Execute inline in this session (user requested immediate implementation).

**Goal:** Ship BlackBox-style DFY reply cards with View/Mark done, all-niche preload, improved link picker, and 60 varied-tone seeded replies per niche.

**Architecture:** Supabase completions table + bulk seeded API; client caches all niches; compact card + modal UI; upgraded seed script rotates tones and fills to 60.

**Tech Stack:** Next.js App Router, Supabase, existing DFY CSS theme, TypeScript

## Global Constraints
- Keep CashWave dark/gold DFY theme (layout like BlackBox, not cream palette)
- Do not commit unless user asks
- Prefer unique real Reddit URLs; multi-tone per post only to fill to 60

---

### Task 1: Completions migration + API
**Files:**
- Create: `supabase/migrations/20260814120000_dfy_reply_completions.sql`
- Create: `src/app/api/dfy/replies/completions/route.ts`
- Modify: `src/lib/dfy/seed-posts.ts`, `src/app/api/dfy/replies/seeded/route.ts`

### Task 2: Card + modal + link combobox UI
**Files:**
- Modify: `src/components/dfy/reply-card.tsx`
- Create: `src/components/dfy/reply-view-modal.tsx`
- Create: `src/components/dfy/link-combobox.tsx`
- Modify: `src/app/dfy/page.tsx`, `src/app/globals.css`

### Task 3: Seed script quality + volume
**Files:**
- Modify: `scripts/seed-dfy-replies.ts`
- Expand fallbacks via `src/lib/dfy/search-fallbacks.ts` usage
- Wipe + reseed to 60/niche with tone rotation

### Task 4: Verify
- Typecheck / lint touched files
- Confirm API shapes and UI wiring
