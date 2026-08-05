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
            <div className="relative w-full aspect-video">
                {thumbPath && !imgError ? (
                    <img
                        src={thumbPath}
                        alt=""
                        loading={eager ? "eager" : "lazy"}
                        decoding="async"
                        onError={() => setImgError(true)}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-bg-medium)] via-[var(--surface-1)] to-[var(--accent-bg-subtle)]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/20 to-black/12" />

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)]/90 transition-all group-hover:scale-105 group-hover:border-[var(--accent-border-emphasis)] group-hover:bg-[var(--accent-bg-hover)] sm:h-16 sm:w-16">
                        <Play size={24} strokeWidth={1.75} className="ml-1 fill-text-primary text-text-primary" />
                    </div>
                </div>
            </div>
        </button>
    );
}
