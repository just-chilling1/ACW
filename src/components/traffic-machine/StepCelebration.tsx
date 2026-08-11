"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface StepCelebrationProps {
  title: string;
  nextLabel: string;
  onDone: () => void;
  autoAdvanceMs?: number;
}

export function StepCelebration({
  title,
  nextLabel,
  onDone,
  autoAdvanceMs = 1800,
}: StepCelebrationProps) {
  useEffect(() => {
    const t = window.setTimeout(onDone, autoAdvanceMs);
    return () => window.clearTimeout(t);
  }, [onDone, autoAdvanceMs]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-base flex flex-col items-start gap-3 border-[var(--success-border)] bg-[var(--success-bg)] p-6"
    >
      <CheckCircle2 size={32} className="text-[var(--success)]" />
      <h2 className="ds-h3">{title}</h2>
      <p className="text-sm text-text-secondary">
        Done — next up: <span className="font-semibold text-text-primary">{nextLabel}</span>
      </p>
    </motion.div>
  );
}
