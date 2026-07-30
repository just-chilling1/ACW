"use client";

import { clsx } from "clsx";

type OfferCardProps = {
  niche: string;
  keyword: string;
  description: string;
  badge?: string;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
  ctaLabel?: string;
};

export function OfferCard({
  niche,
  keyword,
  description,
  badge = "HIGH INTENT",
  selected,
  onSelect,
  className,
  ctaLabel = "Select this keyword",
}: OfferCardProps) {
  return (
    <article
      className={clsx(
        "card-base flex h-full flex-col gap-3 p-5!",
        selected && "border-[rgba(234,179,8,0.45)]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {niche}
        </span>
        <span className="rounded-md bg-[rgba(16,185,129,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--success)]">
          {badge}
        </span>
      </div>
      <p className="text-base font-semibold text-text-primary">&ldquo;{keyword}&rdquo;</p>
      <p className="flex-1 text-sm leading-relaxed text-text-secondary">{description}</p>
      {onSelect ? (
        <button type="button" onClick={onSelect} className="btn-primary mt-2 w-full text-sm">
          {ctaLabel}
        </button>
      ) : null}
    </article>
  );
}
