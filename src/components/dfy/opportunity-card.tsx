"use client";

import { ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton } from "./copy-button";
import { labelDisplay } from "@/lib/dfy/parse-json";
import type { CampaignOpportunityRow } from "@/lib/dfy/types";

type OpportunityCardProps = {
    opportunity: CampaignOpportunityRow;
    onRegenerate?: () => void;
    regenerating?: boolean;
    showAlternatives?: boolean;
    onToggleAlternatives?: () => void;
};

export function OpportunityCard({
    opportunity,
    onRegenerate,
    regenerating,
    showAlternatives,
    onToggleAlternatives,
}: OpportunityCardProps) {
    const label = labelDisplay(opportunity.label);

    return (
        <article className="card-base flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <span className={clsx(
                    "text-xs font-bold uppercase tracking-wide",
                    opportunity.label === "excellent" ? "text-[var(--warning)]" : "text-[var(--gold-text)]",
                )}>
                    {opportunity.label === "excellent" ? "Excellent Opportunity" : `${label} Opportunity`}
                </span>
                <span className="text-xs font-semibold tabular-nums text-text-muted">
                    {opportunity.opportunity_score}/100
                </span>
            </div>

            <div>
                <h3 className="text-base font-semibold text-text-primary sm:text-lg">{opportunity.title}</h3>
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
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{opportunity.recommended_reply}</p>
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
                    View Opportunity
                </a>
                {onToggleAlternatives ? (
                    <button type="button" onClick={onToggleAlternatives} className="btn-secondary px-3 py-2 text-xs sm:text-sm">
                        {showAlternatives ? "Hide Alternatives" : "View Alternatives"}
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
            </div>
        </article>
    );
}
