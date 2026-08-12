"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { InlineError } from "@/components/ui/InlineError";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { KitBuildSequence } from "@/components/instant/kit-build-sequence";
import type { AudienceMode, OfferSnapshot } from "@/lib/dfy/types";
import type { KitBuildProgress } from "@/lib/instant/types";
import { APP_NICHES, detectNicheFromText } from "@/lib/niches";
import { dedupeOffersByUrl } from "@/lib/dfy/offer-url";

type Step = 1 | 2 | 3;

function BuildContent() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [offerUrl, setOfferUrl] = useState("");
    const [manualDescription, setManualDescription] = useState("");
    const [needsManual, setNeedsManual] = useState(false);
    const [snapshot, setSnapshot] = useState<OfferSnapshot | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [building, setBuilding] = useState(false);
    const [buildProgress, setBuildProgress] = useState<KitBuildProgress>({ completedStages: [] });
    const [error, setError] = useState("");
    const [savedOffers, setSavedOffers] = useState<Array<{ id: string; url: string; name: string; snapshot: OfferSnapshot }>>([]);
    const [showEdit, setShowEdit] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPromise, setEditPromise] = useState("");
    const [editAudience, setEditAudience] = useState("");
    const [audienceMode, setAudienceMode] = useState<AudienceMode>("auto");

    useEffect(() => {
        fetch("/api/dfy/offers")
            .then((r) => r.json())
            .then((d) => setSavedOffers(dedupeOffersByUrl(d.offers || [])))
            .catch(() => setSavedOffers([]));
    }, []);

    useEffect(() => {
        if (!snapshot || step !== 2) return;
        if (snapshot.recommendedAudienceMode && snapshot.recommendedAudienceMode !== "auto") {
            setAudienceMode(snapshot.recommendedAudienceMode);
            return;
        }
        const text = `${snapshot.productName} ${snapshot.mainPromise} ${snapshot.category} ${snapshot.targetAudience}`;
        setAudienceMode(detectNicheFromText(text));
    }, [snapshot, step]);

    const handleAnalyze = async () => {
        if (!offerUrl.trim() && !manualDescription.trim()) {
            setError("Paste your offer link or tell us what you're promoting.");
            return;
        }
        setError("");
        setAnalyzing(true);
        try {
            const res = await fetch("/api/instant/analyze-offer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: offerUrl.trim(),
                    manualDescription: manualDescription.trim(),
                    // Analyze the link first; niche chips are chosen after analysis.
                    audienceMode: "auto",
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.needsManual) {
                    setNeedsManual(true);
                    setError("Tell us what you're promoting and we'll prepare your kit.");
                } else {
                    setError(data.error || "Could not analyze offer.");
                }
                return;
            }
            setSnapshot(data.snapshot);
            setEditName(data.snapshot.productName);
            setEditPromise(data.snapshot.mainPromise);
            setEditAudience(data.snapshot.targetAudience);
            if (data.snapshot.recommendedAudienceMode && data.snapshot.recommendedAudienceMode !== "auto") {
                setAudienceMode(data.snapshot.recommendedAudienceMode);
            }
            setStep(2);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleBuild = async () => {
        if (!snapshot) return;
        setError("");
        setBuilding(true);
        setStep(3);

        const finalSnapshot: OfferSnapshot = {
            ...snapshot,
            recommendedAudienceMode: audienceMode,
        };

        try {
            const createRes = await fetch("/api/instant/kits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    offerUrl: offerUrl.trim(),
                    offerSnapshot: finalSnapshot,
                    name: finalSnapshot.productName,
                }),
            });
            const createData = await createRes.json();
            if (!createRes.ok) {
                setError(createData.error || "Could not create kit.");
                setStep(2);
                return;
            }

            const id = createData.kit.id;

            const poll = window.setInterval(async () => {
                try {
                    const progRes = await fetch(`/api/instant/kits/${id}/build`);
                    const progData = await progRes.json();
                    if (progData.progress) setBuildProgress(progData.progress);
                } catch {
                    /* ignore polling errors */
                }
            }, 2000);

            try {
                const buildRes = await fetch(`/api/instant/kits/${id}/build`, { method: "POST" });
                const buildData = await buildRes.json();
                if (!buildRes.ok) throw new Error(buildData.error);

                router.replace(`/instant/kit/${id}`);
                return;
            } finally {
                window.clearInterval(poll);
                setBuilding(false);
            }
        } catch {
            setError("Something went wrong. Please try again.");
            setStep(2);
            setBuilding(false);
        }
    };

    const handleEditSave = () => {
        if (!snapshot) return;
        setSnapshot({
            ...snapshot,
            productName: editName || snapshot.productName,
            mainPromise: editPromise || snapshot.mainPromise,
            targetAudience: editAudience || snapshot.targetAudience,
        });
        setShowEdit(false);
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6 pb-12">
            <PageHeader
                eyebrow="PREMIUM"
                title="Create Promotion Kit"
                subtitle="Paste your offer link and get ready-to-use promotions in moments."
            />

            {error ? <InlineError message={error} /> : null}

            {step === 1 ? (
                <div className="surface-panel-elevated space-y-5 p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-text-primary">Give Cashwave Your Offer</h2>
                    <p className="text-sm text-text-muted">
                        Paste your affiliate or product link. We&apos;ll analyze it and prepare your promotion kit.
                    </p>

                    {savedOffers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {savedOffers.slice(0, 5).map((o) => (
                                <SelectableChip
                                    key={o.id}
                                    label={o.name}
                                    selected={offerUrl === o.url}
                                    onClick={() => {
                                        setOfferUrl(o.url);
                                        setSnapshot(o.snapshot);
                                    }}
                                />
                            ))}
                        </div>
                    ) : null}

                    <Field
                        label="Your offer link"
                        value={offerUrl}
                        onChange={(e) => setOfferUrl(e.target.value)}
                        placeholder="https://your-affiliate-link.com/..."
                    />

                    {needsManual ? (
                        <Field
                            as="textarea"
                            label="Tell us what you're promoting"
                            value={manualDescription}
                            onChange={(e) => setManualDescription(e.target.value)}
                            placeholder="Describe your product or offer..."
                        />
                    ) : null}

                    <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="btn-primary w-full"
                    >
                        {analyzing ? "Analyzing…" : "Continue"}
                        {!analyzing ? <ArrowRight size={16} /> : null}
                    </button>
                </div>
            ) : null}

            {step === 2 && snapshot ? (
                <div className="space-y-5">
                    <div className="surface-panel-elevated space-y-4 p-5 sm:p-6">
                        <h2 className="text-lg font-semibold text-text-primary">We found your offer</h2>

                        {!showEdit ? (
                            <>
                                <div>
                                    <p className="text-xl font-semibold text-text-primary">{snapshot.productName}</p>
                                    <p className="mt-2 text-sm text-text-muted">{snapshot.mainPromise}</p>
                                    <p className="mt-3 text-sm">
                                        <span className="text-text-muted">Best audience: </span>
                                        {snapshot.targetAudience}
                                    </p>
                                    <p className="mt-1 text-sm">
                                        <span className="text-text-muted">Best angle: </span>
                                        {snapshot.strongestAngle}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowEdit(true)}
                                    className="btn-ghost text-sm"
                                >
                                    <Pencil size={14} />
                                    Edit Offer Details
                                </button>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <Field label="Product name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                <Field as="textarea" label="Main benefit" value={editPromise} onChange={(e) => setEditPromise(e.target.value)} />
                                <Field label="Target audience" value={editAudience} onChange={(e) => setEditAudience(e.target.value)} />
                                <button type="button" onClick={handleEditSave} className="btn-secondary">Save Changes</button>
                            </div>
                        )}
                    </div>

                    <div className="surface-panel-elevated space-y-4 p-5 sm:p-6">
                        <p className="text-sm text-text-muted">What is this offer mainly about?</p>
                        <div className="flex flex-wrap gap-2">
                            {APP_NICHES.map((n) => (
                                <SelectableChip
                                    key={n.id}
                                    label={n.label}
                                    selected={audienceMode === n.id}
                                    onClick={() => setAudienceMode(n.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={handleBuild}
                            disabled={building}
                            className="btn-primary w-full py-3 text-base"
                        >
                            <Sparkles size={18} />
                            Create My Promotion Kit
                        </button>
                        <p className="text-center text-xs text-text-muted">
                            We write posts, replies, and hooks together so your kit is ready faster.
                        </p>
                        <button type="button" onClick={() => setStep(1)} className="btn-ghost w-full text-sm">
                            <ArrowLeft size={14} />
                            Back
                        </button>
                    </div>
                </div>
            ) : null}

            {step === 3 ? (
                <KitBuildSequence progress={buildProgress} active={building} />
            ) : null}

            <Link href="/instant" className="btn-ghost inline-flex text-sm">
                <ArrowLeft size={14} />
                Back to Instant Income
            </Link>
        </div>
    );
}

export default function InstantBuildPage() {
    return (
        <Suspense fallback={<div className="p-6 text-text-muted">Loading…</div>}>
            <BuildContent />
        </Suspense>
    );
}
