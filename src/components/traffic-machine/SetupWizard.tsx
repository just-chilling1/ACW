"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { Field } from "@/components/ui/field";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { APP_NICHES } from "@/lib/niches";
import type { TrafficGoal } from "@/lib/traffic-machine/types";

const GOAL_OPTIONS: { id: TrafficGoal; label: string; hint: string }[] = [
  { id: "visitors", label: "More visitors", hint: "Steady traffic to your page" },
  { id: "clicks", label: "More clicks", hint: "People who click your link" },
  { id: "sales", label: "More sales", hint: "Buyers ready to convert" },
  { id: "passive", label: "Passive traffic", hint: "Listings that keep working" },
];

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
  onComplete: (data: { offerUrl: string; audienceNiche: string; goal: TrafficGoal }) => void;
  loading?: boolean;
}

export function SetupWizard({ initialUrl = "", recommendedAudience, onComplete, loading }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [offerUrl, setOfferUrl] = useState(initialUrl);
  const [audience, setAudience] = useState(
    recommendedAudience && APP_NICHES.some((n) => n.id === recommendedAudience)
      ? recommendedAudience
      : "make_money_online",
  );
  const [goal, setGoal] = useState<TrafficGoal>("visitors");
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
        {[1, 2, 3].map((s) => (
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
          {step === 1 ? "Your link" : step === 2 ? "Your niche" : "Your goal"}
        </p>
      </div>

      {step === 1 && (
        <div className="surface-panel-elevated flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">What are you promoting?</h3>
            <p className="mt-1 text-sm text-text-muted">Paste your page or affiliate link once — we use it in every submission.</p>
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
          <button type="button" onClick={handleUrlNext} disabled={!offerUrl.trim()} className="btn-primary w-fit">
            Continue
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="surface-panel-elevated flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Who do you want to reach?</h3>
            <p className="mt-1 text-sm text-text-muted">We rank traffic sources that match this niche.</p>
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
            <button type="button" onClick={() => setStep(3)} className="btn-primary">
              Continue
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="surface-panel-elevated flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">What&apos;s your goal?</h3>
            <p className="mt-1 text-sm text-text-muted">We prioritize sources that fit how you want to grow.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {GOAL_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setGoal(option.id)}
                className={clsx(
                  "rounded-[var(--radius-md)] border px-4 py-3 text-left transition-colors",
                  goal === option.id
                    ? "border-[var(--accent-border-strong)] bg-[var(--accent-bg-subtle)]"
                    : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]",
                )}
              >
                <span className="block text-sm font-semibold text-text-primary">{option.label}</span>
                <span className="mt-0.5 block text-xs text-text-muted">{option.hint}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onComplete({ offerUrl, audienceNiche: audience, goal })}
              className="btn-primary"
            >
              {loading ? "Building…" : "Build my traffic list"}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
