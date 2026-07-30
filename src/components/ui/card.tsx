import { clsx } from "clsx";
import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
  interactive?: boolean;
  padding?: "none" | "sm" | "md";
};

export function Card({
  children,
  className,
  eyebrow,
  title,
  description,
  footer,
  interactive,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={clsx(
        interactive ? "card-interactive" : "card-base",
        padding === "none" && "p-0!",
        padding === "sm" && "p-4!",
        className
      )}
    >
      {(eyebrow || title || description) && (
        <div className={clsx("flex flex-col gap-1", padding === "none" ? "p-5 pb-3" : "mb-4")}>
          {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
          {title ? <h3 className="ds-h3">{title}</h3> : null}
          {description ? <p className="ds-subtitle text-sm">{description}</p> : null}
        </div>
      )}
      {children}
      {footer ? (
        <div className={clsx("mt-4 border-t border-[var(--border-subtle)] pt-4", padding === "none" && "mx-5 mb-5")}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}
