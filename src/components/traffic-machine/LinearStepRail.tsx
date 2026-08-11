"use client";

import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export type RailStepStatus = "locked" | "current" | "complete" | "available";

export interface RailStep {
  id: 1 | 2 | 3;
  title: string;
  hint: string;
  status: RailStepStatus;
}

interface LinearStepRailProps {
  steps: RailStep[];
  activeStep: 1 | 2 | 3;
  onSelectStep: (step: 1 | 2 | 3) => void;
  children: ReactNode;
}

export function LinearStepRail({ steps, activeStep, onSelectStep, children }: LinearStepRailProps) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step) => {
        const isOpen = step.id === activeStep;
        const canOpen = step.status !== "locked";

        return (
          <li
            key={step.id}
            className={clsx(
              "overflow-hidden rounded-[var(--radius-lg)] border transition-colors",
              isOpen
                ? "border-[var(--accent-border-strong)] bg-[var(--bg-elevated)]"
                : "border-[var(--border-strong)] bg-[var(--bg-surface)]",
              step.status === "locked" && "opacity-55",
            )}
          >
            <button
              type="button"
              disabled={!canOpen}
              onClick={() => {
                if (canOpen) onSelectStep(step.id);
              }}
              className={clsx(
                "flex w-full items-center gap-4 px-5 py-4 text-left",
                canOpen && "hover:bg-[var(--bg-hover)]",
                !canOpen && "cursor-not-allowed",
              )}
            >
              <span
                className={clsx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  step.status === "complete" && "bg-[var(--success)] text-white",
                  step.status === "current" && "bg-[var(--gold)] text-[var(--text-on-accent)]",
                  (step.status === "locked" || step.status === "available") &&
                    "border border-[var(--border-strong)] text-text-muted",
                  step.status === "available" && "text-text-primary",
                )}
              >
                {step.status === "complete" ? <CheckCircle2 size={18} /> : step.id}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-text-primary">{step.title}</span>
                <span className="block text-sm text-text-muted">{step.hint}</span>
              </span>
              {canOpen &&
                (isOpen ? (
                  <ChevronUp size={18} className="shrink-0 text-text-muted" />
                ) : (
                  <ChevronDown size={18} className="shrink-0 text-text-muted" />
                ))}
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[var(--border-subtle)] px-5 py-5">{children}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}
