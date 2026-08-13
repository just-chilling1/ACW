"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { InlineError } from "@/components/ui/InlineError";
import { ReplyCard, type ReplyCardData } from "@/components/dfy/reply-card";

type Step = 1 | 2 | 3 | 4;

type GeneratedReply = {
    platform: string;
    url: string;
    title: string;
    context: string;
    body: string;
    style: string;
};

const STEP_LABELS: Record<Step, string> = {
    1: "Your niche",
    2: "Ideal customer",
    3: "Problem solved",
    4: "Offer link",
};

export default function DfyCustomReplyPage() {
    const [step, setStep] = useState<Step>(1);
    const [niche, setNiche] = useState<NicheId>("make_money_online");
    const [idealCustomer, setIdealCustomer] = useState("");
    const [problemSolved, setProblemSolved] = useState("");
    const [offerUrl, setOfferUrl] = useState("");
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [replies, setReplies] = useState<GeneratedReply[] | null>(null);

    const canNext =
        (step === 1 && !!niche) ||
        (step === 2 && idealCustomer.trim().length >= 8) ||
        (step === 3 && problemSolved.trim().length >= 8) ||
        (step === 4 && offerUrl.trim().length >= 8);

    const handleGenerate = async () => {
        if (!canNext) return;
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
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <Link
                href="/dfy"
                className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
            >
                <ArrowLeft size={14} />
                Back to DFY Replies
            </Link>

            <PageHeader
                title="Create a custom reply"
                subtitle="Answer a few questions. We'll analyze your offer, find real posts, and write humanized replies."
            />

            {replies ? (
                <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-text-muted">
                            {cards.length} replies ready — copy, open the post, and paste.
                        </p>
                        <button
                            type="button"
                            className="btn-secondary text-xs"
                            onClick={() => {
                                setReplies(null);
                                setStep(1);
                            }}
                        >
                            Start over
                        </button>
                    </div>
                    {cards.map((card) => (
                        <ReplyCard key={card.id} reply={card} />
                    ))}
                </div>
            ) : (
                <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-6">
                    <div className="mb-5 flex flex-wrap gap-2">
                        {([1, 2, 3, 4] as Step[]).map((s) => (
                            <span
                                key={s}
                                className={
                                    s === step
                                        ? "rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent"
                                        : s < step
                                          ? "rounded-full bg-bg px-3 py-1 text-xs font-medium text-text"
                                          : "rounded-full bg-bg px-3 py-1 text-xs text-text-muted"
                                }
                            >
                                {s}. {STEP_LABELS[s]}
                            </span>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-3">
                            <p className="text-sm text-text-muted">What niche are you promoting in?</p>
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
                        </div>
                    )}

                    {step === 2 && (
                        <Field
                            as="textarea"
                            label="Who is your ideal customer?"
                            placeholder="e.g. Busy parents who want to lose weight without strict diets"
                            value={idealCustomer}
                            onChange={(e) => setIdealCustomer(e.target.value)}
                            hint="Be specific — age, situation, goals."
                        />
                    )}

                    {step === 3 && (
                        <Field
                            as="textarea"
                            label="What problem do they need solved?"
                            placeholder="e.g. They keep quitting diets because of late-night cravings"
                            value={problemSolved}
                            onChange={(e) => setProblemSolved(e.target.value)}
                            hint="Describe the pain in their words."
                        />
                    )}

                    {step === 4 && (
                        <Field
                            label="Offer / affiliate URL"
                            type="url"
                            placeholder="https://your-offer-link.com"
                            value={offerUrl}
                            onChange={(e) => setOfferUrl(e.target.value)}
                            hint="We'll analyze the page and weave the link into each reply."
                        />
                    )}

                    {error ? <div className="mt-4"><InlineError message={error} /></div> : null}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <button
                            type="button"
                            className="btn-secondary"
                            disabled={step === 1 || generating}
                            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
                        >
                            <ArrowLeft size={14} />
                            Back
                        </button>

                        {step < 4 ? (
                            <button
                                type="button"
                                className="btn-primary"
                                disabled={!canNext}
                                onClick={() => setStep((s) => ((s + 1) as Step))}
                            >
                                Next
                                <ArrowRight size={14} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn-primary"
                                disabled={!canNext || generating}
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
                        )}
                    </div>

                    {generating ? (
                        <p className="mt-4 text-xs text-text-muted">
                            Analyzing your offer, searching for real threads, and humanizing replies. This can take up to a minute.
                        </p>
                    ) : null}
                </div>
            )}
        </div>
    );
}
