# Task 1 Report: Migration + pack types/mappers

**Status:** DONE  
**Date:** 2026-08-12  
**Scope:** Quora/Pinterest Vault Offer Packs — Task 1 only

---

## Summary

Implemented the Supabase migration for `vault_entry_packs` and the TypeScript module `src/lib/vault/vault-packs.ts` with pack types, row mapper, and structural validator `isValidPackEntry`. Patterns mirror the existing Shorts Vault pack layer (`shorts-packs.ts` + `20260812180000_shorts_script_packs.sql`) but use vault-specific table/column names per the task brief.

---

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20260812190000_vault_entry_packs.sql` | DB table, indexes, RLS policy |
| `src/lib/vault/vault-packs.ts` | Types, `mapPackRow`, `isValidPackEntry` |

No other files were modified. Shorts vault files were not touched.

---

## Migration Details

**Table:** `vault_entry_packs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | `gen_random_uuid()` default |
| `user_id` | UUID FK | → `auth.users(id)` ON DELETE CASCADE |
| `source_entry_id` | TEXT | Original vault entry id |
| `niche_id` | TEXT | Niche slug |
| `affiliate_link` | TEXT | User's affiliate URL |
| `offer_snapshot` | JSONB | Default `{}` |
| `entry` | JSONB | Customized Quora/Pinterest entry |
| `created_at` / `updated_at` | TIMESTAMPTZ | Default `now()` |

**Constraints & indexes:**
- `UNIQUE (user_id, source_entry_id, affiliate_link)` — one pack per user/entry/link combo
- `idx_vault_entry_packs_user_id` on `user_id`
- `idx_vault_entry_packs_user_created` on `(user_id, created_at DESC)`

**RLS:** Enabled; policy `"Users manage own vault entry packs"` — ALL operations scoped to `auth.uid() = user_id`.

Migration was **not** applied remotely (per plan: apply only when user requests).

---

## TypeScript Module

### Exported types

- **`VaultEntryPack`** — camelCase domain model (id, sourceEntryId, nicheId, affiliateLink, offerSnapshot, entry, createdAt, updatedAt)
- **`VaultEntryPackRow`** — snake_case DB row shape
- Re-exports **`QuoraEntry`**, **`PinterestEntry`** from `@/lib/vault/types`

### `mapPackRow(row: VaultEntryPackRow): VaultEntryPack`

Maps DB row → domain pack. Casts `niche_id` to `NicheId`. Verified: `sourceEntryId` maps correctly from `source_entry_id`.

### `isValidPackEntry(value, opts): value is VaultEntry`

Structural validator before persist. Options: `affiliateLink`, `sourceEntryId`, `nicheId`, optional `minQuoraWords` (default 120).

**Shared checks:** record shape, matching `id`/`nicheId`, non-empty `angle`.

**Quora (`platform === "quora"`):**
- Required string fields: `question`, `searchQuery`, `answer`
- Non-empty `topics[]` of trimmed strings
- No `__LINK__` or affiliate link in `question`/`searchQuery`
- Answer: no `__LINK__`, affiliate link appears exactly once, word count ≥ `minQuoraWords`

**Pinterest (`platform === "pinterest"`):**
- Required string fields: `pinTitle`, `pinDescription`, `boardName`, `imageConcept`
- `keywords`: 4–8 trimmed strings
- `pinTitle` ≤ 100 chars, `pinDescription` ≤ 500 chars
- No banned link tokens in title/board/imageConcept
- Description: no `__LINK__`, affiliate link exactly once

Unknown platforms → `false`.

---

## Sanity-Check Results

Ran inline fixture script via `npx tsx`:

| Fixture | Expected | Actual |
|---------|----------|--------|
| Quora entry, link once in answer, 130+ words, `minQuoraWords: 120` | pass | `true` ✓ |
| Pinterest entry, `pinTitle` length 101 | fail | `false` ✓ |
| Quora answer containing `__LINK__` | fail | `false` ✓ |
| `mapPackRow` → `sourceEntryId === "q1"` | pass | `true` ✓ |

**Lint:** No linter errors on `vault-packs.ts`.  
**Typecheck:** `npx tsc --noEmit --skipLibCheck` — no errors referencing `vault-packs.ts`.

---

## Self-Review

1. **Brief fidelity:** SQL and TS match the task brief verbatim (table name, columns, policy text, validator logic).
2. **Pattern consistency:** Aligns with Shorts pack layer (row mapper, RLS policy style, unique constraint on user + source + link).
3. **Import paths:** `OfferSnapshot`, `NicheId`, `VaultEntry` types all exist and resolve.
4. **Edge cases in validator:**
   - Empty `affiliateLink`: `hasBannedLinkTokens` skips link-in-text check when link length is 0; `countOccurrences` returns 0 — entries requiring exactly one link occurrence would fail (intentional guard).
   - Pinterest `pinDescription` link check uses `countOccurrences !== 1` — consistent with Quora answer rule.
5. **Out of scope (Task 2+):** Customize API, page UX, remote migration apply — not implemented.

---

## Concerns

None blocking. Migration not applied locally/remotely; downstream tasks or user should run Supabase migration when ready.

---

## Commits

None (skipped per workspace/plan instructions).

---

## Review Fix: URL / `__LINK__` Validation (2026-08-12)

**Finding:** `hasBannedLinkTokens` only detected the supplied affiliate link and `__LINK__`, not arbitrary http(s) URLs in metadata fields or extra URLs in body fields.

**Fix applied in `src/lib/vault/vault-packs.ts`:**
- Added `HTTP_URL_PATTERN` (`/https?:\/\//i`) and `hasHttpUrls()` helper.
- Replaced `hasBannedLinkTokens` with `hasForbiddenLinkContent()` for metadata fields (`question`, `searchQuery`, `pinTitle`, `boardName`, `imageConcept`) — rejects `__LINK__` or any http(s) URL.
- Added `isValidBodyWithAffiliateLink()` for body fields (`answer`, `pinDescription`) — requires affiliate link exactly once, no `__LINK__`, and no remaining http(s) URLs after removing the one affiliate occurrence.
- Existing min word counts and length checks unchanged.

**Fixture re-run (10/10 pass):**

| Fixture | Expected | Actual |
|---------|----------|--------|
| Quora valid (link once, 130+ words) | pass | `true` ✓ |
| Pinterest pinTitle length 101 | fail | `false` ✓ |
| Quora answer with `__LINK__` | fail | `false` ✓ |
| URL in question | fail | `false` ✓ |
| Other URL in answer alongside affiliate | fail | `false` ✓ |
| URL in searchQuery | fail | `false` ✓ |
| Pinterest valid | pass | `true` ✓ |
| URL in pinTitle | fail | `false` ✓ |
| Other URL in pinDescription alongside affiliate | fail | `false` ✓ |
| `mapPackRow` → `sourceEntryId === "q1"` | pass | `true` ✓ |

**Lint:** No linter errors on `vault-packs.ts`.  
**Commit:** None (per instructions).
