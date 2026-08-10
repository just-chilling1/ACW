"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { InlineError } from "@/components/ui/InlineError";
import { BuildSequence } from "@/components/dfy/build-sequence";
import { AUDIENCE_OPTIONS, type AudienceMode, type ChannelMode, type OfferSnapshot } from "@/lib/dfy/types";
import { clsx } from "clsx";

function NewCampaignContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [offerUrl, setOfferUrl] = useState(searchParams.get("url") || "");
    const [audienceMode, setAudienceMode] = useState<AudienceMode>("make_money");
    const channels: ChannelMode[] = ["everywhere"];
    const [snapshot, setSnapshot] = useState<OfferSnapshot | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [building, setBuilding] = useState(false);
    const [buildProgress, setBuildProgress] = useState<{ completedStages: string[]; currentStage?: string }>({ completedStages: [] });
    const [error, setError] = useState("");
    const [step, setStep] = useState<"setup" | "understand" | "building">("setup");

    const [savedOffers, setSavedOffers] = useState<Array<{ id: string; url: string; name: string; snapshot: OfferSnapshot }>>([]);

    useEffect(() => {
        const url = searchParams.get("url");
        if (url) setOfferUrl(url);
        fetch("/api/dfy/offers")
            .then((r) => r.json())
            .then((d) => {
                const offers = d.offers || [];
                const seen = new Set<string>();
                const unique = offers.filter((offer: { url: string }) => {
                    if (seen.has(offer.url)) return false;
                    seen.add(offer.url);
                    return true;
                });
                setSavedOffers(unique);
            })
            .catch(() => setSavedOffers([]));
    }, [searchParams]);

    const handleAnalyze = async () => {
        if (!offerUrl.trim()) {
            setError("Please paste your product or affiliate link.");
            return;
        }
        setError("");
        setAnalyzing(true);
        try {
            const res = await fetch("/api/dfy/analyze-offer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: offerUrl.trim(), audienceMode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Analysis failed");
            setSnapshot(data.snapshot);
            if (data.snapshot.recommendedAudienceMode && data.snapshot.recommendedAudienceMode !== "auto") {
                setAudienceMode(data.snapshot.recommendedAudienceMode);
            }
            setStep("understand");
        } catch (e) {
            setError(e instanceof Error ? e.message : "We couldn't analyze that page right now.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleBuild = async () => {
        if (!offerUrl.trim()) return;
        setError("");
        setBuilding(true);
        setStep("building");

        try {
            let currentSnapshot = snapshot;
            if (!currentSnapshot) {
                const analyzeRes = await fetch("/api/dfy/analyze-offer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: offerUrl.trim(), audienceMode }),
                });
                const analyzeData = await analyzeRes.json();
                if (!analyzeRes.ok) throw new Error(analyzeData.error);
                currentSnapshot = analyzeData.snapshot;
            }

            const createRes = await fetch("/api/dfy/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    offerUrl: offerUrl.trim(),
                    name: currentSnapshot?.productName,
                    audienceMode,
                    channels,
                    offerSnapshot: currentSnapshot,
                }),
            });
            const createData = await createRes.json();
            if (!createRes.ok) throw new Error(createData.error);

            if (currentSnapshot) {
                await fetch("/api/dfy/offers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        url: offerUrl.trim(),
                        name: currentSnapshot.productName,
                        snapshot: currentSnapshot,
                    }),
                }).catch(() => undefined);
            }

            const campaignId = createData.campaign.id;

            const poll = window.setInterval(async () => {
                try {
                    const progRes = await fetch(`/api/dfy/campaigns/${campaignId}/build`);
                    const progData = await progRes.json();
                    if (progData.progress) setBuildProgress(progData.progress);
                } catch {
                    /* ignore polling errors */
                }
            }, 2000);

            try {
                const buildRes = await fetch(`/api/dfy/campaigns/${campaignId}/build`, { method: "POST" });
                const buildData = await buildRes.json();
                if (!buildRes.ok) throw new Error(buildData.error);
                router.push(`/dfy/campaigns/${campaignId}`);
            } finally {
                window.clearInterval(poll);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Build failed. Please try again.");
            setStep("understand");
        } finally {
            setBuilding(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
            <Link href="/dfy" className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
                <ArrowLeft size={16} />
                Back
            </Link>

            <PageHeader
                eyebrow="Campaign Setup"
                title="Build My Campaign"
                subtitle="Paste your offer. Cashwave handles the rest."
            />

            {error ? <InlineError message={error} className="mb-4" /> : null}

            {step === "setup" && (
                <div className="flex flex-col gap-6">
                    <Field
                        label="What are you promoting?"
                        hint="Cashwave will automatically analyze the offer for you."
                        value={offerUrl}
                        onChange={(e) => setOfferUrl(e.target.value)}
                        placeholder="Paste your product or affiliate link"
                    />

                    {savedOffers.length > 0 ? (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Or choose a saved offer</p>
                            <div className="flex flex-wrap gap-2">
                                {savedOffers.map((offer) => (
                                    <button
                                        key={offer.id}
                                        type="button"
                                        onClick={() => {
                                            setOfferUrl(offer.url);
                                            setSnapshot(offer.snapshot);
                                        }}
                                        className="btn-chip"
                                    >
                                        {offer.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <section>
                        <h3 className="mb-3 text-sm font-semibold text-text-primary">Who should we target?</h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {AUDIENCE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setAudienceMode(opt.id)}
                                    className={clsx(
                                        "rounded-[var(--radius-md)] border p-3 text-left transition",
                                        audienceMode === opt.id
                                            ? "border-[var(--gold)] bg-[var(--surface-2)]"
                                            : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]",
                                    )}
                                >
                                    <p className="text-sm font-semibold text-text-primary">
                                        {opt.label}
                                        {opt.recommended ? " (Recommended)" : ""}
                                    </p>
                                    <p className="mt-1 text-xs text-text-muted">{opt.description}</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    <button type="button" onClick={handleAnalyze} disabled={analyzing} className="btn-primary w-full sm:w-auto">
                        {analyzing ? "Analyzing…" : "Continue"}
                    </button>
                </div>
            )}

            {step === "understand" && snapshot && (
                <div className="flex flex-col gap-6">
                    <section className="card-base p-5 sm:p-6">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">We understand your offer</h3>
                        <dl className="space-y-3 text-sm">
                            <div><dt className="text-text-muted">Product</dt><dd className="font-semibold text-text-primary">{snapshot.productName}</dd></div>
                            <div><dt className="text-text-muted">Best audience</dt><dd className="text-text-secondary">{snapshot.targetAudience}</dd></div>
                            <div><dt className="text-text-muted">Strongest angle</dt><dd className="text-text-secondary">{snapshot.strongestAngle}</dd></div>
                            <div><dt className="text-text-muted">Recommended promotion style</dt><dd className="text-text-secondary">{snapshot.promotionStyle || snapshot.ctaStyle}</dd></div>
                        </dl>
                    </section>

                    <p className="text-sm text-text-muted">Cashwave will handle the research, strategy, content, and campaign planning for you.</p>

                    <button type="button" onClick={handleBuild} disabled={building} className="btn-primary w-full sm:w-auto">
                        <Sparkles size={18} />
                        Build My Campaign
                    </button>
                </div>
            )}

            {step === "building" && (
                <BuildSequence
                    active={building}
                    progress={{ completedStages: buildProgress.completedStages as never[], currentStage: buildProgress.currentStage as never }}
                />
            )}
        </div>
    );
}

export default function NewCampaignPage() {
    return (
        <Suspense fallback={<div className="p-8 text-text-muted">Loading…</div>}>
            <NewCampaignContent />
        </Suspense>
    );
}
