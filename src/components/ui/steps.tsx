import { clsx } from "clsx";
import type { ReactNode } from "react";

export type StepItem = {
  title: string;
  description?: string;
  icon?: ReactNode;
};

type StepsProps = {
  items: StepItem[];
  className?: string;
  compact?: boolean;
};

export function Steps({ items, className, compact }: StepsProps) {
  return (
    <ol
      className={clsx(
        "grid w-full gap-4",
        items.length <= 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {items.map((item, index) => (
        <li key={item.title} className="relative flex gap-3">
          {index < items.length - 1 ? (
            <span
              className="absolute left-4 top-9 hidden h-px w-[calc(100%-0.5rem)] bg-[var(--border-subtle)] md:block"
              aria-hidden
            />
          ) : null}
          <div
            className={clsx(
              "relative z-10 flex shrink-0 items-center justify-center rounded-full border border-[var(--accent-border-strong)] bg-[var(--accent-bg-subtle)] font-semibold text-[var(--gold)] tabular-nums",
              compact ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-xs"
            )}
          >
            {item.icon ?? index + 1}
          </div>
          <div className="min-w-0 pt-0.5">
            <p className={clsx("font-semibold text-text-primary", compact ? "text-sm" : "text-[15px]")}>
              {item.title}
            </p>
            {item.description ? (
              <p className="mt-1 text-xs leading-relaxed text-text-muted">{item.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
