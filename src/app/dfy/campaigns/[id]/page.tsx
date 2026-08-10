"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignReadyHero } from "@/components/dfy/campaign-ready-hero";
import {
    OverviewTab,
    OpportunitiesTab,
    ContentTab,
    HooksCtaPanel,
    StrategyScoreTab,
    WeeklyBatchTab,
} from "@/components/dfy/campaign-tabs";
import type { CampaignActionRow, CampaignAssetRow, CampaignOpportunityRow, CampaignRow } from "@/lib/dfy/types";
import { clsx } from "clsx";

const TABS = [
    { id: "overview", label: "Overview" },
    { id: "opportunities", label: "Opportunities" },
    { id: "content", label: "Content" },
    { id: "week", label: "Fill My Week" },
    { id: "strategy", label: "Strategy" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CampaignWorkspacePage() {
    const params = useParams();
    const id = params.id as string;
    const [campaign, setCampaign] = useState<CampaignRow | null>(null);
    const [opportunities, setOpportunities] = useState<CampaignOpportunityRow[]>([]);
    const [assets, setAssets] = useState<CampaignAssetRow[]>([]);
    const [actions, setActions] = useState<CampaignActionRow[]>([]);
    const [tab, setTab] = useState<TabId>("overview");
    const [loading, setLoading] = useState(true);
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const [regenerateError, setRegenerateError] = useState("");
    const [fillingWeek, setFillingWeek] = useState(false);
    const [improving, setImproving] = useState(false);
    const [improveMessage, setImproveMessage] = useState("");
    const [markingOpportunityId, setMarkingOpportunityId] = useState<string | null>(null);

    const loadCampaign = async () => {
        const res = await fetch(`/api/dfy/campaigns/${id}`);
        const data = await res.json();
        if (res.ok) {
            setCampaign(data.campaign);
            setOpportunities(data.opportunities || []);
            setAssets(data.assets || []);
            setActions(data.actions || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCampaign();
    }, [id]);

    const handleRegenerate = async (targetType: "opportunity" | "asset", targetId: string) => {
        setRegeneratingId(targetId);
        setRegenerateError("");
        try {
            const res = await fetch(`/api/dfy/campaigns/${id}/regenerate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetType, targetId, mode: "different_angle" }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                await loadCampaign();
            } else {
                setRegenerateError(data.error || "Regeneration failed. Please try again.");
            }
        } catch {
            setRegenerateError("Regeneration failed. Please try again.");
        } finally {
            setRegeneratingId(null);
        }
    };

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
        const previousScore = campaign?.score;
        const previousCount = opportunities.length;
        try {
            const res = await fetch(`/api/dfy/campaigns/${id}/improve`, { method: "POST" });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                if (data.campaign) setCampaign(data.campaign);
                if (data.opportunities) setOpportunities(data.opportunities);
                if (data.assets) setAssets(data.assets);
                await loadCampaign();
                const scoreDelta = data.newScore != null && data.previousScore != null
                    ? data.newScore - data.previousScore
                    : 0;
                const oppDelta = (data.newOpportunityCount ?? opportunities.length) - (data.previousOpportunityCount ?? previousCount);
                const parts: string[] = ["Campaign improved."];
                if (scoreDelta !== 0) parts.push(`Score ${scoreDelta > 0 ? "up" : "down"} ${Math.abs(scoreDelta)} points (${data.previousScore} → ${data.newScore}).`);
                if (oppDelta !== 0) parts.push(`${Math.abs(oppDelta)} ${oppDelta > 0 ? "new" : "fewer"} opportunities.`);
                if (parts.length === 1) parts.push("Opportunities and replies refreshed.");
                setImproveMessage(parts.join(" "));
            } else {
                setImproveMessage(data.error || "Improve failed. Please try again.");
            }
        } catch {
            setImproveMessage("Improve failed. Please try again.");
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

    const stats = campaign.stats || { opportunityCount: opportunities.length, assetCount: assets.length, channelCount: 4, contentDays: 30 };

    return (
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
            <Link href="/dfy" className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
                <ArrowLeft size={16} />
                My Campaigns
            </Link>

            <PageHeader
                title={campaign.name}
                subtitle="Your complete promotional campaign — built for you."
                actions={
                    <div className="flex flex-wrap gap-2">
                        <a href={`/api/dfy/campaigns/${id}/export?format=markdown`} className="btn-secondary px-3 py-2 text-xs">
                            <Download size={14} />
                            Download Campaign
                        </a>
                        <a href={`/api/dfy/campaigns/${id}/export?format=csv`} className="btn-secondary px-3 py-2 text-xs">
                            Export CSV
                        </a>
                    </div>
                }
            />

            {campaign.status === "ready" && campaign.score != null ? (
                <div className="mb-8">
                    <CampaignReadyHero name={campaign.name} score={campaign.score} stats={stats} />
                </div>
            ) : null}

            {regenerateError ? (
                <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--danger)] bg-[var(--danger-fill)] px-4 py-2 text-sm text-[var(--danger)]">
                    {regenerateError}
                </p>
            ) : null}

            {improveMessage ? (
                <p className={`mb-4 rounded-[var(--radius-md)] border px-4 py-2 text-sm ${improveMessage.includes("failed") || improveMessage.includes("Could not") ? "border-[var(--danger)] bg-[var(--danger-fill)] text-[var(--danger)]" : "border-[var(--gold)] bg-[var(--gold-fill)] text-[var(--gold-text)]"}`}>
                    {improveMessage}
                </p>
            ) : null}

            <div className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)] pb-px">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={clsx(
                            "shrink-0 border-b-2 px-3 py-2 text-xs font-semibold sm:text-sm",
                            tab === t.id
                                ? "border-[var(--gold)] text-[var(--gold-text)]"
                                : "border-transparent text-text-muted hover:text-text-primary",
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "overview" && (
                <OverviewTab
                    campaign={campaign}
                    opportunities={opportunities}
                    assets={assets}
                    actions={actions}
                    onViewStrategy={() => setTab("strategy")}
                    onMarkOpportunityDone={handleMarkOpportunityDone}
                    markingOpportunityId={markingOpportunityId}
                />
            )}
            {tab === "opportunities" && (
                <OpportunitiesTab
                    opportunities={opportunities}
                    onRegenerate={(oid) => handleRegenerate("opportunity", oid)}
                    regeneratingId={regeneratingId}
                    onMarkDone={handleMarkOpportunityDone}
                    markingDoneId={markingOpportunityId}
                />
            )}
            {tab === "content" && (
                <>
                    <ContentTab
                        assets={assets}
                        onRegenerate={(aid) => handleRegenerate("asset", aid)}
                        regeneratingId={regeneratingId}
                    />
                    <HooksCtaPanel
                        assets={assets}
                        onRegenerate={(aid) => handleRegenerate("asset", aid)}
                        regeneratingId={regeneratingId}
                    />
                </>
            )}
            {tab === "week" && (
                <WeeklyBatchTab
                    assets={assets}
                    onFillWeek={handleFillWeek}
                    filling={fillingWeek}
                    onRegenerate={(aid) => handleRegenerate("asset", aid)}
                    regeneratingId={regeneratingId}
                />
            )}
            {tab === "strategy" && (
                <StrategyScoreTab campaign={campaign} onImprove={handleImprove} improving={improving} />
            )}
        </div>
    );
}
