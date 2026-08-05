"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { clsx } from "clsx";
import { getVideoThumbnailById } from "@/lib/video-thumbnails";

interface VideoThumbnailProps {
    videoId: string;
    title: string;
    onPlay: () => void;
    className?: string;
    eager?: boolean;
}

export function VideoThumbnail({ videoId, title, onPlay, className, eager = false }: VideoThumbnailProps) {
    const [imgError, setImgError] = useState(false);
    const thumbPath = getVideoThumbnailById(videoId);

    return (
        <button
            type="button"
            onClick={onPlay}
            aria-label={`Play ${title}`}
            className={clsx(
                "surface-panel group relative w-full overflow-hidden text-left",
                className
            )}
        >
            <div className="relative w-full aspect-[3/2]">
                {thumbPath && !imgError ? (
                    <img
                        src={thumbPath}
                        alt=""
                        loading={eager ? "eager" : "lazy"}
                        decoding="async"
                        onError={() => setImgError(true)}
                        className="absolute inset-0 w-full h-full object-contain bg-black"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-bg-medium)] via-[var(--surface-1)] to-[var(--accent-bg-subtle)]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 sm:gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold)] text-[var(--text-on-accent)] shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-4 ring-black/40 transition-transform duration-150 group-hover:scale-110 sm:h-[4.5rem] sm:w-[4.5rem]">
                        <Play size={28} strokeWidth={0} className="ml-1 fill-current" aria-hidden />
                    </div>
                    <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-primary shadow-lg backdrop-blur-sm sm:text-xs">
                        Play Video
                    </span>
                </div>
            </div>
        </button>
    );
}
