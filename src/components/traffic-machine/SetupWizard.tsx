"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { Field } from "@/components/ui/field";
import { APP_NICHES } from "@/lib/niches";
import type { TrafficGoal } from "@/lib/traffic-machine/types";

const AUDIENCE_CARDS = [
  { id: "make_money_online", emoji: "💰", label: "Make Money" },
  { id: "relationships", emoji: "❤️", label: "Relationships" },
  { id: "health_fitness", emoji: "🏃", label: "Health & Fitness" },
  { id: "beauty_skincare", emoji: "✨", label: "Beauty & Lifestyle" },
  { id: "pets", emoji: "🐶", label: "Pets" },
  { id: "home_garden", emoji: "🏠", label: "Home & Family" },
  { id: "tech_gadgets", emoji: "💻", label: "Technology" },
  { id: "not_sure", emoji: "✏️", label: "I'm Not Sure" },
];

const GOAL_CARDS: { id: TrafficGoal; emoji: string; label: string }[] = [
  { id: "visitors", emoji: "👀", label: "More visitors" },
  { id: "clicks", emoji: "🖱️", label: "More clicks" },
  { id: "sales", emoji: "💰", label: "More sales" },
  { id: "passive", emoji: "🔄", label: "Long-term passive traffic" },
];

interface SetupWizardProps {
  initialUrl?: string;
  recommendedAudience?: string;
  onComplete: (data: { offerUrl: string; audienceNiche: string; goal: TrafficGoal }) => void;
  loading?: boolean;
}

export function SetupWizard({ initialUrl = "", recommendedAudience, onComplete, loading }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [offerUrl, setOfferUrl] = useState(initialUrl);
  const [audience, setAudience] = useState(recommendedAudience || "not_sure");
  const [goal, setGoal] = useState<TrafficGoal>("visitors");
  const [urlConfirmed, setUrlConfirmed] = useState(Boolean(initialUrl));

  const handleUrlNext = () => {
    if (!offerUrl.trim()) return;
    try {
      new URL(offerUrl);
      setUrlConfirmed(true);
      setStep(2);
    } catch {
      // Field validation handled by browser type=url
      setUrlConfirmed(true);
      setStep(2);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
              step >= s
                ? "bg-[var(--gold)] text-[var(--text-on-accent)]"
                : "border border-[var(--border-strong)] text-text-muted",
            )}
          >
            {step > s ? <CheckCircle2 size={16} /> : s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h3 className="ds-h3">What are you promoting?</h3>
          <p className="text-sm text-text-secondary">Paste your page or affiliate link</p>
          <Field
            type="url"
            placeholder="https://your-page-url.com"
            value={offerUrl}
            onChange={(e) => {
              setOfferUrl(e.target.value);
              setUrlConfirmed(false);
            }}
          />
          {urlConfirmed && offerUrl && (
            <p className="status-success inline-flex w-fit items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm">
              <CheckCircle2 size={14} />
              Link saved — we&apos;ll use this in your promotions
            </p>
          )}
          <button type="button" onClick={handleUrlNext} disabled={!offerUrl.trim()} className="btn-primary w-fit">
            Continue
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h3 className="ds-h3">Who do you want to reach?</h3>
          {recommendedAudience && recommendedAudience !== "not_sure" && (
            <p className="text-sm text-[var(--gold)]">
              Recommended: {APP_NICHES.find((n) => n.id === recommendedAudience)?.label}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AUDIENCE_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setAudience(card.id)}
                className={clsx(
                  "flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border p-4 text-center transition-all",
                  audience === card.id
                    ? "border-[var(--accent-border-strong)] bg-[var(--accent-bg-subtle)]"
                    : "border-[var(--border-strong)] hover:border-[var(--accent-border-soft)]",
                )}
              >
                <span className="text-2xl">{card.emoji}</span>
                <span className="text-sm font-medium text-text-primary">{card.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
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
        <div className="flex flex-col gap-4">
          <h3 className="ds-h3">What&apos;s your goal?</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GOAL_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setGoal(card.id)}
                className={clsx(
                  "flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border p-4 text-center transition-all",
                  goal === card.id
                    ? "border-[var(--accent-border-strong)] bg-[var(--accent-bg-subtle)]"
                    : "border-[var(--border-strong)] hover:border-[var(--accent-border-soft)]",
                )}
              >
                <span className="text-2xl">{card.emoji}</span>
                <span className="text-sm font-medium text-text-primary">{card.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onComplete({ offerUrl, audienceNiche: audience, goal })}
              className="btn-primary"
            >
              {loading ? "Building…" : "Build My Traffic Machine"}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
