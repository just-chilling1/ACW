"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Link2, Wand2 } from "lucide-react";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { injectLink } from "@/lib/dfy/humanize";
import { InstantPostCard, type InstantPostCardData } from "@/components/instant/post-card";
import { InstantPostViewModal } from "@/components/instant/post-view-modal";
import { LinkCombobox } from "@/components/dfy/link-combobox";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import {
    PremiumLandingShell,
    PremiumHero,
    PremiumSection,
    PremiumStateBlock,
} from "@/components/premium";
import { Field } from "@/components/ui/field";
import { SelectableChip } from "@/components/ui/selectable-chip";

type SeededApiPost = {
    id: string;
    style: string;
    title: string;
    body: string;
    niche: NicheId;
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
        desc: "Add your affiliate link in Links Library — or paste it below — so every post can include it automatically.",
    },
    {
        num: "2",
        title: "Pick a niche",
        desc: "Choose the niche that matches your offer. You’ll get ready Facebook group posts with varied tones.",
    },
    {
        num: "3",
        title: "Copy, post, mark done",
        desc: "Open a card, copy the post into a Facebook group (follow group rules), then mark it done so you don’t repeat work.",
    },
] as const;

export default function InstantLandingPage() {
    const [niche, setNiche] = useState<NicheId>("make_money_online");
    const [affiliateLink, setAffiliateLink] = useState("");
    const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
    const [selectedLinkId, setSelectedLinkId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [byNiche, setByNiche] = useState<Partial<Record<NicheId, SeededApiPost[]>>>({});
    const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
    const [viewing, setViewing] = useState<InstantPostCardData | null>(null);

    const loadLinks = useCallback(async () => {
        try {
            const res = await fetch("/api/dfy/offers");
            const data = await res.json();
            if (!res.ok) return;
            const links = ((data.offers || []) as { id: string; name: string; url: string }[]).map(
                (row) => ({
                    id: row.id,
                    name: row.name || "Untitled Link",
                    url: row.url,
                }),
            );
            setSavedLinks(links);
        } catch {
            /* ignore */
        }
    }, []);

    const loadLibrary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [postsRes, doneRes] = await Promise.all([
                fetch("/api/instant/posts/seeded?all=1"),
                fetch("/api/instant/posts/completions"),
            ]);
            const postsData = await postsRes.json();
            const doneData = await doneRes.json();
            if (!postsRes.ok) throw new Error(postsData.error || "Could not load posts.");
            setByNiche((postsData.byNiche || {}) as Partial<Record<NicheId, SeededApiPost[]>>);
            if (doneRes.ok) {
                setDoneIds(new Set((doneData.postIds || []) as string[]));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load posts.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadLinks();
        void loadLibrary();
    }, [loadLinks, loadLibrary]);

    const applySavedLink = (id: string) => {
        setSelectedLinkId(id);
        const found = savedLinks.find((l) => l.id === id);
        if (found) setAffiliateLink(found.url);
    };

    const nicheLabel = APP_NICHES.find((n) => n.id === niche)?.label || niche;
    const seeded = byNiche[niche] || [];

    const cards: InstantPostCardData[] = useMemo(
        () =>
            seeded.map((row) => ({
                id: row.id,
                title: row.title,
                body: injectLink(row.body, affiliateLink),
                style: row.style,
                nicheLabel,
                platform: "Facebook",
            })),
        [seeded, affiliateLink, nicheLabel],
    );

    const toggleDone = async (postId: string) => {
        const wasDone = doneIds.has(postId);
        setDoneIds((prev) => {
            const next = new Set(prev);
            if (wasDone) next.delete(postId);
            else next.add(postId);
            return next;
        });

        try {
            const res = wasDone
                ? await fetch(`/api/instant/posts/completions?postId=${encodeURIComponent(postId)}`, {
                      method: "DELETE",
                  })
                : await fetch("/api/instant/posts/completions", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ postId }),
                  });
            if (!res.ok) throw new Error("Failed");
        } catch {
            setDoneIds((prev) => {
                const next = new Set(prev);
                if (wasDone) next.add(postId);
                else next.delete(postId);
                return next;
            });
        }
    };

    return (
        <PremiumLandingShell className="dfy-theme">
            <PremiumHero
                eyebrow="INSTANT INCOME"
                title={
                    <>
                        Ready Facebook posts.{" "}
                        <span className="text-gradient">Built for your niche.</span>
                    </>
                }
                subtitle="Browse 250 ready-to-paste Facebook group posts — pick a niche, drop in your link, copy and post."
            />

            <TutorialVideoSection
                title="How Instant Income Works"
                description="A short walkthrough of picking your niche, adding your link, and posting in Facebook groups with confidence."
            />

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
                description="Add your link, then pick a niche. Switching niches is instant after the first load."
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
                            <LinkCombobox
                                links={savedLinks}
                                value={selectedLinkId}
                                onChange={applySavedLink}
                            />
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
                            hint="Optional — leave blank to copy posts without a link."
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
                title={`${nicheLabel} posts`}
                description={
                    loading
                        ? "Loading library…"
                        : cards.length === 0
                          ? "No posts yet."
                          : `Showing ${cards.length} ready Facebook posts`
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
                            No posts for this niche yet.
                        </p>
                        <p>Prefer something tailored? Create a custom post below.</p>
                    </div>
                ) : (
                    <div className="dfy-reply-grid">
                        {cards.map((card) => (
                            <InstantPostCard
                                key={card.id}
                                post={card}
                                done={doneIds.has(card.id)}
                                onView={setViewing}
                                onToggleDone={toggleDone}
                            />
                        ))}
                    </div>
                )}

                <div className="mt-6 flex justify-center">
                    <Link
                        href="/instant/custom"
                        className="btn-primary w-full max-w-md justify-center sm:w-auto"
                    >
                        <Wand2 size={18} strokeWidth={1.75} />
                        Create a custom post
                    </Link>
                </div>
            </PremiumSection>

            <InstantPostViewModal
                post={viewing}
                done={viewing ? doneIds.has(viewing.id) : false}
                onClose={() => setViewing(null)}
                onToggleDone={toggleDone}
            />
        </PremiumLandingShell>
    );
}
