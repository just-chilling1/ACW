"use client";

import { CheckCircle2, ChevronDown, Clock, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { CopyButton } from "@/components/dfy/copy-button";
import type { TrafficSource } from "@/lib/traffic-machine/sources";

type SourceCatalogCardProps = {
  source: TrafficSource;
  pageUrl: string;
  done: boolean;
  expanded: boolean;
  marking: boolean;
  onToggle: () => void;
  onMarkDone: (done: boolean) => void;
};

function withLink(text: string, url: string) {
  return text.replace(/\{LINK\}/g, url.trim() || "[YOUR_LINK]");
}

function withUrlInStep(step: string, url: string) {
  if (!url.trim()) return step;
  return step.replace(/your (page )?(URL|link|page url)/gi, url.trim());
}

export function SourceCatalogCard({
  source,
  pageUrl,
  done,
  expanded,
  marking,
  onToggle,
  onMarkDone,
}: SourceCatalogCardProps) {
  const description = withLink(source.description, pageUrl);
  const setupTime = source.time.replace(/minutes?/i, "min");

  return (
    <article
      className={clsx(
        "card-base overflow-hidden transition",
        done && "border-[var(--success-border)] bg-[var(--success-bg-faint)]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-3 p-4 text-left sm:p-5"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {source.type}
              </span>
              <span
                className={clsx(
                  "rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  source.difficulty === "Easy" ? "badge-success" : "badge-warning",
                )}
              >
                {source.difficulty}
              </span>
              {done ? (
                <span className="badge-success inline-flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Done
                </span>
              ) : null}
            </div>
            <h3 className="ds-h5">{source.name}</h3>
          </div>
          <ChevronDown
            size={18}
            className={clsx(
              "mt-1 shrink-0 text-text-muted transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            ~{setupTime}
          </span>
          <span>{source.traffic}</span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-t border-[var(--border-subtle)] px-4 py-4 sm:px-5 sm:py-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Instructions
                </p>
                <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-text-secondary">
                  {source.instructions.map((step) => (
                    <li key={step}>{withUrlInStep(step, pageUrl)}</li>
                  ))}
                </ol>
              </div>

              <div className="surface-well-lg flex flex-col gap-2 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Description
                </span>
                <p className="text-sm text-text-primary">{description}</p>
                <CopyButton text={description} label="Copy Description" copiedLabel="Copied!" />
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Open site
                  <ExternalLink size={14} />
                </a>
                <button
                  type="button"
                  disabled={marking}
                  onClick={() => onMarkDone(!done)}
                  className={done ? "btn-secondary" : "btn-primary"}
                >
                  {marking ? "Saving…" : done ? "Completed" : "Mark Done"}
                  {!marking && done ? <CheckCircle2 size={14} /> : null}
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
