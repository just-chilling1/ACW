"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain, BarChart3, Shield, Zap, Search, ArrowRight, MessageSquare,
    Flame, TrendingDown, Loader2, ArrowUpDown, ChevronDown,
    ChevronUp, Info, CheckCircle2, RefreshCw
} from "lucide-react";
import { useSearch, AnalysisData } from "@/context/SearchContext";
import { clsx } from "clsx";
import { InfoHint } from "@/components/ui/InfoHint";
import { PageHeader } from "@/components/ui/page-header";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { Skeleton } from "@/components/ui/skeleton";

function LevelBadge({ level }: { level: string }) {
    const l = level?.toLowerCase() || "";
    const isHigh = l === "high" || l === "high activity";
    const isActive = l === "active";

    return (
        <div className={clsx(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider",
            isHigh ? "text-green-400 bg-green-500/10 border border-green-500/20" :
            isActive ? "text-accent bg-accent/10 border border-accent/20" :
            "text-text-muted bg-surface border border-border-dim"
        )}>
            {isHigh ? <Flame size={10} /> : isActive ? <Zap size={10} /> : <TrendingDown size={10} />}
            <span>{isHigh ? "High" : isActive ? "Active" : "Low"}</span>
        </div>
    );
}

function ConfidenceBar({ value }: { value: number }) {
    const color = value >= 80 ? "bg-green-500" : value >= 50 ? "bg-accent" : "bg-orange-400";
    return (
        <div className="flex items-center gap-2 w-full min-w-[100px]">
            <div className="flex-1 h-1.5 bg-page rounded-full overflow-hidden border border-border-dim/20">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full ${color} rounded-full`}
                />
            </div>
            <span className="text-[11px] font-bold text-text-primary tabular-nums w-8 text-right">{value}%</span>
        </div>
    );
}

type SortKey = "keyword" | "level" | "count" | "confidence" | "type";
type SortDir = "asc" | "desc";

function levelRank(level: string): number {
    const l = level?.toLowerCase() || "";
    if (l === "high" || l === "high activity") return 3;
    if (l === "active") return 2;
    return 1;
}

export default function AnalysisPage() {
    const {
        variations, activeChip, setActiveChip,
        analysisByVariation, setAnalysisByVariation,
        activityByVariation, setActivityByVariation,
        keyword
    } = useSearch();
    const [loadingChips, setLoadingChips] = useState<Set<string>>(new Set());
    const [sortKey, setSortKey] = useState<SortKey>("level");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [showGuide, setShowGuide] = useState(false);
    const [showOfferBanner, setShowOfferBanner] = useState(false);
    const router = useRouter();

    const analysisRef = useRef(analysisByVariation);
    const activityRef = useRef(activityByVariation);
    useEffect(() => { analysisRef.current = analysisByVariation; }, [analysisByVariation]);
    useEffect(() => { activityRef.current = activityByVariation; }, [activityByVariation]);

    const fetchAnalysis = useCallback(async (variation: string) => {
        if (analysisRef.current[variation]) return;
        setShowOfferBanner(true);
        setLoadingChips(prev => new Set(prev).add(variation));
        try {
            const resp = await fetch("/api/analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword: variation.trim() })
            });
            if (resp.ok) {
                const data: AnalysisData = await resp.json();
                setAnalysisByVariation({ ...analysisRef.current, [variation]: data });
                setActivityByVariation({ ...activityRef.current, [variation]: data.level });
            }
        } catch (e) {
            console.error("Analysis fetch failed:", e);
        } finally {
            setLoadingChips(prev => {
                const next = new Set(prev);
                next.delete(variation);
                return next;
            });
        }
    }, [setAnalysisByVariation, setActivityByVariation]);

    useEffect(() => {
        if (variations.length > 0) {
            variations.forEach((v, i) => {
                if (!analysisRef.current[v]) {
                    setTimeout(() => fetchAnalysis(v), i * 600);
                }
            });
        }
    }, [variations, fetchAnalysis]);

    const analyzedCount = variations.filter(v => analysisByVariation[v]).length;
    const allAnalyzed = analyzedCount === variations.length;

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    };

    const sortedVariations = [...variations].sort((a, b) => {
        const aData = analysisByVariation[a];
        const bData = analysisByVariation[b];
        if (!aData && !bData) return 0;
        if (!aData) return 1;
        if (!bData) return -1;

        let cmp = 0;
        switch (sortKey) {
            case "keyword": cmp = a.localeCompare(b); break;
            case "level": cmp = levelRank(aData.level) - levelRank(bData.level); break;
            case "count": cmp = (aData.count || 0) - (bData.count || 0); break;
            case "confidence": cmp = (aData.confidence ?? 0) - (bData.confidence ?? 0); break;
            case "type": cmp = (aData.type || "").localeCompare(bData.type || ""); break;
        }
        return sortDir === "desc" ? -cmp : cmp;
    });

    const SortHeader = ({ label, sKey, tooltip }: { label: string; sKey: SortKey; tooltip: string }) => (
        <button
            onClick={() => handleSort(sKey)}
            className="flex items-center gap-1.5 text-left group/sort"
        >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted group-hover/sort:text-text-primary transition-colors">
                {label}
            </span>
            <InfoHint text={tooltip} label={`What does ${label} mean?`} />
            {sortKey === sKey ? (
                sortDir === "desc" ? <ChevronDown size={10} className="text-accent" /> : <ChevronUp size={10} className="text-accent" />
            ) : (
                <ArrowUpDown size={10} className="text-text-muted/30 group-hover/sort:text-text-muted transition-colors" />
            )}
        </button>
    );

    if (variations.length === 0) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-14 h-14 rounded-xl bg-surface flex items-center justify-center border border-border-dim">
                    <Search size={24} className="text-text-muted" />
                </div>
                <div className="text-center flex flex-col gap-2">
                    <h2 className="text-xl font-bold text-text-primary">Start with Step 1</h2>
                    <p className="text-sm text-text-muted">Enter a topic first so we can check demand.</p>
                </div>
                <button onClick={() => router.push("/search")} className="btn-primary">
                    <Search size={16} />
                    <span>Go to Step 1</span>
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 max-w-6xl mx-auto w-full py-6"
        >
            <PageHeader
                eyebrow="STEP 2 OF 4"
                step={2}
                title="Check Demand"
                subtitle={`Topic: "${keyword}" · ${variations.length} keyword ideas found`}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowGuide(!showGuide)}
                            className="btn-secondary h-10 px-4 text-xs"
                        >
                            <Info size={13} strokeWidth={1.75} />
                            <span>{showGuide ? "Hide Guide" : "How to Read This"}</span>
                        </button>
                        <button
                            onClick={() => router.push("/radar")}
                            disabled={analyzedCount === 0}
                            className="btn-primary h-10 px-5 text-sm"
                        >
                            <span>Step 3: Find Ads</span>
                            <ArrowRight size={16} strokeWidth={1.75} />
                        </button>
                    </div>
                }
            />

            {(loadingChips.size > 0 || showOfferBanner) && (
                <GenerationProgress
                    active={loadingChips.size > 0}
                    showBanner={showOfferBanner}
                    label="Analyzing keyword demand..."
                    offer="earnings"
                />
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]">
                    <motion.div
                        animate={{ width: `${(analyzedCount / Math.max(variations.length, 1)) * 100}%` }}
                        className="h-full rounded-full"
                        style={{ background: "var(--grad-brand)" }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-text-muted">
                    {allAnalyzed ? (
                        <span className="flex items-center gap-1 text-[var(--success)]">
                            <CheckCircle2 size={12} strokeWidth={1.75} />
                            All analyzed
                        </span>
                    ) : (
                        `${analyzedCount}/${variations.length} analyzed`
                    )}
                </span>
            </div>

            {/* How-to-read guide */}
            <AnimatePresence>
                {showGuide && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="card-base grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={14} className="text-accent" />
                                    <span className="text-xs font-bold text-white">Demand Level</span>
                                </div>
                                <p className="text-[11px] text-text-muted leading-relaxed">
                                    <strong className="text-green-400">High</strong> = lots of people talking about this. Great for ads.
                                    <strong className="text-accent"> Active</strong> = decent amount of activity. Worth trying.
                                    <strong className="text-text-muted"> Low</strong> = not much activity. Try a different angle.
                                </p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={14} className="text-accent" />
                                    <span className="text-xs font-bold text-white">Ad Count</span>
                                </div>
                                <p className="text-[11px] text-text-muted leading-relaxed">
                                    How many ads and conversations we found on Reddit and YouTube. More ads = more places to post your reply and earn.
                                </p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <Shield size={14} className="text-accent" />
                                    <span className="text-xs font-bold text-white">Confidence</span>
                                </div>
                                <p className="text-[11px] text-text-muted leading-relaxed">
                                    How sure we are about the data. Higher = more reliable. Based on how much live data we collected from real platforms.
                                </p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <Info size={14} className="text-accent" />
                                    <span className="text-xs font-bold text-white">What to Do</span>
                                </div>
                                <p className="text-[11px] text-text-muted leading-relaxed">
                                    Click any row to select it. Then press <strong className="text-accent">&ldquo;Step 3: Find Ads&rdquo;</strong> to see real ads for that topic and create replies.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Data Table */}
            <div id="generation-results" className="-mx-4 scroll-mt-24 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[640px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[var(--elevation-1)]">
                {/* Table Header */}
                <div className="sticky top-0 grid grid-cols-12 gap-4 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 py-3">
                    <div className="col-span-4">
                        <SortHeader label="Keyword" sKey="keyword" tooltip="The ad topic variation we are analyzing. Click to sort alphabetically." />
                    </div>
                    <div className="col-span-2">
                        <SortHeader label="Demand" sKey="level" tooltip="How active this topic is on social media. High = trending with lots of posts. Low = quiet." />
                    </div>
                    <div className="col-span-1">
                        <SortHeader label="Ads" sKey="count" tooltip="Number of ads and conversations found on Reddit and YouTube for this keyword." />
                    </div>
                    <div className="col-span-2">
                        <SortHeader label="Confidence" sKey="confidence" tooltip="How reliable our data is. Higher confidence means more live data was used in the analysis." />
                    </div>
                    <div className="col-span-3">
                        <SortHeader label="What People Say" sKey="type" tooltip="The main type of conversation happening around this topic — questions, reviews, complaints, etc." />
                    </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-[var(--border-subtle)]">
                    {sortedVariations.map((v, i) => {
                        const data = analysisByVariation[v];
                        const isLoading = loadingChips.has(v);
                        const isSelected = activeChip === v;

                        return (
                            <motion.button
                                key={v}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => setActiveChip(v)}
                                className={clsx(
                                    "grid w-full grid-cols-12 gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[var(--surface-3)]",
                                    isSelected && "border-l-2 border-l-[var(--gold)] bg-[rgba(234,179,8,0.06)]"
                                )}
                            >
                                <div className="col-span-4 flex min-w-0 items-center gap-2">
                                    {isSelected && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />}
                                    <span className={clsx(
                                        "truncate text-sm font-medium",
                                        isSelected ? "text-[var(--gold)]" : "text-text-primary"
                                    )}>{v}</span>
                                </div>

                                <div className="col-span-2 flex items-center">
                                    {isLoading ? (
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    ) : data ? (
                                        <LevelBadge level={data.level} />
                                    ) : (
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    )}
                                </div>

                                <div className="col-span-1 flex items-center">
                                    {isLoading || !data ? (
                                        <Skeleton className="h-3 w-8" />
                                    ) : (
                                        <span className="text-sm font-semibold tabular-nums text-text-primary">{data.count}</span>
                                    )}
                                </div>

                                <div className="col-span-2 flex items-center">
                                    {isLoading || !data ? (
                                        <Skeleton className="h-2 w-full" />
                                    ) : (
                                        <ConfidenceBar value={data.confidence ?? 0} />
                                    )}
                                </div>

                                <div className="col-span-3 flex min-w-0 items-center">
                                    {isLoading || !data ? (
                                        <Skeleton className="h-3 w-20" />
                                    ) : (
                                        <span className="truncate text-[12px] text-text-secondary">{data.type || "Questions"}</span>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
            </div>

            {/* Selected detail panel */}
            {analysisByVariation[activeChip] && (
                <motion.div
                    key={activeChip}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-base flex flex-col gap-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Brain size={16} className="text-accent" />
                            <span className="text-sm font-bold text-white">Details for &ldquo;{activeChip}&rdquo;</span>
                        </div>
                        <button
                            onClick={() => {
                                const newAnalysis = { ...analysisByVariation };
                                delete newAnalysis[activeChip];
                                setAnalysisByVariation(newAnalysis);
                                fetchAnalysis(activeChip);
                            }}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted hover:text-accent transition-colors"
                        >
                            <RefreshCw size={11} />
                            <span>Re-analyze</span>
                        </button>
                    </div>
                    <p className="text-[13px] text-text-secondary leading-relaxed">
                        {analysisByVariation[activeChip].classification}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-text-muted pt-2 border-t border-border-dim/15">
                        <span>Sources: <strong className="text-text-primary">{analysisByVariation[activeChip].sources ?? 0}</strong></span>
                        <span>Live data: <strong className={analysisByVariation[activeChip].liveData ? "text-green-400" : "text-text-muted"}>{analysisByVariation[activeChip].liveData ? "Yes" : "No"}</strong></span>
                    </div>
                </motion.div>
            )}

            {/* Continue */}
            <div className="flex items-center justify-between pt-4">
                <button
                    onClick={() => router.push("/search")}
                    className="text-[11px] font-bold text-text-muted hover:text-accent transition-colors"
                >
                    ← Back to Step 1
                </button>
                <button
                    onClick={() => router.push("/radar")}
                    disabled={analyzedCount === 0}
                    className="btn-primary h-11 px-6 text-sm rounded-lg group"
                >
                    <span>Go to Step 3: Find Ads</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
}
