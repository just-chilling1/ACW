"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
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
}

export function GenerationProgress({
  label,
  active,
  offer = "earnings",
  showBanner = true,
  scrollOnComplete = true,
  scrollTargetId,
}: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const wasActive = useRef(false);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }

    setProgress(8);
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const step = prev < 60 ? 6 + Math.random() * 4 : 1 + Math.random() * 2;
        return Math.min(95, prev + step);
      });
    }, 280);

    return () => window.clearInterval(interval);
  }, [active]);

  useEffect(() => {
    if (wasActive.current && !active && scrollOnComplete) {
      scrollToGenerationResults(scrollTargetId ?? GENERATION_RESULTS_ID);
    }
    wasActive.current = active;
  }, [active, scrollOnComplete, scrollTargetId]);

  if (!active && !showBanner) return null;

  const Banner = offer === "welcome" ? WelcomeOfferBanner : EarningsBanner;

  return (
    <div className="flex w-full flex-col gap-3">
      {active && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 shadow-[var(--elevation-1)] sm:p-4">
          <div className="mb-2.5 flex items-center gap-3">
            <Loader2 size={16} className="shrink-0 animate-spin text-[var(--gold)]" strokeWidth={1.75} />
            <span className="text-sm font-semibold text-text-primary">{label}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%`, background: "var(--grad-brand)" }}
            />
          </div>
        </div>
      )}
      {showBanner && <Banner compact={active} />}
    </div>
  );
}
