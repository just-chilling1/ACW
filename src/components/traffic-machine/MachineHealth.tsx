"use client";

import type { MachineHealthSummary } from "@/lib/traffic-machine/types";

interface MachineHealthProps {
  health: MachineHealthSummary;
  onReview: (sourceId: string) => void;
}

export function MachineHealth({ health, onReview }: MachineHealthProps) {
  return (
    <section className="card-base flex flex-col gap-6 p-8">
      <h2 className="ds-h3">Traffic Machine Health</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="surface-well-lg p-4 text-center">
          <span className="text-2xl font-bold text-[var(--gold)]">{health.active}</span>
          <p className="text-xs text-text-muted">Active</p>
        </div>
        <div className="surface-well-lg p-4 text-center">
          <span className="text-2xl font-bold text-[var(--warning)]">{health.needsAttention}</span>
          <p className="text-xs text-text-muted">Needs Attention</p>
        </div>
        <div className="surface-well-lg p-4 text-center">
          <span className="text-2xl font-bold text-text-primary">{health.newOpportunities}</span>
          <p className="text-xs text-text-muted">New Opportunities</p>
        </div>
      </div>
      {health.attentionItems.length === 0 ? (
        <p className="text-sm text-text-secondary">All active sources look good. Keep growing your machine.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {health.attentionItems.map((item) => (
            <li
              key={item.sourceId}
              className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-text-secondary">{item.message}</p>
              <button type="button" onClick={() => onReview(item.sourceId)} className="btn-secondary py-2 text-xs">
                Review
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
