"use client";

import type { TrafficExperiment } from "@/lib/traffic-machine/types";

interface TrafficExperimentsProps {
  experiments: TrafficExperiment[];
}

export function TrafficExperiments({ experiments }: TrafficExperimentsProps) {
  if (!experiments.length) return null;

  return (
    <section className="card-base flex flex-col gap-6 p-8">
      <div>
        <h2 className="ds-h3">Traffic Experiments</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Try different traffic approaches and see what works best.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {experiments.map((exp, i) => (
          <div key={exp.id} className="surface-well-lg flex flex-col gap-2 p-5">
            <span className="text-xs font-semibold text-text-muted">Experiment {String.fromCharCode(65 + i)}</span>
            <h3 className="ds-h5">{exp.name}</h3>
            <p className="text-sm text-text-muted capitalize">Status: {exp.status}</p>
            <p className="text-xs text-text-muted">{exp.sourceIds.length} sources in this test</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        Connect tracking to identify your best-performing approach.
      </p>
    </section>
  );
}
