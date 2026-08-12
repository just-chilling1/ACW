### Task 2: Mount tutorials on premium landings

**Files:**
- Modify: `src/app/dfy/page.tsx`
- Modify: `src/app/instant/page.tsx`
- Modify: `src/app/autopilot/page.tsx`
- Modify: `src/app/hot-threads/page.tsx`

**Interfaces:**
- Consumes: `TutorialVideoSection` / `DfyVideoSection` from Task 1
- Produces: each landing renders one tutorial block under header/hero

- [ ] **Step 1: Update `/dfy`**

In `src/app/dfy/page.tsx`, keep importing `DfyVideoSection`. Move it to immediately after the hero `<section className="mb-10 ...">` (before â€œMy Campaignsâ€‌). Ensure there is only one `<DfyVideoSection />` on the page:

```tsx
<section className="mb-10 overflow-hidden ...">
  {/* existing hero CTA content */}
</section>

<DfyVideoSection className="mb-10" />

<section className="mb-10">
  <PageHeader title="My Campaigns" ... />
  ...
</section>
```

(If it is already in that order, leave placement; only remove duplicates.)

- [ ] **Step 2: Update `/instant`**

In `src/app/instant/page.tsx`, import and place after `PageHeader`:

```tsx
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";

// inside return, after PageHeader:
<TutorialVideoSection
  title="How Instant Income Works"
  description="A short walkthrough of pasting your offer, copying posts and replies, and posting with confidence."
/>
```

No `videoId` (placeholder).

- [ ] **Step 3: Update `/autopilot`**

In `src/app/autopilot/page.tsx`, after the main `PageHeader` (the non-loading return), insert:

```tsx
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";

<TutorialVideoSection
  title="How Automated Profits Works"
  description="See how to set up your Traffic Machine and follow each step one click at a time."
/>
```

Also add the same block in the loading return under its `PageHeader` so layout doesnâ€™t jump, or only on the loaded return â€” prefer **loaded return only** to avoid duplicate placeholders during load.

- [ ] **Step 4: Update `/hot-threads`**

In `src/app/hot-threads/page.tsx`, after `PageHeader`:

```tsx
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";

<TutorialVideoSection
  title="How Hot Threads Works"
  description="Learn how to pick a niche, copy a reply, and post into todayâ€™s hottest conversations."
/>
```

- [ ] **Step 5: Manual smoke**

Start or use running `npm run dev`. Visit:

1. `/dfy` â€” one tutorial under hero; play opens overlay.
2. `/instant`, `/autopilot`, `/hot-threads` â€” â€œTutorial coming soonâ€‌; not clickable as play.

- [ ] **Step 6: Commit**

```bash
git add src/app/dfy/page.tsx src/app/instant/page.tsx src/app/autopilot/page.tsx src/app/hot-threads/page.tsx
git commit -m "feat: add tutorial slots to premium landing pages"
```

---

