"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { VideoOverlay } from "@/components/ui/video-overlay";
import { TodaysTasks } from "@/components/premium/TodaysTasks";

type Props = {
    title: React.ReactNode;
    subtitle: string;
    videoId: string;
    videoTitle: string;
    videoDescription: string;
    trustBullets: string[];
    children: React.ReactNode;
};

export function PremiumPageLayout({
    title,
    subtitle,
    videoId,
    videoTitle,
    videoDescription,
    trustBullets,
    children,
}: Props) {
    const [videoOpen, setVideoOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-8 md:gap-10 md:py-10"
        >
            <PageHeader eyebrow="PREMIUM" title={title} subtitle={subtitle} />

            <TodaysTasks />

            <section className="premium-hero-card overflow-hidden p-0!">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2">
                        <VideoThumbnail
                            videoId={videoId}
                            title={videoTitle}
                            onPlay={() => setVideoOpen(true)}
                            className="rounded-none border-0"
                        />
                    </div>
                    <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-center gap-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-[var(--gold)]" />
                            <span className="page-eyebrow text-[11px]!">Watch First</span>
                        </div>
                        <h2 className="ds-h2">{videoTitle}</h2>
                        <p className="text-text-secondary leading-relaxed">{videoDescription}</p>
                    </div>
                </div>
            </section>

            {children}

            <footer className="mt-6 flex flex-col items-center gap-4 border-t border-[var(--border-subtle)] pt-8 pb-4">
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                    {trustBullets.map((b) => (
                        <div
                            key={b}
                            className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-text-muted"
                        >
                            <div className="h-1 w-1 rounded-full bg-[var(--gold)]" />
                            {b}
                        </div>
                    ))}
                </div>
                <p className="text-[12px] text-text-muted font-medium">
                    © 2026 AI CashWave. All rights reserved.
                </p>
            </footer>

            <VideoOverlay
                open={videoOpen}
                onClose={() => setVideoOpen(false)}
                videoUrl={`https://player.vimeo.com/video/${videoId}`}
                title={videoTitle}
            />
        </motion.div>
    );
}
