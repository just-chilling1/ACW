"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { InlineError } from "@/components/ui/InlineError";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { BuildSequence } from "@/components/traffic-machine/BuildSequence";
import { APP_NICHES, detectNicheFromText } from "@/lib/niches";
import { dedupeOffersByUrl } from "@/lib/dfy/offer-url";
import type { OfferSnapshot } from "@/lib/dfy/types";
import type { MachineBuildProgress } from "@/lib/traffic-machine/types";
import { useSearch } from "@/context/SearchContext";

type Step = 1 | 2 | 3;

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

function BuildContent() {
  const router = useRouter();
  const { affiliateLink } = useSearch();
  const [step, setStep] = useState<Step>(1);
  const [offerUrl, setOfferUrl] = useState(affiliateLink || "");
  const [audience, setAudience] = useState("make_money_online");
  const [building, setBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState<MachineBuildProgress>({
    completedStages: [],
  });
  const [error, setError] = useState("");
  const [savedOffers, setSavedOffers] = useState<
    Array<{ id: string; url: string; name: string; snapshot: OfferSnapshot }>
  >([]);

  useEffect(() => {
    fetch("/api/dfy/offers")
      .then((r) => r.json())
      .then((d) => setSavedOffers(dedupeOffersByUrl(d.offers || [])))
      .catch(() => setSavedOffers([]));
  }, []);

  const handleContinueFromUrl = () => {
    const normalized = normalizeUrl(offerUrl);
    if (!normalized) {
      setError("Paste a valid page or affiliate link.");
      return;
    }
    setOfferUrl(normalized);
    setError("");

    const match = savedOffers.find((o) => o.url === normalized);
    if (match?.snapshot) {
      const text = `${match.snapshot.productName} ${match.snapshot.mainPromise} ${match.snapshot.category}`;
      if (
        match.snapshot.recommendedAudienceMode &&
        match.snapshot.recommendedAudienceMode !== "auto"
      ) {
        setAudience(match.snapshot.recommendedAudienceMode);
      } else {
        setAudience(detectNicheFromText(text));
      }
    }
    setStep(2);
  };

  const handleBuild = async () => {
    setError("");
    setBuilding(true);
    setStep(3);
    setBuildProgress({ currentStage: "understand_offer", completedStages: [] });

    const poll = window.setInterval(async () => {
      try {
        const progRes = await fetch("/api/autopilot/machine");
        const progData = await progRes.json();
        if (progData.buildProgress) setBuildProgress(progData.buildProgress);
      } catch {
        /* ignore */
      }
    }, 1500);

    try {
      const res = await fetch("/api/autopilot/machine/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerUrl,
          audienceNiche: audience,
          goal: "passive",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "build failed");

      setBuildProgress({
        completedStages: [
          "understand_offer",
          "match_channels",
          "write_submissions",
          "build_plan",
          "finalize",
        ],
      });
      router.replace("/autopilot?mission=1");
    } catch {
      setError("We couldn't build your traffic machine. Please try again.");
      setStep(2);
    } finally {
      window.clearInterval(poll);
      setBuilding(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
      <Link
        href="/autopilot"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <PageHeader
        title="Build your traffic machine"
        subtitle="Paste your link once. We write the submissions — you just copy and paste."
      />

      {error ? <InlineError message={error} /> : null}

      {step === 1 && (
        <section className="flex flex-col gap-4">
          <Field
            label="Your offer or affiliate link"
            value={offerUrl}
            onChange={(e) => setOfferUrl(e.target.value)}
            placeholder="https://…"
          />

          {savedOffers.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Or pick a saved offer
              </p>
              <div className="flex flex-wrap gap-2">
                {savedOffers.slice(0, 6).map((offer) => (
                  <SelectableChip
                    key={offer.id}
                    label={offer.name || offer.url}
                    selected={offerUrl === offer.url}
                    onClick={() => setOfferUrl(offer.url)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <button type="button" onClick={handleContinueFromUrl} className="btn-primary w-fit">
            Continue
            <ArrowRight size={14} />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Your niche</p>
            <p className="mt-1 text-sm text-text-secondary">
              We&apos;ll match free traffic channels and write packs for this audience.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {APP_NICHES.map((n) => (
              <SelectableChip
                key={n.id}
                label={n.label}
                selected={audience === n.id}
                onClick={() => setAudience(n.id)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button type="button" onClick={handleBuild} className="btn-primary" disabled={building}>
              <Sparkles size={16} />
              Write my submissions
            </button>
          </div>
        </section>
      )}

      {step === 3 && <BuildSequence progress={buildProgress} active={building} />}
    </div>
  );
}

export default function AutopilotBuildPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-text-muted">Loading…</div>
      }
    >
      <BuildContent />
    </Suspense>
  );
}
