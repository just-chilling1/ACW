# Vault Generate Kits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Vault’s static Quora/Pinterest library with Instant-style offer-aware kit generation (niche + affiliate link → saved kits).

**Architecture:** New `vault_kits` / `vault_assets` tables; kit engine + Quora/Pinterest content prompts mirroring Instant’s build flow; pages at `/vault`, `/vault/build`, `/vault/kit/[id]`.

**Tech Stack:** Next.js App Router, Supabase (RLS), existing `analyzeOffer` / `callChatGPT` / Instant safety helpers, Premium UI shell.

## Global Constraints

- Quora + Pinterest only; ~6 each per kit
- Multiple kits per user
- No static catalog in product path
- Affiliate URL baked into copy
- Reuse Instant safety rules

---

### Task 1: Migration + types

**Files:**
- Create: `supabase/migrations/20260813120000_vault_kits.sql`
- Create: `src/lib/vault/kit-types.ts`
- Modify: replace usage of old `src/lib/vault/types.ts` VaultEntry where still needed for cards

- [ ] Create tables `vault_kits` and `vault_assets` with RLS (mirror Instant)
- [ ] Define `VaultKitRow`, `VaultAssetRow`, stages, stats types

### Task 2: Generation engine

**Files:**
- Create: `src/lib/vault/kit-fallbacks.ts`
- Create: `src/lib/vault/kit-content-engine.ts`
- Create: `src/lib/vault/kit-engine.ts`

- [ ] `generateQuoraAnswers` + `generatePinterestPins` with LLM + fallbacks
- [ ] `runVaultKitBuild` with staged progress updates
- [ ] `getVaultKitWithAssets` helper
- [ ] `assetToVaultEntry` mapper for card UI

### Task 3: API routes

**Files:**
- Create: `src/app/api/vault/analyze-offer/route.ts`
- Create: `src/app/api/vault/kits/route.ts`
- Create: `src/app/api/vault/kits/[id]/route.ts`
- Create: `src/app/api/vault/kits/[id]/build/route.ts`

- [ ] Mirror Instant auth + create/list/get/delete/build patterns
- [ ] Persist niche_id on kit create/update from audienceMode

### Task 4: UI

**Files:**
- Create: `src/components/vault/vault-build-sequence.tsx`
- Modify: `src/app/vault/page.tsx` (landing + kit list)
- Create: `src/app/vault/build/page.tsx`
- Create: `src/app/vault/kit/[id]/page.tsx`
- Modify: `src/components/vault/VaultEntryCard.tsx` (drop customize-required props for kit mode)
- Modify: `src/lib/premium-features.ts` (Vault description)

- [ ] Landing like Instant
- [ ] Build flow analyze → niche → progress
- [ ] Kit detail Quora/Pinterest tabs + copy cards

### Task 5: Cleanup static library from product path

**Files:**
- Stop importing `src/lib/vault/catalog` / content modules from `/vault`
- Leave content files deletable in a follow-up if nothing else imports them

- [ ] Grep for catalog/content imports; remove from vault UX
- [ ] Smoke-check TypeScript on touched files
