"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { ReplyCard, type ReplyCardData } from "@/components/dfy/reply-card";
import {
    PremiumLandingShell,
    PremiumHero,
} from "@/components/premium";
import { Field } from "@/components/ui/field";
import { InlineError } from "@/components/ui/inlineError";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { clsx } from "clsx";

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
        <PremiumLandingShell className="dfy-theme" width="narrow">
            <Link
                href="/dfy"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
                <ArrowLeft size={14} />
                Back to DFY Replies
            </Link>

            <PremiumHero
                eyebrow="CUSTOM REPLY"
                title="Create a custom reply"
                subtitle="Answer a few questions. We'll analyze your offer, find real posts, and write humanized replies."
            />

            {replies ? (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-text-secondary">
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
                <div className="dfy-wizard-panel p-5 sm:p-6">
                    <div className="mb-5 flex flex-wrap gap-2">
                        {([1, 2, 3, 4] as Step[]).map((s) => (
                            <span
                                key={s}
                                className={clsx(
                                    "dfy-step-pill",
                                    s === step && "is-active",
                                    s < step && "is-done",
                                )}
                            >
                                {s}. {STEP_LABELS[s]}
                            </span>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-3">
                            <p className="text-sm text-text-secondary">
                                What niche are you promoting in?
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

                    {error ? (
                        <div className="mt-4">
                            <InlineError message={error} />
                        </div>
                    ) : null}

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            className="btn-secondary w-full sm:w-auto"
                            disabled={step === 1 || generating}
                            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
                        >
                            <ArrowLeft size={14} />
                            Back
                        </button>

                        {step < 4 ? (
                            <button
                                type="button"
                                className="btn-primary w-full sm:w-auto"
                                disabled={!canNext}
                                onClick={() => setStep((s) => ((s + 1) as Step))}
                            >
                                Next
                                <ArrowRight size={14} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn-primary w-full sm:w-auto sm:min-w-[12rem]"
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
                            Analyzing your offer, searching for real threads, and humanizing
                            replies. This can take up to a minute.
                        </p>
                    ) : null}
                </div>
            )}
        </PremiumLandingShell>
    );
}
