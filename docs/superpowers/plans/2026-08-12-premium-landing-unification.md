# Premium Landing Unification Implementation Plan

> **For agentic workers:** Execute task-by-task. User directed: implement directly.

**Goal:** Unify six premium landings with a shared kit (shell, hero, section, states) and skeleton-first loading.

**Architecture:** New `src/components/premium/*` + light CSS; migrate landings only.

**Tech Stack:** Next.js App Router, React client pages, Framer Motion, existing DS tokens in `globals.css`.

---

### Task 1: Premium kit components + CSS

- Create `PremiumLandingShell`, `PremiumHero`, `PremiumSection`, `PremiumStateBlock`
- Add `.premium-landing-*` helpers in `globals.css` if needed

### Task 2: Migrate catalog-style landings

- `/hot-threads`, `/vault`, `/shorts-vault`

### Task 3: Migrate CTA landings

- `/instant`, `/dfy`, `/autopilot`

### Task 4: Smoke-check

- Lint touched files; ensure imports resolve
