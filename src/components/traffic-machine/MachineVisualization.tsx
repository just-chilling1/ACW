"use client";

import { motion } from "framer-motion";
import { CATEGORY_LABELS, getSourceCategory } from "@/lib/traffic-machine/categories";
import type { ScoredOpportunity } from "@/lib/traffic-machine/types";

interface MachineVisualizationProps {
  opportunities: ScoredOpportunity[];
  activatedCount: number;
}

export function MachineVisualization({ opportunities, activatedCount }: MachineVisualizationProps) {
  const total = opportunities.length;
  const pct = total > 0 ? Math.round((activatedCount / total) * 100) : 0;

  const buckets = ["search", "social", "communities", "content"] as const;
  const bucketCounts = buckets.map((b) =>
    opportunities.filter((o) => getSourceCategory(o.source.type) === b).length,
  );

  return (
    <section className="card-base flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="ds-h3">Traffic Machine</h2>
          <p className="text-sm text-text-secondary">
            {activatedCount} / {total} opportunities activated
          </p>
        </div>
        <span className="text-2xl font-bold tabular-nums text-[var(--gold)]">{pct}%</span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--grad-brand)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>

      <div className="flex flex-col items-center gap-4 py-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--gold)]">
          YOUR OFFER
        </div>
        <span className="text-text-muted" aria-hidden>
          ↓
        </span>
        <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
          {buckets.map((b, i) => (
            <div
              key={b}
              className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border-strong)] p-3 text-center"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {CATEGORY_LABELS[b]}
              </span>
              <span className="text-sm font-semibold text-text-primary">{bucketCounts[i]}</span>
            </div>
          ))}
        </div>
        <span className="text-text-muted" aria-hidden>
          ↓
        </span>
        <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-text-secondary">
          <span>TRAFFIC</span>
          <span className="text-text-muted">→</span>
          <span>YOUR SALES</span>
        </div>
      </div>
    </section>
  );
}
