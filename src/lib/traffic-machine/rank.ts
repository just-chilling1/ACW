import type { NextAction, ScoredOpportunity, TrafficMachineRow } from "./types";

export function pickNextOpportunity(scored: ScoredOpportunity[]): ScoredOpportunity | null {
  return scored.find((s) => !s.activated) || null;
}

export function buildNextAction(
  machine: TrafficMachineRow | null,
  scored: ScoredOpportunity[],
  activatedCount: number,
): NextAction {
  if (!machine || machine.status === "setup") {
    return {
      type: "setup",
      title: "Build Your Traffic Machine",
      description: "Tell us what you're promoting and who you want to reach. We'll build your plan.",
      ctaLabel: "Start Setup",
    };
  }

  if (machine.status === "building") {
    return {
      type: "build",
      title: "Building your Traffic Machine",
      description: "We're analyzing your offer and ranking opportunities.",
      ctaLabel: "Please wait…",
    };
  }

  const next = pickNextOpportunity(scored);
  if (next) {
    return {
      type: "activate",
      title: `Activate ${next.source.name}`,
      description: next.reasons[0]
        ? `${next.reasons[0]}. This opportunity is easy to start and matches your goal.`
        : "People in your audience are active here — this is a strong place to start.",
      sourceId: next.source.id,
      ctaLabel: "Start This Opportunity",
    };
  }

  const currentDay = machine.plan?.days?.find((d) => d.status === "current");
  if (currentDay && currentDay.sourceIds.some((id) => !scored.find((s) => s.source.id === id && s.activated))) {
    return {
      type: "plan_day",
      title: currentDay.title,
      description: currentDay.description,
      ctaLabel: "Start Today's Tasks",
    };
  }

  if (activatedCount >= 3) {
    return {
      type: "complete",
      title: "You're on a roll",
      description: "Every source you finished can keep sending visitors. Browse below or change niche to unlock more.",
      ctaLabel: "Browse sources",
    };
  }

  return {
    type: "complete",
    title: "All matched sources done",
    description: "Browse your completed list below, or rebuild with a different niche for more sources.",
    ctaLabel: "Browse sources",
  };
}
