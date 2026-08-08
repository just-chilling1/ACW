"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { AiBadge } from "./ai-badge";

const DEFAULT_STEPS = [
  "Reading your offer",
  "Identifying the product",
  "Understanding the target customer",
  "Identifying the problem it solves",
  "Identifying buyer intent",
  "Finding the strongest opportunities",
];

type AiAnalysisProgressProps = {
  active: boolean;
  steps?: string[];
  title?: string;
};

export function AiAnalysisProgress({
  active,
  steps = DEFAULT_STEPS,
  title = "Understanding your offer...",
}: AiAnalysisProgressProps) {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!active) {
      setCompletedCount(0);
      return;
    }

    setCompletedCount(0);
    const interval = window.setInterval(() => {
      setCompletedCount((prev) => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, 900);

    return () => window.clearInterval(interval);
  }, [active, steps.length]);

  if (!active) return null;

  return (
    <section className="surface-panel-elevated mx-auto w-full max-w-2xl p-6 sm:p-8" aria-live="polite">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <AiBadge>AI Campaign Analysis</AiBadge>
        <div className="flex items-center gap-2">
          <Loader2 size={18} className="animate-spin text-[var(--gold)]" aria-hidden />
          <p className="text-base font-semibold text-text-primary">{title}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const done = i < completedCount;
          const current = i === completedCount;
          return (
            <li key={step} className="flex items-center gap-3">
              <span
                className={clsx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px]",
                  done
                    ? "border-[var(--success-border)] bg-[var(--success-bg-subtle)] text-[var(--success)]"
                    : current
                      ? "border-[var(--accent-border)] bg-[var(--accent-bg-subtle)]"
                      : "border-[var(--border-subtle)] bg-[var(--surface-2)] text-text-muted"
                )}
              >
                {done ? <Check size={12} aria-hidden /> : current ? "●" : null}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${step}-${done}`}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  className={clsx(
                    "text-sm",
                    done ? "text-text-secondary" : current ? "font-medium text-text-primary" : "text-text-muted"
                  )}
                >
                  {step}
                </motion.span>
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
