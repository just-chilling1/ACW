"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap, Link as LinkIcon, ArrowRight, Copy, Check,
    ChevronRight, Flame, RotateCcw, Sparkles, ExternalLink
} from "lucide-react";
import { clsx } from "clsx";
import { InfoHint } from "@/components/ui/InfoHint";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { VideoOverlay } from "@/components/ui/video-overlay";

const DFY_VIDEO_ID = "1214651948";

interface Post {
    id: string;
    platform: string;
    text: string;
    title?: string;
    url: string;
    engagement: string | number;
}

interface PostWithReplies {
    post: Post;
    replies: string[];
}

const KEYWORDS = [
    {
        label: "Best natural appetite suppressant",
        search: "best natural appetite suppressant reddit 2024",
        niche: "Weight Loss",
        description: "Users looking for non-stimulant weight loss solutions with high buying intent."
    },
    {
        label: "Best VPN for streaming",
        search: "best vpn for netflix 2024 reddit",
        niche: "Cybersecurity",
        description: "Users looking to bypass geo-restrictions on streaming platforms."
    },
    {
        label: "How to make money with AI tools",
        search: "how to make money with ai tools reddit",
        niche: "MMO",
        description: "Users seeking ways to leverage AI technology for side income."
    },
    {
        label: "Best ergonomic chair for back pain",
        search: "best ergonomic chair back pain under 300 reddit",
        niche: "Home Office",
        description: "Office workers looking for specific comfort solutions within a budget."
    },
    {
        label: "Best email marketing tool for small business",
        search: "best email marketing platform for creators reddit",
        niche: "Marketing",
        description: "Founders deciding on their email marketing tech stack."
    }
];

export default function DfyPage() {
    const [step, setStep] = useState(1);
    const [selectedKeyword, setSelectedKeyword] = useState<typeof KEYWORDS[0] | null>(null);
    const [affiliateLink, setAffiliateLink] = useState("");
    const [results, setResults] = useState<PostWithReplies[]>([]);
    const [loadingPhase, setLoadingPhase] = useState<"" | "finding" | "generating">("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [showOfferBanner, setShowOfferBanner] = useState(false);
    const [videoOpen, setVideoOpen] = useState(false);

    const handleSelectKeyword = (kw: typeof KEYWORDS[0]) => {
        setSelectedKeyword(kw);
        setStep(2);
        setResults([]);
        setError("");
    };

    const handleGenerate = async () => {
        if (!affiliateLink.trim()) {
            setError("Please enter your Digistore affiliate link.");
            return;
        }
        if (!selectedKeyword) return;

        setError("");
        setStep(3);
        setShowOfferBanner(true);

        try {
            // Phase 1: Find real posts
            setLoadingPhase("finding");
            const postsResp = await fetch("/api/jackpots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword: selectedKeyword.search })
            });
            const postsData = await postsResp.json();
            const posts: Post[] = (postsData.results || []).slice(0, 10);

            if (posts.length === 0) {
                setError("No posts found for this keyword. Try a different one.");
                setStep(2);
                setLoadingPhase("");
                return;
            }

            // Phase 2: Generate replies for each post
            setLoadingPhase("generating");
            const repliesResp = await fetch("/api/replies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ads: posts, affiliateLink: affiliateLink.trim() })
            });
            const repliesData = await repliesResp.json();
            const repliesResults = repliesData.results || [];

            const combined: PostWithReplies[] = posts.map((post) => {
                const match = repliesResults.find((r: any) => r.id === post.id);
                return {
                    post,
                    replies: match?.replies || []
                };
            }).filter((item) => item.replies.length > 0);

            setResults(combined);
        } catch {
            setError("Something went wrong. Please try again.");
            setStep(2);
        } finally {
            setLoadingPhase("");
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleReset = () => {
        setStep(1);
        setSelectedKeyword(null);
        setAffiliateLink("");
        setResults([]);
        setError("");
        setLoadingPhase("");
    };

    const renderFormattedReply = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <span key={i} className="link-info break-all">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mx-auto flex w-full max-w-6xl flex-col gap-10 py-10"
        >
            <PageHeader
                eyebrow="PREMIUM"
                title={
                    <>
                        Done-For-You <span className="text-gradient">Vault</span>
                    </>
                }
                subtitle="5 proven search angles and keywords — pick one, add your link, get ready-made replies."
            />

            <section className="card-base overflow-hidden p-0!">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2">
                        <VideoThumbnail
                            videoId={DFY_VIDEO_ID}
                            title="How to Use Done-For-You"
                            onPlay={() => setVideoOpen(true)}
                            className="rounded-none border-0"
                        />
                    </div>
                    <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center gap-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-[var(--gold)]" />
                            <span className="page-eyebrow text-[11px]!">Watch First</span>
                        </div>
                        <h2 className="ds-h2">How to Use Done-For-You</h2>
                        <p className="text-text-secondary leading-relaxed">
                            Watch this quick tutorial to learn how to pick a keyword, add your link, and get ready-made replies you can post in minutes.
                        </p>
                    </div>
                </div>
            </section>

            {(loadingPhase !== "" || showOfferBanner) && step === 3 && (
                <GenerationProgress
                    active={loadingPhase !== ""}
                    showBanner={showOfferBanner}
                    label={loadingPhase === "finding" ? "Finding high-ranking posts..." : loadingPhase === "generating" ? "Generating replies with your link..." : "Preparing your vault..."}
                    offer="welcome"
                />
            )}

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-3">
                {[
                    { num: 1, label: "Pick Keyword" },
                    { num: 2, label: "Your Link" },
                    { num: 3, label: "Get Replies" }
                ].map((s, i) => (
                    <div key={s.num} className="flex items-center gap-3">
                        <div className={clsx(
                            "flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all",
                            step >= s.num
                                ? "border-[var(--accent-border)] bg-[var(--accent-bg-subtle)] text-[var(--gold)]"
                                : "border-[var(--border-subtle)] bg-[var(--surface-2)] text-text-muted"
                        )}>
                            <span className={clsx(
                                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                                step >= s.num ? "bg-[var(--gold)] text-[var(--text-on-accent)]" : "border border-[var(--border-subtle)] bg-[var(--surface-2)] text-text-muted"
                            )}>
                                {step > s.num ? <Check size={12} /> : s.num}
                            </span>
                            <span className="text-[12px] font-bold uppercase tracking-wider">{s.label}</span>
                        </div>
                        {i < 2 && (
                            <ChevronRight size={14} className={clsx(
                                step > s.num ? "text-accent" : "text-text-muted"
                            )} />
                        )}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* Step 1: Pick a Keyword */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="flex items-center gap-3 px-1">
                            <Zap size={18} className="text-accent" />
                            <h2 className="ds-h2 inline-flex items-center gap-2">
                                Choose Your Keyword
                                <InfoHint
                                    label="What is a niche?"
                                    text="A niche is just a topic area — like fitness, dogs, or skincare. Pick the one closest to what you want to promote."
                                />
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {KEYWORDS.map((kw, idx) => (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.06 }}
                                    onClick={() => handleSelectKeyword(kw)}
                                    className="card-base group relative flex flex-col gap-4 overflow-hidden p-6! text-left transition-all hover:border-[var(--accent-border-strong)]"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                            {kw.niche}
                                        </span>
                                        <div className="badge-success flex items-center gap-1.5 px-2 py-1">
                                            <Flame size={10} />
                                            <span>High Intent</span>
                                        </div>
                                    </div>

                                    <h3 className="text-[16px] font-bold leading-snug text-text-primary transition-colors group-hover:text-[var(--gold)]">
                                        &ldquo;{kw.label}&rdquo;
                                    </h3>

                                    <p className="text-[12px] leading-relaxed text-text-secondary">
                                        {kw.description}
                                    </p>

                                    <div className="mt-auto flex items-center gap-2 border-t border-[var(--border-subtle)] pt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--gold)] transition-all group-hover:gap-3">
                                        <span>Select This Keyword</span>
                                        <ChevronRight size={13} />
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Enter Affiliate Link */}
                {step === 2 && selectedKeyword && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col gap-6 max-w-2xl mx-auto w-full"
                    >
                        <div className="card-base flex items-center justify-between p-5!">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg-subtle)]">
                                    <Check size={16} className="text-[var(--gold)]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Selected Keyword</p>
                                    <p className="text-[15px] font-bold text-text-primary">&ldquo;{selectedKeyword.label}&rdquo;</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setStep(1)}
                                className="text-[11px] font-bold text-text-muted hover:text-accent transition-colors flex items-center gap-1.5"
                            >
                                <RotateCcw size={12} />
                                Change
                            </button>
                        </div>

                        <div className="card-base flex flex-col gap-6 p-8!">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg-subtle)]">
                                    <LinkIcon size={18} className="text-[var(--gold)]" />
                                </div>
                                <div>
                                    <h2 className="ds-h2 inline-flex items-center gap-2">
                                        Provide Your Digistore Affiliate Link
                                        <InfoHint
                                            label="What is a Digistore affiliate link?"
                                            text="Digistore24 is a store that pays you for sales. Your affiliate link is your own special link — when someone buys through it, you get paid."
                                        />
                                    </h2>
                                    <p className="text-[13px] text-text-muted">We&apos;ll find high-ranking posts and generate replies with your link.</p>
                                </div>
                            </div>

                            <Field
                                type="url"
                                placeholder="https://www.digistore24.com/redir/XXXXX/your-id/"
                                value={affiliateLink}
                                onChange={(e) => {
                                    setAffiliateLink(e.target.value);
                                    if (error) setError("");
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                                error={error || undefined}
                            />

                            <button
                                onClick={handleGenerate}
                                className="btn-primary py-4 group"
                            >
                                <Sparkles size={18} />
                                <span>Find Posts & Generate Replies</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Results */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        id="generation-results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col gap-6 scroll-mt-24"
                    >
                        {/* Recap bar */}
                        <div className="card-base flex flex-wrap items-center justify-between gap-3 p-4!">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5">
                                    <Flame size={12} className="text-[var(--gold)]" />
                                    <span className="text-[11px] font-bold text-[var(--gold)]">{selectedKeyword?.niche}</span>
                                </div>
                                <span className="text-[13px] font-medium text-text-primary">&ldquo;{selectedKeyword?.label}&rdquo;</span>
                            </div>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted hover:text-accent transition-colors"
                            >
                                <RotateCcw size={12} />
                                Start Over
                            </button>
                        </div>

                        {/* Results */}
                        {!loadingPhase && results.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="ds-h3">
                                        {results.length} Posts Found — Replies Ready
                                    </h2>
                                    <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold text-[var(--gold)]">
                                        Copy Reply → Paste Under Post → Earn
                                    </span>
                                </div>

                                <div className="flex flex-col gap-5">
                                    {results.map((item, idx) => {
                                        const labels = ["Short & Direct", "Detailed Value", "Curiosity Hook"];
                                        return (
                                            <motion.div
                                                key={item.post.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="surface-panel overflow-hidden"
                                            >
                                                {/* Post header */}
                                                <div className="p-4 flex items-start justify-between gap-3 border-b border-[var(--border-subtle)]">
                                                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <PlatformBadge platform={item.post.platform} />
                                                            <span className="text-[9px] text-text-muted">
                                                                {typeof item.post.engagement === "number"
                                                                    ? `${item.post.engagement.toLocaleString()} engagements`
                                                                    : item.post.engagement || "Trending"}
                                                            </span>
                                                        </div>
                                                        <p className="text-[13px] text-text-primary leading-relaxed font-medium line-clamp-2">
                                                            {item.post.title || item.post.text}
                                                        </p>
                                                    </div>
                                                    <a
                                                        href={item.post.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent hover:bg-accent/20 transition-all"
                                                    >
                                                        <ExternalLink size={11} />
                                                        <span>Go to Post</span>
                                                    </a>
                                                </div>

                                                {/* Replies */}
                                                <div className="p-4">
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                                        {item.replies.map((reply, rIdx) => {
                                                            const uniqueId = `${item.post.id}-${rIdx}`;
                                                            const isCopied = copiedId === uniqueId;

                                                            return (
                                                                <div key={rIdx} className="flex flex-col bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-4 hover:border-accent/20 transition-all group">
                                                                    <div className="flex items-center justify-between mb-2.5">
                                                                        <span className="page-eyebrow text-[9px]! tracking-[0.12em]!">
                                                                            {labels[rIdx] || `Reply #${rIdx + 1}`}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => handleCopy(reply, uniqueId)}
                                                                            className={clsx(
                                                                                "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-all",
                                                                                isCopied
                                                                                    ? "status-success"
                                                                                    : "btn-secondary px-2 py-1 text-[10px]"
                                                                            )}
                                                                        >
                                                                            {isCopied ? <Check size={10} /> : <Copy size={10} />}
                                                                            <span>{isCopied ? "Copied!" : "Copy"}</span>
                                                                        </button>
                                                                    </div>
                                                                    <p className="text-[12px] text-text-secondary leading-relaxed group-hover:text-text-primary transition-colors">
                                                                        {renderFormattedReply(reply)}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Error in step 3 */}
                        {!loadingPhase && results.length === 0 && error && (
                            <div className="flex flex-col items-center py-16 gap-4">
                                <p className="text-sm text-[var(--danger)]">{error}</p>
                                <button onClick={() => setStep(2)} className="btn-primary">
                                    <RotateCcw size={14} />
                                    <span>Try Again</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="mt-10 flex flex-col items-center gap-4 border-t border-[var(--border-subtle)] pt-8 pb-10">
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                    {["5 Hot Keywords", "Real Posts Found", "AI Replies + Your Link", "Copy & Earn"].map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
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
                videoUrl={`https://player.vimeo.com/video/${DFY_VIDEO_ID}`}
                title="How to Use Done-For-You"
            />
        </motion.div>
    );
}
