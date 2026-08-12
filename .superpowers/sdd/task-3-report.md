# Task 3 Report: Auto-scroll in InlineError

## Status

**DONE**

## Summary

Updated `InlineError` so that when `message` transitions from empty to non-empty, the alert banner scrolls into view with smooth behavior via `scrollIntoView({ behavior: "smooth", block: "nearest" })`. A `prevMessage` ref tracks prior state so re-renders with an already-visible message do not re-scroll; clearing the message resets the ref.

## Files

- `src/components/ui/InlineError.tsx` — added `useRef` + `useEffect` scroll-on-appear logic per brief.

Note: Git tracks the file as `InlineError.tsx` (PascalCase). On Windows this is the same path as the brief's `inlineError.tsx`.

## Verification

Ran:

```text
npx eslint src/components/ui/inlineError.tsx
```

Result: exit code 0, no errors or warnings.

Static review confirms:

- Scroll fires only on empty → non-empty transition (including first mount with a message).
- `requestAnimationFrame` defers scroll until after paint; cleanup cancels the frame.
- Public API unchanged: `{ message: string; className?: string }`.
- Early return when `!message` preserved; `role="alert"` and styling unchanged.

Manual browser smoke was not run — no interactive browser session in this agent environment. Recommended check: on `/instant/build` (or `/search` / `/dfy/new`), scroll away from the form, trigger validation, confirm smooth scroll to the alert.

## Commit

- `d6cf640 feat: scroll InlineError into view when it appears`

## Self-Review

- Implementation matches the task brief exactly.
- Only `InlineError.tsx` was staged and committed; unrelated hot-threads changes remain unstaged.
- ESLint clean; no new dependencies.
- `block: "nearest"` avoids unnecessary full-page jumps when the banner is already partially visible.

## Concerns

None blocking. Browser smoke not performed; lint + static review only.
