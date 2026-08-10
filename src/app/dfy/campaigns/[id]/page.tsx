"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignLinearFlow } from "@/components/dfy/campaign-linear-flow";
import type { CampaignAssetRow, CampaignOpportunityRow, CampaignRow } from "@/lib/dfy/types";

export default function CampaignWorkspacePage() {
    const params = useParams();
    const id = params.id as string;
    const [campaign, setCampaign] = useState<CampaignRow | null>(null);
    const [opportunities, setOpportunities] = useState<CampaignOpportunityRow[]>([]);
    const [assets, setAssets] = useState<CampaignAssetRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [improveMessage, setImproveMessage] = useState("");
    const [fillingWeek, setFillingWeek] = useState(false);
    const [improving, setImproving] = useState(false);
    const [markingOpportunityId, setMarkingOpportunityId] = useState<string | null>(null);

    const loadCampaign = async () => {
        const res = await fetch(`/api/dfy/campaigns/${id}`);
        const data = await res.json();
        if (res.ok) {
            setCampaign(data.campaign);
            setOpportunities(data.opportunities || []);
            setAssets(data.assets || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCampaign();
    }, [id]);

    const handleFillWeek = async () => {
        setFillingWeek(true);
        try {
            const res = await fetch(`/api/dfy/campaigns/${id}/weekly-batch`, { method: "POST" });
            if (res.ok) await loadCampaign();
        } finally {
            setFillingWeek(false);
        }
    };

    const handleMarkOpportunityDone = async (opportunityId: string, done: boolean) => {
        setMarkingOpportunityId(opportunityId);
        try {
            const res = await fetch(`/api/dfy/campaigns/${id}/opportunities/${opportunityId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ done }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.opportunity) {
                setOpportunities((prev) =>
                    prev.map((opp) => (opp.id === opportunityId ? data.opportunity : opp)),
                );
            }
        } finally {
            setMarkingOpportunityId(null);
        }
    };

    const handleImprove = async () => {
        setImproving(true);
        setImproveMessage("");
        const previousCount = opportunities.length;
        try {
            const res = await fetch(`/api/dfy/campaigns/${id}/improve`, { method: "POST" });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                if (data.campaign) setCampaign(data.campaign);
                if (data.opportunities) setOpportunities(data.opportunities);
                if (data.assets) setAssets(data.assets);
                await loadCampaign();
                const oppDelta = (data.newOpportunityCount ?? opportunities.length) - (data.previousOpportunityCount ?? previousCount);
                if (oppDelta > 0) {
                    setImproveMessage(`Done! Found ${oppDelta} new conversations. Go to Step 1.`);
                } else {
                    setImproveMessage("Done! Your replies were refreshed. Go to Step 1.");
                }
            } else {
                setImproveMessage(data.error || "Something went wrong. Try again.");
            }
        } catch {
            setImproveMessage("Something went wrong. Try again.");
        } finally {
            setImproving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-text-muted">Loading campaign…</div>;
    }

    if (!campaign) {
        return (
            <div className="mx-auto max-w-3xl p-8 text-center">
                <p className="mb-4 text-text-secondary">Campaign not found.</p>
                <Link href="/dfy" className="btn-primary">Back to DFY</Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
            <Link href="/dfy" className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
                <ArrowLeft size={16} />
                My Campaigns
            </Link>

            <PageHeader
                eyebrow="Your Campaign"
                title={campaign.name}
                subtitle="Follow the 3 steps below. One button at a time."
                step={1}
                totalSteps={3}
                actions={
                    <a href={`/api/dfy/campaigns/${id}/export?format=markdown`} className="btn-secondary px-3 py-2 text-xs">
                        <Download size={14} />
                        Download
                    </a>
                }
            />

            {improveMessage ? (
                <p className={`mb-4 rounded-[var(--radius-md)] border px-4 py-3 text-sm ${improveMessage.includes("wrong") || improveMessage.includes("failed") ? "border-[var(--danger)] bg-[var(--danger-fill)] text-[var(--danger)]" : "border-[var(--success-border)] bg-[var(--success-bg-faint)] text-[var(--success)]"}`}>
                    {improveMessage}
                </p>
            ) : null}

            <CampaignLinearFlow
                campaign={campaign}
                opportunities={opportunities}
                assets={assets}
                onMarkOpportunityDone={handleMarkOpportunityDone}
                markingOpportunityId={markingOpportunityId}
                onFillWeek={handleFillWeek}
                fillingWeek={fillingWeek}
                onImprove={handleImprove}
                improving={improving}
            />
        </div>
    );
}
