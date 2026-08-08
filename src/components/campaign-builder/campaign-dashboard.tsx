"use client";

import { CheckCircle2, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import type { Campaign } from "@/lib/campaign/types";
import { ActionPlanSummary } from "./action-plan";
import { OpportunityScore } from "./opportunity-score";
import { AiBadge } from "./ai-badge";

type CampaignDashboardProps = {
  campaign: Campaign;
  onMarkDone: (actionId: string) => void;
  onNewCampaign: () => void;
  onSelectCampaign?: (id: string) => void;
  onViewPlan?: () => void;
  savedCampaigns?: Campaign[];
};

export function CampaignDashboard({
  campaign,
  onMarkDone,
  onNewCampaign,
  onSelectCampaign,
  onViewPlan,
  savedCampaigns = [],
}: CampaignDashboardProps) {
  const todayActions = campaign.actionPlan.filter((a) => a.status !== "completed");
  const completed = campaign.actionPlan.filter((a) => a.status === "completed");
  const selectedOpp = campaign.opportunities.find((o) => o.id === campaign.selectedOpportunityId);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <AiBadge>My Campaign</AiBadge>
          <h2 className="ds-h1 mt-3 brand-font">{campaign.name}</h2>
          <p className="mt-2 text-sm text-text-muted">
            <span className="font-semibold text-[var(--gold)]">{campaign.campaignStrength}</span> Campaign Strength
          </p>
          <div className="mt-2">
            <ActionPlanSummary items={campaign.actionPlan} />
          </div>
        </div>
        <button type="button" onClick={onNewCampaign} className="btn-secondary shrink-0">
          <RotateCcw size={14} aria-hidden />
          New Campaign
        </button>
      </div>

      {savedCampaigns.length > 1 ? (
        <div className="card-base p-4!">
          <p className="ds-h4 mb-3 text-text-muted">Saved Campaigns</p>
          <div className="flex flex-wrap gap-2">
            {savedCampaigns.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCampaign?.(c.id)}
                className={clsx(
                  "rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold",
                  c.id === campaign.id
                    ? "border-[var(--accent-border-strong)] bg-[var(--accent-bg-subtle)] text-[var(--gold)]"
                    : "border-[var(--border-strong)] text-text-secondary hover:text-text-primary"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-base flex flex-col gap-4 p-6!">
          <h3 className="ds-h3">Today&apos;s Actions</h3>
          {todayActions.length === 0 ? (
            <p className="text-sm text-text-muted">All actions completed — great work!</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {todayActions.slice(0, 3).map((item) => (
                <li key={item.id} className="ds-well flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                    <p className="text-xs text-text-muted">{item.platform} · {item.intentLabel}</p>
                  </div>
                  <button type="button" onClick={() => onMarkDone(item.id)} className="btn-soft shrink-0 px-3 py-1.5 text-[10px]">
                    Start
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-base flex flex-col gap-4 p-6!">
          <h3 className="ds-h3">Content Ready</h3>
          {campaign.promotionPack ? (
            <>
              <p className="text-sm leading-relaxed text-text-secondary line-clamp-4">
                {campaign.promotionPack.recommendedReply}
              </p>
              {onViewPlan ? (
                <button type="button" onClick={onViewPlan} className="btn-soft w-fit py-2 text-xs">
                  View full promotion pack
                </button>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-text-muted">Your promotion pack will appear here.</p>
          )}
        </div>
      </div>

      {selectedOpp ? (
        <div className="card-base p-6!">
          <h3 className="ds-h3 mb-4">Primary Opportunity</h3>
          <OpportunityScore score={selectedOpp.score} compact />
        </div>
      ) : null}

      <div className="card-base p-6!">
        <h3 className="ds-h3 mb-4">Completed</h3>
        {completed.length === 0 ? (
          <p className="text-sm text-text-muted">Completed actions will appear here.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {completed.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 size={14} className="text-[var(--success)]" aria-hidden />
                {item.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-base p-6!">
        <h3 className="ds-h3 mb-2">Campaign Results</h3>
        <p className="text-sm text-text-muted">
          Performance tracking will appear here as you complete actions. We don&apos;t show estimated clicks or revenue until real data is available.
        </p>
      </div>
    </section>
  );
}
