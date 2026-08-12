### Task 1: Shared `TutorialVideoSection`

**Files:**
- Create: `src/components/ui/tutorial-video-section.tsx`
- Modify: `src/components/dfy/dfy-video-section.tsx`

**Interfaces:**
- Consumes: `VideoThumbnail`, `VideoOverlay`, `getVimeoEmbedUrl` from existing UI/lib
- Produces:

```ts
export type TutorialVideoSectionProps = {
  title: string;
  description: string;
  videoId?: string;
  className?: string;
  compact?: boolean;
  eyebrow?: string; // default "Watch First"
};

export function TutorialVideoSection(props: TutorialVideoSectionProps): JSX.Element;
```

- [ ] **Step 1: Create `tutorial-video-section.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { VideoOverlay } from "@/components/ui/video-overlay";
import { getVimeoEmbedUrl } from "@/lib/vimeo";

export type TutorialVideoSectionProps = {
  title: string;
  description: string;
  videoId?: string;
  className?: string;
  compact?: boolean;
  eyebrow?: string;
};

export function TutorialVideoSection({
  title,
  description,
  videoId,
  className,
  compact,
  eyebrow = "Watch First",
}: TutorialVideoSectionProps) {
  const [open, setOpen] = useState(false);
  const hasVideo = Boolean(videoId);

  const media = hasVideo ? (
    <VideoThumbnail
      videoId={videoId!}
      title={title}
      onPlay={() => setOpen(true)}
      className={compact ? undefined : "rounded-none border-0"}
    />
  ) : (
    <div
      className={clsx(
        "surface-panel relative w-full overflow-hidden",
        !compact && "rounded-none border-0"
      )}
      aria-label={`${title} â€” tutorial coming soon`}
    >
      <div className="relative aspect-[3/2] w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-bg-medium)] via-[var(--surface-1)] to-[var(--accent-bg-subtle)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 sm:gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)] text-text-muted ring-4 ring-black/40 sm:h-[4.5rem] sm:w-[4.5rem]">
            <Sparkles size={28} strokeWidth={1.75} aria-hidden />
          </div>
          <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-primary shadow-lg backdrop-blur-sm sm:text-xs">
            Tutorial coming soon
          </span>
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <>
        <section className={className}>{media}</section>
        {hasVideo ? (
          <VideoOverlay
            open={open}
            onClose={() => setOpen(false)}
            videoUrl={getVimeoEmbedUrl(videoId!)}
            title={title}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <section className={clsx("card-base overflow-hidden p-0!", className)}>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2">{media}</div>
          <div className="flex flex-col justify-center gap-4 p-6 md:w-1/2 md:p-8">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--gold)]" />
              <span className="page-eyebrow text-[11px]!">{eyebrow}</span>
            </div>
            <h2 className="ds-h3">{title}</h2>
            <p className="leading-relaxed text-text-secondary">{description}</p>
          </div>
        </div>
      </section>
      {hasVideo ? (
        <VideoOverlay
          open={open}
          onClose={() => setOpen(false)}
          videoUrl={getVimeoEmbedUrl(videoId!)}
          title={title}
        />
      ) : null}
    </>
  );
}
```

- [ ] **Step 2: Thin-wrap `DfyVideoSection`**

Replace `src/components/dfy/dfy-video-section.tsx` body with:

```tsx
"use client";

import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";

export const DFY_VIDEO_ID = "1214651948";

type DfyVideoSectionProps = {
  className?: string;
  compact?: boolean;
};

export function DfyVideoSection({ className, compact }: DfyVideoSectionProps) {
  return (
    <TutorialVideoSection
      videoId={DFY_VIDEO_ID}
      title="How to Build Your Campaign"
      description="Watch this quick walkthrough to paste your offer, pick your niche audience, and let Cashwave build your full promotional campaign."
      className={className}
      compact={compact}
    />
  );
}
```

Keep exporting `DFY_VIDEO_ID` for any existing importers.

- [ ] **Step 3: Lint the new/changed files**

Run: `npx eslint src/components/ui/tutorial-video-section.tsx src/components/dfy/dfy-video-section.tsx`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/tutorial-video-section.tsx src/components/dfy/dfy-video-section.tsx
git commit -m "feat: add shared TutorialVideoSection with DFY wrapper"
```

---

