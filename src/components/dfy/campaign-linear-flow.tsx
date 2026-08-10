"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import type { CampaignAssetRow, CampaignOpportunityRow, CampaignRow } from "@/lib/dfy/types";
import { CopyButton } from "./copy-button";
import { OpportunityCard } from "./opportunity-card";
import {
    getCampaignProgress,
    getContentPosts,
    getOpportunityProgress,
    getWeeklyPosts,
    isAssetDone,
} from "@/lib/dfy/campaign-progress";

const STEPS = [
    { id: 1, label: "Reply to people" },
    { id: 2, label: "Post your content" },
    { id: 3, label: "Fill my week" },
    { id: 4, label: "All done" },
] as const;

const TOTAL_STEPS = STEPS.length;

type CampaignLinearFlowProps = {
    campaign: CampaignRow;
    opportunities: CampaignOpportunityRow[];
    assets: CampaignAssetRow[];
    onMarkOpportunityDone: (id: string, done: boolean) => void;
    markingOpportunityId: string | null;
    onMarkAssetDone: (id: string, done: boolean) => void;
    markingAssetId: string | null;
    onFillWeek: () => Promise<void>;
    fillingWeek: boolean;
    onImprove: () => Promise<void>;
    improving: boolean;
};

function CampaignProgressBar({
    done,
    total,
    percent,
}: {
    done: number;
    total: number;
    percent: number;
}) {
    if (total === 0) return null;

    return (
        <div className="card-base p-4 sm:p-5">
            <div className="mb-2 flex items-end justify-between gap-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Campaign Progress</p>
                    <p className="text-lg font-semibold tabular-nums text-text-primary">
                        {done} of {total} completed
                    </p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-[var(--gold-text)]">{percent}%</p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${percent}%`,
                        background: done === total ? "var(--success)" : "var(--grad-brand)",
                    }}
                />
            </div>
            <p className="mt-2 text-xs text-text-muted">
                Mark replies, posts, and week-day posts as done to track your progress.
            </p>
        </div>
    );
}

function PostCard({
    label,
    content,
    done,
    markingDone,
    onMarkDone,
}: {
    label: string;
    content: string;
    done: boolean;
    markingDone?: boolean;
    onMarkDone?: (done: boolean) => void;
}) {
    return (
        <article
            className={clsx(
                "card-base flex flex-col gap-3 p-4 sm:p-5 transition",
                done && "border-[var(--success-border)] bg-[var(--success-bg-faint)]",
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gold-text)]">{label}</p>
                {done ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-bg-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--success)]">
                        <CheckCircle2 size={12} />
                        Done
                    </span>
                ) : null}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{content}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <CopyButton text={content} label="Copy Post" variant="primary" />
                {onMarkDone ? (
                    <button
                        type="button"
                        onClick={() => onMarkDone(!done)}
                        disabled={markingDone}
                        className={clsx(
                            "flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold",
                            done ? "btn-secondary" : "btn-primary",
                        )}
                    >
                        {markingDone ? (
                            "Saving…"
                        ) : done ? (
                            <>
                                <Circle size={16} />
                                Undo Done
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Done ✓
                            </>
                        )}
                    </button>
                ) : null}
            </div>
        </article>
    );
}

export function CampaignLinearFlow({
    campaign,
    opportunities,
    assets,
    onMarkOpportunityDone,
    markingOpportunityId,
    onMarkAssetDone,
    markingAssetId,
    onFillWeek,
    fillingWeek,
    onImprove,
    improving,
}: CampaignLinearFlowProps) {
    const [step, setStep] = useState(1);
    const [weekGenerated, setWeekGenerated] = useState(false);
    const [improved, setImproved] = useState(false);

    useEffect(() => {
        if (assets.some((a) => a.meta?.section === "weekly_batch")) {
            setWeekGenerated(true);
        }
    }, [assets]);

    const campaignProgress = getCampaignProgress(opportunities, assets);
    const replyProgress = getOpportunityProgress(opportunities);
    const posts = getContentPosts(assets);
    const weeklyPosts = getWeeklyPosts(assets);

    const handleFillWeek = async () => {
        await onFillWeek();
        setWeekGenerated(true);
    };

    const handleImprove = async () => {
        await onImprove();
        setImproved(true);
    };

    return (
        <div className="flex flex-col gap-6">
            <CampaignProgressBar
                done={campaignProgress.done}
                total={campaignProgress.total}
                percent={campaignProgress.percent}
            />

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((s) => {
                    const active = step === s.id;
                    const completed = step > s.id;
                    return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => completed && setStep(s.id)}
                            disabled={!completed && !active}
                            className={clsx(
                                "flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-left text-sm transition",
                                active
                                    ? "border-[var(--gold)] bg-[var(--gold-fill)] font-semibold text-[var(--gold-text)]"
                                    : completed
                                      ? "border-[var(--success-border)] bg-[var(--success-bg-faint)] text-[var(--success)] hover:opacity-90"
                                      : "border-[var(--border-subtle)] text-text-muted",
                            )}
                        >
                            <span
                                className={clsx(
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                    active
                                        ? "bg-[var(--gold)] text-black"
                                        : completed
                                          ? "bg-[var(--success)] text-white"
                                          : "bg-[var(--surface-2)]",
                                )}
                            >
                                {completed ? <CheckCircle2 size={14} /> : s.id}
                            </span>
                            <span className="truncate">{s.label}</span>
                        </button>
                    );
                })}
            </div>

            {step === 1 && (
                <section className="flex flex-col gap-5">
                    <div className="card-base p-5 sm:p-6">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--gold-text)]">Step 1 of {TOTAL_STEPS}</p>
                        <h2 className="ds-h3 mb-2">Copy replies &amp; post them</h2>
                        <p className="text-sm text-text-secondary">
                            For each conversation: tap <strong className="text-text-primary">Copy Reply</strong>, paste it, then tap <strong className="text-text-primary">Done ✓</strong>.
                        </p>
                    </div>

                    {replyProgress.total > 0 ? (
                        <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
                            <p className="text-sm font-semibold text-text-primary">
                                Replies: {replyProgress.done} of {replyProgress.total} done
                            </p>
                        </div>
                    ) : null}

                    {opportunities.length === 0 ? (
                        <div className="card-base p-6 text-center text-sm text-text-secondary">
                            No conversations found yet. Rebuild your campaign to find people to reply to.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {opportunities.map((opp, i) => (
                                <OpportunityCard
                                    key={opp.id}
                                    opportunity={opp}
                                    index={i + 1}
                                    simple
                                    onMarkDone={(doneState) => onMarkOpportunityDone(opp.id, doneState)}
                                    markingDone={markingOpportunityId === opp.id}
                                />
                            ))}
                        </div>
                    )}

                    <button type="button" onClick={() => setStep(2)} className="btn-primary w-full py-4 text-base">
                        Next: Get Posts to Share
                        <ArrowRight size={18} />
                    </button>
                </section>
            )}

            {step === 2 && (
                <section className="flex flex-col gap-5">
                    <div className="card-base p-5 sm:p-6">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--gold-text)]">Step 2 of {TOTAL_STEPS}</p>
                        <h2 className="ds-h3 mb-2">Copy posts &amp; share them</h2>
                        <p className="text-sm text-text-secondary">
                            Tap <strong className="text-text-primary">Copy Post</strong>, share it, then tap <strong className="text-text-primary">Done ✓</strong>.
                        </p>
                    </div>

                    {campaignProgress.posts.total > 0 ? (
                        <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
                            <p className="text-sm font-semibold text-text-primary">
                                Posts: {campaignProgress.posts.done} of {campaignProgress.posts.total} done
                            </p>
                        </div>
                    ) : null}

                    {posts.length === 0 ? (
                        <div className="card-base p-6 text-center text-sm text-text-secondary">
                            No posts yet. They appear here after your campaign is built.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {posts.map((asset, i) => (
                                <PostCard
                                    key={asset.id}
                                    label={`Post ${i + 1}`}
                                    content={asset.content}
                                    done={isAssetDone(asset)}
                                    markingDone={markingAssetId === asset.id}
                                    onMarkDone={(doneState) => onMarkAssetDone(asset.id, doneState)}
                                />
                            ))}
                        </div>
                    )}

                    <button type="button" onClick={() => setStep(3)} className="btn-primary w-full py-4 text-base">
                        Next: Fill My Week
                        <ArrowRight size={18} />
                    </button>
                </section>
            )}

            {step === 3 && (
                <section className="flex flex-col gap-5">
                    <div className="card-base p-5 sm:p-6">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--gold-text)]">Step 3 of {TOTAL_STEPS}</p>
                        <h2 className="ds-h3 mb-2">Fill my week</h2>
                        <p className="text-sm text-text-secondary">
                            Tap the button to get 5 ready-to-copy posts (Mon–Fri). Copy each one, post it, then tap <strong className="text-text-primary">Done ✓</strong>.
                        </p>
                    </div>

                    {!weekGenerated && weeklyPosts.length === 0 ? (
                        <button
                            type="button"
                            onClick={handleFillWeek}
                            disabled={fillingWeek}
                            className="btn-primary w-full py-4 text-base"
                        >
                            <Sparkles size={18} />
                            {fillingWeek ? "Creating your week…" : "Click Here — Fill My Week"}
                        </button>
                    ) : null}

                    {(weekGenerated || weeklyPosts.length > 0) && (
                        <>
                            {campaignProgress.week.total > 0 ? (
                                <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
                                    <p className="text-sm font-semibold text-text-primary">
                                        Week posts: {campaignProgress.week.done} of {campaignProgress.week.total} done
                                    </p>
                                </div>
                            ) : null}

                            <div className="flex flex-col gap-4">
                                {weeklyPosts.map((asset) => {
                                    const fullText = [
                                        asset.meta?.hook ? String(asset.meta.hook) : "",
                                        asset.content,
                                        asset.meta?.cta ? String(asset.meta.cta) : "",
                                    ]
                                        .filter(Boolean)
                                        .join("\n\n");
                                    return (
                                        <PostCard
                                            key={asset.id}
                                            label={`${String(asset.meta?.weekday || "Day")} post`}
                                            content={fullText}
                                            done={isAssetDone(asset)}
                                            markingDone={markingAssetId === asset.id}
                                            onMarkDone={(doneState) => onMarkAssetDone(asset.id, doneState)}
                                        />
                                    );
                                })}
                            </div>

                            {!fillingWeek && weeklyPosts.length === 0 ? (
                                <button type="button" onClick={handleFillWeek} className="btn-secondary w-full">
                                    Try again
                                </button>
                            ) : null}
                        </>
                    )}

                    <button type="button" onClick={() => setStep(4)} className="btn-primary w-full py-4 text-base">
                        Next: You&apos;re Done
                        <ArrowRight size={18} />
                    </button>
                </section>
            )}

            {step === 4 && (
                <section className="flex flex-col gap-5">
                    <div className="card-base p-6 text-center sm:p-8">
                        <CheckCircle2 size={48} className="mx-auto mb-4 text-[var(--success)]" />
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--gold-text)]">Step 4 of {TOTAL_STEPS}</p>
                        <h2 className="ds-h2 mb-2">You&apos;re all set!</h2>
                        <p className="mx-auto max-w-md text-sm text-text-secondary">
                            You completed {campaignProgress.done} of {campaignProgress.total} tasks. Keep posting every day to get results.
                        </p>
                        {campaign.score != null ? (
                            <p className="mt-4 text-2xl font-bold tabular-nums text-[var(--gold-text)]">
                                Campaign score: {campaign.score}/100
                            </p>
                        ) : null}
                    </div>

                    {campaign.strategy?.summary ? (
                        <div className="card-base p-5 sm:p-6">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Quick tip</p>
                            <p className="text-sm leading-relaxed text-text-secondary">{campaign.strategy.summary}</p>
                            {campaign.strategy.firstStep ? (
                                <p className="mt-3 text-sm text-text-primary">
                                    <strong>Do this first:</strong> {campaign.strategy.firstStep}
                                </p>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="card-base flex flex-col gap-4 p-5 sm:p-6">
                        <div>
                            <h3 className="ds-h5 mb-1">Want more opportunities?</h3>
                            <p className="text-sm text-text-secondary">
                                Tap below. We&apos;ll find more conversations and refresh your replies.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleImprove}
                            disabled={improving}
                            className="btn-primary w-full py-4 text-base"
                        >
                            <Sparkles size={18} />
                            {improving ? "Working on it…" : "Click Here — Improve My Campaign"}
                        </button>
                        {improved ? (
                            <p className="text-center text-sm font-semibold text-[var(--success)]">
                                ✓ Done! Go back to Step 1 to see your new replies.
                            </p>
                        ) : null}
                    </div>

                    <button type="button" onClick={() => setStep(1)} className="btn-secondary w-full py-3">
                        ← Back to Step 1 (Replies)
                    </button>
                </section>
            )}
        </div>
    );
}
