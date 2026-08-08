"use client";

import type { ScoreBreakdown } from "@/lib/campaign/types";
import { clsx } from "clsx";

type OpportunityScoreProps = {
  score: ScoreBreakdown;
  title?: string;
  compact?: boolean;
  showBreakdown?: boolean;
};

export function OpportunityScore({
  score,
  title = "Opportunity Score",
  compact,
  showBreakdown = true,
}: OpportunityScoreProps) {
  const metrics = [
    { label: "Audience Match", value: score.audienceMatch },
    { label: "Buying Intent", value: score.buyingIntent },
    { label: "Opportunity", value: score.opportunity },
    { label: "Offer Match", value: score.offerMatch },
  ].filter((m) => m.value !== undefined);

  return (
    <div className={clsx("flex flex-col gap-4", compact && "gap-3")}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="ds-h4 text-text-muted">{title}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--gold)] sm:text-4xl">
            {score.overall}
            <span className="text-lg font-semibold text-text-muted"> / 100</span>
          </p>
        </div>
        <span className="badge-success px-3 py-1.5 text-xs">{score.label}</span>
      </div>

      {showBreakdown && metrics.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="ds-well p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{m.label}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-text-primary">{m.value}</p>
              </div>
            ))}
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-text-muted hover:text-[var(--gold)]">
              Why this score?
            </summary>
            <p className="mt-2 leading-relaxed text-text-secondary">
              Scores combine how well the conversation matches your offer, buying intent in the post,
              competition from other promoters, and engagement when available.
            </p>
          </details>
        </>
      ) : null}
    </div>
  );
}
