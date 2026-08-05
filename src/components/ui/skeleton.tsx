import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton", className)} aria-hidden />;
}

export function SkeletonRows({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-3", className)} aria-busy aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="surface-nested flex items-center gap-4"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="ml-auto h-2 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={clsx("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", className)}
      aria-busy
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="surface-panel flex flex-col gap-3 p-4"
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-2 h-8 w-24" />
        </div>
      ))}
    </div>
  );
}
