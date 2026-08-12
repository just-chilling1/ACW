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
