"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Copy, MessageSquare, RefreshCw, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/page-header";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import type { KitStats } from "@/lib/instant/types";

type KitSummary = {
    id: string;
    name: string;
    status: string;
    stats: KitStats;
    updated_at: string;
};

const FLOW_STEPS = [
    {
        id: 1,
        label: "Post this",
        help: "Copy one post and paste it online.",
        icon: Copy,
    },
    {
        id: 2,
        label: "Reply with this",
        help: "Copy a reply when someone comments.",
        icon: MessageSquare,
    },
    {
        id: 3,
        label: "Post again",
        help: "Use another post in a new place.",
        icon: RefreshCw,
    },
    {
        id: 4,
        label: "Next step / All done",
        help: "Reuse unused posts, then finish when the kit is empty.",
        icon: CheckCircle2,
    },
] as const;

export default function InstantLandingPage() {
    const [kits, setKits] = useState<KitSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/instant/kits")
            .then((r) => r.json())
            .then((d) => setKits(d.kits || []))
            .catch(() => setKits([]))
            .finally(() => setLoading(false));
    }, []);

    const latestKit = kits.find((k) => k.status === "ready") || kits[0];
    const continueLabel =
        latestKit?.status === "building"
            ? "Continue — kit is still building"
            : latestKit?.status === "failed"
              ? "Retry this kit"
              : "Continue your kit";

    return (
        <div className="mx-auto max-w-2xl space-y-6 pb-12">
            <PageHeader
                eyebrow="PREMIUM"
                title="Instant Income"
                subtitle="One step at a time. Copy → paste → next."
            />

            <TutorialVideoSection
                title="How Instant Income Works"
                description="A short walkthrough of pasting your offer, copying posts and replies, and posting with confidence."
            />

            {!loading && latestKit ? (
                <div className="surface-panel-elevated space-y-5 p-5 sm:p-6">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gold-text)]">
                            Pick up where you left off
                        </p>
                        <h2 className="text-xl font-semibold text-text-primary">{latestKit.name}</h2>
                        <p className="text-sm text-text-muted">
                            {latestKit.stats?.postCount || 0} posts · {latestKit.stats?.replyCount || 0} replies ready
                        </p>
                    </div>

                    <Link
                        href={`/instant/kit/${latestKit.id}`}
                        className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base"
                    >
                        {continueLabel}
                        <ArrowRight size={18} />
                    </Link>

                    <Link href="/instant/build" className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-sm">
                        <Sparkles size={16} />
                        Create a new kit
                    </Link>
                </div>
            ) : !loading ? (
                <div className="surface-panel-elevated space-y-5 p-5 sm:p-6 text-center">
                    <h2 className="text-xl font-semibold text-text-primary">Start here</h2>
                    <p className="text-sm text-text-muted">
                        Paste your offer link. We prepare posts and replies in moments — you just copy and paste.
                    </p>
                    <Link href="/instant/build" className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base">
                        <Sparkles size={18} />
                        Create My Promotion Kit
                    </Link>
                </div>
            ) : (
                <p className="text-center text-sm text-text-muted">Loading…</p>
            )}

            <div className="surface-panel space-y-4 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">How it works</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    {FLOW_STEPS.map((step) => {
                        const Icon = step.icon;
                        return (
                            <div
                                key={step.id}
                                className={clsx(
                                    "flex gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3",
                                    latestKit && step.id === 1 && "border-[var(--gold)] bg-[var(--surface-2)]",
                                )}
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--gold-text)]">
                                    <Icon size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">
                                        Step {step.id}: {step.label}
                                    </p>
                                    <p className="text-xs text-text-muted">{step.help}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {kits.length > 1 ? (
                <Link href="/instant/kits" className="btn-ghost inline-flex text-sm">
                    View all my kits ({kits.length})
                </Link>
            ) : null}
        </div>
    );
}
