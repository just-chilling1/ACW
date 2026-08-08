"use client";

import { Check, X } from "lucide-react";
import { clsx } from "clsx";
import type { TrustCheckResult } from "@/lib/campaign/types";

export function TrustCheck({ result }: { result: TrustCheckResult }) {
  return (
    <section className="card-base flex flex-col gap-5 p-6!">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="ds-h3">Trust Check</h3>
          <p className="mt-1 text-sm text-text-muted">Quality checks on your recommended reply</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-[var(--gold)]">
            {result.score}
            <span className="text-sm font-semibold text-text-muted"> / 100</span>
          </p>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{result.label}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {result.items.map((item) => (
          <li
            key={item.id}
            className={clsx(
              "flex items-start gap-3 rounded-[var(--radius-md)] border px-3 py-2.5",
              item.passed
                ? "border-[var(--success-border)] bg-[var(--success-bg-subtle)]"
                : "border-[var(--warning-border)] bg-[var(--warning-bg-subtle)]"
            )}
          >
            {item.passed ? (
              <Check size={16} className="mt-0.5 shrink-0 text-[var(--success)]" aria-hidden />
            ) : (
              <X size={16} className="mt-0.5 shrink-0 text-[var(--warning)]" aria-hidden />
            )}
            <div>
              <p className="text-sm font-medium text-text-primary">{item.label}</p>
              {item.note ? <p className="mt-0.5 text-xs text-text-muted">{item.note}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
