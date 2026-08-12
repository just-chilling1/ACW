### Task 4: Migrate custom error banners to `InlineError`

**Files:**
- Modify: `src/app/autopilot/page.tsx`
- Modify: `src/app/hot-threads/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/forgot-password/page.tsx`
- Modify: `src/app/reset-password/page.tsx`

**Interfaces:**
- Consumes: `InlineError` from Task 3
- Produces: no custom inline error markup left on these pages (auth may keep `motion` wrapper around `InlineError` if desired, but prefer plain `InlineError`)

- [ ] **Step 1: Autopilot**

Import `InlineError`. Replace:

```tsx
{error && (
  <div className="rounded-[var(--radius-lg)] border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-sm text-[var(--error)]">
    {error}
  </div>
)}
```

with:

```tsx
{error ? <InlineError message={error} /> : null}
```

- [ ] **Step 2: Hot Threads**

Replace the custom error `<div>` the same way. Keep any retry button **below** the `InlineError`, not inside it:

```tsx
{error ? (
  <div className="flex flex-col gap-3">
    <InlineError message={error} />
    <button type="button" className="btn-secondary w-fit" onClick={() => loadPack(niche)}>
      Try again
    </button>
  </div>
) : null}
```

(Match the existing button label/handlers already on the page.)

- [ ] **Step 3: Login**

Import `InlineError`. Replace the `motion.div.error-banner` block with:

```tsx
{error ? <InlineError message={error} /> : null}
```

Remove unused `ShieldAlert` import if nothing else uses it.

- [ ] **Step 4: Signup**

Same replacement as login. Remove unused `ShieldAlert` if applicable.

- [ ] **Step 5: Forgot password**

Same: `{error ? <InlineError message={error} /> : null}`

- [ ] **Step 6: Reset password**

Same for the form error banner. Leave any full-page expired-link messaging as-is unless it is also a simple inline banner that can use `InlineError`.

- [ ] **Step 7: Lint changed pages**

Run:

```bash
npx eslint src/app/autopilot/page.tsx src/app/hot-threads/page.tsx src/app/login/page.tsx src/app/signup/page.tsx src/app/forgot-password/page.tsx src/app/reset-password/page.tsx
```

Expected: no errors.

- [ ] **Step 8: Manual smoke**

1. Autopilot / Hot Threads â€” force an error; confirm `InlineError` styling and scroll.
2. Login with bad credentials â€” error appears and scrolls into view if needed.

- [ ] **Step 9: Commit**

```bash
git add src/app/autopilot/page.tsx src/app/hot-threads/page.tsx src/app/login/page.tsx src/app/signup/page.tsx src/app/forgot-password/page.tsx src/app/reset-password/page.tsx
git commit -m "refactor: route inline errors through InlineError for scroll"
```

---

