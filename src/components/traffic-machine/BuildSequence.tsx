"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import { MACHINE_BUILD_STAGES, type MachineBuildProgress } from "@/lib/traffic-machine/types";

type BuildSequenceProps = {
  progress: MachineBuildProgress;
  active: boolean;
};

export function BuildSequence({ progress, active }: BuildSequenceProps) {
  const completed = new Set(progress.completedStages || []);
  const totalStages = MACHINE_BUILD_STAGES.length;
  const completedCount = MACHINE_BUILD_STAGES.filter((s) => completed.has(s.key)).length;
  const progressPct =
    active && progress.currentStage
      ? Math.round(((completedCount + 0.5) / totalStages) * 100)
      : Math.round((completedCount / totalStages) * 100);

  return (
    <div className="surface-panel-elevated p-5 sm:p-6">
      <h2 className="mb-1 text-lg font-semibold text-text-primary sm:text-xl">
        Writing your submission packs
      </h2>
      <p className="mb-4 text-sm text-text-muted">
        We match free traffic channels to your offer and prepare ready-to-paste copy for each one.
      </p>

      <div className="mb-5">
        <div className="mb-1 flex justify-between text-xs text-text-muted">
          <span>Progress</span>
          <span className="tabular-nums">{progressPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-500",
              active && "progress-bar-loading",
            )}
            style={{
              width: `${Math.max(progressPct, active ? 8 : 0)}%`,
              background: "var(--grad-brand)",
            }}
          />
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {MACHINE_BUILD_STAGES.map((stage, i) => {
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
              {done ? `✓ ${stage.label}` : stage.label}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
