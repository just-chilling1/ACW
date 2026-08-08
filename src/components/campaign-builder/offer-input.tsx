"use client";

import { ArrowRight, Link as LinkIcon, Sparkles } from "lucide-react";
import { Field } from "@/components/ui/field";
import { InfoHint } from "@/components/ui/InfoHint";

type OfferInputProps = {
  affiliateLink: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onNoLink?: () => void;
  error?: string;
  loading?: boolean;
};

export function OfferInput({
  affiliateLink,
  onChange,
  onSubmit,
  onNoLink,
  error,
  loading,
}: OfferInputProps) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-3 text-center">
        <p className="page-eyebrow">Done-For-You Campaign Builder</p>
        <h2 className="ds-h1 brand-font">
          Your offer in. <span className="text-gradient">Your campaign out.</span>
        </h2>
        <p className="ds-subtitle mx-auto max-w-xl text-text-secondary">
          Give us your offer and AI will find the best opportunities, create your promotional content,
          and guide you step-by-step.
        </p>
      </div>

      <div className="card-base flex flex-col gap-6 p-6! sm:p-8!">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-bg-subtle)]">
            <LinkIcon size={18} className="text-[var(--gold)]" aria-hidden />
          </div>
          <div>
            <h3 className="ds-h3 inline-flex items-center gap-2">
              Paste your affiliate link
              <InfoHint
                label="What is an affiliate link?"
                text="Your affiliate link is your special tracking URL. When someone buys through it, you earn a commission."
              />
            </h3>
            <p className="mt-1 text-sm text-text-muted">We&apos;ll analyze your offer and build your campaign.</p>
          </div>
        </div>

        <Field
          type="url"
          placeholder="https://www.digistore24.com/redir/XXXXX/your-id/"
          value={affiliateLink}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && onSubmit()}
          error={error}
          aria-label="Affiliate link"
        />

        <button type="button" onClick={onSubmit} disabled={loading} className="btn-primary py-4 group">
          <Sparkles size={18} aria-hidden />
          <span>{loading ? "Analyzing..." : "Analyze My Offer"}</span>
          {!loading ? <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden /> : null}
        </button>

        {onNoLink ? (
          <button
            type="button"
            onClick={onNoLink}
            className="text-center text-sm font-medium text-text-muted transition-colors hover:text-[var(--gold)]"
          >
            I don&apos;t have a link yet
          </button>
        ) : null}
      </div>
    </section>
  );
}
