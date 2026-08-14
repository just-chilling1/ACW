"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, FileText, Link2, Send, Wand2 } from "lucide-react";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { injectLink } from "@/lib/dfy/humanize";
import { InstantPostCard, type InstantPostCardData } from "@/components/instant/post-card";
import { InstantPostViewModal } from "@/components/instant/post-view-modal";
import { LinkCombobox } from "@/components/dfy/link-combobox";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import {
    PremiumLandingShell,
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
        <PremiumLandingShell className="instant-theme instant-income-page">
            <header className="instant-income-hero">
                <div className="instant-income-hero__stamp" aria-hidden>
                    <Send size={20} strokeWidth={1.75} />
                </div>
                <div className="relative space-y-4">
                    <p className="instant-income-kicker">Instant Income · Facebook posting library</p>
                    <h1 className="instant-income-title">
                        Find a post.<br />
                        <span>Make it yours.</span>
                    </h1>
                    <p className="instant-income-subtitle">
                        Browse group-ready Facebook copy, add your offer once, and keep a simple record of every post you publish.
                    </p>
                    <div className="instant-income-hero__stats">
                        <span><FileText size={15} /> 250 ready to use posts</span>
                    </div>
                </div>
            </header>

            <TutorialVideoSection
                title="Use the Posting Desk"
                description="A quick walkthrough of choosing an audience, adding your offer, and publishing posts responsibly in Facebook groups."
            />

            <section className="instant-income-guide" aria-label="How the post library works">
                {HOW_TO_STEPS.map((step) => (
                    <div key={step.num} className="instant-income-guide__step">
                        <span>{step.num}</span>
                        <div>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </div>
                    </div>
                ))}
            </section>

            <section className="instant-setup" aria-labelledby="instant-setup-title">
                <div className="instant-setup__header">
                    <div>
                        <p className="instant-income-kicker">Your posting setup</p>
                        <h2 id="instant-setup-title" className="ds-h3">Link + audience</h2>
                    </div>
                    <p className="instant-setup__hint">
                        Add your offer, pick a niche — the library updates right away.
                    </p>
                </div>

                <div className="instant-setup__row">
                    <div className="instant-setup__field">
                        <div className="instant-setup__field-top">
                            <p className="instant-setup__label">Offer link</p>
                            <Link href="/links" className="instant-setup__library-link">
                                <Link2 size={13} />
                                Links Library
                            </Link>
                        </div>
                        {savedLinks.length > 0 ? (
                            <LinkCombobox links={savedLinks} value={selectedLinkId} onChange={applySavedLink} />
                        ) : null}
                        <Field
                            type="url"
                            placeholder="https://your-offer-link.com"
                            value={affiliateLink}
                            onChange={(e) => {
                                setAffiliateLink(e.target.value);
                                setSelectedLinkId("");
                            }}
                            hint="Optional — inserted into copied posts."
                        />
                    </div>

                    <div className="instant-setup__field">
                        <p className="instant-setup__label">Audience</p>
                        <div className="instant-niche-list">
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
            </section>

            <section className="instant-library" aria-labelledby="instant-library-title">
                <div className="instant-library__header">
                    <div>
                        <p className="instant-income-kicker">Post library</p>
                        <h2 id="instant-library-title" className="ds-h3">{nicheLabel} ideas</h2>
                        <p className="mt-1 text-sm text-text-secondary">
                            {loading
                                ? "Preparing your library…"
                                : cards.length === 0
                                  ? "No templates are available yet."
                                  : `${cards.length} group-ready posts to adapt and publish.`}
                        </p>
                    </div>
                    <div className="instant-library__workflow">
                        <ClipboardList size={17} />
                        <span>Review · Copy · Publish</span>
                    </div>
                </div>

                {loading ? (
                    <PremiumStateBlock rows={4} heightClassName="h-36" />
                ) : error ? (
                    <div className="instant-library__state border-[var(--danger-border)] bg-[var(--danger-bg-subtle)] text-[var(--danger)]">
                        {error}
                    </div>
                ) : cards.length === 0 ? (
                    <div className="instant-library__state">
                        <p className="mb-2 font-medium text-text-primary">No posts for this audience yet.</p>
                        <p>Need something more specific? Build a custom post from your offer.</p>
                    </div>
                ) : (
                    <div className="instant-post-grid">
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
            </section>

            <div className="instant-custom-cta">
                <div>
                    <p className="instant-income-kicker">Need something specific?</p>
                    <h2 className="ds-h4">Write a custom Facebook post</h2>
                    <p className="text-sm text-text-secondary">
                        Answer a few questions and we’ll draft group-ready copy for your offer.
                    </p>
                </div>
                <Link href="/instant/custom" className="btn-primary justify-center">
                    <Wand2 size={18} strokeWidth={1.75} />
                    Write a custom post
                </Link>
            </div>

            <InstantPostViewModal
                post={viewing}
                done={viewing ? doneIds.has(viewing.id) : false}
                onClose={() => setViewing(null)}
                onToggleDone={toggleDone}
            />
        </PremiumLandingShell>
    );
}
