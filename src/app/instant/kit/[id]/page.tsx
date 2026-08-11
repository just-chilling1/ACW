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
    { id: 4, label: "You're done" },
] as const;

type Step = 1 | 2 | 3 | 4;

function StepRail({ step }: { step: Step }) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map((s) => {
                const active = s.id === step;
                const done = s.id < step;
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
                            {s.label}
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
                        disabled={marking}
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
    step,
    onBack,
    onNext,
    nextLabel,
}: {
    step: Step;
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
                    {nextLabel ?? `Next: ${STEPS.find((s) => s.id === step + 1)?.label ?? "Continue"}`}
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

    const bestPost = posts.find((p) => p.id === kit?.recommendations?.bestPostId) || posts[0];
    const bestReply = replies.find((r) => r.id === kit?.recommendations?.bestReplyId) || replies[0];
    const secondPost =
        posts.find((p) => p.id !== bestPost?.id && p.status !== "used") ||
        posts.find((p) => p.id !== bestPost?.id) ||
        null;

    const markUsed = async (asset: PromotionAssetRow) => {
        setMarkingId(asset.id);
        try {
            const nextStatus = asset.status === "used" ? "ready" : "used";
            const res = await fetch(`/api/instant/kits/${kitId}/assets/${asset.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await res.json();
            if (data.asset) {
                setAssets((prev) => prev.map((a) => (a.id === data.asset.id ? data.asset : a)));
            }
        } finally {
            setMarkingId(null);
        }
    };

    const handleRotate = async () => {
        setRotating(true);
        try {
            const res = await fetch(`/api/instant/kits/${kitId}/rotate`, { method: "POST" });
            const data = await res.json();
            if (data.asset) {
                setAssets((prev) => [...prev, data.asset]);
            }
        } finally {
            setRotating(false);
        }
    };

    const handleSmartReply = async () => {
        if (!smartComment.trim()) return;
        setSmartLoading(true);
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

    const stepPost = step === 3 ? secondPost || bestPost : bestPost;

    return (
        <div className="mx-auto max-w-2xl space-y-5 pb-24">
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

            <StepRail step={step} />

            {step === 1 && bestPost ? (
                <div className="space-y-4">
                    <ActionCard
                        eyebrow="Step 1 of 4"
                        title="Copy this post"
                        help="Paste it where you promote (Facebook, Reddit, groups, etc.). Then tap Next."
                        content={bestPost.content}
                        platform={
                            kit.recommendations?.bestPromotionPlatform ||
                            (bestPost.platform !== "General" ? bestPost.platform : undefined)
                        }
                        done={bestPost.status === "used"}
                        marking={markingId === bestPost.id}
                        onMarkDone={() => markUsed(bestPost)}
                    />
                    {kit.recommendations?.bestPromotionWhy ? (
                        <p className="text-xs text-text-muted">
                            Why this one: {kit.recommendations.bestPromotionWhy}
                        </p>
                    ) : null}
                    <StepNav step={1} onNext={() => setStep(2)} nextLabel="Next: Reply with this" />
                </div>
            ) : null}

            {step === 1 && !bestPost ? (
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
                    {bestReply ? (
                        <ActionCard
                            eyebrow="Step 2 of 4"
                            title="Copy this reply"
                            help="When someone comments or asks a question, paste this as your answer."
                            content={bestReply.content}
                            done={bestReply.status === "used"}
                            marking={markingId === bestReply.id}
                            onMarkDone={() => markUsed(bestReply)}
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
                        step={2}
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
                        >
                            <button
                                type="button"
                                onClick={handleRotate}
                                disabled={rotating}
                                className="btn-secondary w-full sm:w-auto"
                            >
                                <RefreshCw size={14} />
                                {rotating ? "Making a new one…" : "Give me a different post"}
                            </button>
                        </ActionCard>
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
                        step={3}
                        onBack={() => setStep(2)}
                        onNext={() => setStep(4)}
                        nextLabel="Next: You're done"
                    />
                </div>
            ) : null}

            {step === 4 ? (
                <div className="space-y-4">
                    <div className="surface-panel-elevated space-y-4 p-5 sm:p-6 text-center">
                        <CheckCircle2 className="mx-auto text-[var(--success)]" size={40} />
                        <h2 className="text-2xl font-bold text-text-primary">You’re ready</h2>
                        <p className="text-sm text-text-muted">
                            You posted once, you have a reply ready, and you have another post for later.
                            Come back anytime for more.
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
                                        <button
                                            type="button"
                                            onClick={() => markUsed(post)}
                                            disabled={markingId === post.id}
                                            className="btn-ghost text-xs"
                                        >
                                            {post.status === "used" ? "Undo used" : "Mark used"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    <div className="space-y-1 text-xs text-text-muted">
                        <p>{AFFILIATE_DISCLOSURE_TIP}</p>
                        <p>{PLATFORM_SAFETY_TIP}</p>
                    </div>

                    <StepNav step={4} onBack={() => setStep(3)} />
                </div>
            ) : null}
        </div>
    );
}
