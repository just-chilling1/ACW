"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Link2, Wand2 } from "lucide-react";
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

const PAGE_SIZE = 30;

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

type SavedLink = {
    id: string;
    name: string;
    url: string;
};

const HOW_TO_STEPS = [
    {
        num: "1",
        title: "Save your link",
        desc: "Add your affiliate link in Links Library — or paste it below — so every reply can include it automatically.",
    },
    {
        num: "2",
        title: "Pick a niche",
        desc: "Choose the niche that matches your offer. You’ll get 60 ready replies split into two batches of 30.",
    },
    {
        num: "3",
        title: "Copy and post",
        desc: "Open the real Reddit thread, paste the reply, and move to the next one. Switch batches when you need fresh copy.",
    },
] as const;

export default function DfyHybridPage() {
    const [niche, setNiche] = useState<NicheId>("make_money_online");
    const [affiliateLink, setAffiliateLink] = useState("");
    const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
    const [selectedLinkId, setSelectedLinkId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seeded, setSeeded] = useState<SeededApiReply[]>([]);
    const [batch, setBatch] = useState(0);

    const loadLinks = useCallback(async () => {
        try {
            const res = await fetch("/api/dfy/offers");
            const data = await res.json();
            if (!res.ok) return;
            const links = ((data.offers || []) as { id: string; name: string; url: string }[]).map((row) => ({
                id: row.id,
                name: row.name || "Untitled Link",
                url: row.url,
            }));
            setSavedLinks(links);
        } catch {
            /* ignore — paste field still works */
        }
    }, []);

    const load = useCallback(async (nicheId: NicheId) => {
        setLoading(true);
        setError(null);
        setBatch(0);
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
        void loadLinks();
    }, [loadLinks]);

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

    const totalBatches = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
    const safeBatch = Math.min(batch, totalBatches - 1);
    const visibleCards = cards.slice(safeBatch * PAGE_SIZE, (safeBatch + 1) * PAGE_SIZE);
    const rangeStart = cards.length === 0 ? 0 : safeBatch * PAGE_SIZE + 1;
    const rangeEnd = Math.min((safeBatch + 1) * PAGE_SIZE, cards.length);

    const nicheLabel = APP_NICHES.find((n) => n.id === niche)?.label || "Niche";

    const applySavedLink = (linkId: string) => {
        setSelectedLinkId(linkId);
        const match = savedLinks.find((link) => link.id === linkId);
        if (match) setAffiliateLink(match.url);
    };

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
                subtitle="Browse humanized replies paired with real Reddit threads — 60 per niche, ready to copy and post."
            />

            <DfyVideoSection />

            <section className="dfy-howto-panel">
                <div className="mb-5 flex items-center gap-3 sm:mb-6">
                    <CheckCircle2 size={20} className="text-[var(--gold-text)]" />
                    <h2 className="ds-h5">How to Use This (3 Simple Steps)</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {HOW_TO_STEPS.map((step) => (
                        <div key={step.num} className="dfy-howto-step">
                            <div className="dfy-howto-step__num">{step.num}</div>
                            <h3 className="text-base font-semibold text-text-primary">{step.title}</h3>
                            <p className="text-sm leading-relaxed text-text-secondary">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <PremiumSection
                title="Setup"
                description="Add your link, then pick a niche. Replies update below."
            >
                <div className="dfy-setup-panel space-y-5">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
                                1. Your link
                            </p>
                            <Link
                                href="/links"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold-text)] underline-offset-2 hover:underline"
                            >
                                <Link2 size={13} />
                                Links Library
                            </Link>
                        </div>

                        {savedLinks.length > 0 ? (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-text-primary" htmlFor="dfy-saved-link">
                                    Use a saved link
                                </label>
                                <select
                                    id="dfy-saved-link"
                                    className="input-base w-full"
                                    value={selectedLinkId}
                                    onChange={(e) => applySavedLink(e.target.value)}
                                >
                                    <option value="">Paste manually below…</option>
                                    {savedLinks.map((link) => (
                                        <option key={link.id} value={link.id}>
                                            {link.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        <Field
                            label="Affiliate / offer link"
                            type="url"
                            placeholder="https://your-offer-link.com"
                            value={affiliateLink}
                            onChange={(e) => {
                                setAffiliateLink(e.target.value);
                                setSelectedLinkId("");
                            }}
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

            <PremiumSection
                title={`${nicheLabel} replies`}
                description={
                    loading
                        ? "Loading…"
                        : cards.length === 0
                          ? "No replies yet."
                          : `Showing ${rangeStart}–${rangeEnd} of ${cards.length}`
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
                        <p>Prefer something tailored? Create a custom reply below.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {visibleCards.map((card) => (
                            <ReplyCard key={card.id} reply={card} />
                        ))}
                    </div>
                )}

                {!loading && cards.length > PAGE_SIZE ? (
                    <div className="mt-5 flex flex-col items-center gap-2">
                        <button
                            type="button"
                            className="btn-secondary px-6 py-2.5 text-sm"
                            onClick={() => setBatch((prev) => (prev === 0 ? 1 : 0))}
                        >
                            {safeBatch === 0
                                ? `Show replies 31–${Math.min(60, cards.length)}`
                                : "Show replies 1–30"}
                        </button>
                        <p className="text-xs text-text-muted">
                            Batch {safeBatch + 1} of {totalBatches}
                        </p>
                    </div>
                ) : null}

                <div className="mt-6 flex justify-center">
                    <Link href="/dfy/custom" className="btn-primary w-full max-w-md justify-center sm:w-auto">
                        <Wand2 size={18} strokeWidth={1.75} />
                        Create a custom reply
                    </Link>
                </div>
            </PremiumSection>
        </PremiumLandingShell>
    );
}
