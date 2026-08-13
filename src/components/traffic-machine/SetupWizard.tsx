"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { Field } from "@/components/ui/field";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { APP_NICHES } from "@/lib/niches";

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

interface SetupWizardProps {
  initialUrl?: string;
  recommendedAudience?: string;
  onComplete: (data: { offerUrl: string; audienceNiche: string; goal: "passive" }) => void;
  loading?: boolean;
}

export function SetupWizard({
  initialUrl = "",
  recommendedAudience,
  onComplete,
  loading,
}: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [offerUrl, setOfferUrl] = useState(initialUrl);
  const [audience, setAudience] = useState(
    recommendedAudience && APP_NICHES.some((n) => n.id === recommendedAudience)
      ? recommendedAudience
      : "make_money_online",
  );
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleUrlNext = () => {
    const normalized = normalizeUrl(offerUrl);
    if (!normalized) {
      setUrlError("Enter a valid page or affiliate URL.");
      return;
    }
    setOfferUrl(normalized);
    setUrlError(null);
    setStep(2);
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
              step > s
                ? "bg-[var(--success)] text-[var(--text-on-accent)]"
                : step === s
                  ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                  : "border border-[var(--border-strong)] text-text-muted",
            )}
          >
            {step > s ? <CheckCircle2 size={16} /> : s}
          </div>
        ))}
        <p className="ml-2 text-sm text-text-muted">
          {step === 1 ? "Your link" : "Your niche"}
        </p>
      </div>

      {step === 1 && (
        <div className="surface-panel-elevated flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">What are you promoting?</h3>
            <p className="mt-1 text-sm text-text-muted">
              Paste your page or affiliate link once — we use it in every submission pack.
            </p>
          </div>
          <Field
            type="url"
            label="Your offer link"
            placeholder="https://your-affiliate-link.com/..."
            value={offerUrl}
            onChange={(e) => {
              setOfferUrl(e.target.value);
              setUrlError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlNext();
              }
            }}
          />
          {urlError ? <p className="text-sm text-[var(--error)]">{urlError}</p> : null}
          <button
            type="button"
            onClick={handleUrlNext}
            disabled={!offerUrl.trim()}
            className="btn-primary w-fit"
          >
            Continue
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="surface-panel-elevated flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Who do you want to reach?</h3>
            <p className="mt-1 text-sm text-text-muted">
              We match traffic channels and write packs for this niche.
            </p>
          </div>
          {recommendedAudience && APP_NICHES.some((n) => n.id === recommendedAudience) ? (
            <p className="text-sm text-[var(--gold-text)]">
              Suggested: {APP_NICHES.find((n) => n.id === recommendedAudience)?.label}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {APP_NICHES.map((niche) => (
              <SelectableChip
                key={niche.id}
                label={niche.label}
                selected={audience === niche.id}
                onClick={() => setAudience(niche.id)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                onComplete({ offerUrl, audienceNiche: audience, goal: "passive" })
              }
              className="btn-primary"
            >
              {loading ? "Writing submissions…" : "Write my submissions"}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
