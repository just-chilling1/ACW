"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignLibrary } from "@/components/dfy/campaign-tabs";
import { EXCLUSIVE_OFFERS } from "@/lib/exclusive-offers";

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

    const handleDuplicate = async (id: string) => {
        const res = await fetch(`/api/dfy/campaigns/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "duplicate" }),
        });
        const data = await res.json();
        if (data.campaign) {
            setCampaigns((prev) => [data.campaign, ...prev]);
        }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
            <section className="mb-10 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-1)] p-6 sm:p-10">
                <p className="page-eyebrow mb-3">DFY Campaign Builder</p>
                <h1 className="ds-h1 mb-3 max-w-2xl">Your Marketing Campaign. Built For You.</h1>
                <p className="ds-subtitle mb-6 max-w-xl">
                    Give Cashwave your offer. We&apos;ll find the opportunities, create the content, and build your action plan.
                </p>
                <p className="mb-6 text-sm text-text-muted">One offer → complete promotional campaign.</p>
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

            <section className="mb-10">
                <PageHeader title="My Campaigns" subtitle="Reopen saved campaigns anytime." />
                {loading ? (
                    <div className="card-base p-6 text-sm text-text-muted">Loading campaigns…</div>
                ) : (
                    <CampaignLibrary campaigns={campaigns} onDelete={handleDelete} onDuplicate={handleDuplicate} />
                )}
            </section>

            <section className="card-base p-5 sm:p-6">
                <h2 className="mb-2 text-lg font-semibold text-text-primary">Don&apos;t have an offer yet?</h2>
                <p className="mb-4 text-sm text-text-secondary">Let Cashwave help you find one.</p>
                <div className="flex flex-col gap-2">
                    {EXCLUSIVE_OFFERS.map((offer) => (
                        <Link
                            key={offer.url}
                            href={`/dfy/new?url=${encodeURIComponent(offer.url)}&name=${encodeURIComponent(offer.title)}`}
                            className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 py-3 text-sm text-text-secondary transition hover:border-[var(--border-strong)] hover:text-text-primary"
                        >
                            {offer.title}
                            <ArrowRight size={14} />
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
