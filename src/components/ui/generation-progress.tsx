"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { EarningsBanner } from "./earnings-banner";
import { WelcomeOfferBanner } from "./welcome-offer-banner";

export const GENERATION_RESULTS_ID = "generation-results";

export function scrollToGenerationResults(targetId = GENERATION_RESULTS_ID, attempt = 0) {
  const el = document.getElementById(targetId);
  if (!el) {
    if (attempt < 10) {
      window.setTimeout(() => scrollToGenerationResults(targetId, attempt + 1), 120);
    }
    return;
  }

  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

interface GenerationProgressProps {
  label: string;
  active: boolean;
  offer?: "earnings" | "welcome";
  showBanner?: boolean;
  scrollOnComplete?: boolean;
  scrollTargetId?: string;
  /** Rotating status lines shown under the main label while active */
  statusMessages?: string[];
  /** How long each status message stays visible (ms) */
  statusIntervalMs?: number;
}

export function GenerationProgress({
  label,
  active,
  offer = "earnings",
  showBanner = true,
  scrollOnComplete = true,
  scrollTargetId,
  statusMessages,
  statusIntervalMs = 3200,
}: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const wasActive = useRef(false);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      setStatusIndex(0);
      return;
    }

    setProgress(6);
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return prev;
        // Slow asymptotic crawl so long waits still feel alive
        const remaining = 94 - prev;
        const step =
          prev < 35
            ? 2.2 + Math.random() * 1.8
            : prev < 65
              ? 1.1 + Math.random() * 1.2
              : Math.max(0.25, remaining * 0.035 + Math.random() * 0.35);
        return Math.min(94, prev + step);
      });
    }, 450);

    return () => window.clearInterval(interval);
  }, [active]);

  const statusKey = statusMessages?.join("\0") ?? "";
  const statusCount = statusMessages?.length ?? 0;

  useEffect(() => {
    if (!active || statusCount === 0) {
      setStatusIndex(0);
      return;
    }

    setStatusIndex(0);
    const interval = window.setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusCount);
    }, statusIntervalMs);

    return () => window.clearInterval(interval);
  }, [active, statusKey, statusCount, statusIntervalMs]);

  useEffect(() => {
    if (wasActive.current && !active && scrollOnComplete) {
      scrollToGenerationResults(scrollTargetId ?? GENERATION_RESULTS_ID);
    }
    wasActive.current = active;
  }, [active, scrollOnComplete, scrollTargetId]);

  if (!active && !showBanner) return null;

  const Banner = offer === "welcome" ? WelcomeOfferBanner : EarningsBanner;
  const currentStatus =
    active && statusMessages?.length ? statusMessages[statusIndex] : null;
  const displayPercent = Math.round(progress);

  return (
    <div className="flex w-full flex-col gap-3">
      {active && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 shadow-[var(--elevation-1)] sm:p-4">
          <div className="mb-3 flex items-start gap-3">
            <Loader2
              size={18}
              className="mt-0.5 shrink-0 animate-spin text-[var(--gold)]"
              strokeWidth={1.75}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-text-primary">{label}</span>
                <span className="shrink-0 text-[12px] font-bold tabular-nums text-[var(--gold)]">
                  {displayPercent}%
                </span>
              </div>
              <div className="mt-1 min-h-[1.25rem]">
                <AnimatePresence mode="wait" initial={false}>
                  {currentStatus ? (
                    <motion.p
                      key={currentStatus}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.22 }}
                      className="text-[12px] leading-snug text-text-muted"
                    >
                      {currentStatus}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: "var(--grad-brand)" }}
            />
          </div>
        </div>
      )}
      {showBanner && <Banner />}
    </div>
  );
}
