"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, X } from "lucide-react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import type { PromotionKit, ScoredOpportunity } from "@/lib/traffic-machine/types";

interface GuidedWorkflowProps {
  opportunity: ScoredOpportunity | null;
  promotionKit: PromotionKit | null;
  loadingKit: boolean;
  completing?: boolean;
  error?: string | null;
  onClose: () => void;
  onGenerateKit: () => void;
  onComplete: () => void;
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={clsx(
        "btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs",
        copied && "status-success",
      )}
    >
      {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

export function GuidedWorkflow({
  opportunity,
  promotionKit,
  loadingKit,
  completing = false,
  error = null,
  onClose,
  onGenerateKit,
  onComplete,
}: GuidedWorkflowProps) {
  const [step, setStep] = useState(1);
  const [autoRequested, setAutoRequested] = useState(false);

  useEffect(() => {
    if (!opportunity || promotionKit || loadingKit || autoRequested) return;
    setAutoRequested(true);
    onGenerateKit();
  }, [opportunity, promotionKit, loadingKit, autoRequested, onGenerateKit]);

  if (!opportunity) return null;

  const { source } = opportunity;
  const siteName = source.name.split(" ")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="card-base flex max-h-[90vh] w-full max-w-2xl flex-col gap-5 overflow-y-auto p-5 sm:p-7"
          role="dialog"
          aria-labelledby="guided-workflow-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Step {step} of 3</p>
              <h2 id="guided-workflow-title" className="ds-h3">
                {source.name}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {source.difficulty} · ~{source.time.replace(/minutes?/i, "min")}
              </p>
            </div>
            <button type="button" onClick={onClose} className="btn-secondary p-2" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {error ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-2 text-sm text-[var(--error)]">
              {error}
            </div>
          ) : null}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Follow these steps</h3>
                <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-text-secondary">
                  {source.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ol>
              </div>

              <div className="surface-well-lg flex flex-col gap-3 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Ready-to-paste content
                </p>
                {loadingKit && !promotionKit ? (
                  <p className="text-sm text-text-muted">Preparing your promotion…</p>
                ) : null}
                {promotionKit ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-text-muted">Headline</span>
                      <p className="text-sm text-text-primary">{promotionKit.headline}</p>
                      <CopyBtn text={promotionKit.headline} label="Copy Headline" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-text-muted">Description</span>
                      <p className="text-sm text-text-primary">{promotionKit.shortDescription}</p>
                      <CopyBtn text={promotionKit.shortDescription} label="Copy Description" />
                    </div>
                    <CopyBtn text={promotionKit.copyAll} label="Copy Everything" />
                  </>
                ) : !loadingKit ? (
                  <button type="button" onClick={onGenerateKit} className="btn-secondary w-fit text-sm">
                    Generate promotion
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!promotionKit || loadingKit}
                  onClick={() => setStep(2)}
                  className="btn-primary"
                >
                  Next: Open site
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Open {source.name}</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Paste your content, then come back here and mark it done.
                </p>
              </div>
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
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Mark this source done?</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  We&apos;ll track it so you don&apos;t submit twice, and move you to the next source.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary" disabled={completing}>
                  Back
                </button>
                <button type="button" onClick={onComplete} disabled={completing} className="btn-primary">
                  {completing ? "Saving…" : "Mark Done ✓"}
                </button>
                <button type="button" onClick={onClose} className="btn-secondary" disabled={completing}>
                  Not yet
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
