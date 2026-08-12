"use client";

import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton } from "./copy-button";
import { labelDisplay } from "@/lib/dfy/parse-json";
import { isOpportunityDone } from "@/lib/dfy/opportunity-progress";
import type { CampaignOpportunityRow } from "@/lib/dfy/types";

type OpportunityCardProps = {
    opportunity: CampaignOpportunityRow;
    index?: number;
    simple?: boolean;
    onRegenerate?: () => void;
    regenerating?: boolean;
    showAlternatives?: boolean;
    onToggleAlternatives?: () => void;
    onMarkDone?: (done: boolean) => void;
    markingDone?: boolean;
};

export function OpportunityCard({
    opportunity,
    index,
    simple = false,
    onRegenerate,
    regenerating,
    showAlternatives,
    onToggleAlternatives,
    onMarkDone,
    markingDone,
}: OpportunityCardProps) {
    const label = labelDisplay(opportunity.label);
    const done = isOpportunityDone(opportunity);

    if (simple) {
        return (
            <article
                className={clsx(
                    "card-base flex flex-col gap-4 p-4 sm:p-5 transition",
                    done && "border-[var(--success-border)] bg-[var(--success-bg-faint)]",
                )}
            >
                <div className="flex items-start gap-3">
                    {index != null ? (
                        <span
                            className={clsx(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                done ? "bg-[var(--success)] text-white" : "bg-[var(--gold)] text-black",
                            )}
                        >
                            {done ? <CheckCircle2 size={16} /> : index}
                        </span>
                    ) : null}
                    <div className="min-w-0 flex-1">
                        <h3
                            className={clsx(
                                "text-base font-semibold",
                                done
                                    ? "text-text-muted line-through decoration-[var(--success)] decoration-2"
                                    : "text-text-primary",
                            )}
                        >
                            {opportunity.title}
                        </h3>
                        <p className="mt-1 text-xs text-text-muted">
                            {opportunity.platform} · Tap &ldquo;Open Post&rdquo; to see the conversation
                        </p>
                    </div>
                </div>

                <div className="rounded-[var(--radius-md)] border-2 border-[var(--gold)] bg-[var(--surface-2)] p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--gold-text)]">
                        Your reply — copy this
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                        {opportunity.recommended_reply || "Reply loading…"}
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <CopyButton text={opportunity.recommended_reply} label="Copy Reply" variant="primary" />
                    <a
                        href={opportunity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex items-center justify-center gap-2 px-4 py-3 text-sm"
                    >
                        <ExternalLink size={16} />
                        Open Post
                    </a>
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

    return (
        <article className={clsx(
            "card-base flex flex-col gap-4 p-4 sm:p-5 transition",
            done && "border-[var(--success-border)] bg-[var(--success-bg-faint)]",
        )}>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={clsx(
                        "text-xs font-bold uppercase tracking-wide",
                        done ? "text-[var(--success)]" : opportunity.label === "excellent" ? "text-[var(--warning)]" : "text-[var(--gold-text)]",
                    )}>
                        {done ? "Completed" : opportunity.label === "excellent" ? "Excellent Opportunity" : `${label} Opportunity`}
                    </span>
                    {done ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-bg-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--success)]">
                            <CheckCircle2 size={12} />
                            Done
                        </span>
                    ) : null}
                </div>
                <span className="text-xs font-semibold tabular-nums text-text-muted">
                    {opportunity.opportunity_score}/100
                </span>
            </div>

            <div>
                <h3
                    className={clsx(
                        "text-base font-semibold sm:text-lg",
                        done
                            ? "text-text-muted line-through decoration-[var(--success)] decoration-2"
                            : "text-text-primary",
                    )}
                >
                    {opportunity.title}
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                    {opportunity.platform} · {opportunity.intent_score >= 70 ? "High buying intent" : "Moderate intent"}
                </p>
            </div>

            {opportunity.context ? (
                <p className="text-sm leading-relaxed text-text-secondary line-clamp-3">{opportunity.context}</p>
            ) : null}

            <div className="space-y-3 border-t border-[var(--border-subtle)] pt-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Why Cashwave selected this</p>
                    <p className="mt-1 text-sm text-text-secondary">{opportunity.why_selected}</p>
                </div>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Recommended approach</p>
                    <p className="mt-1 text-sm text-text-secondary">{opportunity.recommended_approach}</p>
                </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-2)] p-3 sm:p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--gold-text)]">Recommended Reply</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                    {opportunity.recommended_reply || "Reply will appear here after generation. Click Regenerate to create one."}
                </p>
            </div>

            {showAlternatives && opportunity.alternative_replies?.length ? (
                <div className="space-y-2">
                    {opportunity.alternative_replies.map((alt) => (
                        <div key={alt.style} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{alt.style}</p>
                            <p className="mt-1 text-sm text-text-secondary">{alt.text}</p>
                            <div className="mt-2 flex justify-end">
                                <CopyButton text={alt.text} label="Copy" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
                <CopyButton text={opportunity.recommended_reply} label="Copy Reply" variant="primary" />
                <a
                    href={opportunity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary px-3 py-2 text-xs sm:text-sm"
                >
                    <ExternalLink size={14} strokeWidth={1.75} />
                    View Offer
                </a>
                {onToggleAlternatives ? (
                    <button type="button" onClick={onToggleAlternatives} className="btn-secondary px-3 py-2 text-xs sm:text-sm">
                        {showAlternatives ? "Hide Replies" : "View All Replies"}
                    </button>
                ) : null}
                {onRegenerate ? (
                    <button
                        type="button"
                        onClick={onRegenerate}
                        disabled={regenerating}
                        className="btn-secondary px-3 py-2 text-xs sm:text-sm"
                    >
                        {regenerating ? "Regenerating…" : "↻ Regenerate"}
                    </button>
                ) : null}
                {onMarkDone ? (
                    <button
                        type="button"
                        onClick={() => onMarkDone(!done)}
                        disabled={markingDone}
                        className={done ? "btn-secondary px-3 py-2 text-xs sm:text-sm" : "btn-primary px-3 py-2 text-xs sm:text-sm"}
                    >
                        {markingDone ? "Saving…" : done ? (
                            <>
                                <Circle size={14} strokeWidth={1.75} />
                                Mark as Not Done
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={14} strokeWidth={1.75} />
                                Mark as Done
                            </>
                        )}
                    </button>
                ) : null}
            </div>
        </article>
    );
}
