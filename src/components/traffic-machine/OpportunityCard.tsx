"use client";

import { ArrowRight, CheckCircle2, Clock, Users } from "lucide-react";
import { clsx } from "clsx";
import { OpportunityScore } from "./OpportunityScore";
import type { ScoredOpportunity } from "@/lib/traffic-machine/types";

interface OpportunityCardProps {
  opportunity: ScoredOpportunity;
  onStart: (sourceId: string) => void;
}

export function OpportunityCard({ opportunity, onStart }: OpportunityCardProps) {
  const { source, score, label, audienceMatchPercent, reasons, activated } = opportunity;
  const setupTime = source.time.replace(/minutes?/i, "min");

  return (
    <article
      className={clsx(
        "card-base flex flex-col gap-4 p-5 transition-all",
        activated && "border-[var(--success-border-strong)]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{source.type}</span>
          <h3 className="ds-h5">{source.name}</h3>
        </div>
        <OpportunityScore score={score} label={label} compact />
      </div>

      <p className="text-sm text-text-secondary">{source.description.replace("{LINK}", "your link")}</p>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <span className="text-text-muted">Audience Match</span>
          <div className="mt-1 h-1.5 rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--gold)]"
              style={{ width: `${audienceMatchPercent}%` }}
            />
          </div>
          <span className="text-xs text-text-muted">{audienceMatchPercent}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Users size={12} />
          <span>Difficulty: {source.difficulty}</span>
        </div>
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Clock size={12} />
          <span>Setup: ~{setupTime}</span>
        </div>
        <div>
          <span className="text-text-muted">Potential</span>
          <p className="font-medium text-text-primary">{opportunity.potential}</p>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-muted">Why we recommend it</span>
          {reasons.map((r) => (
            <span key={r} className="text-sm text-text-secondary">
              ✓ {r}
            </span>
          ))}
        </div>
      )}

      <div className="surface-well-lg flex flex-col gap-1 p-3 text-sm text-text-secondary">
        <span className="font-semibold text-text-primary">What&apos;s ready for you?</span>
        <span>✓ Step-by-step instructions</span>
        <span>✓ Ready-to-paste answer</span>
        <span>✓ Suggested headline & keywords</span>
        <span>✓ Your link automatically included</span>
      </div>

      {activated ? (
        <div className="status-success inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold">
          <CheckCircle2 size={14} />
          Activated
        </div>
      ) : (
        <button type="button" onClick={() => onStart(source.id)} className="btn-primary w-full py-3">
          Start Opportunity
          <ArrowRight size={14} />
        </button>
      )}
    </article>
  );
}
