"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import { BUILD_STAGES } from "@/lib/dfy/types";
import type { BuildProgress } from "@/lib/dfy/types";

type BuildSequenceProps = {
    progress: BuildProgress;
    active: boolean;
};

export function BuildSequence({ progress, active }: BuildSequenceProps) {
    const completed = new Set(progress.completedStages || []);

    return (
        <div className="surface-panel-elevated p-5 sm:p-6">
            <h2 className="mb-1 text-lg font-semibold text-text-primary sm:text-xl">
                Cashwave is building your campaign
            </h2>
            <p className="mb-5 text-sm text-text-muted">
                We&apos;re handling the research, strategy, content, and campaign planning for you.
            </p>
            <ul className="flex flex-col gap-3">
                {BUILD_STAGES.map((stage, i) => {
                    const done = completed.has(stage.key);
                    const current = progress.currentStage === stage.key;
                    return (
                        <motion.li
                            key={stage.key}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={clsx(
                                "flex items-center gap-3 text-sm",
                                done ? "text-text-primary" : current ? "text-[var(--gold-text)]" : "text-text-muted",
                            )}
                        >
                            <span
                                className={clsx(
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                                    done
                                        ? "border-[var(--success)] bg-[var(--success-fill)] text-[var(--success)]"
                                        : current
                                            ? "border-[var(--gold)] bg-[var(--surface-2)]"
                                            : "border-[var(--border-subtle)]",
                                )}
                            >
                                {done ? <Check size={12} strokeWidth={2.5} /> : current ? "…" : ""}
                            </span>
                            {stage.label}
                        </motion.li>
                    );
                })}
            </ul>
            {active && progress.currentStage ? (
                <p className="mt-4 text-xs text-text-muted">Working on this now…</p>
            ) : null}
        </div>
    );
}
