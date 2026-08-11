"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import type { NextAction, ScoredOpportunity } from "@/lib/traffic-machine/types";

interface NextBestActionProps {
  action: NextAction;
  opportunity?: ScoredOpportunity | null;
  onAction: () => void;
}

export function NextBestAction({ action, opportunity, onAction }: NextBestActionProps) {
  return (
    <section className="card-base relative overflow-hidden border-[var(--accent-border-strong)] p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[var(--gold)]">
            <Sparkles size={18} />
            <h2 className="ds-h3">What Should I Do Next?</h2>
          </div>
          <h3 className="ds-h4">{action.title}</h3>
          {opportunity && action.type === "activate" && (
            <p className="text-sm font-semibold text-[var(--gold)]">
              {opportunity.score} Opportunity Score · {opportunity.label}
            </p>
          )}
          <p className="max-w-xl text-sm text-text-secondary">{action.description}</p>
          {opportunity && action.type === "activate" && (
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-text-muted">
              <span>Audience Match: {opportunity.audienceMatchPercent >= 80 ? "High" : "Good"}</span>
              <span>Difficulty: {opportunity.source.difficulty}</span>
              <span>Setup: ~{opportunity.source.time.replace(/minutes?/i, "min")}</span>
              <span>Potential: {opportunity.potential}</span>
            </div>
          )}
        </div>
        <button type="button" onClick={onAction} className="btn-primary shrink-0 px-6 py-3.5">
          {action.ctaLabel}
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}
