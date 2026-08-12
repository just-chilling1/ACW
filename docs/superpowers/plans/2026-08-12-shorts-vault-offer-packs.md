# Shorts Vault Offer Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve `/shorts-vault` into link → niche → curated scripts with optional offer-aware per-script customize saved as account-backed packs, and remove the Filter the library section.

**Architecture:** Page-local affiliate link drives curated `__LINK__` substitution. Customize API analyzes the offer page, LLM-rewrites one curated seed script, and upserts `shorts_script_packs`. My library lists/deletes packs. Saved/used stays on curated cards via existing vault state.

**Tech Stack:** Next.js App Router, Supabase (RLS), existing `analyzeOffer` / `callChatGPT`, Framer Motion page shell.

**Spec:** [docs/superpowers/specs/2026-08-12-shorts-vault-offer-packs-design.md](../specs/2026-08-12-shorts-vault-offer-packs-design.md)

## Global Constraints

- Affiliate link is page-local only (`acw.shorts-vault.affiliateLink`); never call `setAffiliateLink`.
- No Filter the library UI (no platform chips, Saved only, Hide used).
- Customize is one script per request; packs upsert on `(user_id, source_script_id, affiliate_link)`.
- Spoken fields never contain raw URLs or `__LINK__`; pack captions contain the real URL exactly once.
- Do not change `/vault` behavior.
- Skip git commits unless the user explicitly asks (workspace rule).

---

### Task 1: Migration + pack types/mappers

**Files:**
- Create: `supabase/migrations/20260812180000_shorts_script_packs.sql`
- Create: `src/lib/vault/shorts-packs.ts`

**Interfaces:**
- Produces: `ShortsScriptPack`, `mapPackRow`, table schema matching the spec

- [x] **Step 1:** Add migration with table, unique `(user_id, source_script_id, affiliate_link)`, RLS, index on `user_id`.
- [x] **Step 2:** Add `shorts-packs.ts` with DTO type + row↔DTO mappers + `isValidPackScript` shape checks used by API.

---

### Task 2: Customize server module + APIs

**Files:**
- Create: `src/lib/vault/shorts-customize.ts`
- Create: `src/app/api/shorts-vault/customize/route.ts`
- Create: `src/app/api/shorts-vault/packs/route.ts`
- Create: `src/app/api/shorts-vault/packs/[id]/route.ts`

**Interfaces:**
- Consumes: `analyzeOffer`, `getShortsScriptById`, `isShortsScriptId`, `sanitizeExternalUrl`, `callChatGPT`, pack mappers
- Produces: `POST /api/shorts-vault/customize`, `GET /api/shorts-vault/packs`, `DELETE /api/shorts-vault/packs/[id]`

- [x] **Step 1:** Implement rewrite prompt + parse/validate/retry in `shorts-customize.ts`.
- [x] **Step 2:** Implement customize route (auth, validate, analyze, rewrite, upsert, return pack).
- [x] **Step 3:** Implement list + delete pack routes (owner RLS via user client).

---

### Task 3: Card + page workflow UX

**Files:**
- Modify: `src/components/vault/ShortsScriptCard.tsx`
- Modify: `src/app/shorts-vault/page.tsx`

- [x] **Step 1:** Add Customize action + pending/error props on the card.
- [x] **Step 2:** Rebuild page: local link field → niche → curated list (no filters) → My library; wire customize/packs/delete; parallel load state + packs.

---

### Task 4: Enhance curated scripts

**Files:**
- Modify: `src/lib/vault/content/shorts/*.ts`

- [x] **Step 1:** Strengthen hooks, beats, CTA/caption across all 8 niche files while keeping validator rules.
- [x] **Step 2:** Run `npm run validate:shorts` and fix failures.

---

### Task 5: Verify

- [x] **Step 1:** Typecheck/lint affected files; fix issues.
- [x] **Step 2:** Smoke checklist from spec (link flow, no filter section, customize saves to library).
