"use client";

import { clsx } from "clsx";
import type { MachineProgression } from "@/lib/traffic-machine/types";

const STAGES = [
  { key: "discover" as const, num: "01", title: "Discover", desc: "Find your best opportunities." },
  { key: "activate" as const, num: "02", title: "Activate", desc: "Start your traffic sources." },
  { key: "grow" as const, num: "03", title: "Grow", desc: "Build more traffic channels." },
  { key: "optimize" as const, num: "04", title: "Optimize", desc: "Focus on what works." },
];

interface MachineProgressionProps {
  progression: MachineProgression;
}

function stageLabel(state: MachineProgression[keyof MachineProgression]): string {
  if (state === "complete") return "✓";
  if (state === "current") return "→";
  if (state === "locked") return "🔒";
  if (typeof state === "number") return `${state}%`;
  return "○";
}

export function MachineProgression({ progression }: MachineProgressionProps) {
  return (
    <section className="card-base p-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAGES.map((s) => {
          const state = progression[s.key];
          const isCurrent = state === "current" || typeof state === "number";
          return (
            <div
              key={s.key}
              className={clsx(
                "flex flex-col gap-2 rounded-[var(--radius-lg)] border p-4",
                isCurrent && "border-[var(--accent-border-strong)] bg-[var(--accent-bg-faint)]",
                state === "locked" && "opacity-50",
              )}
            >
              <span className="text-xs font-bold text-[var(--gold)]">{s.num}</span>
              <h3 className="ds-h5">{s.title}</h3>
              <p className="text-xs text-text-muted">{s.desc}</p>
              <span className="text-sm font-semibold text-text-primary">{stageLabel(state)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
