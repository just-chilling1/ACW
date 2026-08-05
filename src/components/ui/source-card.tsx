"use client";

import { Check, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

type SourceCardProps = {
  name: string;
  type: string;
  difficulty: string;
  traffic: string;
  time: string;
  completed?: boolean;
  onToggleComplete?: () => void;
  onViewInstructions?: () => void;
  className?: string;
};

export function SourceCard({
  name,
  type,
  difficulty,
  traffic,
  time,
  completed,
  onToggleComplete,
  onViewInstructions,
  className,
}: SourceCardProps) {
  const diff = difficulty.toLowerCase();
  const isEasy = diff.includes("easy");

  return (
    <article
      className={clsx(
        "card-base flex flex-col gap-3 p-4!",
        completed && "border-[var(--success-border-strong)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {type}
          </span>
          <span
            className={clsx(
              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              isEasy
                ? "badge-success"
                : "badge-warning"
            )}
          >
            {difficulty}
          </span>
        </div>
        {onToggleComplete ? (
          <button
            type="button"
            aria-label={completed ? "Mark incomplete" : "Mark complete"}
            onClick={onToggleComplete}
            className={clsx(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
              completed
                ? "border-[var(--success)] bg-[var(--success)] text-[var(--text-on-accent)]"
                : "border-[var(--border-strong)] text-transparent hover:border-[var(--gold)]"
            )}
          >
            <Check size={12} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>

      <h4 className="text-sm font-semibold text-text-primary">{name}</h4>

      <div className="flex flex-wrap gap-3 text-[11px] text-text-muted">
        <span className="tabular-nums">{traffic}</span>
        <span>{time}</span>
      </div>

      {onViewInstructions ? (
        <button type="button" onClick={onViewInstructions} className="btn-ghost mt-auto justify-start px-0 text-xs text-[var(--gold)]">
          View Instructions
          <ChevronRight size={14} strokeWidth={1.75} />
        </button>
      ) : null}
    </article>
  );
}
