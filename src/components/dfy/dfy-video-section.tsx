"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { VideoOverlay } from "@/components/ui/video-overlay";
import { getVimeoEmbedUrl } from "@/lib/vimeo";

export const DFY_VIDEO_ID = "1214651948";

type DfyVideoSectionProps = {
    className?: string;
    compact?: boolean;
};

export function DfyVideoSection({ className, compact }: DfyVideoSectionProps) {
    const [open, setOpen] = useState(false);

    if (compact) {
        return (
            <>
                <section className={className}>
                    <VideoThumbnail
                        videoId={DFY_VIDEO_ID}
                        title="How to Use DFY Campaign Builder"
                        onPlay={() => setOpen(true)}
                    />
                </section>
                <VideoOverlay
                    open={open}
                    onClose={() => setOpen(false)}
                    videoUrl={getVimeoEmbedUrl(DFY_VIDEO_ID)}
                    title="How to Use DFY Campaign Builder"
                />
            </>
        );
    }

    return (
        <>
            <section className={`card-base overflow-hidden p-0! ${className || ""}`}>
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2">
                        <VideoThumbnail
                            videoId={DFY_VIDEO_ID}
                            title="How to Use DFY Campaign Builder"
                            onPlay={() => setOpen(true)}
                            className="rounded-none border-0"
                        />
                    </div>
                    <div className="flex flex-col justify-center gap-4 p-6 md:w-1/2 md:p-8">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-[var(--gold)]" />
                            <span className="page-eyebrow text-[11px]!">Watch First</span>
                        </div>
                        <h2 className="ds-h3">How to Build Your Campaign</h2>
                        <p className="leading-relaxed text-text-secondary">
                            Watch this quick walkthrough to paste your offer, pick your niche audience, and let Cashwave build your full promotional campaign.
                        </p>
                    </div>
                </div>
            </section>
            <VideoOverlay
                open={open}
                onClose={() => setOpen(false)}
                videoUrl={getVimeoEmbedUrl(DFY_VIDEO_ID)}
                title="How to Use DFY Campaign Builder"
            />
        </>
    );
}
