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
    />
  ) : (
    <div
      className="surface-panel relative w-full overflow-hidden"
      aria-label={`${title} — tutorial coming soon`}
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
          <div className="p-4 sm:p-5 md:w-1/2 md:p-6">{media}</div>
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
