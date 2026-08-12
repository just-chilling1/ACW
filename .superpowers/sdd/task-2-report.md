# Task 2 Report: Customize server module (Quora/Pinterest Vault Offer Packs)

**Status:** DONE  
**Date:** 2026-08-12  
**Scope:** Task 2 only — `vault-customize.ts` (no API routes)

---

## Summary

Created `src/lib/vault/vault-customize.ts` per the task brief. The module rewrites Quora/Pinterest vault seed entries for a user’s affiliate link using offer analysis + LLM rewrite, with strict/soft validation via `isValidPackEntry` and an offer-aware fallback path. Patterns mirror `shorts-customize.ts` but use Vault-specific prompts and merge logic.

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/vault/vault-customize.ts` | `customizeVaultEntry` export and helpers |

No other files were modified. No git commit (per instructions).

---

## Public API

### `customizeVaultEntry(opts)`

**Input:** `{ seed: VaultEntry; affiliateLink: string; nicheId: NicheId }`

**Output:** `Promise<{ entry: VaultEntry; offerSnapshot: OfferSnapshot }>`

**Flow:**

1. **`analyzeOffer(affiliateLink, nicheId)`** — on failure, uses **`degradedOffer(nicheId)`** (generic snapshot with Quora/Pinterest promotion channels).
2. **`rewriteOnce`** — `callChatGPT` + `parseJsonFromLlm` + **`mergeRewrite`** (platform-specific field merge, preserves id/platform/nicheId).
3. **Validation** — **`isValidPackEntry`** from `vault-packs.ts`:
   - **Strict:** Quora min 180 words; Pinterest default rules.
   - **Soft:** Quora min 120 words (validator default).
4. Retries rewrite once if strict fails; accepts strict **or** soft pass.
5. **`fallbackOfferAwareEntry`** — replaces `__LINK__` or appends affiliate URL in answer/pinDescription; updates angle from offer.
6. On LLM/validation failure, returns fallback if soft validation passes; otherwise rethrows.

---

## Platform-Specific Behavior

### Quora

- Prompt: helpful rewrite, affiliate URL once in answer (last third), no URLs in question/searchQuery.
- **`mergeRewrite`:** angle, question, searchQuery, answer, topics (max 8).
- **Fallback:** inject link into answer; preserve seed metadata.

### Pinterest

- Prompt: benefit-led pin rewrite; affiliate URL once in pinDescription only.
- **`mergeRewrite`:** angle, pinTitle, pinDescription, boardName, imageConcept, keywords (max 8).
- **Fallback:** inject link into pinDescription; truncate title/description to 100/500 chars.

---

## Dependencies

| Import | Module |
|--------|--------|
| `analyzeOffer` | `@/lib/dfy/offer-analyze` |
| `parseJsonFromLlm` | `@/lib/dfy/parse-json` |
| `OfferSnapshot` | `@/lib/dfy/types` |
| `callChatGPT` | `@/lib/llm` |
| `NicheId` | `@/lib/niches` |
| `isValidPackEntry` | `@/lib/vault/vault-packs` |
| `VaultEntry` | `@/lib/vault/types` |

---

## Typecheck

**Command:** `npx tsc --noEmit`

**Result:** No errors in `vault-customize.ts` or `vault-packs.ts`.

**Note:** One pre-existing project error in `src/lib/dfy/content-engine.ts` (unrelated `meta` optional vs required). Filtered grep for `vault` in tsc output returned no matches.

**Linter:** No diagnostics on `vault-customize.ts`.

---

## Deviations from Brief

- Fixed mojibake in prompt strings from brief (`≥`, `≤`, `—`) to proper Unicode (matches `shorts-customize.ts` style).
- No functional changes to logic or `isValidPackEntry` call signature.

---

## Out of Scope (Task 3+)

- API routes (`/api/vault/.../customize`, pack CRUD)
- UI wiring on vault pages
- Remote migration apply

---

## Concerns / Follow-ups

1. **Fallback Quora word count:** `fallbackOfferAwareEntry` only swaps the link/angle; short seed answers may still fail soft validation (<120 words). Same class of risk as shorts fallback — API layer should surface errors clearly.
2. **Double affiliate URL in fallback:** If seed answer already contains the raw affiliate link, fallback append logic could duplicate it and fail `isValidPackEntry` (exactly-once rule). Seeds should use `__LINK__` placeholder in vault content.
3. **Pinterest keywords:** Fallback does not adjust keyword count (4–8 required); invalid seed keywords could fail soft validation even after link injection.

---

## Verification Checklist

- [x] `vault-customize.ts` created per brief
- [x] Uses `isValidPackEntry` with `affiliateLink`, `sourceEntryId`, `nicheId`, `minQuoraWords`
- [x] Exports `customizeVaultEntry`
- [x] Typecheck clean for vault modules
- [x] No git commit
- [ ] API routes (Task 3)
