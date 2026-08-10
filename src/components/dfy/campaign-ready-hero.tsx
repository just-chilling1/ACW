"use client";

import { motion } from "framer-motion";
import type { CampaignStats } from "@/lib/dfy/types";

type CampaignReadyHeroProps = {
    name: string;
    score: number;
    stats: CampaignStats;
};

export function CampaignReadyHero({ name, score, stats }: CampaignReadyHeroProps) {
    const items = [
        { label: "High-intent opportunities", value: stats.opportunityCount },
        { label: "Days of content", value: stats.contentDays },
        { label: "Ready-to-use assets", value: stats.assetCount },
        { label: "Promotion channels", value: stats.channelCount },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-panel-elevated overflow-hidden p-5 sm:p-8"
        >
            <p className="page-eyebrow mb-2">Campaign Ready</p>
            <h2 className="ds-h2 mb-1">{name}</h2>
            <p className="mb-6 text-sm text-text-secondary">
                Your campaign is ready to use. We found strong opportunities and created a complete promotional plan.
            </p>

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Campaign Score</p>
                    <p className="text-4xl font-bold tabular-nums text-[var(--gold-text)] sm:text-5xl">{score}/100</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {items.map((item, i) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-2)] p-3 sm:p-4"
                    >
                        <p className="text-2xl font-bold tabular-nums text-text-primary sm:text-3xl">{item.value}</p>
                        <p className="mt-1 text-[11px] leading-snug text-text-muted sm:text-xs">{item.label}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
