"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Wand2 } from "lucide-react";
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

    return (
        <PremiumLandingShell>
            <PremiumHero
                title={
                    <>
                        Ready-to-use replies.{" "}
                        <span className="text-gradient">Built for your niche.</span>
                    </>
                }
                subtitle="Browse 60 humanized replies per niche, each paired with a real Reddit thread. Or create custom replies for your offer."
                actions={
                    <Link href="/dfy/custom" className="btn-primary">
                        <Wand2 size={18} strokeWidth={1.75} />
                        Create a custom reply
                    </Link>
                }
            >
                <p className="text-sm text-text-muted">
                    Paste your affiliate link below — it is injected into every reply automatically.
                </p>
            </PremiumHero>

            <DfyVideoSection />

            <PremiumSection title="Your link" description="Optional — leave blank to copy replies without a link.">
                <Field
                    label="Affiliate / offer link"
                    type="url"
                    placeholder="https://your-offer-link.com"
                    value={affiliateLink}
                    onChange={(e) => setAffiliateLink(e.target.value)}
                />
            </PremiumSection>

            <PremiumSection title="Pick a niche" description="60 replies per niche, each tied to a real post.">
                <div className="flex flex-wrap gap-2">
                    {APP_NICHES.map((n) => (
                        <button
                            key={n.id}
                            type="button"
                            onClick={() => setNiche(n.id)}
                            className={
                                niche === n.id
                                    ? "btn-primary px-3 py-2 text-xs sm:text-sm"
                                    : "btn-secondary px-3 py-2 text-xs sm:text-sm"
                            }
                        >
                            {n.label}
                        </button>
                    ))}
                </div>
            </PremiumSection>

            <PremiumSection
                title={`${APP_NICHES.find((n) => n.id === niche)?.label || "Niche"} replies`}
                description={
                    loading
                        ? "Loading…"
                        : `${cards.length} replies ready to copy.`
                }
            >
                {loading ? (
                    <PremiumStateBlock rows={4} heightClassName="h-36" />
                ) : error ? (
                    <div className="rounded-[var(--radius-lg)] border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
                        {error}
                    </div>
                ) : cards.length === 0 ? (
                    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-sm text-text-muted">
                        <p className="font-medium text-text mb-2">No seeded replies for this niche yet.</p>
                        <p>
                            Run the seed script on your machine (
                            <code className="text-xs">npm run seed:dfy -- --niche={niche}</code>
                            ), or{" "}
                            <Link href="/dfy/custom" className="text-accent underline">
                                create a custom reply
                            </Link>{" "}
                            now.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {cards.map((card) => (
                            <ReplyCard key={card.id} reply={card} />
                        ))}
                    </div>
                )}

                <div className="mt-6 flex justify-center">
                    <Link href="/dfy/custom" className="btn-secondary inline-flex items-center gap-2">
                        <Sparkles size={16} />
                        Need something more specific? Create a custom reply
                    </Link>
                </div>
            </PremiumSection>
        </PremiumLandingShell>
    );
}
