"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignReadyHero } from "@/components/dfy/campaign-ready-hero";
import { OverviewTab, OpportunitiesTab, ContentTab, HooksCtaPanel, StrategyScoreTab, WeeklyBatchTab } from "@/components/dfy/campaign-tabs";
import { EXAMPLE_CAMPAIGN, EXAMPLE_OPPORTUNITIES, EXAMPLE_ASSETS, EXAMPLE_ACTIONS } from "@/lib/dfy/example-campaign";
import { useState } from "react";
import { clsx } from "clsx";

const TABS = ["overview", "opportunities", "content", "week", "strategy"] as const;

export default function ExampleCampaignPage() {
    const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
    const [exampleOpportunities, setExampleOpportunities] = useState(EXAMPLE_OPPORTUNITIES);

    const handleExampleMarkDone = (id: string, done: boolean) => {
        setExampleOpportunities((prev) =>
            prev.map((opp) =>
                opp.id === id
                    ? { ...opp, meta: { ...opp.meta, done, completedAt: done ? new Date().toISOString() : null } }
                    : opp,
            ),
        );
    };

    return (
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
            <Link href="/dfy" className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
                <ArrowLeft size={16} />
                Back
            </Link>

            <PageHeader
                eyebrow="Example Campaign (Read-only)"
                title={EXAMPLE_CAMPAIGN.name}
                subtitle="Preview what a finished DFY campaign looks like."
            />

            <div className="mb-8">
                <CampaignReadyHero
                    name={EXAMPLE_CAMPAIGN.name}
                    score={EXAMPLE_CAMPAIGN.score || 94}
                    stats={EXAMPLE_CAMPAIGN.stats}
                />
            </div>

            <div className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)] pb-px">
                {TABS.map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={clsx(
                            "shrink-0 border-b-2 px-3 py-2 text-xs font-semibold capitalize sm:text-sm",
                            tab === t ? "border-[var(--gold)] text-[var(--gold-text)]" : "border-transparent text-text-muted",
                        )}
                    >
                        {t === "week" ? "Fill My Week" : t}
                    </button>
                ))}
            </div>

            {tab === "overview" && (
                <OverviewTab
                    campaign={EXAMPLE_CAMPAIGN}
                    opportunities={exampleOpportunities}
                    assets={EXAMPLE_ASSETS}
                    actions={EXAMPLE_ACTIONS}
                    onViewStrategy={() => setTab("strategy")}
                    onMarkOpportunityDone={handleExampleMarkDone}
                />
            )}
            {tab === "opportunities" && (
                <OpportunitiesTab
                    opportunities={exampleOpportunities}
                    onRegenerate={() => {}}
                    regeneratingId={null}
                    onMarkDone={handleExampleMarkDone}
                    markingDoneId={null}
                />
            )}
            {tab === "content" && (
                <>
                    <ContentTab assets={EXAMPLE_ASSETS} onRegenerate={() => {}} regeneratingId={null} />
                    <HooksCtaPanel assets={EXAMPLE_ASSETS} />
                </>
            )}
            {tab === "week" && (
                <WeeklyBatchTab assets={EXAMPLE_ASSETS} onFillWeek={() => {}} filling={false} onRegenerate={() => {}} regeneratingId={null} />
            )}
            {tab === "strategy" && (
                <StrategyScoreTab campaign={EXAMPLE_CAMPAIGN} onImprove={() => {}} improving={false} />
            )}

            <div className="mt-10 text-center">
                <Link href="/dfy/new" className="btn-primary">Build My Campaign</Link>
            </div>
        </div>
    );
}
