"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import type { CampaignPhase } from "@/lib/campaign/types";

const STEPS: { phase: CampaignPhase; label: string }[] = [
  { phase: "offer", label: "Offer" },
  { phase: "discovery", label: "Analysis" },
  { phase: "strategy", label: "Strategy" },
  { phase: "pack", label: "Content" },
  { phase: "plan", label: "Actions" },
  { phase: "dashboard", label: "Campaign" },
];

function phaseIndex(phase: CampaignPhase): number {
  if (phase === "analyzing") return 1;
  const idx = STEPS.findIndex((s) => s.phase === phase);
  return idx >= 0 ? idx : 0;
}

export function CampaignWorkflowProgress({ phase }: { phase: CampaignPhase }) {
  const current = phaseIndex(phase);

  return (
    <nav aria-label="Campaign progress" className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((step, i) => {
        const done = current > i;
        const active = current === i || (phase === "analyzing" && step.phase === "discovery");
        return (
          <div key={step.phase} className="flex items-center gap-2 sm:gap-3">
            <div
              className={clsx(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all sm:px-4 sm:py-2",
                done || active
                  ? "border-[var(--accent-border)] bg-[var(--accent-bg-subtle)] text-[var(--gold)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-2)] text-text-muted"
              )}
            >
              <span
                className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                  done || active
                    ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                    : "border border-[var(--border-subtle)] bg-[var(--surface-2)] text-text-muted"
                )}
              >
                {done ? <Check size={12} aria-hidden /> : i + 1}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider">{step.label}</span>
            </div>
            {i < STEPS.length - 1 ? (
              <span
                className={clsx("hidden h-px w-4 sm:block sm:w-6", done ? "bg-[var(--gold)]" : "bg-[var(--border-subtle)]")}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
