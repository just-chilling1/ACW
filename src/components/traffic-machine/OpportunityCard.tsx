"use client";

import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { clsx } from "clsx";
import type { ScoredOpportunity } from "@/lib/traffic-machine/types";

interface OpportunityCardProps {
  opportunity: ScoredOpportunity;
  onStart: (sourceId: string) => void;
  recommended?: boolean;
}

export function OpportunityCard({ opportunity, onStart, recommended }: OpportunityCardProps) {
  const { source, score, activated } = opportunity;
  const setupTime = source.time.replace(/minutes?/i, "min");

  return (
    <article
      className={clsx(
        "flex flex-col gap-3 rounded-[var(--radius-md)] border p-4 transition-colors",
        activated
          ? "border-[var(--success-border)] bg-[var(--success-bg-faint)]"
          : recommended
            ? "border-[var(--gold)] bg-[var(--accent-bg-subtle)]"
            : "border-[var(--border-strong)] bg-[var(--surface-1)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {source.type}
            </span>
            {recommended && !activated ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold-text)]">
                Next up
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 text-base font-semibold text-text-primary">{source.name}</h3>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--gold)]">{score}</span>
      </div>

      <p className="line-clamp-2 text-sm text-text-secondary">
        {source.description.replace("{LINK}", "your link")}
      </p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
        <span>{source.difficulty}</span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} />~{setupTime}
        </span>
      </div>

      {activated ? (
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--success)]">
          <CheckCircle2 size={14} />
          Done
        </div>
      ) : (
        <button type="button" onClick={() => onStart(source.id)} className="btn-primary w-full py-2.5 text-sm">
          Start
          <ArrowRight size={14} />
        </button>
      )}
    </article>
  );
}
