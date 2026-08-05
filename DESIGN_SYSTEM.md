# AI CashWave — Design System

Warm **dark brown** canvas, **logo gold** primary accent, **copper** secondary. Built to match the new branding and logo.

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
| `--gold` / `--brand-primary` | `#D4AF37` | CTAs, active nav, eyebrows |
| `--gold-dim` | `#B8942E` | Gradient end |
| `--copper` / `--brand-secondary` | `#C17F3A` | Secondary highlights |
| `--grad-brand` | gold → gold-dim | Primary buttons, text gradients |
| `--grad-brand-alt` | gold → copper | Alternate gradients |

### Text

| Token | Value | Role |
|---|---|---|
| `--text-primary` | `#F5EDE4` | Headings, body |
| `--text-secondary` | `#C4B5A5` | Subtitles, labels |
| `--text-tertiary` / muted | `#A89680` | Hints, disabled |
| `--text-on-accent` | `#1A1208` | Text on gold buttons |

### Borders

| Token | Value |
|---|---|
| `--border-subtle` | `rgba(212,175,120,0.14)` |
| `--border-strong` | `rgba(212,175,120,0.24)` |

### Semantic colors

| State | Base | Surface faint | Surface subtle | Border |
|---|---|---|---|---|
| Success | `#10B981` | `--success-bg-faint` | `--success-bg-subtle` | `--success-border` |
| Warning | `#F5B301` | `--warning-bg-faint` | `--warning-bg-subtle` | `--warning-border` |
| Error / Danger | `#EF4444` | `--danger-bg-faint` | `--danger-bg-subtle` | `--danger-border` |
| Info | `#38BDF8` | `--info-bg-faint` | `--info-bg-subtle` | `--info-border` |

**CSS classes:** `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`  
**Status blocks:** `.status-success`, `.status-warning`, `.status-danger`, `.status-info`

### Accent surface tokens

Use instead of inline gold rgba:

| Token | Opacity | Use |
|---|---|---|
| `--accent-bg-faint` | 6% | Callouts, info bars |
| `--accent-bg-subtle` | 8% | Icon wells, chips |
| `--accent-bg-medium` | 12% | Active fills |
| `--accent-bg-hover` | 15% | Soft button hover |
| `--accent-border-soft` | 22% | Light borders |
| `--accent-border` | 28% | Standard gold border |
| `--accent-border-strong` | 35% | Hover borders |
| `--accent-border-emphasis` | 45% | Selected cards |
| `--accent-focus-ring` | 14% | Input focus ring |
| `--accent-glow` | 20% | Shadows, glows |

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
| `.page-eyebrow` | 12px (0.75rem) | 600 | 1.3 | 0.14em, uppercase | Route label above titles |
| `.ds-h1` | clamp 1.75–2.25rem | 700 | 1.1 | -0.02em | One page title per screen (Outfit) |
| `.ds-h2` | 24px (1.5rem) | 600 | 1.2 | -0.011em | Section headings |
| `.ds-h3` | 18px (1.125rem) | 600 | 1.35 | default | Card titles |
| `.ds-h4` | 12px (0.75rem) | 600 | 1.3 | 0.14em, uppercase | Micro labels (muted) |
| `.ds-h5` | 16px (1rem) | 600 | 1.35 | -0.011em | Sub-section titles |
| `.ds-h6` | 14px (0.875rem) | 600 | 1.4 | -0.006em | Compact titles |
| `.ds-body` | 16px (1rem) | 400 | 1.6 | -0.011em | Default body copy |
| `.ds-body-sm` | 14px (0.875rem) | 400 | 1.55 | -0.006em | Compact body |
| `.ds-subtitle` | 15px (0.9375rem) | 400 | 1.55 | default | Supporting copy under titles |
| `.ds-label` | 14px (0.875rem) | 500 | 1.4 | default | Form labels |
| `.ds-caption` | 12px (0.75rem) | 400 | 1.45 | 0.01em | Helper text, captions |
| `.ds-annotation` | 11px (0.6875rem) | 600 | 1.3 | 0.12em, uppercase | Tags, metadata, timestamps |
| `.text-gradient` | — | — | — | — | Gold gradient text clip |
| `.text-gradient-alt` | — | — | — | — | Gold → copper gradient text |

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

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 8px | Badges, small wells |
| `--radius-md` | 12px | Buttons, inputs, chips |
| `--radius-lg` | 16px | Cards, callouts |
| `--radius-xl` | 20px | Modals, promo cards |

---

## Buttons

**Rule:** filled gold CTAs use `--text-on-accent` (dark brown), not white.

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
| `.card-base` | Brown panel, subtle border, `--elevation-1` |
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
| `.nav-link-active` | Gold text + surface fill |
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
| `--elevation-1` | Cards — inset highlight + soft drop shadow |
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

{/* Success badge */}
<span className="badge-success">Verified</span>

{/* Gold icon well */}
<div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-bg-subtle)]">
  ...
</div>
```
