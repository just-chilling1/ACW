"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { VideoOverlay } from "@/components/ui/video-overlay";
import { useSearch } from "@/context/SearchContext";
import { TrafficMachineHero } from "@/components/traffic-machine/TrafficMachineHero";
import { SetupWizard } from "@/components/traffic-machine/SetupWizard";
import { MagicMoment } from "@/components/traffic-machine/MagicMoment";
import { MachineReadySummary } from "@/components/traffic-machine/MachineReadySummary";
import { MachineVisualization } from "@/components/traffic-machine/MachineVisualization";
import { NextBestAction } from "@/components/traffic-machine/NextBestAction";
import { OpportunityCard } from "@/components/traffic-machine/OpportunityCard";
import { GuidedWorkflow } from "@/components/traffic-machine/GuidedWorkflow";
import { SevenDayPlan } from "@/components/traffic-machine/SevenDayPlan";
import { NewOpportunities } from "@/components/traffic-machine/NewOpportunities";
import { MachineHealth } from "@/components/traffic-machine/MachineHealth";
import { TrafficResults } from "@/components/traffic-machine/TrafficResults";
import { TrafficExperiments } from "@/components/traffic-machine/TrafficExperiments";
import { MachineProgression } from "@/components/traffic-machine/MachineProgression";
import { WhatNextButton } from "@/components/traffic-machine/WhatNextButton";
import { buildHealthSummary } from "@/lib/traffic-machine/health";
import { buildProgression } from "@/lib/traffic-machine/stage";
import { readLegacyCompletedIds, markLegacyMigrated, wasLegacyMigrated } from "@/lib/traffic-machine/migrate-local";
import type {
  ActivationRow,
  NextAction,
  OpportunitySummary,
  PromotionKit,
  ScoredOpportunity,
  TrafficMachineRow,
} from "@/lib/traffic-machine/types";

const AUTOPILOT_VIDEO_ID = "1214661265";

export default function AutomatedProfitsPage() {
  const { affiliateLink } = useSearch();
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [machine, setMachine] = useState<TrafficMachineRow | null>(null);
  const [activations, setActivations] = useState<ActivationRow[]>([]);
  const [opportunities, setOpportunities] = useState<ScoredOpportunity[]>([]);
  const [summary, setSummary] = useState<OpportunitySummary | null>(null);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showReadyBanner, setShowReadyBanner] = useState(false);
  const [workflowSourceId, setWorkflowSourceId] = useState<string | null>(null);
  const [promotionKit, setPromotionKit] = useState<PromotionKit | null>(null);
  const [loadingKit, setLoadingKit] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [showAllOpportunities, setShowAllOpportunities] = useState(false);
  const [showVideoSection, setShowVideoSection] = useState(false);

  const activatedCount = useMemo(
    () => activations.filter((a) => a.status === "active").length,
    [activations],
  );

  const workflowOpportunity = useMemo(
    () => opportunities.find((o) => o.source.id === workflowSourceId) || null,
    [opportunities, workflowSourceId],
  );

  const loadOpportunities = useCallback(async () => {
    const res = await fetch("/api/autopilot/opportunities");
    if (res.ok) {
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    }
  }, []);

  const loadNextAction = useCallback(async () => {
    const res = await fetch("/api/autopilot/next-action");
    if (res.ok) {
      const data = await res.json();
      setNextAction(data.nextAction);
    }
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const legacyIds = !wasLegacyMigrated() ? readLegacyCompletedIds() : [];
      const res = await fetch("/api/autopilot/machine");
      if (!res.ok) throw new Error("load");
      const data = await res.json();

      if (!data.machine && legacyIds.length > 0) {
        await fetch("/api/autopilot/machine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ legacyCompletedIds: legacyIds, offerUrl: affiliateLink || "" }),
        });
        markLegacyMigrated();
        const retry = await fetch("/api/autopilot/machine");
        if (retry.ok) {
          const retryData = await retry.json();
          setMachine(retryData.machine);
          setActivations(retryData.activations || []);
          setSummary(retryData.summary);
        }
      } else {
        setMachine(data.machine);
        setActivations(data.activations || []);
        setSummary(data.summary);
      }

      await Promise.all([loadOpportunities(), loadNextAction()]);
    } catch {
      setError("We couldn't load your Traffic Machine. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [affiliateLink, loadOpportunities, loadNextAction]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleBuild = async (data: { offerUrl: string; audienceNiche: string; goal: string }) => {
    setBuilding(true);
    setError(null);
    setShowWizard(false);
    try {
      const res = await fetch("/api/autopilot/machine/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "build failed");
      }
      const result = await res.json();
      setMachine(result.machine);
      setSummary(result.summary);
      setOpportunities(result.scored || []);
      setShowReadyBanner(true);
      await loadNextAction();
      const actRes = await fetch("/api/autopilot/machine");
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivations(actData.activations || []);
      }
    } catch {
      setError("We couldn't build your Traffic Machine. Please try again.");
      setShowWizard(true);
    } finally {
      setBuilding(false);
    }
  };

  const handleStartOpportunity = (sourceId: string) => {
    setWorkflowSourceId(sourceId);
    setPromotionKit(null);
  };

  const handleGenerateKit = async () => {
    if (!workflowSourceId) return;
    setLoadingKit(true);
    try {
      const res = await fetch(`/api/autopilot/opportunities/${workflowSourceId}/promotion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAi: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setPromotionKit(data.promotionKit);
      }
    } finally {
      setLoadingKit(false);
    }
  };

  const handleCompleteOpportunity = async () => {
    if (!workflowSourceId) return;
    const res = await fetch(`/api/autopilot/opportunities/${workflowSourceId}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promotionKit }),
    });
    if (res.ok) {
      const data = await res.json();
      setMachine(data.machine);
      setNextAction(data.nextAction);
      await Promise.all([loadOpportunities(), refresh()]);
    }
    setWorkflowSourceId(null);
    setPromotionKit(null);
  };

  const handleNextAction = () => {
    if (!nextAction) return;
    switch (nextAction.type) {
      case "setup":
        setShowWizard(true);
        document.getElementById("traffic-setup")?.scrollIntoView({ behavior: "smooth" });
        break;
      case "activate":
        if (nextAction.sourceId) handleStartOpportunity(nextAction.sourceId);
        break;
      case "plan_day": {
        const current = machine?.plan?.days?.find((d) => d.status === "current");
        const firstId = current?.sourceIds?.find(
          (id) => !opportunities.find((o) => o.source.id === id && o.activated),
        );
        if (firstId) handleStartOpportunity(firstId);
        else document.getElementById("seven-day-plan")?.scrollIntoView({ behavior: "smooth" });
        break;
      }
      case "review_health":
        document.getElementById("machine-health")?.scrollIntoView({ behavior: "smooth" });
        break;
      default:
        document.getElementById("opportunities")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const health = useMemo(
    () => buildHealthSummary(opportunities, activations),
    [opportunities, activations],
  );

  const progression = useMemo(
    () =>
      buildProgression(
        activatedCount,
        opportunities.length,
        machine?.status || "setup",
      ),
    [activatedCount, opportunities.length, machine?.status],
  );

  const nextOpportunity = useMemo(() => {
    if (!nextAction?.sourceId) return null;
    return opportunities.find((o) => o.source.id === nextAction.sourceId) || null;
  }, [nextAction, opportunities]);

  const bestSource = useMemo(() => {
    const activated = opportunities.filter((o) => o.activated);
    if (!activated.length) return undefined;
    return [...activated].sort((a, b) => b.score - a.score)[0]?.source.name;
  }, [opportunities]);

  const visibleOpportunities = showAllOpportunities ? opportunities : opportunities.slice(0, 6);
  const isReady = machine?.status === "ready";
  const showCommandCenter = isReady && !showWizard;

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-12">
        <PageHeader eyebrow="PREMIUM" title="Automated Profits" subtitle="Loading your Traffic Machine…" />
        <div className="card-base p-12 text-center text-text-muted">Please wait…</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-6 pb-28"
    >
      <PageHeader
        eyebrow="PREMIUM"
        title={
          <>
            Automated Profits — <span className="text-gradient">Traffic Machine</span>
          </>
        }
        subtitle="Your personal traffic assistant — we tell you where to promote, what to write, and what to do next."
      />

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      <MagicMoment active={building} />

      <TrafficMachineHero
        configured={Boolean(machine?.status === "ready")}
        onPrimaryAction={() => {
          if (machine?.status === "ready") {
            document.getElementById("next-action")?.scrollIntoView({ behavior: "smooth" });
          } else {
            setShowWizard(true);
            document.getElementById("traffic-setup")?.scrollIntoView({ behavior: "smooth" });
          }
        }}
      />

      {(showWizard || !machine || machine.status === "setup") && !building && (
        <div id="traffic-setup">
          <SetupWizard
            initialUrl={machine?.offer_url || affiliateLink || ""}
            recommendedAudience={machine?.offer_snapshot?.recommendedAudienceMode}
            onComplete={handleBuild}
            loading={building}
          />
        </div>
      )}

      {showReadyBanner && summary && (
        <MachineReadySummary summary={summary} />
      )}

      {showCommandCenter && (
        <>
          <div id="next-action">
            {nextAction && (
              <NextBestAction
                action={nextAction}
                opportunity={nextOpportunity}
                onAction={handleNextAction}
              />
            )}
          </div>

          <MachineProgression progression={progression} />

          <MachineVisualization opportunities={opportunities} activatedCount={activatedCount} />

          <div id="seven-day-plan">
            <SevenDayPlan
              days={machine.plan?.days || []}
              onStartToday={handleNextAction}
            />
          </div>

          <NewOpportunities opportunities={opportunities} onActivate={handleStartOpportunity} />

          <section id="opportunities" className="flex flex-col gap-4">
            <h2 className="ds-h3">Your Opportunities</h2>
            {opportunities.length === 0 ? (
              <div className="card-base p-8 text-center">
                <p className="text-text-secondary">Your Traffic Machine is waiting for its first source.</p>
                <button type="button" onClick={() => nextAction && handleNextAction()} className="btn-primary mt-4">
                  Activate Your First Opportunity
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {visibleOpportunities.map((o) => (
                    <OpportunityCard key={o.source.id} opportunity={o} onStart={handleStartOpportunity} />
                  ))}
                </div>
                {opportunities.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllOpportunities((v) => !v)}
                    className="btn-secondary mx-auto flex items-center gap-2"
                  >
                    {showAllOpportunities ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showAllOpportunities ? "Show fewer" : `Show all ${opportunities.length} opportunities`}
                  </button>
                )}
              </>
            )}
          </section>

          <div id="machine-health">
            <MachineHealth health={health} onReview={handleStartOpportunity} />
          </div>

          <TrafficResults activatedCount={activatedCount} bestSourceName={bestSource} />

          <TrafficExperiments experiments={machine.experiments || []} />

          <section className="card-base overflow-hidden p-0!">
            <button
              type="button"
              onClick={() => setShowVideoSection((v) => !v)}
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <span className="ds-h5">Watch: How Automated Profits Works</span>
              {showVideoSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showVideoSection && (
              <div className="border-t border-[var(--border-subtle)]">
                <VideoThumbnail
                  videoId={AUTOPILOT_VIDEO_ID}
                  title="How to Use Automated Profits"
                  onPlay={() => setVideoOpen(true)}
                  className="rounded-none border-0"
                />
              </div>
            )}
          </section>
        </>
      )}

      {isReady && <WhatNextButton onClick={handleNextAction} />}

      <GuidedWorkflow
        opportunity={workflowOpportunity}
        promotionKit={promotionKit}
        loadingKit={loadingKit}
        onClose={() => {
          setWorkflowSourceId(null);
          setPromotionKit(null);
        }}
        onGenerateKit={handleGenerateKit}
        onComplete={handleCompleteOpportunity}
      />

      <VideoOverlay
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        videoUrl={`https://player.vimeo.com/video/${AUTOPILOT_VIDEO_ID}`}
        title="How to Use Automated Profits"
      />
    </motion.div>
  );
}
