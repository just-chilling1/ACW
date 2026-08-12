import { type ReactNode } from "react";
import { clsx } from "clsx";
import { InlineError } from "@/components/ui/InlineError";
import { Skeleton } from "@/components/ui/skeleton";

type PremiumLoadingProps = {
  variant?: "loading";
  rows?: number;
  heightClassName?: string;
  className?: string;
};

type PremiumEmptyProps = {
  variant: "empty";
  message: ReactNode;
  action?: ReactNode;
  className?: string;
};

type PremiumErrorProps = {
  variant: "error";
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export type PremiumStateBlockProps =
  | PremiumLoadingProps
  | PremiumEmptyProps
  | PremiumErrorProps;

export function PremiumStateBlock(props: PremiumStateBlockProps) {
  if (props.variant === "empty") {
    return (
      <div
        className={clsx(
          "surface-panel px-6 py-10 text-center text-sm text-text-muted",
          props.className,
        )}
      >
        <p>{props.message}</p>
        {props.action ? <div className="mt-4 flex justify-center">{props.action}</div> : null}
      </div>
    );
  }

  if (props.variant === "error") {
    return (
      <div className={clsx("flex flex-col gap-3", props.className)}>
        <InlineError message={props.message} />
        {props.onRetry ? (
          <button type="button" className="btn-secondary w-fit" onClick={props.onRetry}>
            {props.retryLabel || "Try again"}
          </button>
        ) : null}
      </div>
    );
  }

  const rows = props.rows ?? 3;
  const height = props.heightClassName ?? "h-36";

  return (
    <div
      className={clsx("flex flex-col gap-4", props.className)}
      aria-busy
      aria-live="polite"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className={clsx("w-full rounded-[var(--radius-lg)]", height)}
        />
      ))}
    </div>
  );
}
