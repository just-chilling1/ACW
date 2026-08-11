"use client";

import { useState } from "react";
import { CheckCircle2, Copy, ExternalLink, X } from "lucide-react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import type { PromotionKit, ScoredOpportunity } from "@/lib/traffic-machine/types";

interface GuidedWorkflowProps {
  opportunity: ScoredOpportunity | null;
  promotionKit: PromotionKit | null;
  loadingKit: boolean;
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
        navigator.clipboard.writeText(text);
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
  onClose,
  onGenerateKit,
  onComplete,
}: GuidedWorkflowProps) {
  const [step, setStep] = useState(1);

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
          className="card-base flex max-h-[90vh] w-full max-w-2xl flex-col gap-6 overflow-y-auto p-6 sm:p-8"
          role="dialog"
          aria-labelledby="guided-workflow-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Step {step} of 4</p>
              <h2 id="guided-workflow-title" className="ds-h3">
                {source.name}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="btn-secondary p-2" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h3 className="ds-h5">Here&apos;s what to do</h3>
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-text-secondary">
                {source.instructions.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Back
                </button>
                <button type="button" onClick={() => setStep(2)} className="btn-primary">
                  Next: Get Your Content
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h3 className="ds-h5">Here&apos;s your ready-to-use content</h3>
              {!promotionKit && !loadingKit && (
                <button type="button" onClick={onGenerateKit} className="btn-primary w-fit">
                  Generate My Promotion
                </button>
              )}
              {loadingKit && <p className="text-sm text-text-muted">Preparing your promotion…</p>}
              {promotionKit && (
                <div className="flex flex-col gap-4">
                  <div className="surface-well-lg flex flex-col gap-2 p-4">
                    <span className="text-xs font-semibold text-text-muted">Headline</span>
                    <p className="text-sm">{promotionKit.headline}</p>
                    <CopyBtn text={promotionKit.headline} label="Copy Headline" />
                  </div>
                  <div className="surface-well-lg flex flex-col gap-2 p-4">
                    <span className="text-xs font-semibold text-text-muted">Description</span>
                    <p className="text-sm">{promotionKit.shortDescription}</p>
                    <CopyBtn text={promotionKit.shortDescription} label="Copy Description" />
                  </div>
                  <CopyBtn text={promotionKit.copyAll} label="Copy Everything" />
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  Back
                </button>
                <button
                  type="button"
                  disabled={!promotionKit || loadingKit}
                  onClick={() => setStep(3)}
                  className="btn-primary"
                >
                  Next: Open the Site
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h3 className="ds-h5">Open the opportunity</h3>
              <p className="text-sm text-text-secondary">
                Paste your content on {source.name}, then come back here when you&apos;re done.
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
                <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                  Back
                </button>
                <button type="button" onClick={() => setStep(4)} className="btn-primary">
                  I&apos;ve opened it
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <h3 className="ds-h5">Did you complete it?</h3>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setStep(3)} className="btn-secondary">
                  Back
                </button>
                <button type="button" onClick={onComplete} className="btn-primary">
                  ✓ Done
                </button>
                <button type="button" onClick={onClose} className="btn-secondary">
                  Not Yet
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
