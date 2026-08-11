"use client";

import { ArrowRight } from "lucide-react";
import type { ScoredOpportunity } from "@/lib/traffic-machine/types";
import { OpportunityScore } from "./OpportunityScore";

interface NewOpportunitiesProps {
  opportunities: ScoredOpportunity[];
  onActivate: (sourceId: string) => void;
}

export function NewOpportunities({ opportunities, onActivate }: NewOpportunitiesProps) {
  const items = opportunities.filter((o) => !o.activated && (o.source.meta?.isNew || o.score >= 85)).slice(0, 4);

  if (items.length === 0) {
    return (
      <section className="card-base p-8">
        <h2 className="ds-h3">New Opportunities</h2>
        <p className="mt-2 text-sm text-text-secondary">
          You&apos;re all caught up. We&apos;ll show new opportunities here when they&apos;re available.
        </p>
      </section>
    );
  }

  return (
    <section className="card-base flex flex-col gap-6 p-8">
      <h2 className="ds-h3">New Opportunities</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((o) => (
          <article key={o.source.id} className="surface-well-lg flex flex-col gap-3 p-5">
            <span className="badge-success w-fit text-[10px]">New</span>
            <h3 className="ds-h5">{o.source.name}</h3>
            <OpportunityScore score={o.score} label={o.label} compact />
            <p className="text-sm text-text-secondary">
              {o.reasons[0] || "Strong match for your audience and easy to maintain."}
            </p>
            <p className="text-xs text-text-muted">
              Difficulty: {o.source.difficulty} · ~{o.source.time}
            </p>
            <button type="button" onClick={() => onActivate(o.source.id)} className="btn-primary w-fit py-2.5 text-sm">
              Activate
              <ArrowRight size={12} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
