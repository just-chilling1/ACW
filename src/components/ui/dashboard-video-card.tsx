"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { clsx } from "clsx";
import { VideoOverlay } from "@/components/ui/video-overlay";
import { getVimeoEmbedUrl } from "@/lib/vimeo";
import {
  isPlayableVimeoId,
  type DashboardTrainingVideo,
} from "@/lib/dashboard-training-videos";

type Props = {
  video: DashboardTrainingVideo;
  chip?: string;
  className?: string;
};

export function DashboardVideoCard({ video, chip, className }: Props) {
  const [playing, setPlaying] = useState(false);
  const canPlay = isPlayableVimeoId(video.id);

  return (
    <>
      <div className={clsx("card-base overflow-hidden p-0!", className)}>
        <div className="p-5 pb-3">
          {chip ? <span className="page-eyebrow mb-2 inline-block">{chip}</span> : null}
          <h3 className="ds-h3">{video.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">{video.description}</p>
        </div>

        <div className="px-5 pb-5 pt-2">
          <button
            type="button"
            onClick={() => {
              if (canPlay) setPlaying(true);
            }}
            aria-label={canPlay ? `Play ${video.title}` : `${video.title} thumbnail`}
            aria-disabled={!canPlay}
            className="group relative block aspect-[3/2] w-full overflow-hidden rounded-[var(--radius-md)] bg-black ring-1 ring-white/[0.06]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnail}
              alt={`${video.title} thumbnail`}
              className="absolute inset-0 h-full w-full object-contain"
              loading={video.priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={video.priority ? "high" : "auto"}
              width={1536}
              height={1024}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/25" />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gold)] text-[var(--text-on-accent)] shadow-lg ring-4 ring-black/30 transition-transform duration-150 group-hover:scale-105">
                <Play className="ml-0.5 h-7 w-7 fill-current" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-text-primary drop-shadow-lg">
                Click to Play Video
              </span>
            </span>
          </button>
        </div>
      </div>

      <VideoOverlay
        open={playing}
        onClose={() => setPlaying(false)}
        videoUrl={getVimeoEmbedUrl(video.id)}
        title={video.title}
      />
    </>
  );
}

/** Design-system alias */
export const VideoCard = DashboardVideoCard;
