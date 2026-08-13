"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { SubmissionPackCard } from "@/components/traffic-machine/SubmissionPackCard";
import type { ScoredOpportunity, SubmissionPack } from "@/lib/traffic-machine/types";

const STEPS = [
  { id: 1, label: "Copy this" },
  { id: 2, label: "Open site" },
  { id: 3, label: "Mark done" },
] as const;

type MissionFlowProps = {
  opportunity: ScoredOpportunity;
  pack: SubmissionPack | null;
  loadingPack: boolean;
  regenerating: boolean;
  completing: boolean;
  skipping: boolean;
  error: string | null;
  onEnsurePack: () => void;
  onRegenerate: () => void;
  onComplete: () => void;
  onSkip: () => void;
};

export function MissionFlow({
  opportunity,
  pack,
  loadingPack,
  regenerating,
  completing,
  skipping,
  error,
  onEnsurePack,
  onRegenerate,
  onComplete,
  onSkip,
}: MissionFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { source } = opportunity;
  const siteName = source.name.split(" ")[0];

  useEffect(() => {
    setStep(1);
  }, [source.id]);

  useEffect(() => {
    if (!pack && !loadingPack) onEnsurePack();
  }, [pack, loadingPack, onEnsurePack]);

  const stepStatuses = useMemo(() => {
    return STEPS.map((s) => ({
      ...s,
      done: s.id < step,
      active: s.id === step,
    }));
  }, [step]);

  return (
    <section className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2">
        {stepStatuses.map((s) => (
          <div
            key={s.id}
            className={clsx(
              "rounded-[var(--radius-md)] border px-3 py-2",
              s.active
                ? "border-[var(--gold)] bg-[var(--surface-2)]"
                : s.done
                  ? "border-[var(--success-border)] bg-[var(--success-bg-faint)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-1)]",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Step {s.id}
            </p>
            <p
              className={clsx(
                "text-sm font-semibold",
                s.active ? "text-text-primary" : s.done ? "text-[var(--success)]" : "text-text-muted",
              )}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div>
        <p className="page-eyebrow">Your next source</p>
        <h2 className="ds-h3 mt-1">{source.name}</h2>
        <p className="mt-1 text-sm text-text-muted">
          {source.difficulty} · ~{source.time.replace(/minutes?/i, "min")} · {source.type}
        </p>
        {opportunity.reasons[0] ? (
          <p className="mt-2 text-sm text-text-secondary">{opportunity.reasons[0]}</p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-2 text-sm text-[var(--error)]">
          {error}
        </div>
      ) : null}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          {loadingPack && !pack ? (
            <p className="text-sm text-text-muted">Preparing your submission pack…</p>
          ) : null}
          {pack ? (
            <SubmissionPackCard
              pack={pack}
              regenerating={regenerating}
              onRegenerate={onRegenerate}
            />
          ) : null}

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              How to submit
            </p>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-text-secondary">
              {source.instructions.map((inst) => (
                <li key={inst}>{inst}</li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!pack || loadingPack}
              onClick={() => setStep(2)}
              className="btn-primary"
            >
              Next: Open site
              <ArrowRight size={14} />
            </button>
            <button type="button" onClick={onSkip} disabled={skipping} className="btn-ghost text-sm">
              {skipping ? "Skipping…" : "Skip for now"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Open {source.name}, paste the pack we wrote, then come back and mark it done.
          </p>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-fit"
          >
            Open {siteName}
            <ExternalLink size={14} />
          </a>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button type="button" onClick={() => setStep(3)} className="btn-primary">
              I&apos;ve submitted it
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 text-[var(--success)]" size={20} />
            <div>
              <h3 className="text-base font-semibold text-text-primary">Mark this source done?</h3>
              <p className="mt-1 text-sm text-text-secondary">
                We&apos;ll count it as a live channel and move you to the next pack.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary" disabled={completing}>
              Back
            </button>
            <button type="button" onClick={onComplete} disabled={completing} className="btn-primary">
              {completing ? "Saving…" : "Mark done"}
            </button>
            <button type="button" onClick={onSkip} disabled={skipping || completing} className="btn-ghost text-sm">
              <Circle size={14} />
              Skip instead
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
