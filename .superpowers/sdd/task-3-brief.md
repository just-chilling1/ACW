### Task 3: Auto-scroll in `InlineError`

**Files:**
- Modify: `src/components/ui/inlineError.tsx`

**Interfaces:**
- Consumes: existing `InlineError` props `{ message: string; className?: string }`
- Produces: same public API; scrolls into view when message appears

- [ ] **Step 1: Implement scroll-on-appear**

Replace `src/components/ui/inlineError.tsx` with:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";

export function InlineError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prevMessage = useRef("");

  useEffect(() => {
    if (!message) {
      prevMessage.current = "";
      return;
    }

    const appeared = prevMessage.current === "";
    prevMessage.current = message;
    if (!appeared) return;

    const id = window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={ref}
      role="alert"
      className={clsx("error-banner items-start", className)}
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--danger)]" />
      <span className="leading-snug">{message}</span>
    </div>
  );
}
```

Notes:

- Scrolls when message goes from empty â†’ non-empty (including first mount with a message).
- Does not re-scroll when the same non-empty message re-renders, or when the message text changes while already showing (if product later wants re-scroll on text change, compare `prevMessage.current !== message` instead).

- [ ] **Step 2: Lint**

Run: `npx eslint src/components/ui/inlineError.tsx`

Expected: no errors.

- [ ] **Step 3: Manual smoke on an existing `InlineError` page**

On `/instant/build` (or `/search` / `/dfy/new`): trigger a validation error with the viewport scrolled away from the banner. Confirm the page smoothly scrolls to the alert.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/inlineError.tsx
git commit -m "feat: scroll InlineError into view when it appears"
```

---

