# Task 4 Report: Quora/Pinterest Vault Workflow UX

## Status

Implemented the Task 4 card and page workflow described in the Quora/Pinterest Vault Offer Packs implementation plan. The supplied `task-4-brief.md` currently contains an unrelated InlineError migration brief, so the authoritative Task 4 section in `docs/superpowers/plans/2026-08-12-quora-pinterest-vault-offer-packs.md` and its approved design were used.

## Files changed

- `src/components/vault/VaultEntryCard.tsx`
  - Added optional customize, pending error, library-mode, delete, and offer-label props.
  - Added Customize and Delete actions with pending labels and icons.
  - Save/Used actions remain the default and are hidden for library pack cards.
  - Added per-card customize error output with `role="alert"`.
- `src/app/vault/page.tsx`
  - Removed SearchContext affiliate-link usage and the complete Filter the library workflow.
  - Added page-local `acw.vault.affiliateLink` persistence alongside `acw.vault.niche`.
  - Rebuilt the page as link → niche → copy/customize → My library.
  - Curated posts render independently of state/pack loading.
  - Added valid-link guard with input focus, per-card customization, pack upsert reconciliation, niche-filtered library loading, retry states, and optimistic delete rollback.
  - Integrated `/api/vault/customize` and `/api/vault/packs`.

## Verification

- `npx eslint src/app/vault/page.tsx src/components/vault/VaultEntryCard.tsx` — PASS.
- IDE diagnostics for both touched files — no errors.
- Static search confirmed no `useSearch`, `setAffiliateLink`, platform/filter state, `SelectableChip`, or “Filter the library” remains on `/vault`.
- `npx tsc --noEmit --pretty false` — project typecheck remains blocked by one pre-existing unrelated error at `src/lib/dfy/content-engine.ts:221` (`meta` optional versus required). No Vault-related TypeScript error was reported.
- Mental smoke: curated posts render with an empty link; niche selection drives both curated posts and library packs; invalid Customize focuses the link input without an API request; successful customize reconciles duplicate source/link packs; delete confirms, removes optimistically, and rolls back on failure.

## Constraints observed

- No curated content files were edited.
- No Shorts Vault files or behavior were changed.
- No git commit was created.

## Concerns

- End-to-end authenticated customize/list/delete was not run because it requires a running app, authenticated session, applied migration, and configured LLM/Supabase environment.
- The supplied `.superpowers/sdd/task-4-brief.md` should be corrected to match this Task 4 to prevent future workflow ambiguity.
# Task 4 Report: Migrate custom error banners to `InlineError`

## Status

DONE

## Implementation

- Replaced custom inline error markup with `InlineError` on:
  - `src/app/autopilot/page.tsx`
  - `src/app/hot-threads/page.tsx`
  - `src/app/login/page.tsx`
  - `src/app/signup/page.tsx`
  - `src/app/forgot-password/page.tsx`
  - `src/app/reset-password/page.tsx`
- Kept the Hot Threads retry button below and outside `InlineError`.
- Removed the now-unused `ShieldAlert` imports from login and signup.
- Left the reset-password expired/invalid-link full-page state unchanged.
- Changed the login and signup catch bindings from `any` to `unknown` to satisfy the repository ESLint configuration.

## Verification

- Passed:
  - `npx eslint src/app/autopilot/page.tsx src/app/hot-threads/page.tsx src/app/login/page.tsx src/app/signup/page.tsx src/app/forgot-password/page.tsx src/app/reset-password/page.tsx`
- Passed `git diff --cached --check` before commit.
- Passed `git show --check HEAD` after commit.
- Browser smoke testing was deferred because no browser session was available.

## Self-review

- Confirmed all six form/page error paths now render the shared `InlineError`.
- Confirmed no custom `error-banner` or `ShieldAlert` usage remains in the migrated error blocks.
- Confirmed the Hot Threads retry action remains a sibling below `InlineError`.
- Confirmed only the six requested page files were staged and committed.
- Confirmed unrelated dirty files remain unstaged.

## Commit

- `88ea72c refactor: route inline errors through InlineError for scroll`

## Concerns

- None. Browser smoke testing remains deferred as permitted by the task brief.

## Fix round

- Restored `src/app/hot-threads/page.tsx` to the Task 4 base from `d6cf640f14f54af00e938a05e698d4b81d84dcea`, preserving its Task 2 tutorial slot.
- Re-applied only the `InlineError` import and error-banner migration, keeping the existing retry handler and `Try again` label below the shared error component.
- This correction removes the unrelated Hot Threads load/polling, `RefreshCountdown`, motion, copy, skeleton, and featured-card changes that were inadvertently bundled in `88ea72c`.
- Committed the scoped correction as `1112138 fix: keep Hot Threads Task 4 change scoped to InlineError`.
- Passed: `npx eslint src/app/hot-threads/page.tsx`.
