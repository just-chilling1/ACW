"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignLibrary } from "@/components/dfy/campaign-tabs";
import { DfyVideoSection } from "@/components/dfy/dfy-video-section";

type CampaignSummary = {
    id: string;
    name: string;
    score: number | null;
    stats: { assetCount?: number; opportunityCount?: number };
    created_at: string;
    updated_at: string;
};

export default function DfyLandingPage() {
    const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dfy/campaigns")
            .then((r) => r.json())
            .then((d) => setCampaigns(d.campaigns || []))
            .catch(() => setCampaigns([]))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this campaign?")) return;
        await fetch(`/api/dfy/campaigns/${id}`, { method: "DELETE" });
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
            <section className="mb-10 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-1)] p-6 sm:p-10">
                <p className="page-eyebrow mb-3">DFY Campaign Builder</p>
                <h1 className="ds-h1 mb-3 max-w-2xl">Your Marketing Campaign. Built For You.</h1>
                <p className="ds-subtitle mb-6 max-w-xl">
                    Paste your link → get replies → copy posts → done. Three simple steps.
                </p>
                <p className="mb-6 text-sm text-text-muted">One button at a time. Nothing happens until you click.</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/dfy/new" className="btn-primary">
                        <Sparkles size={18} strokeWidth={1.75} />
                        Build My Campaign
                    </Link>
                    <Link href="/dfy/example" className="btn-secondary">
                        <Eye size={18} strokeWidth={1.75} />
                        See Example Campaign
                    </Link>
                </div>
            </section>

            <DfyVideoSection className="mb-10" />

            <section className="mb-10">
                <PageHeader title="My Campaigns" subtitle="Reopen saved campaigns anytime." />
                {loading ? (
                    <div className="card-base p-6 text-sm text-text-muted">Loading campaigns…</div>
                ) : (
                    <CampaignLibrary campaigns={campaigns} onDelete={handleDelete} />
                )}
            </section>
        </div>
    );
}
