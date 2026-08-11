"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";

interface TrafficMachineHeroProps {
  configured: boolean;
  onPrimaryAction: () => void;
}

export function TrafficMachineHero({ configured, onPrimaryAction }: TrafficMachineHeroProps) {
  return (
    <section className="card-base relative overflow-hidden p-8 md:p-12">
      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--accent-border-strong)] bg-[var(--accent-bg-subtle)]">
            <TrendingUp size={28} className="text-[var(--gold)]" />
          </div>
          <div>
            <h2 className="ds-h1">Build Your Traffic Machine</h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-text-secondary">
              Set up your promotion once. We&apos;ll help you find the best traffic opportunities,
              prepare everything you need, and show you what to do next.
            </p>
          </div>
          <button type="button" onClick={onPrimaryAction} className="btn-primary w-fit px-6 py-3.5">
            {configured ? "Continue My Traffic Machine" : "Build My Traffic Machine"}
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="surface-well-lg flex flex-col items-center gap-3 px-6 py-8 text-center lg:min-w-[240px]">
          {["YOUR OFFER", "TRAFFIC SOURCES", "VISITORS", "CLICKS", "SALES"].map((step, i, arr) => (
            <div key={step} className="flex flex-col items-center gap-2">
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="text-[11px] font-semibold uppercase tracking-wider text-text-muted"
              >
                {step}
              </motion.span>
              {i < arr.length - 1 && (
                <span className="text-[var(--gold)] opacity-60" aria-hidden>
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
