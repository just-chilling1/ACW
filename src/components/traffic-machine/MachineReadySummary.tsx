"use client";

import type { OpportunitySummary } from "@/lib/traffic-machine/types";

interface MachineReadySummaryProps {
  summary: OpportunitySummary;
}

export function MachineReadySummary({ summary }: MachineReadySummaryProps) {
  const metrics = [
    { value: summary.total, label: "Opportunities" },
    { value: summary.quickWins, label: "Quick Wins" },
    { value: summary.longTerm, label: "Long-Term Sources" },
    { value: summary.highPotential, label: "High-Potential" },
    { value: summary.content, label: "Content Opportunities" },
  ];

  return (
    <section className="card-base flex flex-col gap-6 p-8 text-center">
      <div>
        <h2 className="ds-h2">Your Traffic Machine Is Ready</h2>
        <p className="mt-2 text-text-secondary">
          We found {summary.total} traffic opportunities that match your offer.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="surface-well-lg flex flex-col gap-1 p-4">
            <span className="text-2xl font-bold tabular-nums text-[var(--gold)]">{m.value}</span>
            <span className="text-xs text-text-muted">{m.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        Counts reflect available opportunities in your plan — not traffic you&apos;ve generated yet.
      </p>
    </section>
  );
}
