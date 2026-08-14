"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
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
        <PremiumLandingShell className="dfy-theme instant-theme" width="narrow">
            <Link href="/instant" className="btn-secondary w-fit gap-1.5 text-sm">
                <ArrowLeft size={14} />
                Back to Instant Income
            </Link>

            {posts ? (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-text-secondary">
                            {cards.length} Facebook posts ready — copy and paste into groups.
                        </p>
                        <button
                            type="button"
                            className="btn-secondary text-sm"
                            onClick={() => setPosts(null)}
                        >
                            Start over
                        </button>
                    </div>
                    {cards.map((card) => (
                        <InstantPostCard key={card.id} post={card} />
                    ))}
                </div>
            ) : (
                <div className="dfy-wizard-panel space-y-6 p-5 sm:p-7">
                    <header className="space-y-2">
                        <h1 className="ds-h1">Create a custom post</h1>
                        <p className="ds-subtitle max-w-xl">
                            Answer 4 short questions. We write Facebook group posts for your offer.
                        </p>
                    </header>

                    <div className="space-y-2">
                        <p className="dfy-question-label">1. Pick your niche</p>
                        <div className="dfy-niche-grid">
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

                    <div className="space-y-2">
                        <p className="dfy-question-label">2. Who are you helping?</p>
                        <Field
                            as="textarea"
                            placeholder="e.g. Busy parents who want a simple side income plan"
                            value={idealCustomer}
                            onChange={(e) => setIdealCustomer(e.target.value)}
                            hint="Be specific — age, situation, goals."
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="dfy-question-label">3. What problem do they have?</p>
                        <Field
                            as="textarea"
                            placeholder="e.g. They keep switching methods before anything has time to work"
                            value={problemSolved}
                            onChange={(e) => setProblemSolved(e.target.value)}
                            hint="Describe the pain in their words."
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="dfy-question-label">4. Paste your offer link</p>
                        <Field
                            type="url"
                            placeholder="https://your-offer-link.com"
                            value={offerUrl}
                            onChange={(e) => setOfferUrl(e.target.value)}
                            hint="We'll analyze the page and weave the link into each post."
                        />
                    </div>

                    {error ? <InlineError message={error} /> : null}

                    <div className="space-y-3 pt-1">
                        <button
                            type="button"
                            className="btn-primary w-full"
                            disabled={!canGenerate || generating}
                            onClick={() => void handleGenerate()}
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Writing Facebook posts…
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Generate posts
                                </>
                            )}
                        </button>
                        {generating ? (
                            <p className="text-xs text-text-muted">
                                Analyzing your offer and drafting group-ready posts. This can take
                                up to a minute.
                            </p>
                        ) : null}
                    </div>
                </div>
            )}
        </PremiumLandingShell>
    );
}
