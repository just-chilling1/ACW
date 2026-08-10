"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignLinearFlow } from "@/components/dfy/campaign-linear-flow";
import { EXAMPLE_CAMPAIGN, EXAMPLE_OPPORTUNITIES, EXAMPLE_ASSETS } from "@/lib/dfy/example-campaign";
import { useState } from "react";

export default function ExampleCampaignPage() {
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
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
            <Link href="/dfy" className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
                <ArrowLeft size={16} />
                Back
            </Link>

            <PageHeader
                eyebrow="Example (Read-only)"
                title={EXAMPLE_CAMPAIGN.name}
                subtitle="This is what your finished campaign looks like. Follow the 3 steps."
                step={1}
                totalSteps={3}
            />

            <CampaignLinearFlow
                campaign={EXAMPLE_CAMPAIGN}
                opportunities={exampleOpportunities}
                assets={EXAMPLE_ASSETS}
                onMarkOpportunityDone={handleExampleMarkDone}
                markingOpportunityId={null}
                onFillWeek={async () => {}}
                fillingWeek={false}
                onImprove={async () => {}}
                improving={false}
            />
        </div>
    );
}
