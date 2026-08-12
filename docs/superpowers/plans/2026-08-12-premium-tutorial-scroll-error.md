# Premium Tutorial + Scroll-to-Error Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared tutorial-video slot on the four premium landings, and make every inline error scroll into view via `InlineError`.

**Architecture:** Generalize DFY’s Vimeo tutorial into `TutorialVideoSection` (real ID or placeholder). Thin-wrap it as `DfyVideoSection`. Enhance `InlineError` to `scrollIntoView` when a message appears. Migrate custom error banners (Autopilot, Hot Threads, auth pages) to `InlineError`.

**Tech Stack:** Next.js App Router, React client components, existing `VideoThumbnail` / `VideoOverlay` / `getVimeoEmbedUrl`, Tailwind/design tokens already in the app.

## Global Constraints

- Tutorial video only on `/dfy`, `/instant`, `/autopilot`, `/hot-threads`.
- DFY keeps Vimeo ID `1214651948`; Instant / Autopilot / Hot Threads are placeholders (no play).
- Scroll-to-error is app-wide through `InlineError` (not limited to premium pages).
- No new npm dependencies; no test framework (repo has none — verify with lint + manual smoke).
- Placeholder copy must be feature-specific; do not block CTAs behind the video.
- No double tutorial on `/dfy`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/ui/tutorial-video-section.tsx` | Shared tutorial card: live Vimeo or “coming soon” placeholder |
| `src/components/dfy/dfy-video-section.tsx` | Thin wrapper: DFY title/copy + `DFY_VIDEO_ID` |
| `src/components/ui/inlineError.tsx` | Alert banner + auto-scroll on message appear |
| `src/app/dfy/page.tsx` | Mount tutorial under hero (single instance) |
| `src/app/instant/page.tsx` | Mount placeholder tutorial under `PageHeader` |
| `src/app/autopilot/page.tsx` | Mount placeholder + use `InlineError` |
| `src/app/hot-threads/page.tsx` | Mount placeholder + use `InlineError` |
| `src/app/login/page.tsx` | Replace custom `error-banner` with `InlineError` |
| `src/app/signup/page.tsx` | Same |
| `src/app/forgot-password/page.tsx` | Same |
| `src/app/reset-password/page.tsx` | Same |

---

### Task 1: Shared `TutorialVideoSection`

**Files:**
- Create: `src/components/ui/tutorial-video-section.tsx`
- Modify: `src/components/dfy/dfy-video-section.tsx`

**Interfaces:**
- Consumes: `VideoThumbnail`, `VideoOverlay`, `getVimeoEmbedUrl` from existing UI/lib
- Produces:

```ts
export type TutorialVideoSectionProps = {
  title: string;
  description: string;
  videoId?: string;
  className?: string;
  compact?: boolean;
  eyebrow?: string; // default "Watch First"
};

export function TutorialVideoSection(props: TutorialVideoSectionProps): JSX.Element;
```

- [ ] **Step 1: Create `tutorial-video-section.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { VideoOverlay } from "@/components/ui/video-overlay";
import { getVimeoEmbedUrl } from "@/lib/vimeo";

export type TutorialVideoSectionProps = {
  title: string;
  description: string;
  videoId?: string;
  className?: string;
  compact?: boolean;
  eyebrow?: string;
};

export function TutorialVideoSection({
  title,
  description,
  videoId,
  className,
  compact,
  eyebrow = "Watch First",
}: TutorialVideoSectionProps) {
  const [open, setOpen] = useState(false);
  const hasVideo = Boolean(videoId);

  const media = hasVideo ? (
    <VideoThumbnail
      videoId={videoId!}
      title={title}
      onPlay={() => setOpen(true)}
      className={compact ? undefined : "rounded-none border-0"}
    />
  ) : (
    <div
      className={clsx(
        "surface-panel relative w-full overflow-hidden",
        !compact && "rounded-none border-0"
      )}
      aria-label={`${title} — tutorial coming soon`}
    >
      <div className="relative aspect-[3/2] w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-bg-medium)] via-[var(--surface-1)] to-[var(--accent-bg-subtle)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 sm:gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)] text-text-muted ring-4 ring-black/40 sm:h-[4.5rem] sm:w-[4.5rem]">
            <Sparkles size={28} strokeWidth={1.75} aria-hidden />
          </div>
          <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-primary shadow-lg backdrop-blur-sm sm:text-xs">
            Tutorial coming soon
          </span>
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <>
        <section className={className}>{media}</section>
        {hasVideo ? (
          <VideoOverlay
            open={open}
            onClose={() => setOpen(false)}
            videoUrl={getVimeoEmbedUrl(videoId!)}
            title={title}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <section className={clsx("card-base overflow-hidden p-0!", className)}>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2">{media}</div>
          <div className="flex flex-col justify-center gap-4 p-6 md:w-1/2 md:p-8">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--gold)]" />
              <span className="page-eyebrow text-[11px]!">{eyebrow}</span>
            </div>
            <h2 className="ds-h3">{title}</h2>
            <p className="leading-relaxed text-text-secondary">{description}</p>
          </div>
        </div>
      </section>
      {hasVideo ? (
        <VideoOverlay
          open={open}
          onClose={() => setOpen(false)}
          videoUrl={getVimeoEmbedUrl(videoId!)}
          title={title}
        />
      ) : null}
    </>
  );
}
```

- [ ] **Step 2: Thin-wrap `DfyVideoSection`**

Replace `src/components/dfy/dfy-video-section.tsx` body with:

```tsx
"use client";

import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";

export const DFY_VIDEO_ID = "1214651948";

type DfyVideoSectionProps = {
  className?: string;
  compact?: boolean;
};

export function DfyVideoSection({ className, compact }: DfyVideoSectionProps) {
  return (
    <TutorialVideoSection
      videoId={DFY_VIDEO_ID}
      title="How to Build Your Campaign"
      description="Watch this quick walkthrough to paste your offer, pick your niche audience, and let Cashwave build your full promotional campaign."
      className={className}
      compact={compact}
    />
  );
}
```

Keep exporting `DFY_VIDEO_ID` for any existing importers.

- [ ] **Step 3: Lint the new/changed files**

Run: `npx eslint src/components/ui/tutorial-video-section.tsx src/components/dfy/dfy-video-section.tsx`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/tutorial-video-section.tsx src/components/dfy/dfy-video-section.tsx
git commit -m "feat: add shared TutorialVideoSection with DFY wrapper"
```

---

### Task 2: Mount tutorials on premium landings

**Files:**
- Modify: `src/app/dfy/page.tsx`
- Modify: `src/app/instant/page.tsx`
- Modify: `src/app/autopilot/page.tsx`
- Modify: `src/app/hot-threads/page.tsx`

**Interfaces:**
- Consumes: `TutorialVideoSection` / `DfyVideoSection` from Task 1
- Produces: each landing renders one tutorial block under header/hero

- [ ] **Step 1: Update `/dfy`**

In `src/app/dfy/page.tsx`, keep importing `DfyVideoSection`. Move it to immediately after the hero `<section className="mb-10 ...">` (before “My Campaigns”). Ensure there is only one `<DfyVideoSection />` on the page:

```tsx
<section className="mb-10 overflow-hidden ...">
  {/* existing hero CTA content */}
</section>

<DfyVideoSection className="mb-10" />

<section className="mb-10">
  <PageHeader title="My Campaigns" ... />
  ...
</section>
```

(If it is already in that order, leave placement; only remove duplicates.)

- [ ] **Step 2: Update `/instant`**

In `src/app/instant/page.tsx`, import and place after `PageHeader`:

```tsx
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";

// inside return, after PageHeader:
<TutorialVideoSection
  title="How Instant Income Works"
  description="A short walkthrough of pasting your offer, copying posts and replies, and posting with confidence."
/>
```

No `videoId` (placeholder).

- [ ] **Step 3: Update `/autopilot`**

In `src/app/autopilot/page.tsx`, after the main `PageHeader` (the non-loading return), insert:

```tsx
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";

<TutorialVideoSection
  title="How Automated Profits Works"
  description="See how to set up your Traffic Machine and follow each step one click at a time."
/>
```

Also add the same block in the loading return under its `PageHeader` so layout doesn’t jump, or only on the loaded return — prefer **loaded return only** to avoid duplicate placeholders during load.

- [ ] **Step 4: Update `/hot-threads`**

In `src/app/hot-threads/page.tsx`, after `PageHeader`:

```tsx
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";

<TutorialVideoSection
  title="How Hot Threads Works"
  description="Learn how to pick a niche, copy a reply, and post into today’s hottest conversations."
/>
```

- [ ] **Step 5: Manual smoke**

Start or use running `npm run dev`. Visit:

1. `/dfy` — one tutorial under hero; play opens overlay.
2. `/instant`, `/autopilot`, `/hot-threads` — “Tutorial coming soon”; not clickable as play.

- [ ] **Step 6: Commit**

```bash
git add src/app/dfy/page.tsx src/app/instant/page.tsx src/app/autopilot/page.tsx src/app/hot-threads/page.tsx
git commit -m "feat: add tutorial slots to premium landing pages"
```

---

### Task 3: Auto-scroll in `InlineError`

**Files:**
- Modify: `src/components/ui/inlineError.tsx`

**Interfaces:**
- Consumes: existing `InlineError` props `{ message: string; className?: string }`
- Produces: same public API; scrolls into view when message appears

- [ ] **Step 1: Implement scroll-on-appear**

Replace `src/components/ui/inlineError.tsx` with:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";

export function InlineError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prevMessage = useRef("");

  useEffect(() => {
    if (!message) {
      prevMessage.current = "";
      return;
    }

    const appeared = prevMessage.current === "";
    prevMessage.current = message;
    if (!appeared) return;

    const id = window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={ref}
      role="alert"
      className={clsx("error-banner items-start", className)}
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--danger)]" />
      <span className="leading-snug">{message}</span>
    </div>
  );
}
```

Notes:

- Scrolls when message goes from empty → non-empty (including first mount with a message).
- Does not re-scroll when the same non-empty message re-renders, or when the message text changes while already showing (if product later wants re-scroll on text change, compare `prevMessage.current !== message` instead).

- [ ] **Step 2: Lint**

Run: `npx eslint src/components/ui/inlineError.tsx`

Expected: no errors.

- [ ] **Step 3: Manual smoke on an existing `InlineError` page**

On `/instant/build` (or `/search` / `/dfy/new`): trigger a validation error with the viewport scrolled away from the banner. Confirm the page smoothly scrolls to the alert.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/inlineError.tsx
git commit -m "feat: scroll InlineError into view when it appears"
```

---

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

1. Autopilot / Hot Threads — force an error; confirm `InlineError` styling and scroll.
2. Login with bad credentials — error appears and scrolls into view if needed.

- [ ] **Step 9: Commit**

```bash
git add src/app/autopilot/page.tsx src/app/hot-threads/page.tsx src/app/login/page.tsx src/app/signup/page.tsx src/app/forgot-password/page.tsx src/app/reset-password/page.tsx
git commit -m "refactor: route inline errors through InlineError for scroll"
```

---

### Task 5: Final verification

**Files:** none new

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`

Expected: exit 0 (or only pre-existing errors unrelated to these files — fix any new errors introduced here).

- [ ] **Step 2: Full smoke checklist (from spec)**

1. `/dfy` — tutorial under hero; video plays; only one tutorial.
2. `/instant`, `/autopilot`, `/hot-threads` — placeholder, not playable.
3. Autopilot + Hot Threads errors scroll into view.
4. Instant build or Search error scrolls into view.
5. Auth error scrolls into view.

- [ ] **Step 3: Commit only if Step 1–2 required fixes**

Otherwise no extra commit.

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Shared `TutorialVideoSection` | Task 1 |
| DFY thin wrapper + ID `1214651948` | Task 1 |
| Placeholders for Instant / Autopilot / Hot Threads | Task 2 |
| Top placement under header/hero; no double DFY video | Task 2 |
| `InlineError` scroll on appear | Task 3 |
| App-wide inheritance for existing `InlineError` callers | Task 3 |
| Migrate Autopilot, Hot Threads, auth banners | Task 4 |
| Smoke checks | Tasks 2–5 |
