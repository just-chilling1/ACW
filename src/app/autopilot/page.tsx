"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Pencil } from "lucide-react";
import { clsx } from "clsx";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { useSearch } from "@/context/SearchContext";
import { SetupWizard } from "@/components/traffic-machine/SetupWizard";
import { MagicMoment } from "@/components/traffic-machine/MagicMoment";
import { GuidedWorkflow } from "@/components/traffic-machine/GuidedWorkflow";
import { OpportunityCard } from "@/components/traffic-machine/OpportunityCard";
import { StepCelebration } from "@/components/traffic-machine/StepCelebration";
import {
  PremiumLandingShell,
  PremiumHero,
  PremiumSection,
  PremiumStateBlock,
} from "@/components/premium";
import { readLegacyCompletedIds, markLegacyMigrated, wasLegacyMigrated } from "@/lib/traffic-machine/migrate-local";
import { getNicheById } from "@/lib/niches";
import type {
  ActivationRow,
  NextAction,
  PromotionKit,
  ScoredOpportunity,
  TrafficMachineRow,
} from "@/lib/traffic-machine/types";

type BrowseFilter = "available" | "easy" | "done" | "all";

type Celebration = {
  title: string;
  nextLabel: string;
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
  const [celebration, setCelebration] = useState<Celebration>(null);
  const [workflowSourceId, setWorkflowSourceId] = useState<string | null>(null);
  const [promotionKit, setPromotionKit] = useState<PromotionKit | null>(null);
  const [loadingKit, setLoadingKit] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [editingSetup, setEditingSetup] = useState(false);
  const [browseFilter, setBrowseFilter] = useState<BrowseFilter>("available");

  const activatedCount = useMemo(
    () => activations.filter((a) => a.status === "active").length,
    [activations],
  );

  const isSetupComplete = machine?.status === "ready" && !editingSetup;

  const workflowOpportunity = useMemo(
    () => opportunities.find((o) => o.source.id === workflowSourceId) || null,
    [opportunities, workflowSourceId],
  );

  const nextOpportunity = useMemo(() => {
    if (nextAction?.sourceId) {
      return opportunities.find((o) => o.source.id === nextAction.sourceId) || null;
    }
    return opportunities.find((o) => !o.activated) || null;
  }, [nextAction, opportunities]);

  const availableCount = useMemo(
    () => opportunities.filter((o) => !o.activated).length,
    [opportunities],
  );

  const nicheLabel = getNicheById(machine?.audience_niche || "")?.label || "your niche";

  const filteredOpportunities = useMemo(() => {
    let list = opportunities;
    if (browseFilter === "available") list = list.filter((o) => !o.activated);
    else if (browseFilter === "easy") {
      list = list.filter((o) => !o.activated && o.source.difficulty.toLowerCase() === "easy");
    } else if (browseFilter === "done") list = list.filter((o) => o.activated);
    return [...list].sort((a, b) => {
      if (a.activated !== b.activated) return a.activated ? 1 : -1;
      return b.score - a.score;
    });
  }, [opportunities, browseFilter]);

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
      setError("We couldn't load Automated Profits. Please refresh the page.");
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
      setEditingSetup(false);
      await loadNextAction();
      const actRes = await fetch("/api/autopilot/machine");
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivations(actData.activations || []);
      }
      setCelebration({
        title: "Your traffic list is ready",
        nextLabel: "Start your first source",
      });
    } catch {
      setError("We couldn't build your traffic list. Please try again.");
    } finally {
      setBuilding(false);
    }
  };

  const handleStartOpportunity = (sourceId: string) => {
    setWorkflowError(null);
    setPromotionKit(null);
    setWorkflowSourceId(sourceId);
  };

  const handleGenerateKit = useCallback(async () => {
    if (!workflowSourceId) return;
    setLoadingKit(true);
    setWorkflowError(null);
    try {
      const res = await fetch(`/api/autopilot/opportunities/${workflowSourceId}/promotion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAi: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setPromotionKit(data.promotionKit);
      } else {
        setWorkflowError("Couldn't prepare promotion text. Try again.");
      }
    } catch {
      setWorkflowError("Couldn't prepare promotion text. Try again.");
    } finally {
      setLoadingKit(false);
    }
  }, [workflowSourceId]);

  const handleCompleteOpportunity = async () => {
    if (!workflowSourceId) return;
    setCompleting(true);
    setWorkflowError(null);
    try {
      const res = await fetch(`/api/autopilot/opportunities/${workflowSourceId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotionKit }),
      });
      if (!res.ok) {
        setWorkflowError("Couldn't mark this source done. Please try again.");
        return;
      }
      const data = await res.json();
      setMachine(data.machine);
      setNextAction(data.nextAction);
      setWorkflowSourceId(null);
      setPromotionKit(null);
      await Promise.all([loadOpportunities(), refresh()]);
      setCelebration({
        title: "Source marked done",
        nextLabel: "Continue",
      });
      setBrowseFilter("available");
    } catch {
      setWorkflowError("Couldn't mark this source done. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  const handleStartNext = () => {
    if (nextOpportunity && !nextOpportunity.activated) {
      handleStartOpportunity(nextOpportunity.source.id);
      return;
    }
    if (nextAction?.type === "activate" && nextAction.sourceId) {
      handleStartOpportunity(nextAction.sourceId);
      return;
    }
    if (nextAction?.type === "plan_day") {
      const current = machine?.plan?.days?.find((d) => d.status === "current");
      const firstId = current?.sourceIds?.find(
        (id) => !opportunities.find((o) => o.source.id === id && o.activated),
      );
      if (firstId) handleStartOpportunity(firstId);
    }
  };

  const celebrationDone = useCallback(() => {
    setCelebration(null);
  }, []);

  const progressPct =
    opportunities.length > 0 ? Math.round((activatedCount / opportunities.length) * 100) : 0;

  if (loading) {
    return (
      <PremiumLandingShell animate={false} className="autopilot-theme">
        <PremiumHero
          title={
            <>
              Automated <span className="text-gradient">Profits</span>
            </>
          }
          subtitle="Submit once — visitors keep coming. One source at a time."
        />
        <PremiumStateBlock rows={3} heightClassName="h-36" />
      </PremiumLandingShell>
    );
  }

  return (
    <PremiumLandingShell className="autopilot-theme">
      <PremiumHero
        title={
          <>
            Automated <span className="text-gradient">Profits</span>
          </>
        }
        subtitle="Submit once — visitors keep coming. One source at a time."
      />

      {error ? (
        <PremiumStateBlock variant="error" message={error} onRetry={refresh} />
      ) : null}

      <MagicMoment active={building} />

      {celebration ? (
        <StepCelebration
          title={celebration.title}
          nextLabel={celebration.nextLabel}
          onDone={celebrationDone}
        />
      ) : !isSetupComplete ? (
        <div className="flex flex-col gap-4">
          {editingSetup && machine?.status === "ready" ? (
            <button
              type="button"
              onClick={() => setEditingSetup(false)}
              className="btn-ghost w-fit text-sm"
            >
              Cancel — keep current setup
            </button>
          ) : null}
          <SetupWizard
            initialUrl={machine?.offer_url || affiliateLink || ""}
            recommendedAudience={machine?.offer_snapshot?.recommendedAudienceMode}
            onComplete={handleBuild}
            loading={building}
          />
        </div>
      ) : (
        <>
          <PremiumSection
            elevated
            title="Your progress"
            description={`Niche: ${nicheLabel}${
              machine?.offer_url
                ? ` · ${machine.offer_url.replace(/^https?:\/\//, "").slice(0, 40)}`
                : ""
            }`}
            meta={
              <button
                type="button"
                onClick={() => setEditingSetup(true)}
                className="btn-ghost text-sm"
              >
                <Pencil size={14} />
                Change setup
              </button>
            }
          >
            <p className="text-lg font-semibold text-text-primary">
              {activatedCount} of {opportunities.length} sources done
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--gold)] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </PremiumSection>

          <PremiumSection elevated title="Next source">
            {nextOpportunity && !nextOpportunity.activated ? (
              <>
                <h3 className="text-xl font-semibold text-text-primary sm:text-2xl">
                  {nextOpportunity.source.name}
                </h3>
                <p className="text-sm text-text-muted">
                  {nextAction?.description ||
                    nextOpportunity.reasons[0] ||
                    "Strong match for your niche — copy, submit, mark done."}
                </p>
                <p className="text-sm font-medium text-[var(--gold-text)]">
                  {nextOpportunity.source.difficulty} · ~
                  {nextOpportunity.source.time.replace(/minutes?/i, "min")} · Score{" "}
                  {nextOpportunity.score}
                </p>
                <button type="button" onClick={handleStartNext} className="btn-primary w-full sm:w-fit">
                  Start this source
                  <ArrowRight size={14} />
                </button>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--success)]">
                  All matched sources done
                </p>
                <h3 className="text-xl font-semibold text-text-primary">Nice work</h3>
                <p className="text-sm text-text-muted">
                  {nextAction?.description ||
                    "Browse your completed sources below, or change setup to unlock another niche."}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setBrowseFilter("done")}
                    className="btn-secondary"
                  >
                    <CheckCircle2 size={14} />
                    View completed
                  </button>
                  <button type="button" onClick={() => setEditingSetup(true)} className="btn-primary">
                    Change niche
                    <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}
          </PremiumSection>

          <PremiumSection
            title="Or pick a source"
            description="Skip ahead, knock out Easy wins first, or revisit what you've finished."
          >
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["available", `Available (${availableCount})`],
                  ["easy", "Easy first"],
                  ["done", `Done (${activatedCount})`],
                  ["all", "All"],
                ] as const
              ).map(([id, label]) => (
                <SelectableChip
                  key={id}
                  label={label}
                  selected={browseFilter === id}
                  onClick={() => setBrowseFilter(id)}
                />
              ))}
            </div>

            {filteredOpportunities.length === 0 ? (
              <PremiumStateBlock
                variant="empty"
                message={
                  browseFilter === "done"
                    ? "Nothing marked done yet — start the next source above."
                    : browseFilter === "easy"
                      ? "No Easy sources left. Try Available or All."
                      : "No sources in this view."
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredOpportunities.map((o) => (
                  <OpportunityCard
                    key={o.source.id}
                    opportunity={o}
                    recommended={o.source.id === nextOpportunity?.source.id && !o.activated}
                    onStart={handleStartOpportunity}
                  />
                ))}
              </div>
            )}
          </PremiumSection>

          {activatedCount > 0 ? (
            <section
              className={clsx(
                "rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4",
                "text-sm text-text-secondary",
              )}
            >
              Keep stacking submissions — each done source is another channel that can send clicks on autopilot.
            </section>
          ) : null}
        </>
      )}

      <GuidedWorkflow
        key={workflowSourceId || "closed"}
        opportunity={workflowOpportunity}
        promotionKit={promotionKit}
        loadingKit={loadingKit}
        completing={completing}
        error={workflowError}
        onClose={() => {
          setWorkflowSourceId(null);
          setPromotionKit(null);
          setWorkflowError(null);
        }}
        onGenerateKit={handleGenerateKit}
        onComplete={handleCompleteOpportunity}
      />
    </PremiumLandingShell>
  );
}
