"use client";

import { CopyButton } from "@/components/dfy/copy-button";
import type { SubmissionPack } from "@/lib/traffic-machine/types";

type SubmissionPackCardProps = {
  pack: SubmissionPack;
  regenerating?: boolean;
  onRegenerate?: () => void;
};

export function SubmissionPackCard({ pack, regenerating, onRegenerate }: SubmissionPackCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Ready-to-paste pack
          </p>
          <p className="mt-1 text-sm text-text-secondary">{pack.whyThisSource}</p>
          {pack.estimatedTraffic ? (
            <p className="mt-1 text-xs text-[var(--gold-text)]">
              Est. traffic: {pack.estimatedTraffic}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={pack.copyAll} label="Copy all" variant="primary" />
          {onRegenerate ? (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={regenerating}
              className="btn-secondary px-3 py-2 text-xs sm:text-sm"
            >
              {regenerating ? "Rewriting…" : "Rewrite pack"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {pack.fields.map((field) => (
          <div
            key={field.key}
            className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 sm:p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {field.label}
              </p>
              <CopyButton text={field.value} label="Copy" />
            </div>
            <p className="whitespace-pre-wrap text-sm text-text-primary">{field.value}</p>
          </div>
        ))}
      </div>

      {pack.tips.length > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Quick tips
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-text-secondary">
            {pack.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
