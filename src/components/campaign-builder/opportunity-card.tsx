"use client";

import { ExternalLink, Flame } from "lucide-react";
import { clsx } from "clsx";
import type { Opportunity } from "@/lib/campaign/types";
import { AiBadge } from "./ai-badge";
import { OpportunityScore } from "./opportunity-score";
import { PlatformBadge } from "@/components/ui/platform-badge";

type OpportunityCardProps = {
  opportunity: Opportunity;
  onSelect: () => void;
  selected?: boolean;
};

export function OpportunityCard({ opportunity, onSelect, selected }: OpportunityCardProps) {
  const { post, score, indicators, whyPicked, recommended } = opportunity;
  const question = post.title || post.text;

  return (
    <article
      className={clsx(
        "card-base flex flex-col gap-5 p-5! transition-all sm:p-6!",
        selected && "border-[var(--accent-border-strong)] ring-1 ring-[var(--accent-border)]",
        recommended && !selected && "border-[var(--accent-border)]"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {recommended ? <AiBadge>Recommended for you</AiBadge> : null}
        {score.overall >= 85 ? (
          <span className="badge-success flex items-center gap-1 px-2 py-1 text-[10px]">
            <Flame size={10} aria-hidden />
            High-Potential Opportunity
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <p className="ds-h4 text-text-muted">Question / problem</p>
        <blockquote className="border-l-2 border-[var(--accent-border)] pl-4 text-base font-medium leading-relaxed text-text-primary">
          &ldquo;{question}&rdquo;
        </blockquote>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <PlatformBadge platform={post.platform} />
        <span className="text-xs text-text-muted">
          {typeof post.engagement === "number"
            ? `${post.engagement.toLocaleString()} engagements`
            : "Active conversation"}
        </span>
      </div>

      <OpportunityScore score={score} compact showBreakdown={false} />

      {indicators.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {indicators.map((item) => (
            <li
              key={item}
              className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-text-secondary"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="ds-well p-4">
        <p className="ds-h4 mb-2 text-text-muted">Why AI picked this</p>
        <p className="text-sm leading-relaxed text-text-secondary">{whyPicked}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary py-2.5 text-xs"
        >
          <ExternalLink size={14} aria-hidden />
          Preview conversation
        </a>
        <button type="button" onClick={onSelect} className="btn-primary py-3">
          Use This Opportunity
        </button>
      </div>
    </article>
  );
}
