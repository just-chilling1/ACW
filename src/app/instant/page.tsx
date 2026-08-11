"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CopyButton } from "@/components/dfy/copy-button";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { VideoOverlay } from "@/components/ui/video-overlay";
import type { KitStats, KitRecommendations } from "@/lib/instant/types";

const INSTANT_VIDEO_ID = "1214657449";

type KitSummary = {
    id: string;
    name: string;
    status: string;
    stats: KitStats;
    recommendations: KitRecommendations;
    updated_at: string;
};

export default function InstantLandingPage() {
    const [kits, setKits] = useState<KitSummary[]>([]);
    const [latestAsset, setLatestAsset] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [videoOpen, setVideoOpen] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        fetch("/api/instant/kits")
            .then((r) => r.json())
            .then(async (d) => {
                const kitList = d.kits || [];
                setKits(kitList);
                const latest = kitList.find((k: KitSummary) => k.status === "ready");
                if (latest) {
                    const detail = await fetch(`/api/instant/kits/${latest.id}`).then((r) => r.json());
                    const bestId = detail.kit?.recommendations?.bestPromotionId || detail.kit?.recommendations?.bestPostId;
                    const asset = detail.assets?.find((a: { id: string }) => a.id === bestId);
                    setLatestAsset(asset?.content || detail.assets?.find((a: { type: string }) => a.type === "post")?.content || "");
                }
            })
            .catch(() => setKits([]))
            .finally(() => setLoading(false));
    }, []);

    const latestKit = kits.find((k) => k.status === "ready");

    return (
        <div className="mx-auto max-w-2xl space-y-8 pb-12">
            <PageHeader
                eyebrow="PREMIUM"
                title="Instant Income"
                subtitle="Turn your offer into ready-to-use promotions."
            />

            <Link href="/instant/build" className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-base">
                <Sparkles size={18} />
                Create Promotion Kit
            </Link>

            <p className="text-center text-xs text-text-muted">Ready in moments. No marketing expertise required.</p>

            {!loading && latestKit ? (
                <div className="surface-panel-elevated space-y-4 p-5 sm:p-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Your Latest Kit</h2>
                    <div>
                        <p className="text-xl font-semibold text-text-primary">{latestKit.name}</p>
                        <p className="text-xs capitalize text-[var(--success)]">Ready</p>
                        <p className="mt-2 text-sm text-text-muted">
                            {latestKit.stats?.postCount || 0} Posts · {latestKit.stats?.hookCount || 0} Hooks · {latestKit.stats?.replyCount || 0} Replies
                        </p>
                    </div>
                    <Link href={`/instant/kit/${latestKit.id}`} className="btn-secondary inline-flex">
                        Open Kit
                        <ArrowRight size={14} />
                    </Link>
                </div>
            ) : !loading ? (
                <div className="surface-panel-elevated space-y-4 p-6 text-center">
                    <h2 className="text-lg font-semibold">Your first promotion kit starts here</h2>
                    <p className="text-sm text-text-muted">
                        Give Cashwave your offer and we&apos;ll prepare ready-to-use promotions for you.
                    </p>
                    <Link href="/instant/build" className="btn-primary inline-flex">
                        Create My First Kit
                    </Link>
                </div>
            ) : null}

            {latestAsset ? (
                <div className="surface-panel-elevated space-y-3 p-5 sm:p-6">
                    <h2 className="text-sm font-semibold text-[var(--gold-text)]">What should I use right now?</h2>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{latestAsset.slice(0, 400)}{latestAsset.length > 400 ? "…" : ""}</p>
                    <CopyButton text={latestAsset} label="Copy" variant="primary" />
                </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
                <Link href="/instant/kits" className="btn-secondary text-sm">My Promotion Kits</Link>
                <button type="button" onClick={() => setShowHelp(!showHelp)} className="btn-ghost text-sm">
                    <HelpCircle size={14} />
                    Need help?
                </button>
            </div>

            {showHelp ? (
                <div className="space-y-4">
                    <p className="text-sm text-text-muted">
                        Paste your affiliate link, confirm your offer, and click Create My Promotion Kit.
                        You&apos;ll get posts, hooks, replies, CTAs, and a quick-start plan — all ready to copy.
                    </p>
                    <VideoThumbnail
                        videoId={INSTANT_VIDEO_ID}
                        title="Instant Income walkthrough"
                        onPlay={() => setVideoOpen(true)}
                    />
                </div>
            ) : null}

            {videoOpen ? (
                <VideoOverlay
                    open={videoOpen}
                    onClose={() => setVideoOpen(false)}
                    videoUrl={`https://player.vimeo.com/video/${INSTANT_VIDEO_ID}`}
                    title="Instant Income walkthrough"
                />
            ) : null}
        </div>
    );
}
