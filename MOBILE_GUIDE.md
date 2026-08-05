# AI CashWave Mobile Guide

Mobile behavior spec for AI CashWave member area.

## Viewport & PWA

- `viewportFit: cover`, `themeColor: #0A0A0B`
- `appleWebApp.capable: true`, `statusBarStyle: black-translucent`
- Manifest: `src/app/manifest.ts` (`display: standalone`)
- Icons: `public/icons/icon-192.png`, `public/icons/icon-512.png` (add branded assets)

## Shell

- **Desktop:** collapsible sidebar via `html[data-sidebar]` + `localStorage`
- **Mobile:** slim top bar (logo + `AI&nbsp;CashWave`, no hamburger)
- Content padding: `pb-24` for bottom tab clearance
- Safe areas: `env(safe-area-inset-top)` on top bar, bottom nav uses `safe-area-inset-bottom`

## Bottom navigation (`BottomNav`)

Five tabs:

1. Home → `/dashboard`
2. Search → `/search`
3. Find Ads → `/radar`
4. Replies → `/replies`
5. More → bottom sheet

**More sheet** includes:

- Remaining nav (Analysis, Training, Scale training)
- Premium (DFY, Instant, Autopilot)
- Exclusive offers (verbatim sidebar affiliate URLs)
- Contact Support, Logout

Tab bar: 64px + safe area, active accent + 3px top gradient bar.

## z-index stack

| Layer | z-index |
|---|---|
| Bottom tab bar | 50 |
| More sheet backdrop / panel | 70 |
| Video overlay | 120 |

## Generation banners

- **EarningsBanner** on `/search`, `/analysis`, `/radar`, `/replies` — appears when generation starts, persists until dismissed
- **WelcomeOfferBanner** on `/dfy`, `/instant`, `/autopilot`
- Instant/Autopilot: 3.5–4.5s fake delays on niche switches; Instant show-posts uses ~4–4.5s

## Video

- No inline Vimeo embeds on mobile or desktop
- Thumbnail tap → full-screen `VideoOverlay` with withdraw bar always visible (flex column, no scroll)

## Honest activity

- No floating toasts on mobile
- Dashboard activity rail uses `/api/stats` + tips
- Include “Individual results vary.” on dashboard

## Testing checklist

- iPhone SE (375px), Pro Max (430px), ~412px Android width
- Last CTA not hidden behind tab bar
- No input zoom on focus
- Brand wordmark single line at 320px
- Overlay ad fully visible without scrolling at ~800px laptop height and on phone
