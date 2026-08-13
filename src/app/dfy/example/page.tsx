"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignLinearFlow } from "@/components/dfy/campaign-linear-flow";
import { EXAMPLE_CAMPAIGN, EXAMPLE_OPPORTUNITIES, EXAMPLE_ASSETS } from "@/lib/dfy/example-campaign";
import { useState } from "react";

export default function ExampleCampaignPage() {
    const [exampleOpportunities, setExampleOpportunities] = useState(EXAMPLE_OPPORTUNITIES);
    const [exampleAssets, setExampleAssets] = useState(EXAMPLE_ASSETS);

    const handleExampleMarkDone = (id: string, done: boolean) => {
        setExampleOpportunities((prev) =>
            prev.map((opp) =>
                opp.id === id
                    ? { ...opp, meta: { ...opp.meta, done, completedAt: done ? new Date().toISOString() : null } }
                    : opp,
            ),
        );
    };

    const handleExampleMarkAssetDone = (id: string, done: boolean) => {
        setExampleAssets((prev) =>
            prev.map((asset) =>
                asset.id === id
                    ? { ...asset, meta: { ...asset.meta, done, completedAt: done ? new Date().toISOString() : null } }
                    : asset,
            ),
        );
    };

    return (
        <div className="mx-auto flex w-full max-w-none flex-col gap-6 pb-10 sm:pb-12">
            <Link href="/dfy" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
                <ArrowLeft size={16} />
                Back
            </Link>

            <PageHeader
                eyebrow="Example (Read-only)"
                title={EXAMPLE_CAMPAIGN.name}
                subtitle="This is what your finished campaign looks like. Follow the 4 steps."
                step={1}
                totalSteps={4}
            />

            <CampaignLinearFlow
                campaign={EXAMPLE_CAMPAIGN}
                opportunities={exampleOpportunities}
                assets={exampleAssets}
                onMarkOpportunityDone={handleExampleMarkDone}
                markingOpportunityId={null}
                onMarkAssetDone={handleExampleMarkAssetDone}
                markingAssetId={null}
                onFillWeek={async () => {}}
                fillingWeek={false}
                onImprove={async () => {}}
                improving={false}
            />
        </div>
    );
}
