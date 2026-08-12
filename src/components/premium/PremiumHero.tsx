import { type ReactNode } from "react";
import { clsx } from "clsx";

type PremiumHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function PremiumHero({
  eyebrow = "PREMIUM",
  title,
  subtitle,
  actions,
  children,
  className,
}: PremiumHeroProps) {
  return (
    <header className={clsx("premium-landing-hero", className)}>
      <div className="premium-landing-hero__glow" aria-hidden />
      <div className="relative flex flex-col gap-4">
        {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
        <h1 className="ds-h1 max-w-3xl">{title}</h1>
        {subtitle ? <p className="ds-subtitle max-w-2xl">{subtitle}</p> : null}
        {actions ? (
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            {actions}
          </div>
        ) : null}
        {children}
      </div>
    </header>
  );
}
