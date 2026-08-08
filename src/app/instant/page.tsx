"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Facebook, Sparkles, MessageSquare, CheckCircle2, Wand2, Share2,
} from "lucide-react";
import { clsx } from "clsx";
import { PremiumPageLayout } from "@/components/premium/PremiumPageLayout";
import { MemberProfileSetup } from "@/components/premium/MemberProfileSetup";
import { CopyButton } from "@/components/premium/CopyButton";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { SkeletonCards } from "@/components/ui/skeleton";
import { INSTANT_NICHES, INSTANT_POSTS } from "@/lib/content/instant-posts";
import { REPURPOSE_PLATFORMS, WRITING_STYLES, type RepurposePlatform, type WritingStyle } from "@/lib/premium-types";

type PersonalizedPost = {
    postId: string;
    text: string;
    loading?: boolean;
};

export default function InstantIncomePage() {
    const { profile, loading, saving, error, saveProfile, isSetupComplete } = useMemberProfile();
    const [selectedNiche, setSelectedNiche] = useState("All Niches");
    const [showPosts, setShowPosts] = useState(false);
    const [loadingReveal, setLoadingReveal] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [personalized, setPersonalized] = useState<Record<string, PersonalizedPost>>({});
    const [postedIds, setPostedIds] = useState<Set<string>>(new Set());
    const [repurposeFor, setRepurposeFor] = useState<string | null>(null);
    const [repurposeData, setRepurposeData] = useState<Record<RepurposePlatform, string> | null>(null);
    const [repurposeLoading, setRepurposeLoading] = useState(false);
    const [activePlatform, setActivePlatform] = useState<RepurposePlatform>("facebook");
    const [rewriteError, setRewriteError] = useState("");
    const [writingStyle, setWritingStyle] = useState<WritingStyle>("personal_story");

    useEffect(() => {
        if (profile?.writing_style) {
            setWritingStyle(profile.writing_style);
        }
    }, [profile?.writing_style]);

    useEffect(() => {
        if (!isSetupComplete) return;
        fetch("/api/premium/saved?tool=instant&status=posted")
            .then((r) => r.json())
            .then((d) => {
                if (d.postedPostIds?.length) {
                    setPostedIds(new Set(d.postedPostIds as string[]));
                }
            })
            .catch(() => {});
    }, [isSetupComplete]);

    const filteredPosts = useMemo(() => {
        const base = selectedNiche === "All Niches"
            ? INSTANT_POSTS
            : INSTANT_POSTS.filter((p) => p.niche === selectedNiche);
        return base.filter((p) => !postedIds.has(p.id));
    }, [selectedNiche, postedIds]);

    const handleShowPosts = () => {
        setLoadingReveal(true);
        setShowBanner(true);
        setTimeout(() => {
            setShowPosts(true);
            setLoadingReveal(false);
        }, 800);
    };

    const handleMakeMine = async (postId: string, seedText: string) => {
        setPersonalized((prev) => ({
            ...prev,
            [postId]: { postId, text: "", loading: true },
        }));
        setRewriteError("");

        try {
            const resp = await fetch("/api/premium/rewrite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seedText, postId, niche: profile?.niche, writingStyle }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error);

            setPersonalized((prev) => ({
                ...prev,
                [postId]: { postId, text: data.text, loading: false },
            }));
        } catch (e) {
            setRewriteError(e instanceof Error ? e.message : "Rewrite failed");
            setPersonalized((prev) => {
                const next = { ...prev };
                delete next[postId];
                return next;
            });
        }
    };

    const handleMarkPosted = async (postId: string, body?: string) => {
        setPostedIds((prev) => new Set([...prev, postId]));
        await fetch("/api/premium/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tool: "instant",
                postId,
                status: "posted",
                body: body ?? "",
                title: `Posted — ${postId}`,
            }),
        }).catch(() => {});
    };

    const handleRepurpose = async (text: string, postId: string) => {
        setRepurposeFor(postId);
        setRepurposeLoading(true);
        setRepurposeData(null);

        try {
            const resp = await fetch("/api/premium/repurpose", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error);
            setRepurposeData(data.platforms);
            setActivePlatform("facebook");
        } catch {
            setRepurposeFor(null);
        } finally {
            setRepurposeLoading(false);
        }
    };

    return (
        <PremiumPageLayout
            title={
                <>
                    Instant Income: <span className="text-gradient">Your Posts</span>
                </>
            }
            subtitle="AI writes posts in your voice with your link — then reformats them for 6 platforms. Nobody else gets the same words."
            videoId="1214657449"
            videoTitle="How to Use Instant Income"
            videoDescription="Pick your niche, personalize any post, and share it on Facebook, Reddit, Quora, and more."
            trustBullets={["AI Personalized", "6 Platforms", "Your Link Built In", "Copy & Post"]}
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
                    {(loadingReveal || showBanner) && !showPosts && (
                        <GenerationProgress
                            active={loadingReveal}
                            showBanner={showBanner}
                            label="Loading posts for your niche..."
                            offer="welcome"
                        />
                    )}

                    <section className="premium-hero-card p-6! text-center flex flex-col items-center gap-3">
                        <div className="premium-icon-well">
                            <Facebook size={22} />
                        </div>
                        <h2 className="ds-h2">Posts Ready for {profile?.niche}</h2>
                        <p className="ds-body-sm text-text-secondary max-w-lg">
                            Your link is saved. Pick posts, hit &ldquo;Make This Mine,&rdquo; and AI rewrites them uniquely for you.
                        </p>
                    </section>

                    {!showPosts ? (
                        <section className="card-base flex flex-col gap-6 p-6!">
                            <div className="flex flex-col gap-3">
                                <span className="ds-label">Writing style for AI rewrites</span>
                                <div className="flex flex-wrap gap-2">
                                    {WRITING_STYLES.map((style) => (
                                        <SelectableChip
                                            key={style.id}
                                            label={style.label}
                                            selected={writingStyle === style.id}
                                            onClick={() => setWritingStyle(style.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {INSTANT_NICHES.map((niche) => (
                                    <SelectableChip
                                        key={niche}
                                        label={niche}
                                        selected={selectedNiche === niche}
                                        onClick={() => setSelectedNiche(niche)}
                                    />
                                ))}
                            </div>
                            <button type="button" onClick={handleShowPosts} className="btn-primary py-4">
                                <Sparkles size={18} />
                                <span>Show Me {filteredPosts.length} Posts</span>
                            </button>
                        </section>
                    ) : (
                        <section className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="ds-h3">{filteredPosts.length} Posts — Pick & Personalize</h3>
                                <span className="badge-success">Copy → Paste in Facebook Group → Earn</span>
                            </div>

                            {rewriteError && (
                                <p className="text-sm text-[var(--danger)]">{rewriteError}</p>
                            )}

                            <div className="flex flex-col gap-4">
                                {filteredPosts.map((post, idx) => {
                                    const custom = personalized[post.id];
                                    const displayText = custom?.text
                                        || post.text.replace("{LINK}", profile?.affiliate_link ?? "{LINK}");

                                    return (
                                        <motion.div
                                            key={post.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="card-base flex flex-col gap-4 p-5!"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="badge-info px-2 py-1 text-[10px]">{post.niche}</span>
                                                {custom?.text && (
                                                    <span className="premium-badge-unique">
                                                        <CheckCircle2 size={10} />
                                                        Your version — nobody else has this
                                                    </span>
                                                )}
                                            </div>

                                            {custom?.loading ? (
                                                <div className="skeleton h-20 w-full rounded-[var(--radius-md)]" />
                                            ) : (
                                                <p className="text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap">
                                                    {displayText}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-4">
                                                {!custom?.text && !custom?.loading && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMakeMine(post.id, post.text)}
                                                        className="btn-primary"
                                                    >
                                                        <Wand2 size={16} />
                                                        <span>Make This Mine</span>
                                                    </button>
                                                )}
                                                {custom?.text && (
                                                    <>
                                                        <CopyButton text={custom.text} />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRepurpose(custom.text, post.id)}
                                                            className="btn-soft"
                                                        >
                                                            <Share2 size={16} />
                                                            <span>6 Platforms</span>
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkPosted(post.id, custom?.text || displayText)}
                                                    className="btn-secondary"
                                                >
                                                    <MessageSquare size={14} />
                                                    <span>Mark as Posted</span>
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {repurposeFor === post.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="surface-well-lg overflow-hidden"
                                                    >
                                                        {repurposeLoading ? (
                                                            <div className="skeleton h-24 w-full" />
                                                        ) : repurposeData ? (
                                                            <>
                                                                <p className="ds-label mb-3">One post, six places:</p>
                                                                <div className="flex flex-wrap gap-2 mb-4">
                                                                    {REPURPOSE_PLATFORMS.map((p) => (
                                                                        <button
                                                                            key={p.id}
                                                                            type="button"
                                                                            onClick={() => setActivePlatform(p.id)}
                                                                            className={clsx(
                                                                                "premium-platform-tab",
                                                                                activePlatform === p.id && "is-active"
                                                                            )}
                                                                        >
                                                                            {p.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <p className="text-[13px] text-text-secondary leading-relaxed flex-1 whitespace-pre-wrap">
                                                                        {repurposeData[activePlatform]}
                                                                    </p>
                                                                    <CopyButton text={repurposeData[activePlatform]} compact />
                                                                </div>
                                                            </>
                                                        ) : null}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {filteredPosts.length === 0 && (
                                <div className="card-base p-8 text-center">
                                    <p className="text-text-secondary">You&apos;ve posted everything in this niche! Try another niche above.</p>
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}
        </PremiumPageLayout>
    );
}
