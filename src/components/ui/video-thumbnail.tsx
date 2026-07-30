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
                "group relative w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] text-left",
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
                    <div className="absolute inset-0 bg-gradient-to-br from-[rgba(234,179,8,0.12)] via-[var(--surface-1)] to-[rgba(99,102,241,0.18)]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/20 to-black/12" />

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)]/90 transition-all group-hover:scale-105 group-hover:border-[rgba(234,179,8,0.45)] group-hover:bg-[rgba(234,179,8,0.15)] sm:h-16 sm:w-16">
                        <Play size={24} strokeWidth={1.75} className="ml-1 fill-white text-white" />
                    </div>
                </div>
            </div>
        </button>
    );
}
