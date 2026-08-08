"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import type { CampaignStrategy } from "@/lib/campaign/types";
import { AiBadge } from "./ai-badge";

type CampaignStrategyProps = {
  strategy: CampaignStrategy;
  onBuildPack: () => void;
  loading?: boolean;
};

export function CampaignStrategyView({ strategy, onBuildPack, loading }: CampaignStrategyProps) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <AiBadge>AI Recommendation</AiBadge>
        <h2 className="ds-h2">Here&apos;s what I&apos;d do</h2>
      </div>

      <div className="card-base flex flex-col gap-6 p-6! sm:p-8!">
        <div>
          <h3 className="ds-h4 mb-2 text-text-muted">Recommended approach</h3>
          <p className="text-base leading-relaxed text-text-primary">{strategy.approach}</p>
        </div>
        <div>
          <h3 className="ds-h4 mb-2 text-text-muted">Best angle</h3>
          <p className="text-base leading-relaxed text-text-primary">{strategy.bestAngle}</p>
        </div>
        <div>
          <h3 className="ds-h4 mb-2 text-text-muted">Recommended CTA</h3>
          <p className="text-base leading-relaxed text-text-primary">{strategy.recommendedCta}</p>
        </div>

        <button type="button" onClick={onBuildPack} disabled={loading} className="btn-primary py-4 group">
          <Sparkles size={18} aria-hidden />
          <span>{loading ? "Building your pack..." : "Build My Promotion Pack"}</span>
          {!loading ? <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden /> : null}
        </button>
      </div>
    </section>
  );
}
