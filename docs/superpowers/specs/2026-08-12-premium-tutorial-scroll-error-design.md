# Premium Tutorial Video + Scroll-to-Error Design

**Date:** 2026-08-12  
**Status:** Approved for planning

## Summary

Add a shared tutorial-video slot at the top of the four premium feature landing pages, and make inline error messages scroll into view automatically across the app.

## Goals

1. Give each premium landing a clear “watch first” tutorial place near the top of the page.
2. When an inline error appears, bring it into view so users don’t miss it—especially on longer forms.
3. Reuse existing DFY/Vimeo patterns instead of inventing a second video UX.

## Non-goals

- Shipping real Vimeo IDs for Instant, Autopilot, or Hot Threads in this change (placeholders only).
- Changing build/create flow layouts beyond inheriting `InlineError` scroll behavior.
- New thumbnail asset pipeline beyond the existing Vimeo helpers.
- Redesigning premium landing heroes beyond inserting the tutorial block.

## Decisions (from brainstorming)

| Topic | Choice |
|---|---|
| Tutorial pages | Only the four premium landings: `/dfy`, `/instant`, `/autopilot`, `/hot-threads` |
| Video pattern | Same as DFY today (Vimeo thumbnail + overlay); placeholders where no ID |
| Missing video IDs | Placeholder UI (“Tutorial coming soon”), not reusable DFY video |
| Scroll-to-error scope | **All pages** that show inline errors (not only premium landings) |
| Implementation shape | Shared `TutorialVideoSection` + scroll behavior inside `InlineError` |

## Feature 1: Tutorial video slot

### Shared component

Create `src/components/ui/tutorial-video-section.tsx` by generalizing `DfyVideoSection`.

**Props:**

- `title: string`
- `description: string`
- `videoId?: string`
- `className?: string`
- `compact?: boolean` (preserve existing DFY compact behavior if still needed)

**Behavior:**

- **With `videoId`:** Render current DFY layout — thumbnail via `VideoThumbnail`, play opens `VideoOverlay` with `getVimeoEmbedUrl(videoId)`. Eyebrow “Watch First”.
- **Without `videoId`:** Same card layout and copy structure, gradient placeholder instead of thumbnail, “Tutorial coming soon” label, play control not clickable / non-interactive.

### Page placement

Mount the section near the top of each landing, directly under the page header / hero and before the primary workflow content.

| Page | Content |
|---|---|
| `/dfy` | Existing Vimeo ID `1214651948`; move current mid-page video to this top slot; keep DFY-specific title/copy (or thin-wrap shared component as `DfyVideoSection`) |
| `/instant` | Placeholder with Instant-specific title/blurb |
| `/autopilot` | Placeholder with Autopilot-specific title/blurb |
| `/hot-threads` | Placeholder with Hot Threads-specific title/blurb |

### Compatibility

Prefer keeping `DfyVideoSection` as a thin wrapper around `TutorialVideoSection` so existing imports continue to work. Remove the duplicate mid-page instance on `/dfy` so the tutorial appears only once, at the top.

### Future IDs

When real Vimeo IDs exist for Instant / Autopilot / Hot Threads, pass them as `videoId` only—no layout rewrite required.

## Feature 2: Scroll to error (app-wide)

### Primary mechanism

Enhance `InlineError` (`src/components/ui/inlineError.tsx`):

- When `message` becomes a non-empty string, scroll the banner into view after paint.
- Use `scrollIntoView({ behavior: "smooth", block: "nearest" })` (or `"start"` if nearest proves insufficient in the app shell).
- Keep `role="alert"`. Scrolling is additive; it does not replace the alert semantics.
- Guard against unnecessary scrolls when the same message re-renders without a clear “appeared” transition (scroll when message goes from empty → non-empty, or when the component mounts with a message).

### Coverage

Every caller of `InlineError` inherits scroll automatically, including at least:

- Instant build / kit detail
- DFY new campaign
- Search
- Onboarding (if applicable)

### Unify custom error banners

Pages that render custom error markup instead of `InlineError` should switch to `InlineError` (or a tiny shared helper) so behavior is consistent. Known targets:

- `/autopilot`
- `/hot-threads`
- Auth-style pages using `error-banner` (`login`, `signup`, `forgot-password`, `reset-password`) — migrate to `InlineError` in this change so they get the same scroll

Goal: one inline-error pattern app-wide, not a second scroll implementation per page.

## Architecture

```
TutorialVideoSection
  ├─ videoId present → VideoThumbnail + VideoOverlay (Vimeo)
  └─ videoId absent  → placeholder card (non-interactive)

InlineError
  └─ on message appear → scrollIntoView (smooth)

Premium landings mount TutorialVideoSection under header/hero
All inline errors prefer InlineError
```

## Testing / smoke checks

1. `/dfy` — tutorial sits under hero; existing video still plays in overlay.
2. `/instant`, `/autopilot`, `/hot-threads` — placeholder tutorial visible; not playable.
3. Trigger an error on Autopilot and Hot Threads — banner uses `InlineError` and scrolls into view.
4. Trigger an error on a non-premium page that already uses `InlineError` (e.g. Instant build or Search) — page scrolls to the error.
5. Auth page error (if migrated) — scrolls to the banner.
6. No double tutorial on `/dfy`.

## Rollout notes

- Placeholder copy should feel feature-specific, not generic lorem.
- Do not block premium CTAs behind the video; tutorial is supportive content above the workflow.
- No new dependencies.
