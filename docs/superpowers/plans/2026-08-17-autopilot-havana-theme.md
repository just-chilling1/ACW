# Automated Profits Havana Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Automated Profits (`/autopilot`) a dedicated Cigar Lounge Havana theme that matches the DFY/Instant premium family with strong contrast, without changing layout or flows.

**Architecture:** Mirror Instant Income’s pattern: scoped CSS variables on `.autopilot-theme`, body chrome via `data-theme="autopilot"`, Shell path detection for `/autopilot`, and light Autopilot-specific polish for cards/panels. No shared `havana-theme` extraction in this plan.

**Tech Stack:** Next.js App Router, existing CSS design tokens in `src/app/globals.css`, React Shell layout, TypeScript

## Global Constraints

- Palette: Cigar Lounge (caramel / Havana orange on espresso) — Instant-adjacent, not DFY amber-gold
- Scope: Theme existing page only — no Instant-style hero / how-to rebuild
- Do not edit `.dfy-theme` or `.instant-theme` token blocks
- Do not change Autopilot APIs, copy, or setup/opportunity/activation flows
- Do not commit unless the user explicitly asks
- No new test framework (repo has none); verify with file checks + visual checklist

## File map

| File | Responsibility |
|---|---|
| `src/app/globals.css` | `.autopilot-theme` tokens + primitive overrides + `body[data-theme="autopilot"]` chrome |
| `src/components/layout/Shell.tsx` | Detect `/autopilot`, apply theme class + `dataset.theme` |
| `src/app/autopilot/page.tsx` | Pass `className="autopilot-theme"` on `PremiumLandingShell` |
| `src/components/traffic-machine/OpportunityCard.tsx` | Stronger default/recommended borders using theme tokens |

---

### Task 1: Autopilot theme tokens + chrome CSS

**Files:**
- Modify: `src/app/globals.css` (append after the Instant Income theme section ends — after Instant custom/mobile rules near EOF is fine; preferred placement is immediately after `body.app-bg[data-theme="instant"]` / Instant button overrides so premium themes stay grouped — insert a new block labeled `/* ── Automated Profits — Havana cigar lounge ── */` after the Instant theme variable block and before Instant-only layout classes is acceptable; simplest: append at end of file)
- Test: manual / `rg` checks below

**Interfaces:**
- Consumes: Instant Cigar Lounge token values as the visual reference (`#080504` canvas, `#c97943` caramel, etc. from `.instant-theme`)
- Produces: `.autopilot-theme` CSS custom properties + `body.app-bg[data-theme="autopilot"]` chrome vars; descendant overrides for `.btn-primary`, `.btn-secondary`, `.btn-chip`, `.btn-chip-active`, `.input-base`, `.card-base`, `.surface-panel`, `.surface-panel-elevated`, `.premium-landing-hero`, `.premium-landing-hero__glow`

- [ ] **Step 1: Confirm Instant reference tokens still exist**

Run:

```bash
rg -n "\.instant-theme \{|data-theme=\"instant\"" src/app/globals.css
```

Expected: matches for `.instant-theme {` and `body.app-bg[data-theme="instant"]`.

- [ ] **Step 2: Append Autopilot theme CSS at end of `src/app/globals.css`**

Add exactly this block (do not modify existing DFY/Instant blocks):

```css
/* ── Automated Profits — Havana cigar lounge ── */
.autopilot-theme {
  /* Canvas: near-black espresso */
  --bg-app: #080504;
  --bg-app-2: #0e0806;
  --bg-page: #080504;
  /* Surfaces: layered mocha */
  --surface-1: #18100c;
  --surface-2: rgba(180, 110, 60, 0.08);
  --surface-3: #221410;
  --bg-panel: #18100c;
  --bg-glass: rgba(18, 12, 9, 0.97);
  --chrome-bg: rgba(10, 6, 5, 0.96);
  --sidebar-bg: rgba(8, 5, 4, 0.99);
  --bg-sidebar: rgba(8, 5, 4, 0.99);

  /* Borders: warm copper — solid, high visibility */
  --border-subtle: #3d2418;
  --border-strong: #6b3f28;
  --border-secondary-hover: #a8643d;
  --bg-border: #4a2a1c;
  --card-border: #4a2a1c;
  --card-border-hover: #b87340;
  --card-bg-hover: #1e1210;

  /* Text: wide hierarchy gap */
  --text-primary: #fff8f0;
  --text-secondary: #c9a882;
  --text-tertiary: #9a7860;
  --text-muted: #7a6350;
  --text-on-accent: #140a06;

  /* Accents: caramel Havana */
  --gold: #c97943;
  --gold-text: #e8a862;
  --gold-hover: #a85e32;
  --gold-light: #f0b878;
  --gold-dim: #6b3820;
  --copper: #a85530;
  --brand-primary: #c97943;
  --brand-secondary: #7a3d22;
  --brand-tint: rgba(201, 121, 67, 0.14);
  --grad-brand: linear-gradient(110deg, #d4874f 0%, #8f4528 100%);
  --grad-brand-alt: linear-gradient(110deg, #f0b878 0%, #c97943 100%);

  --accent-bg-faint: rgba(201, 121, 67, 0.1);
  --accent-bg-subtle: rgba(201, 121, 67, 0.16);
  --accent-bg-medium: rgba(201, 121, 67, 0.24);
  --accent-bg-hover: rgba(201, 121, 67, 0.32);
  --accent-border-soft: #5a3220;
  --accent-border: #8f5230;
  --accent-border-strong: #c97943;
  --accent-border-emphasis: #e8a862;
  --accent-focus-ring: rgba(201, 121, 67, 0.32);
  --accent-glow: rgba(140, 70, 35, 0.38);
  --shadow-gold: 0 18px 48px rgba(0, 0, 0, 0.72);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 26px;
  --radius-pill: 999px;
}

body.app-bg[data-theme="autopilot"] {
  --sidebar-bg: rgba(8, 5, 4, 0.99);
  --bg-sidebar: rgba(8, 5, 4, 0.99);
  --chrome-bg: rgba(10, 6, 5, 0.96);
  --surface-1: #18100c;
  --surface-2: rgba(180, 110, 60, 0.08);
  --surface-3: #221410;
  --border-subtle: #3d2418;
  --border-strong: #6b3f28;
  --text-primary: #fff8f0;
  --text-secondary: #c9a882;
  --text-tertiary: #9a7860;
  --text-muted: #7a6350;
  --gold: #c97943;
  --gold-text: #e8a862;
  --gold-light: #f0b878;
  --grad-brand: linear-gradient(110deg, #d4874f 0%, #8f4528 100%);
  --accent-bg-faint: rgba(201, 121, 67, 0.1);
  --accent-bg-subtle: rgba(201, 121, 67, 0.16);
  --accent-bg-medium: rgba(201, 121, 67, 0.24);
  --accent-border: #8f5230;
  --accent-border-strong: #c97943;
  --accent-border-emphasis: #e8a862;
  --accent-glow: rgba(140, 70, 35, 0.38);
  --app-bg-base: linear-gradient(180deg, #140c0a 0%, #080504 55%, #050302 100%);
  --app-bg-gold: radial-gradient(ellipse 75% 60% at 5% 0%, rgba(140, 70, 35, 0.14) 0%, transparent 58%);
  --app-bg-copper: radial-gradient(ellipse 60% 50% at 92% 88%, rgba(60, 30, 18, 0.18) 0%, transparent 55%);
}

.autopilot-theme .btn-primary {
  border: 1px solid #8f5230;
  background: linear-gradient(115deg, #a85e32 0%, #7a3d22 48%, #5a2818 100%);
  color: #fff8f0;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.1) inset,
    0 8px 22px -6px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(140, 70, 35, 0.35);
  transition:
    background var(--duration-normal) var(--ease-out),
    transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out),
    border-color var(--duration-normal) var(--ease-out);
}

.autopilot-theme .btn-primary:hover:not(:disabled) {
  background: linear-gradient(115deg, #c97943 0%, #8f4528 42%, #6b3018 100%);
  border-color: #c97943;
  color: #fff8f0;
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.14) inset,
    0 14px 34px -8px rgba(140, 70, 35, 0.55),
    0 0 0 1px rgba(201, 121, 67, 0.4),
    0 0 20px rgba(140, 70, 35, 0.22);
}

.autopilot-theme .btn-primary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.18) inset,
    0 6px 16px -8px rgba(212, 135, 79, 0.45);
}

.autopilot-theme .btn-secondary {
  border: 1px solid var(--border-subtle);
  background: #0e0806;
  color: var(--text-secondary);
  transition:
    border-color var(--duration-normal) var(--ease-out),
    background var(--duration-normal) var(--ease-out),
    transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out),
    color var(--duration-normal) var(--ease-out);
}

.autopilot-theme .btn-secondary:hover:not(:disabled) {
  border-color: var(--accent-border);
  background: #18100c;
  color: var(--gold-light);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px -10px rgba(0, 0, 0, 0.75);
}

.autopilot-theme .btn-chip {
  border-color: var(--border-subtle);
  border-radius: var(--radius-pill);
  background: #0a0605;
  color: var(--text-muted);
}

.autopilot-theme .btn-chip:hover:not(:disabled) {
  border-color: var(--accent-border);
  background: #140c0a;
  color: var(--text-secondary);
}

.autopilot-theme .btn-chip-active {
  border-color: var(--gold);
  background: var(--accent-bg-subtle);
  color: var(--gold-light);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--gold) 30%, transparent),
    0 0 12px rgba(201, 121, 67, 0.15);
}

.autopilot-theme .input-base {
  border-color: var(--border-subtle);
  border-radius: var(--radius-md);
  background: #0a0605;
  color: var(--text-primary);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.35);
}

.autopilot-theme .input-base::placeholder {
  color: var(--text-muted);
}

.autopilot-theme .input-base:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px var(--accent-focus-ring);
}

.autopilot-theme .surface-panel,
.autopilot-theme .surface-panel-elevated {
  border-color: var(--border-strong);
  background: linear-gradient(180deg, #1a100c 0%, #120a08 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.autopilot-theme .card-base {
  background: linear-gradient(180deg, #1c1210 0%, #140c0a 100%);
  border-color: var(--border-strong);
  box-shadow:
    var(--elevation-1),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.autopilot-theme .card-base:hover {
  border-color: var(--accent-border);
  background: linear-gradient(180deg, #201410 0%, #16100c 100%);
}

.autopilot-theme .premium-landing-hero {
  border-radius: var(--radius-2xl);
  border-color: var(--border-strong);
  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--surface-3) 90%, var(--bg-app)) 0%,
      var(--surface-1) 48%,
      var(--bg-app) 100%
    );
  box-shadow: var(--shadow-gold);
}

.autopilot-theme .premium-landing-hero__glow {
  display: block;
  opacity: 0.55;
  background: radial-gradient(
    ellipse at center,
    color-mix(in srgb, var(--gold) 26%, transparent) 0%,
    transparent 68%
  );
}

.autopilot-theme .text-text-secondary,
.autopilot-theme .ds-subtitle {
  color: var(--text-secondary);
}

.autopilot-theme .text-text-muted {
  color: var(--text-muted);
}

.autopilot-theme .page-eyebrow {
  color: var(--gold-text);
}
```

- [ ] **Step 3: Verify CSS landed and DFY/Instant untouched**

Run:

```bash
rg -n "autopilot-theme|data-theme=\"autopilot\"" src/app/globals.css
rg -n "DFY quiet luxury|Instant Income — cocoa" src/app/globals.css
```

Expected: multiple `autopilot-theme` hits; DFY and Instant section headers still present once each.

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
Add Autopilot Havana theme tokens and chrome CSS.

EOF
)"
```

Skip this step unless the user explicitly requested a commit.

---

### Task 2: Wire Shell + Autopilot page theme class

**Files:**
- Modify: `src/components/layout/Shell.tsx`
- Modify: `src/app/autopilot/page.tsx`
- Test: `rg` + visual on `/autopilot`

**Interfaces:**
- Consumes: `.autopilot-theme` and `body.app-bg[data-theme="autopilot"]` from Task 1
- Produces: Autopilot routes render with theme class on Shell content wrapper and `document.body.dataset.theme === "autopilot"` while pathname starts with `/autopilot`

- [ ] **Step 1: Update `Shell.tsx` path detection and theme effect**

In `src/components/layout/Shell.tsx`, after `isInstantPage`, add:

```tsx
const isAutopilotPage = pathname.startsWith("/autopilot");
```

Replace the Instant-only `useEffect` for `dataset.theme` with:

```tsx
useEffect(() => {
  if (isInstantPage) {
    document.body.dataset.theme = "instant";
  } else if (isAutopilotPage) {
    document.body.dataset.theme = "autopilot";
  } else {
    delete document.body.dataset.theme;
  }

  return () => {
    delete document.body.dataset.theme;
  };
}, [isInstantPage, isAutopilotPage]);
```

Update the content wrapper `clsx` to:

```tsx
className={clsx(
  "mx-auto flex min-h-full w-full min-w-0 max-w-6xl flex-col px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10",
  isDfyPage && "dfy-theme",
  isInstantPage && "instant-theme",
  isAutopilotPage && "autopilot-theme",
)}
```

- [ ] **Step 2: Apply theme class on Autopilot landing shell**

In `src/app/autopilot/page.tsx`, update both `PremiumLandingShell` usages (loading + main return):

Loading branch:

```tsx
<PremiumLandingShell animate={false} className="autopilot-theme">
```

Main return:

```tsx
<PremiumLandingShell className="autopilot-theme">
```

- [ ] **Step 3: Verify wiring**

Run:

```bash
rg -n "isAutopilotPage|autopilot-theme|dataset.theme" src/components/layout/Shell.tsx src/app/autopilot/page.tsx
```

Expected:
- `Shell.tsx` defines `isAutopilotPage`, sets `dataset.theme` to `"autopilot"`, applies `autopilot-theme` in `clsx`
- `page.tsx` has `className="autopilot-theme"` on both shells

Visual (dev server): open `/autopilot` — espresso background, caramel CTAs, copper borders; navigate to `/dfy` and `/instant` — their themes unchanged; leave Autopilot — body `data-theme` cleared.

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/components/layout/Shell.tsx src/app/autopilot/page.tsx
git commit -m "$(cat <<'EOF'
Wire Autopilot Havana theme through Shell and landing shell.

EOF
)"
```

---

### Task 3: Opportunity card contrast polish

**Files:**
- Modify: `src/components/traffic-machine/OpportunityCard.tsx`
- Test: visual on Autopilot ready-state card grid

**Interfaces:**
- Consumes: `--border-strong`, `--gold`, `--accent-bg-subtle`, `--surface-1` from active theme
- Produces: Non-activated cards use strong borders; recommended cards use accent tint fill for clearer “next up” contrast

- [ ] **Step 1: Strengthen card border/fill classes**

In `OpportunityCard.tsx`, replace the `clsx` border/background branch with:

```tsx
className={clsx(
  "flex flex-col gap-3 rounded-[var(--radius-md)] border p-4 transition-colors",
  activated
    ? "border-[var(--success-border)] bg-[var(--success-bg-faint)]"
    : recommended
      ? "border-[var(--gold)] bg-[var(--accent-bg-subtle)]"
      : "border-[var(--border-strong)] bg-[var(--surface-1)]",
)}
```

Rationale: Autopilot Havana needs solid borders; recommended state uses accent tint instead of faint `surface-2` wash. Uses CSS variables so DFY/Instant (if they ever reuse the card) still follow their own tokens.

- [ ] **Step 2: Verify**

Run:

```bash
rg -n "border-strong|accent-bg-subtle" src/components/traffic-machine/OpportunityCard.tsx
```

Expected: both strings present in the non-activated branches.

Visual: on Autopilot ready state, Available cards show copper borders against espresso; “Next up” card has caramel border + tinted fill distinct from neighbors.

- [ ] **Step 3: Commit (only if user asked)**

```bash
git add src/components/traffic-machine/OpportunityCard.tsx
git commit -m "$(cat <<'EOF'
Improve Autopilot opportunity card border contrast.

EOF
)"
```

---

### Task 4: End-to-end verification

**Files:**
- None (verification only)

- [ ] **Step 1: Static coverage check against spec**

Run:

```bash
rg -n "autopilot-theme|data-theme=\"autopilot\"" src/app/globals.css src/components/layout/Shell.tsx src/app/autopilot/page.tsx
rg -n "dfy-theme \{|instant-theme \{" src/app/globals.css
```

Expected: Autopilot theme wired in all three files; DFY and Instant theme selectors still exist.

- [ ] **Step 2: Lint touched files**

Run:

```bash
npx eslint src/components/layout/Shell.tsx src/app/autopilot/page.tsx src/components/traffic-machine/OpportunityCard.tsx
```

Expected: no new errors.

- [ ] **Step 3: Manual visual checklist**

With `npm run dev`, confirm:

| Check | Pass? |
|---|---|
| `/autopilot` loading + ready: Havana espresso canvas, cream text, caramel primary buttons | |
| Setup wizard inputs: dark inset fields, copper focus | |
| Progress bar + next source + filter chips: readable accent contrast | |
| Opportunity cards: strong borders; recommended card pops | |
| Guided workflow + celebration: inherit mocha cards / caramel CTAs | |
| Sidebar/chrome while on Autopilot match page | |
| `/dfy` and `/instant` look unchanged | |
| Leave Autopilot: chrome returns to default | |

- [ ] **Step 4: Stop**

Do not open a PR or commit unless the user asks.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|---|---|
| Cigar Lounge tokens | Task 1 |
| `body[data-theme="autopilot"]` chrome | Task 1 + 2 |
| Shell `/autopilot` class + dataset | Task 2 |
| `PremiumLandingShell` `autopilot-theme` | Task 2 |
| Buttons / chips / inputs / hero / panels | Task 1 |
| Opportunity card contrast | Task 3 |
| Guided workflow / celebration inherit tokens | Task 1 (descendant rules) + Task 2 (ancestor class) |
| DFY/Instant untouched | Task 1 constraint + Task 4 checks |
| No layout/API/copy changes | Global constraints; no tasks touch those |
| Verification desktop/mobile + other premium pages | Task 4 |
