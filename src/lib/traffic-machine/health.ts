import type { ActivationRow, ScoredOpportunity, TrafficMachineRow } from "./types";

export function buildHealthSummary(
  scored: ScoredOpportunity[],
  activations: ActivationRow[],
): {
  active: number;
  needsAttention: number;
  newOpportunities: number;
  attentionItems: { sourceId: string; message: string }[];
} {
  const active = activations.filter((a) => a.status === "active").length;
  const attentionItems = activations
    .filter((a) => a.status === "needs_attention")
    .map((a) => {
      const source = scored.find((s) => s.source.id === a.source_id)?.source;
      return {
        sourceId: a.source_id,
        message: source?.meta?.status
          ? String(source.meta.status)
          : "This source may need a quick review.",
      };
    });

  const newOpportunities = scored.filter(
    (s) => !s.activated && (s.source.meta?.isNew || s.score >= 85),
  ).length;

  return {
    active,
    needsAttention: attentionItems.length,
    newOpportunities,
    attentionItems,
  };
}

export function defaultExperiments(scored: ScoredOpportunity[]): TrafficMachineRow["experiments"] {
  const byType = (type: string) =>
    scored.filter((s) => s.source.type === type).slice(0, 3).map((s) => s.source.id);

  return [
    {
      id: "exp-community",
      name: "Community posts",
      channel: "Forum",
      status: "testing" as const,
      sourceIds: byType("Forum"),
    },
    {
      id: "exp-pinterest",
      name: "Pinterest",
      channel: "Social",
      status: "testing" as const,
      sourceIds: scored.filter((s) => s.source.name.toLowerCase().includes("pinterest")).slice(0, 3).map((s) => s.source.id),
    },
    {
      id: "exp-qa",
      name: "Q&A answers",
      channel: "Q&A",
      status: "testing" as const,
      sourceIds: byType("Q&A"),
    },
  ];
}
