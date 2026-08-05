"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare, Sparkles, RefreshCw, ExternalLink,
    Copy, Check, ChevronUp, ChevronDown, Link as LinkIcon,
    Radar, Trash2, ArrowLeft, Loader2
} from "lucide-react";
import { useSearch, Ad } from "@/context/SearchContext";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { InfoHint } from "@/components/ui/InfoHint";
import { PageHeader } from "@/components/ui/page-header";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { Field } from "@/components/ui/field";
import { PlatformBadge } from "@/components/ui/platform-badge";
    const {
        selectedAds, setSelectedAds, keyword,
        repliesByPostId, setRepliesByPostId,
        affiliateLink, setAffiliateLink
    } = useSearch();
    const router = useRouter();
    const currentAds = selectedAds || [];
    const [loadingReplyId, setLoadingReplyId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [showOfferBanner, setShowOfferBanner] = useState(false);
    const [scrollTargetId, setScrollTargetId] = useState<string | undefined>();

    const handleGenerate = async (post: Ad) => {
        setShowOfferBanner(true);
        setLoadingReplyId(post.id);
        setScrollTargetId(`generation-results-${post.id}`);
        setExpandedIds(prev => new Set(prev).add(post.id));

        try {
            const resp = await fetch("/api/replies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ads: [post], affiliateLink: affiliateLink || "" })
            });
            const data = await resp.json();
            const result = data.results?.[0];
            if (result?.replies) {
                setRepliesByPostId({ ...repliesByPostId, [post.id]: result.replies });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingReplyId(null);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const removePost = (id: string) => {
        setSelectedAds(selectedAds.filter((p: Ad) => p.id !== id));
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

    if (currentAds.length === 0) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-14 h-14 rounded-xl bg-surface flex items-center justify-center border border-border-dim">
                    <Radar size={24} className="text-text-muted" />
                </div>
                <div className="text-center flex flex-col gap-2">
                    <h2 className="ds-h2">No Ads Selected</h2>
                    <p className="text-sm text-text-muted">Go to Step 3 and pick ads first.</p>
                </div>
                <button onClick={() => router.push("/radar")} className="btn-primary">
                    <Radar size={16} />
                    <span>Go to Step 3: Find Ads</span>
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 max-w-6xl mx-auto w-full py-6"
        >
            {(loadingReplyId !== null || showOfferBanner) && (
                <GenerationProgress
                    active={loadingReplyId !== null}
                    showBanner={showOfferBanner}
                    label="Creating replies..."
                    offer="earnings"
                    scrollTargetId={scrollTargetId}
                />
            )}

            {/* Header */}
            <PageHeader
                eyebrow="STEP 4 OF 4"
                step={4}
                title="Create Replies"
                subtitle={`${currentAds.length} ad${currentAds.length !== 1 ? "s" : ""} selected for "${keyword}"`}
                actions={
                    <InfoHint
                        label="What is an affiliate link?"
                        text="Affiliate link = your own special link. When someone buys through it, you get paid."
                    />
                }
            />

            <Field
                label="Affiliate link"
                placeholder="Paste your affiliate link here (optional — it gets inserted into replies)"
                value={affiliateLink}
                onChange={(e) => setAffiliateLink(e.target.value)}
                trailing={<LinkIcon size={14} strokeWidth={1.75} className="text-text-muted" />}
            />

            {/* Ad cards */}
            <div className="flex flex-col gap-4">
                {currentAds.map((post, idx) => {
                    const replies = repliesByPostId[post.id] || [];
                    const isExpanded = expandedIds.has(post.id);
                    const isLoading = loadingReplyId === post.id;

                    return (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="card-base overflow-hidden p-0!"
                        >
                            {/* Ad header */}
                            <div className="p-4 flex items-start justify-between gap-3">
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <PlatformBadge platform={post.platform} />
                                        <span className="text-[9px] text-text-muted">
                                            {typeof post.engagement === 'number'
                                                ? `${post.engagement.toLocaleString()} engagements`
                                                : post.engagement || "Trending"}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-text-primary leading-relaxed font-medium line-clamp-2">
                                        {post.title || post.text}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => removePost(post.id)}
                                        className="btn-icon h-10 w-10 min-h-0 min-w-0 rounded-lg sm:h-7 sm:w-7 hover:text-[var(--danger)] hover:bg-[var(--danger-bg-faint)]"
                                        title="Remove ad"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                    <a
                                        href={post.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent hover:bg-accent/20 transition-all"
                                    >
                                        <ExternalLink size={11} />
                                        <span>Go to Post</span>
                                    </a>
                                </div>
                            </div>

                            {/* Action bar */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-dim/15 bg-[var(--surface-1)]">
                                <button
                                    onClick={() => {
                                        if (replies.length === 0) handleGenerate(post);
                                        else toggleExpand(post.id);
                                    }}
                                    disabled={isLoading}
                                    className={clsx(
                                        "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
                                        isLoading ? "text-text-muted" :
                                        isExpanded ? "bg-accent/10 text-accent border border-accent/20" :
                                        replies.length > 0 ? "bg-accent/5 text-accent hover:bg-accent/10" :
                                        "bg-surface border border-border-dim text-text-secondary hover:border-accent/30 hover:text-accent"
                                    )}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" />
                                            <span>Creating replies...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare size={13} />
                                            <span>{replies.length > 0 ? `${replies.length} Replies` : "Create Replies"}</span>
                                            {replies.length > 0 && (isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </>
                                    )}
                                </button>

                                {replies.length > 0 && (
                                    <button
                                        onClick={() => handleGenerate(post)}
                                        disabled={isLoading}
                                        className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted hover:text-accent transition-colors"
                                    >
                                        <RefreshCw size={11} />
                                        <span>Regenerate</span>
                                    </button>
                                )}
                            </div>

                            {/* Replies */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        id={`generation-results-${post.id}`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden border-t border-border-dim/15 scroll-mt-24"
                                    >
                                        <div className="p-4">
                                            {isLoading ? (
                                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                                                    {[0, 1, 2].map((i) => (
                                                        <div key={i} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
                                                            <Skeleton className="h-3 w-24" />
                                                            <Skeleton className="h-3 w-full" />
                                                            <Skeleton className="h-3 w-4/5" />
                                                            <Skeleton className="h-3 w-3/5" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                                                    {replies.map((reply, rIdx) => {
                                                        const labels = ["Short & Direct", "Detailed Value", "Curiosity Hook"];
                                                        const uniqueId = `${post.id}-${rIdx}`;
                                                        const isCopied = copiedId === uniqueId;

                                                        return (
                                                            <div key={rIdx} className="group flex flex-col rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4 transition-colors hover:border-[var(--accent-border-strong)]">
                                                                <div className="mb-2.5 flex items-center justify-between">
                                                                    <span className="page-eyebrow text-[10px]! tracking-[0.12em]!">{labels[rIdx]}</span>
                                                                    <button
                                                                        onClick={() => handleCopy(reply, uniqueId)}
                                                                        className={clsx(
                                                                            "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold transition-all",
                                                                            isCopied
                                                                                ? "bg-[var(--success)] text-[var(--text-on-accent)]"
                                                                                : "btn-secondary px-2 py-1 text-[10px]"
                                                                        )}
                                                                    >
                                                                        {isCopied ? <Check size={10} /> : <Copy size={10} />}
                                                                        <span>{isCopied ? "Copied!" : "Copy"}</span>
                                                                    </button>
                                                                </div>
                                                                <p className="text-[12px] leading-relaxed text-text-secondary transition-colors group-hover:text-text-primary">
                                                                    {renderFormattedReply(reply)}
                                                                </p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between pt-4 border-t border-border-dim/20">
                <button
                    onClick={() => router.push("/radar")}
                    className="flex items-center gap-2 text-[11px] font-bold text-text-muted hover:text-accent transition-colors"
                >
                    <ArrowLeft size={14} />
                    <span>Back to Step 3</span>
                </button>
                <p className="text-[10px] text-text-muted inline-flex items-center gap-1">
                    Copy a reply → paste it under the ad → include your link → earn commissions
                    <InfoHint
                        label="What is a commission?"
                        text="A commission is the money you earn each time someone buys through your link."
                    />
                </p>
            </div>
        </motion.div>
    );
}
