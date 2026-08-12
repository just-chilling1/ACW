"use client";

type CatalogProgressProps = {
  done: number;
  total: number;
};

export function CatalogProgress({ done, total }: CatalogProgressProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;

  return (
    <div className="card-base p-4 sm:p-5">
      <div className="mb-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Your progress</p>
          <p className="text-lg font-semibold tabular-nums text-text-primary">
            {done} of {total} completed
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-[var(--gold-text)]">{percent}%</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: complete ? "var(--success)" : "var(--grad-brand)",
          }}
        />
      </div>
      <p className="mt-2 text-xs text-text-muted">
        Copy the description, submit your link, then mark each source done.
      </p>
    </div>
  );
}
