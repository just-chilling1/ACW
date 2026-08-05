"use client";

import { motion } from "framer-motion";
import { Trophy, Flame, Target, Zap, Crown } from "lucide-react";

interface MilestoneTrackerProps {
    totalSearches: number;
    nichesAnalyzed: number;
}

const MILESTONES = [
    { threshold: 1, label: "First Search", icon: Target, reward: "You started. Most people never do." },
    { threshold: 5, label: "Getting Serious", icon: Flame, reward: "You're ahead of 80% of members." },
    { threshold: 10, label: "Ad Hunter", icon: Zap, reward: "Top 10% of earners started here." },
    { threshold: 25, label: "Power User", icon: Trophy, reward: "You're in the top 5%. Keep going!" },
    { threshold: 50, label: "CashWave Master", icon: Crown, reward: "Elite status. You're unstoppable." },
];

export function MilestoneTracker({ totalSearches }: MilestoneTrackerProps) {
    const currentMilestone = MILESTONES.filter(m => totalSearches >= m.threshold).pop();
    const nextMilestone = MILESTONES.find(m => totalSearches < m.threshold);
    const progressToNext = nextMilestone
        ? Math.min(100, (totalSearches / nextMilestone.threshold) * 100)
        : 100;

    return (
        <div className="card-base flex flex-col gap-5 p-6!">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--accent-bg-subtle)]">
                        <Trophy size={18} className="text-[var(--gold)]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="ds-h6">Your Progress</span>
                        <span className="text-[10px] uppercase tracking-widest text-text-muted">
                            {currentMilestone ? currentMilestone.label : "Just Getting Started"}
                        </span>
                    </div>
                </div>
                {currentMilestone && (
                    <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5">
                        <currentMilestone.icon size={12} className="text-[var(--gold)]" />
                        <span className="text-[10px] font-semibold uppercase text-[var(--gold)]">{currentMilestone.label}</span>
                    </div>
                )}
            </div>

            {currentMilestone && (
                <p className="status-success rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium">
                    {currentMilestone.reward}
                </p>
            )}

            {nextMilestone && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold uppercase tracking-wider text-text-muted">
                            Next: {nextMilestone.label}
                        </span>
                        <span className="font-semibold tabular-nums text-[var(--gold)]">{totalSearches}/{nextMilestone.threshold}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToNext}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ background: "var(--grad-brand)" }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
