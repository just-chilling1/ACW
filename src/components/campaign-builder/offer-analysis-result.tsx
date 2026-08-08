"use client";

import type { OfferAnalysis } from "@/lib/campaign/types";
import { AiBadge } from "./ai-badge";
import { OpportunityScore } from "./opportunity-score";

export function OfferAnalysisResult({ analysis }: { analysis: OfferAnalysis }) {
  const rows = [
    { label: "Product", value: analysis.productName },
    { label: "Category", value: analysis.category },
    { label: "Main problem", value: analysis.mainProblem },
    { label: "Target audience", value: analysis.targetAudience },
    { label: "Main benefit", value: analysis.mainBenefit },
    { label: "Recommended positioning", value: analysis.positioning },
  ];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <AiBadge>AI Analysis</AiBadge>
        <h2 className="ds-h2">Your Offer</h2>
      </div>

      <div className="card-base grid gap-4 p-6! sm:grid-cols-2 sm:p-8!">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <p className="ds-h4 text-text-muted">{row.label}</p>
            <p className="text-sm leading-relaxed text-text-primary">{row.value}</p>
          </div>
        ))}
      </div>

      <div className="card-base p-6! sm:p-8!">
        <OpportunityScore score={analysis.opportunityScore} title="AI Opportunity Score" />
      </div>
    </section>
  );
}
