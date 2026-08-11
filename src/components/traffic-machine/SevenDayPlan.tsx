"use client";

import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import type { SevenDayPlanDay } from "@/lib/traffic-machine/types";

interface SevenDayPlanProps {
  days: SevenDayPlanDay[];
  onStartToday: () => void;
}

export function SevenDayPlan({ days, onStartToday }: SevenDayPlanProps) {
  if (!days.length) {
    return (
      <section className="card-base p-8 text-center">
        <h2 className="ds-h3">Your 7-Day Traffic Plan</h2>
        <p className="mt-2 text-sm text-text-secondary">Build your Traffic Machine to generate your plan.</p>
      </section>
    );
  }

  const current = days.find((d) => d.status === "current");

  return (
    <section className="card-base flex flex-col gap-6 p-8">
      <h2 className="ds-h3">Your 7-Day Traffic Plan</h2>
      <div className="flex flex-col gap-4">
        {days.map((day) => (
          <div
            key={day.dayIndex}
            className={clsx(
              "flex flex-col gap-1 rounded-[var(--radius-lg)] border p-4 sm:flex-row sm:items-center sm:justify-between",
              day.status === "current" && "border-[var(--accent-border-strong)] bg-[var(--accent-bg-faint)]",
              day.status === "completed" && "opacity-70",
            )}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg" aria-hidden>
                {day.status === "completed" ? "✓" : day.status === "current" ? "→" : "○"}
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {day.label}
                </span>
                <h3 className="ds-h5">{day.title}</h3>
                <p className="text-sm text-text-muted">{day.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {current && (
        <button type="button" onClick={onStartToday} className="btn-primary w-fit">
          Start Today&apos;s Tasks
          <ArrowRight size={14} />
        </button>
      )}
    </section>
  );
}
