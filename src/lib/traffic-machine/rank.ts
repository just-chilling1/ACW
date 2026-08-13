import type { NextAction, ScoredOpportunity, TrafficMachineRow } from "./types";

export function pickNextOpportunity(
  scored: ScoredOpportunity[],
  dismissedIds?: Set<string>,
): ScoredOpportunity | null {
  return (
    scored.find(
      (s) =>
        !s.activated &&
        s.activationStatus !== "dismissed" &&
        !(dismissedIds && dismissedIds.has(s.source.id)),
    ) || null
  );
}

export function buildNextAction(
  machine: TrafficMachineRow | null,
  scored: ScoredOpportunity[],
  activatedCount: number,
  dismissedIds?: Set<string>,
): NextAction {
  if (!machine || machine.status === "setup") {
    return {
      type: "setup",
      title: "Build your traffic machine",
      description: "Paste your link once — we write every submission for you.",
      ctaLabel: "Build my traffic machine",
    };
  }

  if (machine.status === "building") {
    return {
      type: "build",
      title: "Writing your submissions",
      description: "We're matching channels and preparing ready-to-paste packs.",
      ctaLabel: "Please wait…",
    };
  }

  const next = pickNextOpportunity(scored, dismissedIds);
  if (next) {
    return {
      type: "activate",
      title: next.source.name,
      description: next.reasons[0]
        ? `${next.reasons[0]}. Copy the pack, open the site, paste, and mark done.`
        : "Copy the pack we wrote, open the site, paste, and mark done.",
      sourceId: next.source.id,
      ctaLabel: "Start this source",
    };
  }

  const currentDay = machine.plan?.days?.find((d) => d.status === "current");
  if (
    currentDay &&
    currentDay.sourceIds.some(
      (id) =>
        !scored.find((s) => s.source.id === id && s.activated) &&
        !(dismissedIds && dismissedIds.has(id)),
    )
  ) {
    return {
      type: "plan_day",
      title: currentDay.title,
      description: currentDay.description,
      ctaLabel: "Continue today's plan",
    };
  }

  if (activatedCount >= 3) {
    return {
      type: "complete",
      title: "You're on a roll",
      description:
        "Every source you finished can keep sending visitors. Rebuild with a new niche anytime for more channels.",
      ctaLabel: "Change niche",
    };
  }

  return {
    type: "complete",
    title: "All matched sources done",
    description: "Nice work. Rebuild with a different niche to unlock more submission packs.",
    ctaLabel: "Change niche",
  };
}
