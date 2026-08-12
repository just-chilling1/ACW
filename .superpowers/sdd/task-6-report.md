# Task 6 Report: Verify Quora/Pinterest Vault Offer Packs

**Status:** PASS (static verification)  
**Date:** 2026-08-12  
**Scope:** Task 6 — typecheck/lint, smoke checklist, migration note. No git commit.

---

## Step 1: Typecheck / lint

| Command | Result | Notes |
|---------|--------|-------|
| `npx tsc --noEmit` | **FAIL** (1 error) | Pre-existing, unrelated: `src/lib/dfy/content-engine.ts:221` — `meta` optional vs required. **No vault offer-pack file errors.** |
| `npx eslint` on vault files | **PASS** | `src/app/vault/**`, `src/app/api/vault/**`, `vault-packs.ts`, `vault-customize.ts`, `VaultEntryCard.tsx` |
| `npm run validate:vault` | **PASS** | 160 entries across 8 niches |
| `npm run validate:shorts` | **PASS** | 40 scripts across 8 niches |

---

## Step 2: Spec smoke checklist (static / code inspection)

Browser and authenticated E2E not run (no live app session). Evidence from source.

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | Paste link → pick niche → posts show with link; Filter section gone | **PASS** | `applyAffiliateLink` via `substituteLink` in `catalog.ts:27–31`; link keys `acw.vault.affiliateLink` / `acw.vault.niche` in `vault/page.tsx:17–18`. No Filter UI, `SelectableChip`, platform filter, or SearchContext — confirmed by grep and page structure (sections 1–4 only). |
| 2 | Customize Quora + Pinterest → My library; recustomize same source+link updates pack | **PASS** | `POST /api/vault/customize` upserts on `(user_id, source_entry_id, affiliate_link)` (`customize/route.ts:48–61`). Client reconciles duplicates (`page.tsx:207–216`). Section **4. My library** at `page.tsx:344–387`. |
| 3 | Delete pack; invalid link blocks customize; curated works with empty link | **PASS** | `DELETE /api/vault/packs/[id]` exists. `handleCustomize` guards with `isSafeHttpUrl` + focus hint (`page.tsx:178–184`). Curated browse uses `applyAffiliateLink`; empty link strips `__LINK__` via `substituteLink` (`ttl.ts:18–22`) — no customize API call without valid link. |
| 4 | Saved/used persist for curated ids; packs not on `/shorts-vault` | **PASS** | `/api/vault/state` uses `vault_entry_states` + `isVaultEntryId` (`state/route.ts:40–41`). Shorts page uses `/api/shorts-vault/packs` only for library (`shorts-vault/page.tsx:101`); shares state API only for saved/used marks — vault entry packs table not referenced from shorts routes. |
| 5 | Migration applied in test environment | **NOT VERIFIED** | File exists locally: `supabase/migrations/20260812190000_vault_entry_packs.sql`. Remote Supabase MCP unavailable (no `project_id`). Per Task 1 plan: apply when user requests. Customize/list/delete will 500 until migration is applied. |

---

## Migration

- **Local file:** `supabase/migrations/20260812190000_vault_entry_packs.sql` — present; defines `vault_entry_packs`, indexes, RLS.
- **Remote:** Not confirmed applied. Manual customize tests require applying this migration to the target Supabase project first.

---

## Shorts vault isolation

- Separate localStorage keys: `acw.shorts-vault.niche` / `acw.shorts-vault.affiliateLink` vs `acw.vault.*`.
- Separate pack APIs: `/api/shorts-vault/packs` vs `/api/vault/packs`.
- `validate:shorts` PASS; no edits to shorts vault files in this task chain.

---

## Concerns

1. **E2E not exercised** — LLM customize, auth, and DB upsert/delete require running app + applied migration + API keys.
2. **Project typecheck** — one unrelated `dfy/content-engine.ts` error remains; does not block vault offer-pack files.
3. **Migration** — must be applied before production/staging customize flows.

---

## Commits

None (per instructions).

---

## Final code review fixes

**Status:** Implemented and statically verified  
**Date:** 2026-08-12

- **I2 — Invalid link substitution:** The Vault page now displays the invalid-link hint continuously whenever the trimmed input is non-empty and unsafe. Curated entries receive an empty affiliate link until the input passes `isSafeHttpUrl`, preventing broken URLs from being baked into copyable posts.
- **I3 — Better rewrite candidate:** Rewrite attempts are ranked `strict > soft > invalid`. A soft-valid first attempt is retained unless the retry ranks higher, including when the retry is invalid or throws.
- **I4 — Concurrent customize:** In-flight customization state is now a `Set<string>`, so each card independently enters and leaves its pending state without clearing other concurrent requests.
- **Minor — Pack ordering:** `GET /api/vault/packs` now orders by `updated_at DESC`.
- **Scope:** No Shorts Vault files changed. No SSRF changes. No git commit.

### Verification

- Targeted ESLint on the three modified source files: **PASS**
- `npm run validate:vault`: **PASS** — 160 entries across 8 niches
- `npx tsc --noEmit`: **FAIL** only on the previously documented unrelated error in `src/lib/dfy/content-engine.ts:221` (`meta` optional vs required); no errors reported in the modified Vault files
- IDE diagnostics on the modified source files: **PASS**
