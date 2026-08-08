"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp, ExternalLink, CheckCircle2, Sparkles, Flame, Target,
} from "lucide-react";
import { clsx } from "clsx";
import { PremiumPageLayout } from "@/components/premium/PremiumPageLayout";
import { MemberProfileSetup } from "@/components/premium/MemberProfileSetup";
import { CopyButton } from "@/components/premium/CopyButton";
import { useMemberProfile } from "@/hooks/use-member-profile";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { SkeletonCards } from "@/components/ui/skeleton";
import { AUTOPILOT_NICHES, TRAFFIC_SOURCES, type TrafficSource } from "@/lib/content/traffic-sources";

type ProgressRow = {
    source_id: string;
    completed_at: string | null;
    submission_copy: string | null;
};

type PlanStats = {
    completed: number;
    total: number;
    estimatedTraffic: number;
    streak: number;
};

export default function AutopilotPage() {
    const { profile, loading, saving, error, saveProfile, isSetupComplete } = useMemberProfile();
    const [selectedNiche, setSelectedNiche] = useState("All");
    const [todaySources, setTodaySources] = useState<TrafficSource[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, ProgressRow>>({});
    const [stats, setStats] = useState<PlanStats>({ completed: 0, total: 0, estimatedTraffic: 0, streak: 0 });
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [copyCache, setCopyCache] = useState<Record<string, string>>({});

    const loadPlan = useCallback(async (niche: string) => {
        setLoadingPlan(true);
        setShowBanner(true);
        try {
            const params = niche !== "All" ? `?niche=${encodeURIComponent(niche)}` : "";
            const resp = await fetch(`/api/premium/plan${params}`);
            const data = await resp.json();
            setTodaySources(data.todaySources ?? []);
            setProgressMap(data.progressMap ?? {});
            setStats(data.stats ?? { completed: 0, total: 0, estimatedTraffic: 0, streak: 0 });

            const copies: Record<string, string> = {};
            Object.entries(data.progressMap ?? {}).forEach(([id, row]) => {
                const r = row as ProgressRow;
                if (r.submission_copy) copies[id] = r.submission_copy;
            });
            setCopyCache(copies);
        } finally {
            setLoadingPlan(false);
        }
    }, []);

    useEffect(() => {
        if (isSetupComplete) loadPlan(selectedNiche);
    }, [isSetupComplete, selectedNiche, loadPlan]);

    const handleGenerateCopy = async (sourceId: string) => {
        setGeneratingId(sourceId);
        try {
            const resp = await fetch("/api/premium/submission-copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sourceId }),
            });
            const data = await resp.json();
            if (resp.ok && data.copy) {
                setCopyCache((prev) => ({ ...prev, [sourceId]: data.copy }));
                setExpandedId(sourceId);
            }
        } finally {
            setGeneratingId(null);
        }
    };

    const handleToggleComplete = async (sourceId: string, completed: boolean) => {
        await fetch("/api/premium/submission-copy", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceId, completed }),
        });
        loadPlan(selectedNiche);
    };

    return (
        <PremiumPageLayout
            title={
                <>
                    Automated Income — <span className="text-gradient">Traffic On Autopilot</span>
                </>
            }
            subtitle="Your 3 sources for today — AI writes the submission copy. Copy, open the site, paste, done."
            videoId="1214661265"
            videoTitle="How to Use Automated Profits"
            videoDescription="We pick today's sources and write everything for you. Two buttons per source: Copy Everything, then Open Site."
            trustBullets={["3 Sources Daily", "AI-Written Copy", "Track Progress", "Free Traffic"]}
        >
            {loading ? (
                <SkeletonCards count={2} />
            ) : !isSetupComplete ? (
                <MemberProfileSetup
                    onComplete={saveProfile}
                    saving={saving}
                    error={error}
                    initial={{
                        affiliateLink: profile?.affiliate_link,
                        niche: profile?.niche,
                        writingStyle: profile?.writing_style,
                    }}
                />
            ) : (
                <>
                    {(loadingPlan || showBanner) && todaySources.length === 0 && (
                        <GenerationProgress
                            active={loadingPlan}
                            showBanner={showBanner}
                            label="Loading your daily traffic plan..."
                            offer="welcome"
                        />
                    )}

                    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "Completed", value: stats.completed, icon: CheckCircle2 },
                            { label: "Remaining", value: Math.max(0, stats.total - stats.completed), icon: Target },
                            { label: "Est. Traffic", value: `${stats.estimatedTraffic}+/mo`, icon: TrendingUp },
                            { label: "Day Streak", value: stats.streak, icon: Flame },
                        ].map((stat) => (
                            <div key={stat.label} className="card-base p-4! text-center">
                                <stat.icon size={16} className="mx-auto mb-2 text-[var(--gold)]" />
                                <p className="text-[20px] font-bold text-text-primary tabular-nums">{stat.value}</p>
                                <p className="text-[11px] uppercase tracking-wider text-text-muted">{stat.label}</p>
                            </div>
                        ))}
                    </section>

                    <section className="card-base flex flex-col gap-4 p-5!">
                        <span className="ds-label">Filter by niche (optional)</span>
                        <div className="flex flex-wrap gap-2">
                            {AUTOPILOT_NICHES.map((niche) => (
                                <SelectableChip
                                    key={niche}
                                    label={niche}
                                    selected={selectedNiche === niche}
                                    onClick={() => setSelectedNiche(niche)}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={18} className="text-[var(--gold)]" />
                            <h2 className="ds-h2">Your 3 Sources for Today</h2>
                        </div>

                        {todaySources.length === 0 && !loadingPlan && (
                            <div className="card-base p-8 text-center">
                                <p className="text-text-secondary">All sources completed for this niche! Try another niche or check back tomorrow.</p>
                            </div>
                        )}

                        {todaySources.map((source, idx) => {
                            const isCompleted = Boolean(progressMap[source.id]?.completed_at);
                            const copy = copyCache[source.id];
                            const isExpanded = expandedId === source.id;

                            return (
                                <motion.div
                                    key={source.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                    className={clsx(
                                        "card-base flex flex-col gap-4 p-5!",
                                        isCompleted && "opacity-75"
                                    )}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-wrap gap-2">
                                                <span className="badge-info text-[10px]">{source.type}</span>
                                                <span className={clsx(
                                                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-[var(--radius-sm)]",
                                                    source.difficulty === "Easy" ? "badge-success" : "badge-warning"
                                                )}>
                                                    {source.difficulty}
                                                </span>
                                                {isCompleted && (
                                                    <span className="badge-success text-[10px]">
                                                        <CheckCircle2 size={10} className="inline mr-1" />
                                                        Done
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="ds-h4">{source.name}</h3>
                                            <p className="text-[13px] text-text-muted">
                                                {source.traffic} · {source.time} to submit
                                            </p>
                                        </div>
                                    </div>

                                    {!copy && !generatingId && (
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateCopy(source.id)}
                                            className="btn-primary"
                                        >
                                            <Sparkles size={16} />
                                            <span>Write My Submission Copy</span>
                                        </button>
                                    )}

                                    {generatingId === source.id && (
                                        <div className="skeleton h-24 w-full rounded-[var(--radius-md)]" />
                                    )}

                                    {copy && (
                                        <>
                                            <div className="surface-well-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-[var(--gold)]">Your Copy — Ready to Paste</span>
                                                    <CopyButton text={copy} label="Copy Everything" />
                                                </div>
                                                <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap line-clamp-4">
                                                    {copy}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedId(isExpanded ? null : source.id)}
                                                    className="mt-2 text-[12px] font-semibold text-[var(--gold)]"
                                                >
                                                    {isExpanded ? "Show less" : "Show full copy & steps"}
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="surface-nested flex flex-col gap-3">
                                                    <p className="text-[13px] text-text-primary whitespace-pre-wrap">{copy}</p>
                                                    <ol className="list-decimal list-inside text-[13px] text-text-secondary space-y-1">
                                                        {source.instructions.map((step, i) => (
                                                            <li key={i}>{step}</li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                <a
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-primary"
                                                >
                                                    <ExternalLink size={16} />
                                                    <span>Open Site</span>
                                                </a>
                                                {!isCompleted && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleComplete(source.id, true)}
                                                        className="btn-soft"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                        <span>Mark Done</span>
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            );
                        })}
                    </section>
                </>
            )}
        </PremiumPageLayout>
    );
}
