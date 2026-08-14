"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, PenLine, Sparkles } from "lucide-react";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { InstantPostCard, type InstantPostCardData } from "@/components/instant/post-card";
import { PremiumLandingShell } from "@/components/premium";
import { Field } from "@/components/ui/field";
import { InlineError } from "@/components/ui/InlineError";
import { SelectableChip } from "@/components/ui/selectable-chip";

type GeneratedPost = {
    title: string;
    body: string;
    style: string;
    platform?: string;
};

export default function InstantCustomPostPage() {
    const [niche, setNiche] = useState<NicheId>("make_money_online");
    const [idealCustomer, setIdealCustomer] = useState("");
    const [problemSolved, setProblemSolved] = useState("");
    const [offerUrl, setOfferUrl] = useState("");
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [posts, setPosts] = useState<GeneratedPost[] | null>(null);

    const canGenerate =
        !!niche &&
        idealCustomer.trim().length >= 8 &&
        problemSolved.trim().length >= 8 &&
        offerUrl.trim().length >= 8;

    const handleGenerate = async () => {
        if (!canGenerate) return;
        setError("");
        setGenerating(true);
        setPosts(null);
        try {
            const res = await fetch("/api/instant/posts/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    niche,
                    idealCustomer: idealCustomer.trim(),
                    problemSolved: problemSolved.trim(),
                    offerUrl: offerUrl.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Could not generate posts.");
            setPosts(data.posts || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not generate posts.");
        } finally {
            setGenerating(false);
        }
    };

    const cards: InstantPostCardData[] = (posts || []).map((p, i) => ({
        id: `custom-${i}`,
        title: p.title,
        body: p.body,
        style: p.style,
        platform: p.platform || "Facebook",
    }));

    return (
        <PremiumLandingShell className="instant-theme instant-custom-page" width="narrow">
            <Link href="/instant" className="instant-custom-back btn-secondary w-fit gap-1.5 text-sm">
                <ArrowLeft size={14} />
                Post library
            </Link>

            {posts ? (
                <section className="instant-custom-results" aria-label="Generated posts">
                    <header className="instant-custom-results__header">
                        <div>
                            <p className="instant-income-kicker">Your drafts</p>
                            <h1 className="instant-custom-results__title">
                                {cards.length} Facebook {cards.length === 1 ? "post" : "posts"} ready
                            </h1>
                            <p className="instant-custom-results__subtitle">
                                Copy each post into a relevant Facebook group — follow group rules.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="btn-secondary shrink-0 text-sm"
                            onClick={() => setPosts(null)}
                        >
                            Write new posts
                        </button>
                    </header>
                    <div className="instant-custom-results__list">
                        {cards.map((card) => (
                            <InstantPostCard key={card.id} post={card} />
                        ))}
                    </div>
                </section>
            ) : (
                <>
                    <header className="instant-custom-hero">
                        <div className="instant-custom-hero__icon" aria-hidden>
                            <PenLine size={22} strokeWidth={1.75} />
                        </div>
                        <div className="instant-custom-hero__copy">
                            <p className="instant-income-kicker">Custom post writer</p>
                            <h1 className="instant-custom-hero__title">Draft Facebook group posts</h1>
                            <p className="instant-custom-hero__subtitle">
                                Tell us about your audience and offer — we&apos;ll write posts you can
                                paste into Facebook groups.
                            </p>
                        </div>
                        <ul className="instant-custom-hero__tags" aria-label="What you'll get">
                            <li>Group-ready copy</li>
                            <li>Your link included</li>
                            <li>Varied tones</li>
                        </ul>
                    </header>

                    <ol className="instant-custom-steps">
                        <li className="instant-custom-step">
                            <span className="instant-custom-step__num" aria-hidden>
                                1
                            </span>
                            <div className="instant-custom-step__body">
                                <p className="instant-custom-step__label">Who is this for?</p>
                                <p className="instant-custom-step__hint">
                                    Choose the niche that best matches your offer.
                                </p>
                                <div className="instant-custom-niche-list">
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
                        </li>

                        <li className="instant-custom-step">
                            <span className="instant-custom-step__num" aria-hidden>
                                2
                            </span>
                            <div className="instant-custom-step__body">
                                <p className="instant-custom-step__label">Describe your ideal reader</p>
                                <Field
                                    as="textarea"
                                    placeholder="e.g. Busy parents who want a simple side income plan"
                                    value={idealCustomer}
                                    onChange={(e) => setIdealCustomer(e.target.value)}
                                    hint="Age, situation, goals — the more specific, the better."
                                />
                            </div>
                        </li>

                        <li className="instant-custom-step">
                            <span className="instant-custom-step__num" aria-hidden>
                                3
                            </span>
                            <div className="instant-custom-step__body">
                                <p className="instant-custom-step__label">What problem are they facing?</p>
                                <Field
                                    as="textarea"
                                    placeholder="e.g. They keep switching methods before anything has time to work"
                                    value={problemSolved}
                                    onChange={(e) => setProblemSolved(e.target.value)}
                                    hint="Write it the way they would say it in a Facebook group."
                                />
                            </div>
                        </li>

                        <li className="instant-custom-step">
                            <span className="instant-custom-step__num" aria-hidden>
                                4
                            </span>
                            <div className="instant-custom-step__body">
                                <p className="instant-custom-step__label">Your offer link</p>
                                <Field
                                    type="url"
                                    placeholder="https://your-offer-link.com"
                                    value={offerUrl}
                                    onChange={(e) => setOfferUrl(e.target.value)}
                                    hint="We analyze the page and weave your link naturally into each post."
                                />
                            </div>
                        </li>
                    </ol>

                    {error ? <InlineError message={error} /> : null}

                    <div className="instant-custom-generate">
                        <div className="instant-custom-generate__copy">
                            <Sparkles size={18} className="text-[var(--gold-text)]" aria-hidden />
                            <div>
                                <p className="instant-custom-generate__title">Ready to draft?</p>
                                <p className="instant-custom-generate__hint">
                                    {canGenerate
                                        ? "We'll write several Facebook posts tailored to your answers."
                                        : "Fill in all four steps above to continue."}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-primary instant-custom-generate__btn"
                            disabled={!canGenerate || generating}
                            onClick={() => void handleGenerate()}
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Writing posts…
                                </>
                            ) : (
                                <>
                                    <PenLine size={16} />
                                    Draft my posts
                                </>
                            )}
                        </button>
                        {generating ? (
                            <p className="instant-custom-generate__status">
                                Analyzing your offer and drafting group-ready posts — up to a minute.
                            </p>
                        ) : null}
                    </div>
                </>
            )}
        </PremiumLandingShell>
    );
}
