"use client";

import { Link2 } from "lucide-react";

interface TrafficResultsProps {
  activatedCount: number;
  bestSourceName?: string;
}

export function TrafficResults({ activatedCount, bestSourceName }: TrafficResultsProps) {
  const metrics = [
    { label: "Visitors", value: null },
    { label: "Clicks", value: null },
    { label: "Sales", value: null },
    { label: "Activated Sources", value: String(activatedCount) },
    { label: "Best Source", value: bestSourceName || "—" },
  ];

  return (
    <section className="card-base flex flex-col gap-6 p-8">
      <h2 className="ds-h3">Results</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="surface-well-lg flex flex-col gap-1 p-4">
            <span className="text-xs text-text-muted">{m.label}</span>
            {m.value === null ? (
              <span className="text-sm text-text-muted">Unavailable</span>
            ) : (
              <span className="text-lg font-semibold text-text-primary">{m.value}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border-strong)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          Start tracking your traffic to see which sources are working.
        </p>
        <button type="button" className="btn-secondary" disabled title="Tracking integration coming soon">
          <Link2 size={14} />
          Connect Tracking
        </button>
      </div>
    </section>
  );
}
