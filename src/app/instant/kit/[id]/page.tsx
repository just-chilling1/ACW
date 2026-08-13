"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Circle,
    Copy,
    RefreshCw,
    Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { InlineError } from "@/components/ui/InlineError";
import { CopyButton } from "@/components/dfy/copy-button";
import { buildCopyFullKit } from "@/lib/instant/export";
import { AFFILIATE_DISCLOSURE_TIP, PLATFORM_SAFETY_TIP } from "@/lib/instant/safety";
import type { PromotionAssetRow, PromotionKitRow } from "@/lib/instant/types";

const STEPS = [
    { id: 1, label: "Post this" },
    { id: 2, label: "Reply with this" },
    { id: 3, label: "Post again" },
    { id: 4, label: "Next step" },
] as const;

type Step = 1 | 2 | 3 | 4;

function StepRail({ step, allDone }: { step: Step; allDone: boolean }) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map((s) => {
                const label = s.id === 4 && allDone ? "You're done" : s.label;
                const active = s.id === step;
                const done = s.id < step || (s.id === 4 && allDone && step === 4);
                return (
                    <div
                        key={s.id}
                        className={clsx(
                            "rounded-[var(--radius-md)] border px-3 py-2",
                            active
                                ? "border-[var(--gold)] bg-[var(--surface-2)]"
                                : done
                                  ? "border-[var(--success-border)] bg-[var(--success-bg-faint)]"
                                  : "border-[var(--border-subtle)] bg-[var(--surface-1)]",
                        )}
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                            Step {s.id}
                        </p>
                        <p
                            className={clsx(
                                "text-sm font-semibold",
                                active ? "text-text-primary" : done ? "text-[var(--success)]" : "text-text-muted",
                            )}
                        >
                            {label}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

function ActionCard({
    eyebrow,
    title,
    help,
    content,
    platform,
    done,
    marking,
    onMarkDone,
    children,
}: {
    eyebrow: string;
    title: string;
    help: string;
    content: string;
    platform?: string;
    done?: boolean;
    marking?: boolean;
    onMarkDone?: () => void;
    children?: ReactNode;
}) {
    return (
        <div
            className={clsx(
                "surface-panel-elevated space-y-4 p-5 sm:p-6",
                done && "border-[var(--success-border)]",
            )}
        >
            <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gold-text)]">
                    {eyebrow}
                </p>
                <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">{title}</h2>
                <p className="text-sm text-text-muted">{help}</p>
            </div>

            {platform ? (
                <p className="text-xs font-medium text-[var(--gold-text)]">Best place: {platform}</p>
            ) : null}

            <div className="surface-nested rounded-[var(--radius-md)] p-4 sm:p-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{content}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <CopyButton text={content} label="Copy" variant="primary" />
                {onMarkDone ? (
                    <button
                        type="button"
                        onClick={onMarkDone}
                        disabled={marking || done}
                        className={clsx(
                            "inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold",
                            done ? "btn-secondary" : "btn-primary",
                        )}
                    >
                        {marking ? (
                            "Saving…"
                        ) : done ? (
                            <>
                                <CheckCircle2 size={16} />
                                Done ✓
                            </>
                        ) : (
                            <>
                                <Circle size={16} />
                                I used this
                            </>
                        )}
                    </button>
                ) : null}
            </div>

            {children}
        </div>
    );
}

function StepNav({
    onBack,
    onNext,
    nextLabel,
}: {
    onBack?: () => void;
    onNext?: () => void;
    nextLabel?: string;
}) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            {onBack ? (
                <button type="button" onClick={onBack} className="btn-secondary w-full py-3 sm:w-auto sm:min-w-[140px]">
                    <ArrowLeft size={16} />
                    Back
                </button>
            ) : (
                <div className="hidden sm:block sm:min-w-[140px]" />
            )}
            {onNext ? (
                <button type="button" onClick={onNext} className="btn-primary w-full py-4 text-base sm:w-auto sm:min-w-[220px]">
                    {nextLabel ?? "Continue"}
                    <ArrowRight size={18} />
                </button>
            ) : null}
        </div>
    );
}

export default function KitDashboardPage() {
    const params = useParams();
    const kitId = params.id as string;

    const [kit, setKit] = useState<PromotionKitRow | null>(null);
    const [assets, setAssets] = useState<PromotionAssetRow[]>([]);
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [rotating, setRotating] = useState(false);
    const [smartComment, setSmartComment] = useState("");
    const [smartReply, setSmartReply] = useState<string | null>(null);
    const [smartLoading, setSmartLoading] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const [cyclePostAId, setCyclePostAId] = useState<string | null>(null);
    const [cyclePostBId, setCyclePostBId] = useState<string | null>(null);
    const [cycleReplyId, setCycleReplyId] = useState<string | null>(null);
    const [allDone, setAllDone] = useState(false);
    const [cycleReady, setCycleReady] = useState(false);

    const loadKit = useCallback(async () => {
        try {
            const res = await fetch(`/api/instant/kits/${kitId}`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Kit not found.");
                return;
            }
            setKit(data.kit);
            setAssets(data.assets || []);
        } catch {
            setError("Could not load kit.");
        } finally {
            setLoading(false);
        }
    }, [kitId]);

    useEffect(() => {
        loadKit();
    }, [loadKit]);

    const posts = useMemo(() => assets.filter((a) => a.type === "post"), [assets]);
    const replies = useMemo(() => assets.filter((a) => a.type === "reply"), [assets]);
    const hooks = useMemo(() => assets.filter((a) => a.type === "hook"), [assets]);

    const pickCycle = useCallback(
        (sourcePosts: PromotionAssetRow[], sourceReplies: PromotionAssetRow[], kitRow: PromotionKitRow | null) => {
            const unusedPosts = sourcePosts.filter((p) => p.status !== "used");
            if (unusedPosts.length === 0) {
                setCyclePostAId(null);
                setCyclePostBId(null);
                setCycleReplyId(null);
                setAllDone(true);
                setStep(4);
                setCycleReady(true);
                return;
            }

            const preferred =
                unusedPosts.find((p) => p.id === kitRow?.recommendations?.bestPostId) || unusedPosts[0];
            const second =
                unusedPosts.find((p) => p.id !== preferred.id) ||
                sourcePosts.find((p) => p.id !== preferred.id) ||
                null;
            const unusedReplies = sourceReplies.filter((r) => r.status !== "used");
            const reply =
                unusedReplies.find((r) => r.id === kitRow?.recommendations?.bestReplyId) ||
                unusedReplies[0] ||
                sourceReplies[0] ||
                null;

            setCyclePostAId(preferred.id);
            setCyclePostBId(second?.id ?? null);
            setCycleReplyId(reply?.id ?? null);
            setAllDone(false);
            setStep(1);
            setSmartComment("");
            setSmartReply(null);
            setCycleReady(true);
        },
        [],
    );

    useEffect(() => {
        if (loading || cycleReady || !kit) return;
        pickCycle(posts, replies, kit);
    }, [loading, cycleReady, kit, posts, replies, pickCycle]);

    const postA = posts.find((p) => p.id === cyclePostAId) || null;
    const postB = posts.find((p) => p.id === cyclePostBId) || null;
    const cycleReply = replies.find((r) => r.id === cycleReplyId) || null;
    const unusedRemaining = posts.filter(
        (p) => p.status !== "used" && p.id !== cyclePostAId && p.id !== cyclePostBId,
    );
    const hasMoreCycles = unusedRemaining.length > 0;

    const markUsed = async (asset: PromotionAssetRow) => {
        if (asset.status === "used") return;
        setMarkingId(asset.id);
        try {
            const res = await fetch(`/api/instant/kits/${kitId}/assets/${asset.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "used" }),
            });
            const data = await res.json();
            if (data.asset) {
                setAssets((prev) => prev.map((a) => (a.id === data.asset.id ? data.asset : a)));
            }
        } finally {
            setMarkingId(null);
        }
    };

    const markCycleAssetsUsed = async () => {
        const ids = [cyclePostAId, cyclePostBId, cycleReplyId].filter(Boolean) as string[];
        for (const id of ids) {
            const asset = assets.find((a) => a.id === id);
            if (asset && asset.status !== "used") {
                await markUsed(asset);
            }
        }
    };

    const handleRotate = async () => {
        setRotating(true);
        try {
            const res = await fetch(`/api/instant/kits/${kitId}/rotate`, { method: "POST" });
            const data = await res.json();
            if (data.asset) {
                setAssets((prev) => [...prev, data.asset as PromotionAssetRow]);
                // Pin the newly generated post so the UI actually switches.
                if (step === 3) {
                    setCyclePostBId(data.asset.id);
                } else if (step === 1) {
                    setCyclePostAId(data.asset.id);
                } else if (step === 4 && allDone) {
                    // New asset after finishing — reopen the workflow with it.
                    setAllDone(false);
                    setCyclePostAId(data.asset.id);
                    setCyclePostBId(null);
                    setSmartComment("");
                    setSmartReply(null);
                    setStep(1);
                }
            }
        } finally {
            setRotating(false);
        }
    };

    const handleSmartReply = async () => {
        if (!smartComment.trim()) return;
        setSmartLoading(true);
        setSmartReply(null);
        try {
            const res = await fetch(`/api/instant/kits/${kitId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: smartComment }),
            });
            const data = await res.json();
            if (res.ok) setSmartReply(data.recommended || null);
        } finally {
            setSmartLoading(false);
        }
    };

    const goToNextStepPage = async () => {
        await markCycleAssetsUsed();
        const remaining = posts.filter(
            (p) =>
                p.status !== "used" &&
                p.id !== cyclePostAId &&
                p.id !== cyclePostBId,
        );
        // After marking, remaining may still include unmarked posts outside this cycle.
        setAllDone(remaining.length === 0);
        setStep(4);
    };

    const startNextCycle = async () => {
        // Ensure current cycle assets are marked before picking the next set.
        await markCycleAssetsUsed();
        const freshPosts = assets.map((a) => {
            if (a.id === cyclePostAId || a.id === cyclePostBId || a.id === cycleReplyId) {
                return { ...a, status: "used" as const };
            }
            return a;
        });
        setAssets(freshPosts);
        setCycleReady(false);
        pickCycle(
            freshPosts.filter((a) => a.type === "post"),
            freshPosts.filter((a) => a.type === "reply"),
            kit,
        );
    };

    const copyFullKit = async () => {
        if (!kit) return;
        const text = buildCopyFullKit(kit, assets);
        await navigator.clipboard.writeText(text);
    };

    if (loading) return <div className="p-6 text-text-muted">Loading your kit…</div>;
    if (error || !kit) {
        return (
            <div className="p-6">
                <InlineError message={error || "Kit not found."} />
            </div>
        );
    }

    const stepPost = step === 3 ? postB || postA : postA;

    return (
        <div className="mx-auto flex w-full max-w-none flex-col gap-5 pb-10 sm:pb-12">
            <Link
                href="/instant"
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
            >
                <ArrowLeft size={16} />
                Instant Income
            </Link>

            <PageHeader
                eyebrow="Promotion Kit"
                title={kit.name}
                subtitle="One step at a time. Copy → use it → tap Next."
                step={step}
                totalSteps={4}
            />

            <StepRail step={step} allDone={allDone && step === 4} />

            {step === 1 && postA ? (
                <div className="space-y-4">
                    <ActionCard
                        eyebrow="Step 1 of 4"
                        title="Copy this post"
                        help="Paste it where you promote (Facebook, Reddit, groups, etc.). Then tap Next."
                        content={postA.content}
                        platform={
                            kit.recommendations?.bestPromotionPlatform ||
                            (postA.platform !== "General" ? postA.platform : undefined)
                        }
                        done={postA.status === "used"}
                        marking={markingId === postA.id}
                        onMarkDone={() => markUsed(postA)}
                    />
                    {kit.recommendations?.bestPromotionWhy ? (
                        <p className="text-xs text-text-muted">
                            Why this one: {kit.recommendations.bestPromotionWhy}
                        </p>
                    ) : null}
                    <StepNav onNext={() => setStep(2)} nextLabel="Next: Reply with this" />
                </div>
            ) : null}

            {step === 1 && !postA ? (
                <div className="surface-panel-elevated space-y-4 p-5 sm:p-6">
                    <h2 className="text-xl font-semibold">No posts yet</h2>
                    <p className="text-sm text-text-muted">Something went wrong building this kit.</p>
                    <Link href="/instant/build" className="btn-primary inline-flex">
                        Create a new kit
                    </Link>
                </div>
            ) : null}

            {step === 2 ? (
                <div className="space-y-4">
                    {cycleReply ? (
                        <ActionCard
                            eyebrow="Step 2 of 4"
                            title="Copy this reply"
                            help="When someone comments or asks a question, paste this as your answer."
                            content={cycleReply.content}
                            done={cycleReply.status === "used"}
                            marking={markingId === cycleReply.id}
                            onMarkDone={() => markUsed(cycleReply)}
                        />
                    ) : (
                        <div className="surface-panel-elevated space-y-3 p-5 sm:p-6">
                            <h2 className="text-xl font-semibold">Step 2 — Reply</h2>
                            <p className="text-sm text-text-muted">
                                No ready-made reply in this kit. Skip to the next step, or generate one below.
                            </p>
                        </div>
                    )}

                    <details className="surface-panel p-4 sm:p-5">
                        <summary className="cursor-pointer text-sm font-semibold text-text-primary">
                            Someone asked something different? Generate a reply
                        </summary>
                        <div className="mt-4 space-y-3">
                            <Field
                                as="textarea"
                                label="Paste their comment"
                                value={smartComment}
                                onChange={(e) => setSmartComment(e.target.value)}
                                placeholder="How does this work?"
                            />
                            <button
                                type="button"
                                onClick={handleSmartReply}
                                disabled={smartLoading || !smartComment.trim()}
                                className="btn-secondary"
                            >
                                <Sparkles size={14} />
                                {smartLoading ? "Generating…" : "Generate Reply"}
                            </button>
                            {smartReply ? (
                                <div className="space-y-2 border-t border-[var(--border-subtle)] pt-3">
                                    <p className="whitespace-pre-wrap text-sm">{smartReply}</p>
                                    <CopyButton text={smartReply} label="Copy Reply" variant="primary" />
                                </div>
                            ) : null}
                        </div>
                    </details>

                    <StepNav
                        onBack={() => setStep(1)}
                        onNext={() => setStep(3)}
                        nextLabel="Next: Post again"
                    />
                </div>
            ) : null}

            {step === 3 ? (
                <div className="space-y-4">
                    {stepPost ? (
                        <ActionCard
                            eyebrow="Step 3 of 4"
                            title="Copy another post"
                            help="Use a different post in another group or on another day. Same offer, fresh wording."
                            content={stepPost.content}
                            platform={stepPost.platform !== "General" ? stepPost.platform : undefined}
                            done={stepPost.status === "used"}
                            marking={markingId === stepPost.id}
                            onMarkDone={() => markUsed(stepPost)}
                        />
                    ) : (
                        <div className="surface-panel-elevated space-y-4 p-5 sm:p-6">
                            <h2 className="text-xl font-semibold">Need another post?</h2>
                            <p className="text-sm text-text-muted">Tap below and we’ll write a fresh one.</p>
                            <button
                                type="button"
                                onClick={handleRotate}
                                disabled={rotating}
                                className="btn-primary w-full py-4"
                            >
                                <RefreshCw size={16} />
                                {rotating ? "Making a new one…" : "Make me a new post"}
                            </button>
                        </div>
                    )}

                    <StepNav
                        onBack={() => setStep(2)}
                        onNext={goToNextStepPage}
                        nextLabel={hasMoreCycles ? "Next: Next step" : "Next: You're done"}
                    />
                </div>
            ) : null}

            {step === 4 && !allDone ? (
                <div className="space-y-4">
                    <div className="surface-panel-elevated space-y-4 p-5 sm:p-6 text-center">
                        <Sparkles className="mx-auto text-[var(--gold-text)]" size={36} />
                        <h2 className="text-2xl font-bold text-text-primary">Next step</h2>
                        <p className="text-sm text-text-muted">
                            You’ve got more unused posts in this kit. Run the workflow again with different
                            assets until everything is used.
                        </p>
                        <p className="text-xs text-text-muted">
                            {unusedRemaining.length} post{unusedRemaining.length === 1 ? "" : "s"} still ready.
                        </p>
                    </div>

                    <StepNav
                        onBack={() => setStep(3)}
                        onNext={startNextCycle}
                        nextLabel="Use next asset"
                    />
                </div>
            ) : null}

            {step === 4 && allDone ? (
                <div className="space-y-4">
                    <div className="surface-panel-elevated space-y-4 p-5 sm:p-6 text-center">
                        <CheckCircle2 className="mx-auto text-[var(--success)]" size={40} />
                        <h2 className="text-2xl font-bold text-text-primary">All done</h2>
                        <p className="text-sm text-text-muted">
                            You’ve worked through the posts in this kit. Come back anytime to generate more,
                            or start a new kit with another offer.
                        </p>
                    </div>

                    {hooks[0] ? (
                        <ActionCard
                            eyebrow="Bonus"
                            title="Opening line (optional)"
                            help="Use this as the first sentence if you want a stronger hook."
                            content={hooks[0].content}
                        />
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button type="button" onClick={copyFullKit} className="btn-secondary">
                            <Copy size={14} />
                            Copy full kit
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowMore((v) => !v)}
                            className="btn-ghost"
                        >
                            {showMore ? "Hide extra posts" : "Show all posts"}
                        </button>
                        <Link href="/instant/kits" className="btn-ghost">
                            All my kits
                        </Link>
                        <button
                            type="button"
                            onClick={handleRotate}
                            disabled={rotating}
                            className="btn-ghost"
                        >
                            <RefreshCw size={14} />
                            {rotating ? "Making a new one…" : "Generate another post"}
                        </button>
                    </div>

                    {showMore ? (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-text-primary">All posts in this kit</p>
                            {posts.map((post, index) => (
                                <div key={post.id} className="card-base space-y-3 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        Post {index + 1}
                                        {post.status === "used" ? " · Used" : ""}
                                    </p>
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <CopyButton text={post.content} label="Copy" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    <div className="space-y-1 text-xs text-text-muted">
                        <p>{AFFILIATE_DISCLOSURE_TIP}</p>
                        <p>{PLATFORM_SAFETY_TIP}</p>
                    </div>

                    <StepNav onBack={() => setStep(3)} />
                </div>
            ) : null}
        </div>
    );
}
