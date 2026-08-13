"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Pencil,
  Rocket,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import {
  PremiumLandingShell,
  PremiumHero,
  PremiumSection,
  PremiumStateBlock,
} from "@/components/premium";
import { MissionFlow } from "@/components/traffic-machine/MissionFlow";
import { StepCelebration } from "@/components/traffic-machine/StepCelebration";
import { readLegacyCompletedIds, markLegacyMigrated, wasLegacyMigrated } from "@/lib/traffic-machine/migrate-local";
import { getNicheById } from "@/lib/niches";
import { TRAFFIC_SOURCES } from "@/lib/traffic-machine/sources";
import { coerceSubmissionPack } from "@/lib/traffic-machine/submission-pack";
import { pickNextOpportunity } from "@/lib/traffic-machine/rank";
import { useSearch } from "@/context/SearchContext";
import type {
  ActivationRow,
  ScoredOpportunity,
  SubmissionPack,
  TrafficMachineRow,
} from "@/lib/traffic-machine/types";

type Celebration = {
  title: string;
  nextLabel: string;
} | null;

const FLOW_STEPS = [
  {
    id: 1,
    label: "Paste your link",
    help: "We learn your offer and niche.",
    icon: Sparkles,
  },
  {
    id: 2,
    label: "We write every submission",
    help: "Ready-to-paste packs for each traffic channel.",
    icon: Copy,
  },
  {
    id: 3,
    label: "Copy → open → mark done",
    help: "One source at a time. Traffic can keep coming.",
    icon: ExternalLink,
  },
] as const;

function formatEstVisitors(n: number): string {
  if (n <= 0) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

function AutopilotContent() {
  const { affiliateLink } = useSearch();
  const searchParams = useSearchParams();
  const startMission = searchParams.get("mission") === "1";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [machine, setMachine] = useState<TrafficMachineRow | null>(null);
  const [activations, setActivations] = useState<ActivationRow[]>([]);
  const [opportunities, setOpportunities] = useState<ScoredOpportunity[]>([]);
  const [estimatedMonthlyVisitors, setEstimatedMonthlyVisitors] = useState(0);
  const [celebration, setCelebration] = useState<Celebration>(null);
  const [inMission, setInMission] = useState(false);
  const [missionSourceId, setMissionSourceId] = useState<string | null>(null);
  const [pack, setPack] = useState<SubmissionPack | null>(null);
  const [loadingPack, setLoadingPack] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [weekOpen, setWeekOpen] = useState(false);

  const activatedCount = useMemo(
    () => activations.filter((a) => a.status === "active").length,
    [activations],
  );

  const dismissedIds = useMemo(
    () => new Set(activations.filter((a) => a.status === "dismissed").map((a) => a.source_id)),
    [activations],
  );

  const nicheLabel = getNicheById(machine?.audience_niche || "")?.label || "your niche";

  const nextOpportunity = useMemo(() => {
    if (missionSourceId) {
      return opportunities.find((o) => o.source.id === missionSourceId) || null;
    }
    return pickNextOpportunity(opportunities, dismissedIds);
  }, [opportunities, missionSourceId, dismissedIds]);

  const weekPlan = machine?.plan?.days || [];

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
          body: JSON.stringify({
            legacyCompletedIds: legacyIds,
            offerUrl: affiliateLink || "",
          }),
        });
        markLegacyMigrated();
        const retry = await fetch("/api/autopilot/machine");
        if (retry.ok) {
          const retryData = await retry.json();
          setMachine(retryData.machine);
          setActivations(retryData.activations || []);
          setOpportunities(retryData.scored || []);
          setEstimatedMonthlyVisitors(retryData.estimatedMonthlyVisitors || 0);
        }
      } else {
        setMachine(data.machine);
        setActivations(data.activations || []);
        setOpportunities(data.scored || []);
        setEstimatedMonthlyVisitors(data.estimatedMonthlyVisitors || 0);
      }

      if ((!data.scored || data.scored.length === 0) && data.machine?.status === "ready") {
        const oppRes = await fetch("/api/autopilot/opportunities");
        if (oppRes.ok) {
          const oppData = await oppRes.json();
          setOpportunities(oppData.opportunities || []);
        }
      }
    } catch {
      setError("We couldn't load Automated Profits. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [affiliateLink]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (startMission && machine?.status === "ready" && !loading) {
      setInMission(true);
    }
  }, [startMission, machine?.status, loading]);

  const ensurePack = useCallback(async () => {
    if (!nextOpportunity) return;
    const sourceId = nextOpportunity.source.id;
    setLoadingPack(true);
    setMissionError(null);
    try {
      const existing = activations.find((a) => a.source_id === sourceId)?.promotion_kit;
      if (existing) {
        setPack(
          coerceSubmissionPack(
            existing,
            nextOpportunity.source,
            machine?.offer_url || "",
            machine?.offer_snapshot,
          ),
        );
        return;
      }
      const res = await fetch(`/api/autopilot/opportunities/${sourceId}/promotion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAi: true }),
      });
      if (!res.ok) throw new Error("pack");
      const data = await res.json();
      setPack(data.submissionPack || data.promotionKit);
      await refresh();
    } catch {
      setMissionError("Couldn't prepare this submission pack. Try again.");
    } finally {
      setLoadingPack(false);
    }
  }, [nextOpportunity, activations, machine, refresh]);

  const handleRegenerate = useCallback(async () => {
    if (!nextOpportunity) return;
    setRegenerating(true);
    setMissionError(null);
    try {
      const res = await fetch(
        `/api/autopilot/opportunities/${nextOpportunity.source.id}/regenerate`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error("regen");
      const data = await res.json();
      setPack(data.submissionPack || data.promotionKit);
    } catch {
      setMissionError("Couldn't rewrite this pack. Try again.");
    } finally {
      setRegenerating(false);
    }
  }, [nextOpportunity]);

  const handleComplete = async () => {
    if (!nextOpportunity) return;
    setCompleting(true);
    setMissionError(null);
    try {
      const res = await fetch(
        `/api/autopilot/opportunities/${nextOpportunity.source.id}/activate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promotionKit: pack, submissionPack: pack }),
        },
      );
      if (!res.ok) {
        setMissionError("Couldn't mark this source done. Please try again.");
        return;
      }
      setPack(null);
      setMissionSourceId(null);
      await refresh();
      const nextName =
        pickNextOpportunity(
          /* refreshed below via state — use optimistic */ opportunities
            .map((o) =>
              o.source.id === nextOpportunity.source.id ? { ...o, activated: true } : o,
            ),
          dismissedIds,
        )?.source.name || "your next source";
      setCelebration({
        title: "Channel is live",
        nextLabel: nextName,
      });
    } catch {
      setMissionError("Couldn't mark this source done. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  const handleSkip = async () => {
    if (!nextOpportunity) return;
    setSkipping(true);
    setMissionError(null);
    try {
      const res = await fetch(
        `/api/autopilot/opportunities/${nextOpportunity.source.id}/dismiss`,
        { method: "POST" },
      );
      if (!res.ok) {
        setMissionError("Couldn't skip this source. Please try again.");
        return;
      }
      setPack(null);
      setMissionSourceId(null);
      await refresh();
    } catch {
      setMissionError("Couldn't skip this source. Please try again.");
    } finally {
      setSkipping(false);
    }
  };

  const celebrationDone = useCallback(() => {
    setCelebration(null);
    setInMission(true);
  }, []);

  const sourceName = (id: string) =>
    TRAFFIC_SOURCES.find((s) => s.id === id)?.name || id;

  if (loading) {
    return (
      <PremiumLandingShell animate={false}>
        <PremiumHero
          title={
            <>
              Automated <span className="text-gradient">Profits</span>
            </>
          }
          subtitle="We write the submissions. You paste them."
        />
        <PremiumStateBlock rows={3} heightClassName="h-36" />
      </PremiumLandingShell>
    );
  }

  const isReady = machine?.status === "ready";
  const showMission = isReady && (inMission || celebration) && nextOpportunity;

  return (
    <PremiumLandingShell>
      <PremiumHero
        title={
          <>
            Automated <span className="text-gradient">Profits</span>
          </>
        }
        subtitle="We write the submissions. You paste them. One source at a time — traffic can keep coming."
      />

      {error ? (
        <PremiumStateBlock variant="error" message={error} onRetry={refresh} />
      ) : null}

      <TutorialVideoSection
        title="How Automated Profits Works"
        description="Paste your link, get ready-made submission packs, then copy → open → mark done."
        videoId="1214661265"
      />

      {celebration ? (
        <StepCelebration
          title={celebration.title}
          nextLabel={celebration.nextLabel}
          onDone={celebrationDone}
        />
      ) : null}

      {!isReady ? (
        <>
          <PremiumSection
            elevated
            title="Start here"
            description="Paste your offer once. We match free traffic channels and write every submission for you."
          >
            <Link
              href="/autopilot/build"
              className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base"
            >
              <Rocket size={18} />
              Build my traffic machine
            </Link>
          </PremiumSection>

          <PremiumSection title="How it works">
            <div className="grid gap-3 sm:grid-cols-3">
              {FLOW_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-3)] text-[var(--gold-text)]">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        Step {step.id}: {step.label}
                      </p>
                      <p className="text-xs text-text-muted">{step.help}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </PremiumSection>
        </>
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
              <Link href="/autopilot/build" className="btn-ghost text-sm">
                <Pencil size={14} />
                Change setup
              </Link>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Channels live
                </p>
                <p className="text-2xl font-semibold text-text-primary">{activatedCount}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Est. monthly visitors
                </p>
                <p className="text-2xl font-semibold text-text-primary">
                  ~{formatEstVisitors(estimatedMonthlyVisitors)}
                </p>
              </div>
            </div>
            <p className="text-sm text-text-muted">
              Each done source can keep sending visitors for months.
            </p>
          </PremiumSection>

          {!celebration && showMission && nextOpportunity ? (
            <PremiumSection elevated title="Today's mission">
              <MissionFlow
                opportunity={nextOpportunity}
                pack={pack}
                loadingPack={loadingPack}
                regenerating={regenerating}
                completing={completing}
                skipping={skipping}
                error={missionError}
                onEnsurePack={ensurePack}
                onRegenerate={handleRegenerate}
                onComplete={handleComplete}
                onSkip={handleSkip}
              />
            </PremiumSection>
          ) : null}

          {!celebration && !showMission ? (
            <PremiumSection
              elevated
              title={nextOpportunity ? "Continue where you left off" : "Nice work"}
              description={
                nextOpportunity
                  ? "Your next submission pack is ready — copy, open the site, paste, mark done."
                  : "Rebuild with a different niche to unlock more channels."
              }
            >
              {nextOpportunity ? (
                <>
                  <p className="text-xl font-semibold text-text-primary">
                    {nextOpportunity.source.name}
                  </p>
                  <p className="text-sm text-text-muted">
                    {nextOpportunity.reasons[0] ||
                      `${nextOpportunity.source.difficulty} · ~${nextOpportunity.source.time}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMissionSourceId(nextOpportunity.source.id);
                      setPack(null);
                      setInMission(true);
                    }}
                    className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base sm:w-fit"
                  >
                    Continue — next source ready
                    <ArrowRight size={18} />
                  </button>
                </>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <p className="flex items-center gap-2 text-sm text-[var(--success)]">
                    <CheckCircle2 size={16} />
                    All matched sources done for this niche
                  </p>
                  <Link href="/autopilot/build" className="btn-primary">
                    Change niche
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </PremiumSection>
          ) : null}

          {weekPlan.length > 0 ? (
            <PremiumSection
              title="This week"
              description="A simple checklist — not a library. Open today's mission above to submit."
              meta={
                <button
                  type="button"
                  onClick={() => setWeekOpen((v) => !v)}
                  className="btn-ghost text-sm"
                >
                  {weekOpen ? "Hide" : "Show"}
                </button>
              }
            >
              {weekOpen ? (
                <ul className="flex flex-col gap-3">
                  {weekPlan.map((day) => (
                    <li
                      key={day.dayIndex}
                      className={clsx(
                        "rounded-[var(--radius-md)] border px-3 py-3",
                        day.status === "current"
                          ? "border-[var(--gold)] bg-[var(--surface-2)]"
                          : "border-[var(--border-subtle)]",
                      )}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        {day.label} · {day.status}
                      </p>
                      <p className="text-sm font-semibold text-text-primary">{day.title}</p>
                      <ul className="mt-2 flex flex-col gap-1 text-sm text-text-secondary">
                        {day.sourceIds.map((id) => {
                          const done = activations.some(
                            (a) => a.source_id === id && a.status === "active",
                          );
                          return (
                            <li key={id} className="flex items-center gap-2">
                              {done ? (
                                <CheckCircle2 size={14} className="text-[var(--success)]" />
                              ) : (
                                <span className="h-3.5 w-3.5 rounded-full border border-[var(--border-strong)]" />
                              )}
                              {sourceName(id)}
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted">
                  {weekPlan.find((d) => d.status === "current")?.title ||
                    "Your first-week plan is ready when you are."}
                </p>
              )}
            </PremiumSection>
          ) : null}
        </>
      )}
    </PremiumLandingShell>
  );
}

export default function AutomatedProfitsPage() {
  return (
    <Suspense
      fallback={
        <PremiumLandingShell animate={false}>
          <PremiumStateBlock rows={3} heightClassName="h-36" />
        </PremiumLandingShell>
      }
    >
      <AutopilotContent />
    </Suspense>
  );
}
