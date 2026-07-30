import { ReactNode } from "react";
import { clsx } from "clsx";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  /** When set, shows a slim step progress bar under the header (1–4). */
  step?: number;
  totalSteps?: number;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
  step,
  totalSteps = 4,
}: PageHeaderProps) {
  const progress = step ? Math.min(100, (step / totalSteps) * 100) : null;

  return (
    <header className={clsx("mb-6 flex flex-col gap-4 sm:mb-8", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
          <h1 className="ds-h1">{title}</h1>
          {subtitle ? <p className="ds-subtitle max-w-2xl">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      {progress !== null ? (
        <div className="flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${progress}%`,
                background: "var(--grad-brand)",
              }}
            />
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-text-muted">
            {step}/{totalSteps}
          </span>
        </div>
      ) : null}
    </header>
  );
}

/** Alias used by the design system / style guide. */
export const StepHeader = PageHeader;
