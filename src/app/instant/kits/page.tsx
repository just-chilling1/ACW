"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Trash2, Copy } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import type { KitStats } from "@/lib/instant/types";

type KitSummary = {
    id: string;
    name: string;
    status: string;
    stats: KitStats;
    created_at: string;
    updated_at: string;
};

export default function KitsListPage() {
    const [kits, setKits] = useState<KitSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/instant/kits")
            .then((r) => r.json())
            .then((d) => setKits(d.kits || []))
            .catch(() => setKits([]))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this promotion kit?")) return;
        await fetch(`/api/instant/kits/${id}`, { method: "DELETE" });
        setKits((prev) => prev.filter((k) => k.id !== id));
    };

    const handleDuplicate = async (id: string) => {
        const res = await fetch(`/api/instant/kits/${id}/duplicate`, { method: "POST" });
        const data = await res.json();
        if (data.kit) {
            setKits((prev) => [data.kit, ...prev]);
        }
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6 pb-12">
            <PageHeader
                eyebrow="PREMIUM"
                title="My Promotion Kits"
                subtitle="Your saved promotion kits — open, duplicate, or delete."
            />

            <Link href="/instant/build" className="btn-primary inline-flex">
                <Sparkles size={16} />
                Create Promotion Kit
            </Link>

            {loading ? (
                <p className="text-text-muted">Loading kits…</p>
            ) : kits.length === 0 ? (
                <div className="surface-panel-elevated space-y-4 p-6 text-center">
                    <h2 className="text-lg font-semibold">Your first promotion kit starts here</h2>
                    <p className="text-sm text-text-muted">
                        Give Cashwave your offer and we&apos;ll prepare ready-to-use promotions for you.
                    </p>
                    <Link href="/instant/build" className="btn-primary inline-flex">
                        Create My First Kit
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {kits.map((kit) => (
                        <div key={kit.id} className="card-interactive flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                            <div className="min-w-0">
                                <p className="font-semibold text-text-primary">{kit.name}</p>
                                <p className="text-xs text-text-muted capitalize">{kit.status}</p>
                                <p className="mt-1 text-xs text-text-muted">
                                    {kit.stats?.postCount || 0} Posts · {kit.stats?.hookCount || 0} Hooks · {kit.stats?.replyCount || 0} Replies
                                </p>
                                <p className="text-xs text-text-muted">
                                    {new Date(kit.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link href={`/instant/kit/${kit.id}`} className="btn-primary text-sm">
                                    Open
                                    <ArrowRight size={14} />
                                </Link>
                                <button type="button" onClick={() => handleDuplicate(kit.id)} className="btn-secondary text-sm">
                                    <Copy size={14} />
                                    Duplicate
                                </button>
                                <button type="button" onClick={() => handleDelete(kit.id)} className="btn-ghost text-sm text-[var(--danger)]">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Link href="/instant" className="btn-ghost inline-flex text-sm">Back to Instant Income</Link>
        </div>
    );
}
