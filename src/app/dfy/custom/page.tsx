"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { ReplyCard, type ReplyCardData } from "@/components/dfy/reply-card";
import { PremiumLandingShell } from "@/components/premium";
import { Field } from "@/components/ui/field";
import { InlineError } from "@/components/ui/InlineError";
import { SelectableChip } from "@/components/ui/selectable-chip";

type GeneratedReply = {
    platform: string;
    url: string;
    title: string;
    context: string;
    body: string;
    style: string;
};

export default function DfyCustomReplyPage() {
    const [niche, setNiche] = useState<NicheId>("make_money_online");
    const [idealCustomer, setIdealCustomer] = useState("");
    const [problemSolved, setProblemSolved] = useState("");
    const [offerUrl, setOfferUrl] = useState("");
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [replies, setReplies] = useState<GeneratedReply[] | null>(null);

    const canGenerate =
        !!niche &&
        idealCustomer.trim().length >= 8 &&
        problemSolved.trim().length >= 8 &&
        offerUrl.trim().length >= 8;

    const handleGenerate = async () => {
        if (!canGenerate) return;
        setError("");
        setGenerating(true);
        setReplies(null);
        try {
            const res = await fetch("/api/dfy/replies/generate", {
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
            if (!res.ok) throw new Error(data.error || "Could not generate replies.");
            setReplies(data.replies || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not generate replies.");
        } finally {
            setGenerating(false);
        }
    };

    const cards: ReplyCardData[] = (replies || []).map((r, i) => ({
        id: `${r.url}-${i}`,
        title: r.title,
        context: r.context,
        platform: r.platform,
        url: r.url,
        body: r.body,
        style: r.style,
    }));

    return (
        <PremiumLandingShell className="dfy-theme" width="narrow">
            <Link href="/dfy" className="btn-secondary w-fit gap-1.5 text-sm">
                <ArrowLeft size={14} />
                Back to DFY Replies
            </Link>

            {replies ? (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-text-secondary">
                            {cards.length} replies ready — copy, open the post, and paste.
                        </p>
                        <button
                            type="button"
                            className="btn-secondary text-sm"
                            onClick={() => setReplies(null)}
                        >
                            Start over
                        </button>
                    </div>
                    {cards.map((card) => (
                        <ReplyCard key={card.id} reply={card} />
                    ))}
                </div>
            ) : (
                <div className="dfy-wizard-panel space-y-6 p-5 sm:p-7">
                    <header className="space-y-2">
                        <h1 className="ds-h1">Create a custom reply</h1>
                        <p className="ds-subtitle max-w-xl">
                            Answer 4 short questions. We write the replies.
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
                            placeholder="e.g. Busy parents who want to lose weight without strict diets"
                            value={idealCustomer}
                            onChange={(e) => setIdealCustomer(e.target.value)}
                            hint="Be specific — age, situation, goals."
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="dfy-question-label">3. What problem do they have?</p>
                        <Field
                            as="textarea"
                            placeholder="e.g. They keep quitting diets because of late-night cravings"
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
                            hint="We'll analyze the page and weave the link into each reply."
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
                                    Finding posts & writing replies…
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Generate replies
                                </>
                            )}
                        </button>
                        {generating ? (
                            <p className="text-xs text-text-muted">
                                Analyzing your offer, searching for real threads, and
                                humanizing replies. This can take up to a minute.
                            </p>
                        ) : null}
                    </div>
                </div>
            )}
        </PremiumLandingShell>
    );
}
