"use client";

import type { Opportunity, OpportunityFilter } from "@/lib/campaign/types";
import { filterOpportunities } from "@/lib/campaign/scoring";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { AiBadge } from "./ai-badge";
import { OpportunityCard } from "./opportunity-card";

const FILTERS: { id: OpportunityFilter; label: string }[] = [
  { id: "best_match", label: "Best Match" },
  { id: "highest_intent", label: "Highest Intent" },
  { id: "lowest_competition", label: "Lowest Competition" },
  { id: "newest", label: "Newest" },
];

type OpportunityListProps = {
  opportunities: Opportunity[];
  filter: OpportunityFilter;
  onFilterChange: (filter: OpportunityFilter) => void;
  selectedId: string | null;
  onSelect: (opportunity: Opportunity) => void;
};

export function OpportunityList({
  opportunities,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
}: OpportunityListProps) {
  const sorted = filterOpportunities(opportunities, filter);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <AiBadge>AI Found</AiBadge>
          <h2 className="ds-h2">
            {opportunities.length} Opportunit{opportunities.length === 1 ? "y" : "ies"}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <SelectableChip
              key={f.id}
              label={f.label}
              selected={filter === f.id}
              onClick={() => onFilterChange(f.id)}
            />
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="card-base flex flex-col items-center gap-3 p-10! text-center">
          <p className="text-sm text-text-secondary">We couldn&apos;t find strong opportunities yet.</p>
          <p className="text-xs text-text-muted">Try analyzing a different offer or check back later.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {sorted.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              selected={selectedId === opp.id}
              onSelect={() => onSelect(opp)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
