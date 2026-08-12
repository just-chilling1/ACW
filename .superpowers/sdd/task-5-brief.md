### Task 5: Enhance curated posts

**Files:**
- Modify: `src/lib/vault/content/make-money-online.ts`
- Modify: `src/lib/vault/content/weight-loss.ts`
- Modify: `src/lib/vault/content/health-fitness.ts`
- Modify: `src/lib/vault/content/beauty-skincare.ts`
- Modify: `src/lib/vault/content/relationships.ts`
- Modify: `src/lib/vault/content/tech-gadgets.ts`
- Modify: `src/lib/vault/content/pets.ts`
- Modify: `src/lib/vault/content/home-garden.ts`

Do **not** edit `src/lib/vault/content/shorts/*`.

- [ ] **Step 1: Editorial pass per niche file**

For each of 10 Quora + 10 Pinterest entries:

- Stronger first 1â€“2 sentences (specific problem, not generic opener).
- Clear useful steps before the link.
- Natural last-third resource framing for `__LINK__` (Quora) / benefit + CTA in description (Pinterest).
- Keep IDs, counts, `__LINK__` exactly once, word/length limits, distinct angles.
- No spam triggers; beginner voice; no product-name leaks.

Prefer strengthening weak openers and CTAs over full rewrites when already strong (e.g. parts of `make-money-online.ts`).

- [ ] **Step 2: Validate**

Run: `npm run validate:vault`  
Expected: PASS (exit 0). Fix any failures before proceeding.

---
