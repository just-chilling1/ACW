"use client";

import { Check, ExternalLink, MessageSquare } from "lucide-react";
import { clsx } from "clsx";
import type { ReactNode } from "react";

type AdCardProps = {
  platform?: string;
  title?: string;
  text: string;
  engagement?: string | number;
  url?: string;
  selected?: boolean;
  onSelect?: () => void;
  onCreateReplies?: () => void;
  actions?: ReactNode;
  className?: string;
};

export function AdCard({
  platform,
  title,
  text,
  engagement,
  url,
  selected,
  onSelect,
  onCreateReplies,
  actions,
  className,
}: AdCardProps) {
  const source = (platform || "POST").toUpperCase();

  return (
    <article
      className={clsx(
        "card-base flex flex-col gap-3 p-4!",
        selected && "border-[var(--accent-border-emphasis)] bg-[var(--accent-bg-faint)]",
        onSelect && "cursor-pointer",
        className
      )}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {source}
        </span>
        {selected ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold)] text-[var(--text-on-accent)]">
            <Check size={12} strokeWidth={2.5} />
          </span>
        ) : null}
      </div>

      {title ? <h4 className="text-sm font-semibold text-text-primary">{title}</h4> : null}
      <p className="line-clamp-3 text-[13px] leading-relaxed text-text-secondary">{text}</p>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
        {engagement !== undefined ? (
          <span className="text-[11px] font-medium tabular-nums text-text-muted">{engagement}</span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost px-2 py-1.5 text-[11px]"
            >
              <ExternalLink size={12} strokeWidth={1.75} />
              Go to Post
            </a>
          ) : null}
          {onCreateReplies ? (
            <button type="button" onClick={onCreateReplies} className="btn-soft px-3 py-1.5 text-[11px]">
              <MessageSquare size={12} strokeWidth={1.75} />
              Create Replies
            </button>
          ) : null}
          {actions}
        </div>
      </div>
    </article>
  );
}
