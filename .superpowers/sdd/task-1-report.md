# Task 1 Report: Shared TutorialVideoSection

## Status

**DONE**

## Summary

Created a reusable `TutorialVideoSection` component and refactored `DfyVideoSection` into a thin wrapper that passes DFY-specific props. ESLint passed on both files. Changes committed in a single commit.

## Files Changed

| File | Action |
|------|--------|
| `src/components/ui/tutorial-video-section.tsx` | Created |
| `src/components/dfy/dfy-video-section.tsx` | Modified (thin wrapper) |

## Implementation Details

### `TutorialVideoSection`

- Client component with `useState` for overlay open/close.
- Props: `title`, `description`, optional `videoId`, `className`, `compact`, `eyebrow` (default `"Watch First"`).
- When `videoId` is provided: renders `VideoThumbnail` + `VideoOverlay` via `getVimeoEmbedUrl`.
- When `videoId` is absent: renders a gradient placeholder with Sparkles icon and "Tutorial coming soon" badge.
- **Compact mode**: section wraps media only (no text column); overlay still mounts when video present.
- **Full mode**: `card-base` layout with media left, eyebrow/title/description right.

### `DfyVideoSection` wrapper

- Exports `DFY_VIDEO_ID = "1214651948"` unchanged for existing importers.
- Delegates to `TutorialVideoSection` with fixed title, description, and video ID.
- Preserves `className` and `compact` passthrough.

## Verification

```bash
.\node_modules\.bin\eslint src/components/ui/tutorial-video-section.tsx src/components/dfy/dfy-video-section.tsx
```

**Result:** Exit code 0, no errors or warnings.

> Note: `npx eslint …` hung in this environment (~3+ min with no output). Local binary completed in ~57s with a clean result.

## Commit

| SHA | Subject |
|-----|---------|
| `24de592` | feat: add shared TutorialVideoSection with DFY wrapper |

Only the two task files were staged; unrelated dirty files in the working tree were left untouched.

## Self-Review

### Correctness

- Matches task brief interfaces and component structure.
- Imports (`VideoThumbnail`, `VideoOverlay`, `getVimeoEmbedUrl`, `clsx`, `Sparkles`) align with existing codebase patterns.
- `DFY_VIDEO_ID` export preserved; `src/app/dfy/page.tsx` import path unchanged.

### Intentional behavior change (per brief)

Previous `DfyVideoSection` used overlay/thumbnail title **"How to Use DFY Campaign Builder"** while the visible `<h2>` was **"How to Build Your Campaign"**. The wrapper now passes **"How to Build Your Campaign"** as `title` for both thumbnail and overlay, matching the task spec.

### Minor encoding fix

Brief contained mojibake `â€"` in the placeholder `aria-label`; implemented as proper em dash `—` for accessibility text.

### Risks / follow-ups for later tasks

- Placeholder UI (`!videoId`) is new surface area; premium pages in later tasks will rely on it when env vars are unset.
- No runtime/browser verification in this task (lint-only per plan).

## Concerns

None blocking. Title unification in the DFY wrapper is intentional per spec but differs from prior overlay/thumbnail labeling.
