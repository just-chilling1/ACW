"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import { InlineError } from "@/components/ui/InlineError";
import { useSearch } from "@/context/SearchContext";
import { SetupWizard } from "@/components/traffic-machine/SetupWizard";
import { MagicMoment } from "@/components/traffic-machine/MagicMoment";
import { GuidedWorkflow } from "@/components/traffic-machine/GuidedWorkflow";
import { LinearStepRail, type RailStep } from "@/components/traffic-machine/LinearStepRail";
import { StepCelebration } from "@/components/traffic-machine/StepCelebration";
import { SimpleResultsStep } from "@/components/traffic-machine/SimpleResultsStep";
import { readLegacyCompletedIds, markLegacyMigrated, wasLegacyMigrated } from "@/lib/traffic-machine/migrate-local";
import type {
  ActivationRow,
  NextAction,
  ScoredOpportunity,
  PromotionKit,
  TrafficMachineRow,
} from "@/lib/traffic-machine/types";

type ActiveStep = 1 | 2 | 3;

type Celebration = {
  title: string;
  nextLabel: string;
  goTo: ActiveStep;
} | null;

export default function AutomatedProfitsPage() {
  const { affiliateLink } = useSearch();
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [machine, setMachine] = useState<TrafficMachineRow | null>(null);
  const [activations, setActivations] = useState<ActivationRow[]>([]);
  const [opportunities, setOpportunities] = useState<ScoredOpportunity[]>([]);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [activeStep, setActiveStep] = useState<ActiveStep>(1);
  const [celebration, setCelebration] = useState<Celebration>(null);
  const [workflowSourceId, setWorkflowSourceId] = useState<string | null>(null);
  const [promotionKit, setPromotionKit] = useState<PromotionKit | null>(null);
  const [loadingKit, setLoadingKit] = useState(false);
  const [stepInitialized, setStepInitialized] = useState(false);

  const activatedCount = useMemo(
    () => activations.filter((a) => a.status === "active").length,
    [activations],
  );

  const isSetupComplete = machine?.status === "ready";

  const workflowOpportunity = useMemo(
    () => opportunities.find((o) => o.source.id === workflowSourceId) || null,
    [opportunities, workflowSourceId],
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
        }
      } else {
        setMachine(data.machine);
        setActivations(data.activations || []);
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

  useEffect(() => {
    if (loading || stepInitialized) return;
    if (!isSetupComplete) {
      setActiveStep(1);
    } else if (activatedCount === 0) {
      setActiveStep(2);
    } else {
      setActiveStep(2);
    }
    setStepInitialized(true);
  }, [loading, stepInitialized, isSetupComplete, activatedCount]);

  const railSteps: RailStep[] = useMemo(() => {
    const statusFor = (step: ActiveStep): RailStep["status"] => {
      if (step === activeStep) return "current";
      if (step === 1) return isSetupComplete ? "complete" : "locked";
      if (step === 2) {
        if (!isSetupComplete) return "locked";
        return activatedCount > 0 ? "complete" : "available";
      }
      return activatedCount > 0 ? "complete" : "locked";
    };

    return [
      {
        id: 1,
        title: "Set up your machine",
        hint: isSetupComplete ? "Done — you can go back anytime" : "Paste your link and answer 2 questions",
        status: statusFor(1),
      },
      {
        id: 2,
        title: "Do today's task",
        hint: nextAction?.title || "One clear action — click, finish, done",
        status: statusFor(2),
      },
      {
        id: 3,
        title: "See your results",
        hint: activatedCount > 0 ? `${activatedCount} activated` : "Unlocks after your first task",
        status: statusFor(3),
      },
    ];
  }, [activeStep, isSetupComplete, activatedCount, nextAction?.title]);

  const handleSelectStep = (step: ActiveStep) => {
    const target = railSteps.find((s) => s.id === step);
    if (!target || target.status === "locked") return;
    setCelebration(null);
    setActiveStep(step);
  };

  const handleBuild = async (data: { offerUrl: string; audienceNiche: string; goal: string }) => {
    setBuilding(true);
    setError(null);
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
      setOpportunities(result.scored || []);
      await loadNextAction();
      const actRes = await fetch("/api/autopilot/machine");
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivations(actData.activations || []);
      }
      setCelebration({
        title: "Your Traffic Machine is ready",
        nextLabel: "Do today's task",
        goTo: 2,
      });
    } catch {
      setError("We couldn't build your Traffic Machine. Please try again.");
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
    setCelebration({
      title: "Task complete",
      nextLabel: "See your results",
      goTo: 3,
    });
  };

  const handleStartTodaysTask = () => {
    if (!nextAction) return;
    if (nextAction.type === "activate" && nextAction.sourceId) {
      handleStartOpportunity(nextAction.sourceId);
      return;
    }
    if (nextAction.type === "plan_day") {
      const current = machine?.plan?.days?.find((d) => d.status === "current");
      const firstId = current?.sourceIds?.find(
        (id) => !opportunities.find((o) => o.source.id === id && o.activated),
      );
      if (firstId) {
        handleStartOpportunity(firstId);
        return;
      }
    }
    if (nextAction.sourceId) {
      handleStartOpportunity(nextAction.sourceId);
    }
  };

  const celebrationDone = useCallback(() => {
    setCelebration((prev) => {
      if (prev) setActiveStep(prev.goTo);
      return null;
    });
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-12">
        <PageHeader eyebrow="PREMIUM" title="Automated Profits" subtitle="Loading your Traffic Machine…" />
        <div className="card-base p-12 text-center text-text-muted">Please wait…</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6 pb-16"
    >
      <PageHeader
        eyebrow="PREMIUM"
        title={
          <>
            Automated Profits — <span className="text-gradient">Traffic Machine</span>
          </>
        }
        subtitle="Follow the steps. One click at a time."
      />

      <TutorialVideoSection
        title="How Automated Profits Works"
        description="See how to set up your Traffic Machine and follow each step one click at a time."
      />

      {error ? <InlineError message={error} /> : null}

      <MagicMoment active={building} />

      {celebration ? (
        <StepCelebration
          title={celebration.title}
          nextLabel={celebration.nextLabel}
          onDone={celebrationDone}
        />
      ) : (
        <LinearStepRail steps={railSteps} activeStep={activeStep} onSelectStep={handleSelectStep}>
          {activeStep === 1 && (
            <div className="flex flex-col gap-4">
              {isSetupComplete ? (
                <>
                  <p className="text-sm text-text-secondary">
                    Your machine is already set up
                    {machine?.offer_url ? (
                      <>
                        {" "}
                        for <span className="font-medium text-text-primary">{machine.offer_url}</span>
                      </>
                    ) : null}
                    .
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => setActiveStep(2)} className="btn-primary">
                      Continue to today&apos;s task
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <SetupWizard
                  initialUrl={machine?.offer_url || affiliateLink || ""}
                  recommendedAudience={machine?.offer_snapshot?.recommendedAudienceMode}
                  onComplete={handleBuild}
                  loading={building}
                />
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="ds-h4">{nextAction?.title || "Activate your next opportunity"}</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  {nextAction?.description || "Click the button, follow the steps, then come back."}
                </p>
                {nextOpportunity && (
                  <p className="mt-2 text-sm font-semibold text-[var(--gold)]">
                    {nextOpportunity.source.name} · Score {nextOpportunity.score} · ~
                    {nextOpportunity.source.time.replace(/minutes?/i, "min")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setActiveStep(1)} className="btn-secondary">
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStartTodaysTask}
                  disabled={!nextAction || nextAction.type === "complete"}
                  className="btn-primary"
                >
                  {nextAction?.ctaLabel || "Start this task"}
                  <ArrowRight size={14} />
                </button>
                {activatedCount > 0 && (
                  <button type="button" onClick={() => setActiveStep(3)} className="btn-secondary">
                    See results
                  </button>
                )}
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <SimpleResultsStep
              activatedCount={activatedCount}
              bestSourceName={bestSource}
              nextTaskTitle={nextAction?.title}
              onBack={() => setActiveStep(2)}
              onDoAnother={() => setActiveStep(2)}
            />
          )}
        </LinearStepRail>
      )}

      <GuidedWorkflow
        key={workflowSourceId || "closed"}
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
    </motion.div>
  );
}
