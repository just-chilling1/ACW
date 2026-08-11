"use client";

import { clsx } from "clsx";
import type { ScoreLabel } from "@/lib/traffic-machine/types";

interface OpportunityScoreProps {
  score: number;
  label: ScoreLabel;
  compact?: boolean;
}

export function OpportunityScore({ score, label, compact }: OpportunityScoreProps) {
  return (
    <div className={clsx("flex flex-col gap-1", compact && "items-end")}>
      <span className="text-2xl font-bold tabular-nums text-[var(--gold)]">{score}</span>
      <span className="text-xs text-text-muted">/ 100</span>
      <span className="text-sm font-semibold text-text-primary">{label} Opportunity</span>
    </div>
  );
}
