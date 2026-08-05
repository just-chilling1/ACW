# AI CashWave — Design System

Warm **dark brown** canvas, **logo gold** primary accent, **copper** secondary. Built to match the new branding and logo.

**Audience is 50–60.** Every text token clears AAA (7:1) and every border or icon that carries meaning clears 3:1, measured against the card surface `#241C14` — the harder of the two backgrounds. Ratios are printed in the tables below; if you add a token, add its ratio.

**Live preview:** `/dev/style-guide`  
**Token source:** `src/app/globals.css`

---

## Design principles

| Principle | Implementation |
|---|---|
| Premium & trustworthy | Espresso brown base (`#140F0A`), not cold gray/black |
| Warm contrast | Ivory text on brown surfaces, gold for action |
| Token-first | CSS variables only — no hardcoded hex/rgba in components |
| Mobile-first | 44px touch targets, 16px inputs (no iOS zoom) |
| Legible at 60 | AAA text, 3:1 meaningful borders, 17px body, no hue-only signals |
| Tight corners | 3–10px radius — a tool, not a consumer app |
| Accessible motion | All animations honor `prefers-reduced-motion` |

---

## Color palette

### Canvas & surfaces

| Token | Hex / Value | Role |
|---|---|---|
| `--bg-app` / `--bg-page` | `#140F0A` | Main canvas (espresso) |
| `--bg-app-2` | `#1A1410` | Gradient mid-tone |
| `--surface-1` / `--bg-panel` | `#241C14` | Cards, panels |
| `--surface-2` | `rgba(255,220,180,0.06)` | Subtle wells |
| `--surface-3` | `rgba(255,220,180,0.09)` | Hover states |
| `--sidebar-bg` / `--chrome-bg` | `rgba(18,13,9,0.92–0.95)` | Sidebar, mobile header/nav |
| `--bg-glass` | `rgba(36,28,20,0.82)` | Frosted overlays |

### Brand

| Token | Value | Role |
|---|---|---|
| `--gold` / `--brand-primary` | `#D4AF37` | 8.0:1 — CTAs, icons, headings ≥16px |
| `--gold-text` | `#E8C55A` | 10.0:1 — gold type under 16px, active nav |
| `--gold-dim` | `#B8942E` | Gradient end |
| `--copper` / `--brand-secondary` | `#C17F3A` | Secondary highlights |
| `--grad-brand` | gold → gold-dim | Primary buttons, text gradients |
| `--grad-brand-alt` | gold → copper | Alternate gradients |

### Text

| Token | Value | Contrast on card | Role |
|---|---|---|---|
| `--text-primary` | `#F5EDE4` | 11.9:1 | Headings, body |
| `--text-secondary` | `#C4B5A5` | 8.4:1 | Subtitles, labels |
| `--text-tertiary` / muted | `#BFAE97` | 7.8:1 | Hints, disabled |
| `--text-on-accent` | `#1A1208` | — | Text on gold buttons |

`--text-tertiary` was `#A89680` (5.9:1, under AAA). `--text-muted` is now an alias of it — there is no dimmer tier.

### Borders

| Token | Value | Contrast | Use |
|---|---|---|---|
| `--border-subtle` | `rgba(226,196,150,0.30)` | 1.9:1 | Dividers only |
| `--border-strong` | `rgba(226,196,150,0.48)` | 3.0–3.4:1 | Any border that carries meaning |

The base RGB moved from `(212,175,120)` to `(226,196,150)` so the same alpha buys more separation. The old `--border-subtle` at 14% measured 1.25:1 — it was not visible to anyone. **Rule:** card edges, inputs, selected states and focus all use `--border-strong`. `--border-subtle` is for rules between rows, nothing else.

### Semantic colors

| State | Base | Contrast | Fill | Border | Was |
|---|---|---|---|---|---|
| Success | `#7DD98A` | 9.7:1 | 12% / 16% | 45% | `#10B981` (6.6:1) |
| Warning | `#FF8C42` | 7.3:1 | 12% / 16% | 45% | `#F5B301` (collided with brand gold) |
| Error / Danger | `#FF8A7A` | 7.3:1 | 12% / 16% | 45% | `#EF4444` (4.5:1 — failed AAA) |
| Info | `#F5EDE4` | 11.9:1 | 8% / 12% warm neutral | 42% | `#38BDF8` (cyan, retired) |

**Why these moved:**

- **Warning is no longer amber.** The brand accent is gold, so an amber warning is indistinguishable from a call to action. Orange is the nearest hue that stays legible and stops reading as "click me."
- **Info has no hue.** Short wavelengths are the first thing an aging lens loses, and cyan was the only cool colour in a warm system. Info now reads as ivory + `ti-info-circle`. The token names survive so `.badge-info` and `.status-info` still resolve.
- **Never signal with hue alone.** Every semantic surface pairs its colour with an icon and a text label. Assume a portion of the audience will not resolve the hue difference.

Fill tiers went from 6%/8% to 12%/16%. Below roughly 10% a tint does not exist on brown.

**CSS classes:** `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`  
**Status blocks:** `.status-success`, `.status-warning`, `.status-danger`, `.status-info`

### Accent surface tokens

Use instead of inline gold rgba:

Five real tiers, down from ten. The old ladder had five steps sitting within 3% of a neighbour, which is below what anyone can distinguish on brown. The retired names are kept as aliases so no component changed.

| Token | Opacity | Use |
|---|---|---|
| `--accent-bg-faint` | 12% | Callouts, info bars |
| `--accent-bg-subtle` | 16% | Icon wells, chips, active nav fill |
| `--accent-bg-medium` | 22% | Active fills, soft button hover |
| `--accent-border` | 48% | Standard gold border |
| `--accent-border-strong` | 62% | Hover, selected |

Aliases: `--accent-bg-hover` → medium · `--accent-border-soft` → border · `--accent-border-emphasis` → border-strong · `--accent-focus-ring` 24% · `--accent-glow` 28%.

### Promo surfaces

| Token | Value | Use |
|---|---|---|
| `--promo-surface-from` | `#2A1F14` | Offer card gradient top |
| `--promo-surface-to` | `#1A120B` | Offer card gradient bottom |
| `--promo-bg-gradient` | from → to | `.promo-card` background |

---

## Typography

| Font | Variable | Use |
|---|---|---|
| Outfit | `--font-brand` | Headings, brand moments (`.brand-font`, `.ds-h1`) |
| Inter | `--font-ui` | Body, UI, forms |

### Type scale

| Class | Size | Weight | Leading | Tracking | Use |
|---|---|---|---|---|---|
| `.page-eyebrow` | 13px (0.8125rem) | 600 | 1.3 | 0.08em, uppercase | Route label above titles |
| `.ds-h1` | clamp 1.75–2.25rem | 700 | 1.1 | -0.02em | One page title per screen (Outfit) |
| `.ds-h2` | 24px (1.5rem) | 600 | 1.2 | -0.011em | Section headings |
| `.ds-h3` | 19px (1.1875rem) | 600 | 1.35 | default | Card titles |
| `.ds-h4` | 13px (0.8125rem) | 600 | 1.3 | 0.08em, uppercase | Micro labels (muted) |
| `.ds-h5` | 17px (1.0625rem) | 600 | 1.35 | -0.011em | Sub-section titles |
| `.ds-h6` | 15px (0.9375rem) | 600 | 1.4 | -0.006em | Compact titles |
| `.ds-body` | 17px (1.0625rem) | 400 | 1.6 | -0.011em | Default body copy |
| `.ds-body-sm` | 15px (0.9375rem) | 400 | 1.55 | -0.006em | Compact body |
| `.ds-subtitle` | 16px (1rem) | 400 | 1.55 | default | Supporting copy under titles |
| `.ds-label` | 15px (0.9375rem) | 500 | 1.4 | default | Form labels |
| `.ds-caption` | 13px (0.8125rem) | 400 | 1.45 | 0.01em | Helper text, captions |
| `.ds-annotation` | 12px (0.75rem) | 600 | 1.3 | 0.08em, uppercase | Tags, metadata, timestamps |
| `.text-gradient` | — | — | — | — | Gold gradient text clip |
| `.text-gradient-alt` | — | — | — | — | Gold → copper gradient text |

Every size moved up one step from the previous scale. Uppercase tracking halved from 0.14em/0.12em to 0.08em — wide-tracked caps at small sizes are the hardest thing on the page to parse at 60. Gold type below 16px uses `--gold-text`, not `--gold`.

---

## Spacing

| Token | Value | Tailwind equivalent |
|---|---|---|
| `--space-1` | 4px | `gap-1` / `p-1` |
| `--space-2` | 8px | `gap-2` / `p-2` |
| `--space-3` | 12px | `gap-3` / `p-3` |
| `--space-4` | 16px | `gap-4` / `p-4` |
| `--space-5` | 20px | `gap-5` / `p-5` |
| `--space-6` | 24px | `gap-6` / `p-6` |
| `--space-8` | 32px | `gap-8` / `p-8` |
| `--space-10` | 40px | `gap-10` |
| `--space-12` | 48px | `gap-12` |
| `--space-16` | 64px | `gap-16` |

**Section gaps:** `gap-6` (mobile) / `gap-8` (desktop)  
**Page padding:** `px-4 sm:px-6 lg:px-8` via Shell

---

## Radius

| Token | Value | Was | Use |
|---|---|---|---|
| `--radius-sm` | 3px | 8px | Badges, small wells |
| `--radius-md` | 5px | 12px | Buttons, inputs, chips |
| `--radius-lg` | 8px | 16px | Cards, callouts |
| `--radius-xl` | 10px | 20px | Modals, promo cards |

**No pills.** `.btn-chip` uses `--radius-md` like every other control; `--radius-pill` is aliased to 5px so any remaining full-round usage collapses with the rest. Avatars and status dots stay circular — those are the only exceptions.

---

## Buttons

**Rule:** filled gold CTAs use `--text-on-accent` (dark brown), not white.

**Rule:** `.btn-primary` is a flat `--gold` fill, not a gradient. The gold → gold-dim ramp was a ~4% luminance drop across 44px that nobody perceives, and it softened the button's edge. `--grad-brand` stays for text clips and promo surfaces, where it does real work.

All buttons: `min-height: 44px`, `touch-action: manipulation`.

| Class | Style |
|---|---|
| `.btn-primary` | Gold gradient, dark brown text |
| `.btn-secondary` | Transparent + warm border |
| `.btn-soft` | Gold tint fill + border |
| `.btn-ghost` | Text only |
| `.btn-danger` | Red fill |
| `.btn-chip` / `.btn-chip-active` | Filter pills |
| `.btn-icon` | 44×44 icon button |

### Button states

| State | Primary | Secondary | Soft | Ghost | Danger |
|---|---|---|---|---|---|
| **Default** | Gold gradient + inset highlight | Transparent, `--border-strong` | Gold tint bg | Transparent, secondary text | Red fill |
| **Hover** | `brightness(1.08)`, lift -1px, glow | `--surface-3` bg, gold border | Darker tint, lift | `--surface-3` bg, primary text | Brighten, lift |
| **Active (pressed)** | `scale(0.98)`, darker | `scale(0.98)`, `--surface-2` | `scale(0.98)`, medium tint | `--surface-2` bg | `scale(0.98)`, darker |
| **Focused** | 2px gold outline + `--accent-focus-ring` shadow | Same | Same | Same | Same |
| **Disabled** | 45% opacity, no pointer | Same | Same | Same | Same |

**Compact mobile** (`max-height: 740px`): buttons reduce to 40px min-height.

---

## Surfaces & cards

| Class | Description |
|---|---|
| `.card-base` | Brown panel, **1px `--border-strong`**, `--elevation-1` |
| `.glass-card` | Frosted, blurred surface |
| `.card-interactive` | Clickable card; gold border on hover |
| `.promo-card` | Offer/training banner gradient surface |
| `.ds-well` | Bordered inner box on `--surface-2` |
| `.surface-panel` | Flat `--surface-1` panel (no padding) |
| `.surface-panel-elevated` | `--surface-1` + `--elevation-1` shadow |
| `.surface-well-lg` / `.surface-well-md` | Padded `--surface-2` sections |
| `.surface-nested` | Smaller inner wells inside panels |
| `.step-card` / `.step-card-sm` | Numbered step layouts (autopilot, instant) |

---

## Navigation

| Class | Style |
|---|---|
| `.nav-link` | Sidebar links, secondary → primary on hover |
| `.nav-link-active` | `--gold-text` + 3px gold left bar + `--accent-bg-subtle` fill, `border-radius: 0` |
| `.command-nav-link` | Command-style nav with gold left bar when active |
| `.premium-nav-section` | Gold glow + animated conic border (premium upsells) |
| `.premium-sidebar-item` | Gold left bar on hover/active |
| `.premium-upgrade-card` | Gold-bordered upgrade cards with hover lift |

---

## Inputs

| Class | Style |
|---|---|
| `.input-base` | Full-width, `--surface-2` bg, gold focus ring |

Mobile: all inputs forced to 16px to prevent iOS zoom.

---

## Animation guide

### Timing tokens

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 100ms | Micro feedback |
| `--duration-fast` | 150ms | Buttons, nav, chips |
| `--duration-normal` | 200ms | Cards, borders |
| `--duration-slow` | 300ms | Page transitions, modals |
| `--duration-slower` | 360ms | Premium glow pulse |
| `--duration-shimmer` | 1400ms | Skeleton loading |
| `--ease-out` | `cubic-bezier(0.4,0,0.2,1)` | Default easing |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | Playful bounce (use sparingly) |

### Named animations

| Name | Duration | Use |
|---|---|---|
| `skeleton-shimmer` | 1.4s loop | `.skeleton` loading |
| `fade-up` | 300ms once | `.animate-fade-up` page enter |
| `premium-glow-pulse` | 3.6s loop | `.premium-nav-section` |
| `premium-border-spin` | 4.5s loop | Conic border on premium nav |
| `sheen` | 3s loop | CTA sheen on specialist popup |
| `cta-pulse` | — | Optional gold CTA pulse |

### Motion rules

1. **Always** wrap decorative loops in `@media (prefers-reduced-motion: reduce) { animation: none }`
2. **Page enter:** Framer Motion `opacity + y: 20` or CSS `.animate-fade-up`
3. **Interactive lift:** max `translateY(-1px)` on hover; `scale(0.98)` on press
4. **No motion on disabled** elements
5. **Skeleton only** for loading — no spinners unless necessary

---

## Desktop + mobile layout

### Breakpoints

| Breakpoint | Behavior |
|---|---|
| `< 1024px` (default) | Mobile chrome: sticky header, bottom nav, `pb-24` content clearance |
| `≥ 1024px` (`lg:`) | Desktop sidebar (240px / 72px collapsed), no bottom nav |
| `≥ 1280px` (`xl:`) | Dashboard two-column widget rail |

### Desktop (≥ 1024px)

- **Sidebar:** fixed left, `--sidebar-w: 240px`, collapsible to 72px
- **Content:** `max-w-6xl mx-auto`, `lg:pl-[var(--sidebar-w)]`
- **Padding:** `lg:px-8 lg:pt-10 lg:pb-16`
- **Touch targets:** still ≥ 44px (tablet hybrid)

### Mobile (< 1024px)

- **Header:** sticky logo bar, `--chrome-bg` + backdrop blur, safe-area top
- **Bottom nav:** 4 tabs + "More" sheet, safe-area bottom
- **Content padding:** `px-4 pt-6 pb-24`
- **Inputs:** 16px font-size (global base rule)
- **Short screens** (`max-height: 740px`): compact nav rows, 40px buttons
- **Viewport:** `min-h-dvh`, `100dvh` with fallback

### Shared

- **Background:** `--app-bg-base` on `.app-bg`, with animated gold/copper glow layers on `body.app-bg::before` and `::after`
- **Focus:** gold outline globally on `:focus-visible`
- **Scrollbars:** 6px warm thumb via `::-webkit-scrollbar`

---

## Elevation

| Token | Use |
|---|---|
| `--elevation-1` | Cards — inset highlight + soft drop shadow (supplementary only; the border is what makes the edge findable) |
| `--elevation-3` | Modals, popups |
| `--overlay-scrim` | Modal/sheet backdrop (warm brown tint) |
| `--chrome-shadow-up` | Mobile bottom sheet shadow |
| `--shadow-gold` | Gold CTA shadow |

---

## Media

- **Video previews:** `VideoThumbnail` + bottom scrim
- **Playback:** `VideoOverlay` only
- **Thumbnails:** `src/lib/video-thumbnails.ts`

---

## File reference

| File | Purpose |
|---|---|
| `src/app/globals.css` | All tokens + component classes |
| `DESIGN_SYSTEM.md` | This document |
| `/dev/style-guide` | Live component preview |

---

## Quick usage

```tsx
{/* Page header */}
<p className="page-eyebrow">Dashboard</p>
<h1 className="ds-h1">Welcome to <span className="text-gradient">AI CashWave</span></h1>
<p className="ds-subtitle">Find high-intent ads and write replies that convert.</p>

{/* Card */}
<div className="card-base">...</div>

{/* CTA */}
<button className="btn-primary">Get Started</button>
<button className="btn-secondary">Learn More</button>

{/* Success badge — always icon + label, never hue alone */}
<span className="badge-success">
  <CheckCircle className="h-[18px] w-[18px]" aria-hidden />
  Step complete
</span>

{/* Gold icon well */}
<div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-bg-subtle)]">
  ...
</div>
```
