"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wand2 } from "lucide-react";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { injectLink } from "@/lib/dfy/humanize";
import { ReplyCard, type ReplyCardData } from "@/components/dfy/reply-card";
import { DfyVideoSection } from "@/components/dfy/dfy-video-section";
import {
    PremiumLandingShell,
    PremiumHero,
    PremiumSection,
    PremiumStateBlock,
} from "@/components/premium";
import { Field } from "@/components/ui/field";
import { SelectableChip } from "@/components/ui/selectable-chip";

type SeededApiReply = {
    id: string;
    style: string;
    body: string;
    post: {
        id: string;
        platform: string;
        title: string;
        body: string;
        url: string;
    };
};

export default function DfyHybridPage() {
    const [niche, setNiche] = useState<NicheId>("make_money_online");
    const [affiliateLink, setAffiliateLink] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seeded, setSeeded] = useState<SeededApiReply[]>([]);

    const load = useCallback(async (nicheId: NicheId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/dfy/replies/seeded?niche=${encodeURIComponent(nicheId)}&limit=60`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Could not load replies.");
            setSeeded(data.replies || []);
        } catch (err) {
            setSeeded([]);
            setError(err instanceof Error ? err.message : "Could not load replies.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load(niche);
    }, [niche, load]);

    const cards: ReplyCardData[] = useMemo(
        () =>
            seeded.map((row) => ({
                id: row.id,
                title: row.post.title,
                context: row.post.body,
                platform: row.post.platform,
                url: row.post.url,
                body: injectLink(row.body, affiliateLink),
                style: row.style,
            })),
        [seeded, affiliateLink],
    );

    const nicheLabel = APP_NICHES.find((n) => n.id === niche)?.label || "Niche";

    return (
        <PremiumLandingShell className="dfy-theme">
            <PremiumHero
                eyebrow="DONE-FOR-YOU"
                title={
                    <>
                        Ready-to-use replies.{" "}
                        <span className="text-gradient">Built for your niche.</span>
                    </>
                }
                subtitle="Browse humanized replies paired with real Reddit threads — or create custom ones for your offer."
                actions={
                    <Link href="/dfy/custom" className="btn-primary">
                        <Wand2 size={18} strokeWidth={1.75} />
                        Create a custom reply
                    </Link>
                }
            />

            <PremiumSection
                title="Setup"
                description="Add your link, then pick a niche. Replies update below."
            >
                <div className="dfy-setup-panel space-y-5">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
                            1. Your link
                        </p>
                        <Field
                            label="Affiliate / offer link"
                            type="url"
                            placeholder="https://your-offer-link.com"
                            value={affiliateLink}
                            onChange={(e) => setAffiliateLink(e.target.value)}
                            hint="Optional — leave blank to copy replies without a link."
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
                            2. Niche
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {APP_NICHES.map((n) => (
                                <SelectableChip
                                    key={n.id}
                                    label={n.label}
                                    selected={niche === n.id}
                                    onClick={() => setNiche(n.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </PremiumSection>

            <div className="dfy-video-wrap">
                <DfyVideoSection compact />
            </div>

            <PremiumSection
                title={`${nicheLabel} replies`}
                description={
                    loading
                        ? "Loading…"
                        : `${cards.length} replies ready to copy.`
                }
            >
                {loading ? (
                    <PremiumStateBlock rows={4} heightClassName="h-36" />
                ) : error ? (
                    <div className="dfy-state-box border-[var(--danger-border)] bg-[var(--danger-bg-subtle)] p-4 text-sm text-[var(--danger)]">
                        {error}
                    </div>
                ) : cards.length === 0 ? (
                    <div className="dfy-state-box p-6 text-sm text-text-secondary">
                        <p className="mb-2 font-medium text-text-primary">
                            No seeded replies for this niche yet.
                        </p>
                        <p>
                            Prefer something tailored?{" "}
                            <Link href="/dfy/custom" className="font-semibold text-[var(--gold-text)] underline underline-offset-2">
                                Create a custom reply
                            </Link>
                            .
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {cards.map((card) => (
                            <ReplyCard key={card.id} reply={card} />
                        ))}
                    </div>
                )}
            </PremiumSection>
        </PremiumLandingShell>
    );
}
