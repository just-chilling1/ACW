"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles, ArrowRight, ExternalLink, Flame, RotateCcw,
    Zap, Download,
} from "lucide-react";
import { PremiumPageLayout } from "@/components/premium/PremiumPageLayout";
import { MemberProfileSetup } from "@/components/premium/MemberProfileSetup";
import { CopyButton } from "@/components/premium/CopyButton";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { SkeletonCards } from "@/components/ui/skeleton";
import type { CampaignData } from "@/lib/premium-types";
import { DFY_KEYWORDS } from "@/lib/content/dfy-keywords";
import { buildCampaignCopyAll } from "@/lib/premium-copy";

export default function DfyPage() {
    const { profile, loading, saving, error, saveProfile, isSetupComplete } = useMemberProfile();
    const [building, setBuilding] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState("");
    const [showBanner, setShowBanner] = useState(false);
    const [campaign, setCampaign] = useState<CampaignData | null>(null);
    const [copyAll, setCopyAll] = useState("");
    const [buildError, setBuildError] = useState("");
    const [pastCampaigns, setPastCampaigns] = useState<{ id: string; name: string; data: CampaignData }[]>([]);

    useEffect(() => {
        if (isSetupComplete) {
            fetch("/api/premium/campaign")
                .then((r) => r.json())
                .then((d) => setPastCampaigns(d.campaigns ?? []))
                .catch(() => {});
        }
    }, [isSetupComplete]);

    const handleBuild = async (opts?: { useFallbackKeyword?: boolean; fallbackSearch?: string }) => {
        setBuilding(true);
        setShowBanner(true);
        setBuildError("");
        setLoadingLabel("Finding the best keywords for your niche...");

        try {
            setLoadingLabel("Searching Reddit & YouTube for high-intent posts...");
            const resp = await fetch("/api/premium/campaign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(opts ?? {}),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Build failed");

            setLoadingLabel("Writing your replies and bonus content...");
            setCampaign(data.data);
            setCopyAll(data.copyAll);
            setPastCampaigns((prev) => [data.campaign, ...prev].slice(0, 5));
        } catch (e) {
            setBuildError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setBuilding(false);
        }
    };

    const loadCampaign = (c: { data: CampaignData }) => {
        setCampaign(c.data);
        setCopyAll(buildCampaignCopyAll(c.data));
    };

    return (
        <PremiumPageLayout
            title={
                <>
                    Done-For-You <span className="text-gradient">Campaign Builder</span>
                </>
            }
            subtitle="One click builds your full campaign — keywords, real posts, AI replies, and bonus content for Facebook, Quora, and Pinterest."
            videoId="1214651948"
            videoTitle="How to Use Done-For-You"
            videoDescription="Watch this quick tutorial, then press Build My Campaign. We handle the rest."
            trustBullets={["AI Keywords", "Real Posts Found", "Replies + Your Link", "Copy & Earn"]}
        >
            {loading ? (
                <SkeletonCards count={2} />
            ) : !isSetupComplete ? (
                <MemberProfileSetup
                    onComplete={saveProfile}
                    saving={saving}
                    error={error}
                    initial={{
                        affiliateLink: profile?.affiliate_link,
                        niche: profile?.niche,
                        writingStyle: profile?.writing_style,
                    }}
                />
            ) : (
                <>
                    {(building || showBanner) && (
                        <GenerationProgress
                            active={building}
                            showBanner={showBanner}
                            label={loadingLabel || "Building your campaign..."}
                            offer="welcome"
                            scrollOnComplete
                            scrollTargetId="campaign-results"
                        />
                    )}

                    {!campaign && !building && (
                        <section className="premium-campaign-cta">
                            <div className="premium-icon-well mx-auto">
                                <Sparkles size={24} />
                            </div>
                            <h2 className="ds-h2">Ready to Build Your Campaign?</h2>
                            <p className="ds-body-sm text-text-secondary max-w-lg">
                                Promoting <strong className="text-[var(--gold)]">{profile?.niche}</strong> with your link saved.
                                One click finds posts, writes replies, and creates bonus content.
                            </p>
                            <button
                                type="button"
                                onClick={() => handleBuild()}
                                className="btn-primary py-4 px-8 text-[16px]"
                            >
                                <Sparkles size={20} />
                                <span>Build My Campaign</span>
                                <ArrowRight size={18} />
                            </button>
                            {buildError && (
                                <p className="text-sm text-[var(--danger)]">{buildError}</p>
                            )}
                        </section>
                    )}

                    {!campaign && !building && (
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 px-1">
                                <Zap size={16} className="text-[var(--gold)]" />
                                <h3 className="ds-h3">Not sure? Start with a proven keyword</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {DFY_KEYWORDS.slice(0, 12).map((kw) => (
                                    <button
                                        key={kw.search}
                                        type="button"
                                        onClick={() => handleBuild({ useFallbackKeyword: true, fallbackSearch: kw.search })}
                                        className="card-base group flex flex-col gap-3 p-5! text-left hover:border-[var(--accent-border-strong)]"
                                    >
                                        <span className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-text-muted w-fit">
                                            {kw.niche}
                                        </span>
                                        <span className="font-bold text-text-primary group-hover:text-[var(--gold)] transition-colors">
                                            &ldquo;{kw.label}&rdquo;
                                        </span>
                                        <span className="text-[12px] text-text-secondary">{kw.description}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {pastCampaigns.length > 0 && !building && (
                        <section className="flex flex-col gap-3">
                            <h3 className="ds-h4">Your Recent Campaigns</h3>
                            <div className="flex flex-wrap gap-2">
                                {pastCampaigns.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => loadCampaign(c)}
                                        className="btn-chip"
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    <AnimatePresence>
                        {campaign && (
                            <motion.div
                                id="campaign-results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col gap-6 scroll-mt-24"
                            >
                                <div className="card-base flex flex-wrap items-center justify-between gap-3 p-4!">
                                    <div className="flex items-center gap-3">
                                        <Flame size={16} className="text-[var(--gold)]" />
                                        <span className="font-bold text-text-primary">
                                            {campaign.posts.length} Posts — {campaign.keywords.length} Keywords
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {copyAll && <CopyButton text={copyAll} label="Copy All" />}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const w = window.open("", "_blank");
                                                if (w) {
                                                    w.document.write(`<pre style="font-family:sans-serif;padding:2rem;white-space:pre-wrap">${copyAll.replace(/</g, "&lt;")}</pre>`);
                                                    w.print();
                                                }
                                            }}
                                            className="btn-secondary"
                                        >
                                            <Download size={14} />
                                            <span>Print</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setCampaign(null); setCopyAll(""); }}
                                            className="btn-ghost text-[12px]"
                                        >
                                            <RotateCcw size={12} />
                                            <span>New Campaign</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="card-base p-5!">
                                    <h3 className="ds-h4 mb-3">Your Keywords</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {campaign.keywords.map((k) => (
                                            <span key={k.search} className="badge-success px-3 py-1.5 text-[11px]">
                                                {k.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h3 className="ds-h3">Posts & Replies</h3>
                                    {campaign.posts.map((item, idx) => (
                                        <div key={item.id} className="surface-panel overflow-hidden">
                                            <div className="p-4 flex items-start justify-between gap-3 border-b border-[var(--border-subtle)]">
                                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <PlatformBadge platform={item.platform} />
                                                        <span className="text-[9px] text-text-muted">
                                                            {typeof item.engagement === "number"
                                                                ? `${item.engagement.toLocaleString()} engagements`
                                                                : item.engagement || "Trending"}
                                                        </span>
                                                    </div>
                                                    <p className="text-[13px] text-text-primary font-medium line-clamp-2">
                                                        {item.title || item.text}
                                                    </p>
                                                </div>
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent"
                                                >
                                                    <ExternalLink size={11} />
                                                    Go to Post
                                                </a>
                                            </div>
                                            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                                                {item.replies.map((reply, rIdx) => {
                                                    const labels = ["Short & Direct", "Detailed Value", "Curiosity Hook"];
                                                    return (
                                                        <div key={rIdx} className="flex flex-col bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="page-eyebrow text-[9px]!">{labels[rIdx]}</span>
                                                                <CopyButton text={reply} compact />
                                                            </div>
                                                            <p className="text-[12px] text-text-secondary leading-relaxed">{reply}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="card-base p-5! flex flex-col gap-4">
                                    <h3 className="ds-h3">Bonus Content — Same Campaign, More Channels</h3>
                                    {[
                                        { label: "Facebook Post", text: campaign.extras.facebookPost },
                                        { label: "Quora Answer", text: campaign.extras.quoraAnswer },
                                        { label: "Pinterest Description", text: campaign.extras.pinterestDescription },
                                    ].map((extra) => (
                                        <div key={extra.label} className="surface-well-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-[var(--gold)]">{extra.label}</span>
                                                <CopyButton text={extra.text} compact />
                                            </div>
                                            <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">{extra.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </PremiumPageLayout>
    );
}
