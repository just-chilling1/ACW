import { clsx } from "clsx";
import type { ReactNode } from "react";

type AiBadgeProps = {
  children: ReactNode;
  className?: string;
};

export function AiBadge({ children, className }: AiBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--accent-border)] bg-[var(--accent-bg-subtle)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--gold-text)]",
        className
      )}
    >
      <span aria-hidden className="text-[var(--gold)]">
        ✦
      </span>
      {children}
    </span>
  );
}
