# Automated Profits Havana Theme Design

**Date:** 2026-08-17  
**Status:** Approved (Cigar Lounge palette; theme existing page; Approach 1 — dedicated `autopilot-theme`)

## Summary

Restyle the Automated Profits (`/autopilot`) experience to sit in the same premium design family as DFY and Instant Income, using a **Cigar Lounge Havana** color theme with strong surface/text/accent contrast. Keep the current page structure and traffic flows; change scoped tokens, chrome, and component styling only.

## Decisions

| Topic | Choice |
|---|---|
| Palette | B — Cigar Lounge (caramel / Havana orange on espresso; Instant-adjacent) |
| Scope | A — Theme existing page (no Instant-style hero / how-to rebuild) |
| Implementation | 1 — Dedicated `.autopilot-theme` + `body[data-theme="autopilot"]` |
| Layout / copy / APIs | Unchanged |
| DFY / Instant themes | Untouched |

## Goals

- Visual kinship with Instant Income (cocoa/caramel family) and DFY (dark warm premium panels), without reusing Instant’s class or layout markup.
- High contrast: cream primary text on near-black canvas; solid copper borders; selected chips and CTAs readable at a glance.
- Sidebar and app chrome match the page while the user is on Autopilot (same pattern Instant already uses).

## Non-goals

- Redesigning hero, how-to steps, or Instant Income page patterns onto Autopilot.
- Changing setup / opportunity / activation flows, APIs, or marketing copy.
- Editing `.dfy-theme` or `.instant-theme` tokens.
- Extracting a shared `havana-theme` base (deferred; Approach 3).

## Architecture

### Theme surface

1. **`globals.css`** — new scoped block `.autopilot-theme { … }` defining CSS variables (surfaces, borders, text, gold/caramel accents, radii) and overrides for shared primitives:
   - `.btn-primary` / `.btn-secondary` / `.btn-chip` / `.btn-chip-active`
   - `.input-base`
   - `.card-base`, `.surface-panel`, `.surface-panel-elevated`
   - `.premium-landing-hero` (+ glow)
2. **`body.app-bg[data-theme="autopilot"]`** — chrome/sidebar/app background gradients aligned with Instant’s `data-theme="instant"` pattern, using espresso canvas + soft copper radials.
3. **Autopilot-specific polish** under `.autopilot-theme` for traffic-machine surfaces that need clearer borders/fills (opportunity cards, progress track, elevated premium sections) without new layout components.

### Shell wiring

In `Shell.tsx`:

- `isAutopilotPage = pathname.startsWith("/autopilot")`
- Apply `autopilot-theme` on the main content wrapper (alongside existing DFY/Instant class toggles)
- Set `document.body.dataset.theme = "autopilot"` when on Autopilot; clear on leave

Also pass `className="autopilot-theme"` on `PremiumLandingShell` in `src/app/autopilot/page.tsx` so landing content stays themed consistently (same double-apply pattern Instant uses on its shell).

### Token direction (Cigar Lounge)

| Role | Direction |
|---|---|
| Canvas | Near-black espresso (`#080504` / `#050302`) |
| Surfaces | Layered mocha (`#18100c` → `#221410`) |
| Borders | Warm copper (`#3d2418` subtle → `#6b3f28` strong) |
| Text | `#fff8f0` primary · `#c9a882` secondary · `#7a6350` muted |
| Accent | `#c97943` caramel · `#f0b878` light · `#e8a862` text |
| CTA | Dark caramel gradient with light text (Instant-style), not DFY gold-on-dark |
| Focus / depth | Soft copper focus rings; dark elevation shadows |

Contrast rules:

- Primary text vs canvas must remain high-contrast.
- Selected chips/borders use solid accent (not faint tint alone).
- Secondary buttons stay near-black with copper hover so they do not compete with primary.

## Components in restyle scope

| Surface | Treatment |
|---|---|
| Premium hero / sections / state blocks | Mocha panels, copper borders, Instant-like CTA |
| Buttons / chips | Caramel primary; near-black secondary; solid selected chip border |
| Inputs / fields | Dark inset fields; copper focus ring |
| Setup wizard | Inherit tokens; no layout rewrite |
| Opportunity cards | Stronger border; recommended = accent border + tinted fill |
| Progress / next-source meta | Accent fill and gold-text meta readable on dark |
| Guided workflow / celebration | Same token pass so overlays match the page |

## Out of scope files / areas

- Instant Income and DFY page markup and themes
- Traffic-machine business logic and API routes
- New design-system documentation site or Storybook

## Verification

- Desktop + mobile: Autopilot loading, setup wizard, ready state (progress + next source + card grid), guided workflow, celebration.
- Confirm DFY (`/dfy`) and Instant (`/instant`) are visually unchanged.
- Spot-check sidebar/chrome colors only while on `/autopilot`.

## Open follow-ups (not this work)

- Later extract shared Havana tokens if Autopilot and Instant drift or duplicate too much.
- Optional Instant-style hero/how-to layout if product wants pattern parity after the theme ships.
