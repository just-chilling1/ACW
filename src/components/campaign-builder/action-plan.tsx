"use client";

import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import type { ActionPlanItem } from "@/lib/campaign/types";

type ActionPlanProps = {
  items: ActionPlanItem[];
  onStart: () => void;
  onMarkDone: (id: string) => void;
};

export function ActionPlan({ items, onStart, onMarkDone }: ActionPlanProps) {
  const todayItems = items.filter((i) => i.status !== "completed").slice(0, 3);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="ds-h2">Your Action Plan</h2>
        <p className="mt-1 text-sm text-text-muted">Exactly what to do next — no guesswork.</p>
      </div>

      <div className="card-base p-6!">
        <h3 className="ds-h4 mb-4 text-text-muted">Today</h3>
        <p className="mb-4 text-sm text-text-secondary">
          {todayItems.length} opportunit{todayItems.length === 1 ? "y" : "ies"} ready
        </p>

        <ol className="flex flex-col gap-4">
          {todayItems.map((item, idx) => (
            <li key={item.id} className="surface-well-md flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold tabular-nums text-[var(--gold)]">{idx + 1}</span>
                <span className="text-sm font-semibold text-text-primary">{item.platform}</span>
                <span className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase text-text-muted">
                  {item.intentLabel}
                </span>
              </div>
              <p className="text-sm font-medium text-text-primary">{item.title}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="ds-h4 mb-1 text-text-muted">What to do</p>
                  <p className="text-sm text-text-secondary">{item.whatToDo}</p>
                </div>
                <div>
                  <p className="ds-h4 mb-1 text-text-muted">Why it matters</p>
                  <p className="text-sm text-text-secondary">{item.whyItMatters}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={item.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary py-2 text-xs"
                >
                  <ExternalLink size={12} aria-hidden />
                  Open conversation
                </a>
                {item.status === "completed" ? (
                  <span className="status-success inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold">
                    <CheckCircle2 size={14} aria-hidden />
                    Completed
                  </span>
                ) : (
                  <button type="button" onClick={() => onMarkDone(item.id)} className="btn-soft py-2 text-xs">
                    Mark as Done
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>

        <button type="button" onClick={onStart} className="btn-primary mt-6 w-full py-4 group sm:w-auto">
          <span>Start Today&apos;s Actions</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden />
        </button>
      </div>
    </section>
  );
}

export function ActionPlanSummary({ items }: { items: ActionPlanItem[] }) {
  const completed = items.filter((i) => i.status === "completed").length;
  return (
    <p className="text-sm text-text-muted">
      Progress:{" "}
      <span className="font-semibold text-text-primary">
        {completed} / {items.length} completed
      </span>
    </p>
  );
}
