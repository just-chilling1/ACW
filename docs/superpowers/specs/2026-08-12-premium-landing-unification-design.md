# Premium Landing Unification Design

**Date:** 2026-08-12  
**Status:** Approved by user directive (choose recommended answers + implement)

## Decisions (locked)

| Question | Choice |
|----------|--------|
| Scope | Landings first; sub-pages follow later |
| Priority | Balanced: design + speed + structure |
| Visual | Noticeable refresh on existing dark/gold tokens |
| Approach | Shared premium landing kit + structural unification |

## Goal

Unify the six premium feature landings under one shell, clearer hierarchy, shared loading/empty/error patterns, and light performance fixes — without redesigning DFY/Instant/Autopilot sub-flows yet.

## Pages in scope

- `/dfy`
- `/instant`
- `/autopilot`
- `/hot-threads`
- `/vault`
- `/shorts-vault`

## Architecture

### Shared kit (`src/components/premium/`)

- `PremiumLandingShell` — max-width, padding, entrance motion, optional width (`narrow` | `wide`)
- `PremiumHero` — elevated intro block: eyebrow, title (gradient accent support), subtitle, optional CTA row
- `PremiumSection` — numbered/titled section with consistent gap
- `PremiumStateBlock` — empty / loading skeleton / error+retry wrappers

Extend existing `PageHeader` usage where a full hero is overkill; prefer `PremiumHero` on landings for stronger premium feel.

### Slot order (standard)

1. Hero / header  
2. Tutorial (existing `TutorialVideoSection` / DFY video)  
3. Primary setup or CTA  
4. Main content  
5. Secondary help / library  

### Speed & structure

- Skeleton-first loading (no bare “Loading…” / “Please wait…” where avoidable)
- Parallel fetches preserved/ensured
- Vault + Shorts Vault keep separate pages but share identical shell/section/state patterns
- Reuse `InlineError`, `Skeleton`, design-system buttons/panels

## Visual language

- Keep `--gold`, `--surface-*`, `surface-panel`, `surface-panel-elevated`
- Stronger hero: elevated panel, gold eyebrow, title with optional `text-gradient` accent word
- Consistent vertical rhythm (`gap-6` / section spacing)
- Subtle entrance motion (existing framer pattern)
- No new color theme; no purple/cream redesign

## Out of scope

- Sub-pages (`/dfy/new`, `/instant/build`, kit/campaign detail, etc.)
- Backend/API changes
- Nav / PremiumUpgradesWidget redesign (already share `PREMIUM_FEATURES`)

## Success criteria

1. All six landings use `PremiumLandingShell` (+ shared section/state helpers where applicable)
2. Visual hierarchy reads as one product family
3. Loading states are skeleton-based
4. DFY landing matches shell (no one-off max-width/padding island)
5. Vault and Shorts Vault feel structurally identical
