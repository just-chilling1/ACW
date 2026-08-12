import { type ReactNode } from "react";
import { clsx } from "clsx";

type PremiumSectionProps = {
  step?: number;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  /** elevated panel wrapper for primary CTA / progress blocks */
  elevated?: boolean;
};

export function PremiumSection({
  step,
  title,
  description,
  meta,
  children,
  className,
  elevated,
}: PremiumSectionProps) {
  return (
    <section
      className={clsx(
        "premium-landing-section flex flex-col gap-3",
        elevated && "surface-panel-elevated p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h2 className="ds-h5">
            {typeof step === "number" ? `${step}. ` : null}
            {title}
          </h2>
          {description ? <p className="text-sm text-text-muted">{description}</p> : null}
        </div>
        {meta ? (
          <div className="shrink-0">
            {typeof meta === "string" || typeof meta === "number" ? (
              <span className="text-sm text-text-muted">{meta}</span>
            ) : (
              meta
            )}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}
