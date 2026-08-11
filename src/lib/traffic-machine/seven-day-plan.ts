import type { ScoredOpportunity, SevenDayPlanDay } from "./types";

const DAY_LABELS = ["TODAY", "TOMORROW", "DAY 3", "DAY 4", "DAY 5", "DAY 6", "DAY 7"];

function pickByBucket(scored: ScoredOpportunity[], bucket: ScoredOpportunity["bucket"], count: number): string[] {
  return scored.filter((s) => s.bucket === bucket && !s.activated).slice(0, count).map((s) => s.source.id);
}

function pickEasy(scored: ScoredOpportunity[], count: number): string[] {
  return scored
    .filter((s) => !s.activated && s.source.difficulty === "Easy")
    .slice(0, count)
    .map((s) => s.source.id);
}

export function generateSevenDayPlan(scored: ScoredOpportunity[], activatedIds: Set<string>): SevenDayPlanDay[] {
  const incomplete = scored.filter((s) => !activatedIds.has(s.source.id));
  const templates = [
    { title: "Activate 3 Quick Wins", bucket: "quick_win" as const, count: 3, minutes: 25 },
    { title: "Activate 3 Community Opportunities", types: ["Forum"] as const, count: 3, minutes: 30 },
    { title: "Create 2 Long-Term Traffic Assets", bucket: "content" as const, count: 2, minutes: 20 },
    { title: "Answer Questions on Q&A Sites", types: ["Q&A"] as const, count: 2, minutes: 25 },
    { title: "Post on Social Platforms", types: ["Social"] as const, count: 3, minutes: 20 },
    { title: "Activate High-Potential Sources", bucket: "high_potential" as const, count: 2, minutes: 30 },
    { title: "Review & Expand Your Machine", bucket: "long_term" as const, count: 2, minutes: 25 },
  ];

  let dayIndex = 0;
  const used = new Set<string>();

  return templates.map((tpl, i) => {
    let sourceIds: string[] = [];
    if ("bucket" in tpl && tpl.bucket) {
      sourceIds = pickByBucket(incomplete, tpl.bucket, tpl.count).filter((id) => !used.has(id));
    }
    if (sourceIds.length < tpl.count) {
      const extra = pickEasy(incomplete, tpl.count - sourceIds.length).filter(
        (id) => !used.has(id) && !sourceIds.includes(id),
      );
      sourceIds = [...sourceIds, ...extra];
    }
    if (sourceIds.length < tpl.count) {
      const fallback = incomplete
        .map((s) => s.source.id)
        .filter((id) => !used.has(id) && !sourceIds.includes(id))
        .slice(0, tpl.count - sourceIds.length);
      sourceIds = [...sourceIds, ...fallback];
    }
    sourceIds.forEach((id) => used.add(id));

    const allDone = sourceIds.length > 0 && sourceIds.every((id) => activatedIds.has(id));
    const anyDone = sourceIds.some((id) => activatedIds.has(id));
    let status: SevenDayPlanDay["status"] = "upcoming";
    if (allDone) status = "completed";
    else if (dayIndex === 0 || (i > 0 && !anyDone && dayIndex === i)) status = "current";
    else if (anyDone && !allDone) status = "current";
    if (status === "current") dayIndex = i + 1;

    return {
      dayIndex: i,
      label: DAY_LABELS[i] || `DAY ${i + 1}`,
      title: tpl.title,
      description: `~${tpl.minutes} minutes`,
      estimatedMinutes: tpl.minutes,
      sourceIds,
      status,
    };
  });
}

export function refreshPlanStatuses(plan: SevenDayPlanDay[], activatedIds: Set<string>): SevenDayPlanDay[] {
  let foundCurrent = false;
  return plan.map((day) => {
    const allDone = day.sourceIds.length > 0 && day.sourceIds.every((id) => activatedIds.has(id));
    const anyDone = day.sourceIds.some((id) => activatedIds.has(id));
    if (allDone) return { ...day, status: "completed" as const };
    if (!foundCurrent) {
      foundCurrent = true;
      return { ...day, status: "current" as const };
    }
    if (anyDone) return { ...day, status: "current" as const };
    return { ...day, status: "upcoming" as const };
  });
}
