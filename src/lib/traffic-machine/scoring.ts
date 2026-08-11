import { APP_NICHES, type NicheId } from "@/lib/niches";
import type { OfferSnapshot } from "@/lib/dfy/types";
import type { TrafficSource } from "./sources";
import type { OpportunityBucket, ScoreLabel, ScoredOpportunity, TrafficGoal } from "./types";

const NICHE_LABEL_TO_ID: Record<string, NicheId> = {
  "Weight Loss": "weight_loss",
  "Make Money Online": "make_money_online",
  "Health & Fitness": "health_fitness",
  "Tech & Gadgets": "tech_gadgets",
  "Beauty & Skincare": "beauty_skincare",
  Relationships: "relationships",
  Pets: "pets",
  "Home & Garden": "home_garden",
};

export function parseTrafficMidpoint(traffic: string): number {
  const nums = traffic.match(/\d+/g)?.map(Number) || [100];
  if (nums.length >= 2) return Math.round((nums[0] + nums[1]) / 2);
  return nums[0] || 100;
}

export function parseSetupMinutes(time: string): number {
  const match = time.match(/(\d+)/);
  return match ? Number(match[1]) : 10;
}

function nicheMatchScore(sourceNiche: string, audienceNiche: string, snapshot?: OfferSnapshot): number {
  const sourceId = NICHE_LABEL_TO_ID[sourceNiche];
  if (audienceNiche === "not_sure") {
    const recommended = snapshot?.recommendedAudienceMode;
    if (recommended && recommended !== "auto" && sourceId === recommended) return 95;
    return 70;
  }
  if (sourceId === audienceNiche) return 100;
  const related: Record<string, string[]> = {
    weight_loss: ["health_fitness"],
    health_fitness: ["weight_loss"],
    beauty_skincare: ["health_fitness"],
  };
  if (related[audienceNiche]?.includes(sourceId)) return 75;
  return 40;
}

function goalTypeBonus(type: TrafficSource["type"], goal: TrafficGoal): number {
  const map: Record<TrafficGoal, Partial<Record<TrafficSource["type"], number>>> = {
    visitors: { Social: 8, "Q&A": 6, Forum: 5 },
    clicks: { "Q&A": 10, Social: 8, Blog: 5 },
    sales: { "Q&A": 8, Forum: 7, Social: 6 },
    passive: { Directory: 10, Blog: 9, Social: 7, Classified: 6 },
  };
  return map[goal][type] || 0;
}

function classifyBucket(source: TrafficSource, score: number): OpportunityBucket {
  if (source.type === "Blog" || source.type === "Directory") return "content";
  if (source.difficulty === "Easy" && parseSetupMinutes(source.time) <= 10) return "quick_win";
  if (parseTrafficMidpoint(source.traffic) >= 800) return "high_potential";
  return "long_term";
}

function scoreLabel(score: number): ScoreLabel {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Good";
  return "Fair";
}

function potentialLabel(mid: number): "High" | "Medium" | "Low" {
  if (mid >= 800) return "High";
  if (mid >= 300) return "Medium";
  return "Low";
}

export function scoreOpportunity(
  source: TrafficSource,
  audienceNiche: string,
  goal: TrafficGoal,
  activated: boolean,
  snapshot?: OfferSnapshot,
): ScoredOpportunity {
  const audienceMatch = nicheMatchScore(source.niche, audienceNiche, snapshot);
  const trafficMid = parseTrafficMidpoint(source.traffic);
  const setupMin = parseSetupMinutes(source.time);
  const difficultyBonus = source.difficulty === "Easy" ? 12 : 0;
  const trafficBonus = Math.min(20, Math.round(trafficMid / 150));
  const setupBonus = setupMin <= 8 ? 10 : setupMin <= 12 ? 6 : 0;
  const goalBonus = goalTypeBonus(source.type, goal);

  let score = Math.round(
    audienceMatch * 0.45 + difficultyBonus + trafficBonus + setupBonus + goalBonus,
  );
  score = Math.min(100, Math.max(30, score));

  const reasons: string[] = [];
  if (audienceMatch >= 90) reasons.push("Strong audience match");
  else if (audienceMatch >= 70) reasons.push("Good audience fit");
  if (source.difficulty === "Easy") reasons.push("Easy to activate");
  if (trafficMid >= 500) reasons.push("Good long-term potential");
  if (setupMin <= 10) reasons.push(`Quick setup (~${setupMin} min)`);

  return {
    source,
    score,
    label: scoreLabel(score),
    audienceMatchPercent: audienceMatch,
    potential: potentialLabel(trafficMid),
    reasons: reasons.slice(0, 4),
    bucket: classifyBucket(source, score),
    activated,
  };
}

export function filterSourcesForAudience(sources: TrafficSource[], audienceNiche: string): TrafficSource[] {
  if (audienceNiche === "not_sure") return sources;
  const label = APP_NICHES.find((n) => n.id === audienceNiche)?.label;
  if (!label) return sources;
  const nicheSources = sources.filter((s) => s.niche === label);
  const related = sources.filter((s) => {
    const id = NICHE_LABEL_TO_ID[s.niche];
    return id !== audienceNiche && nicheMatchScore(s.niche, audienceNiche) >= 75;
  });
  const combined = [...nicheSources, ...related.filter((r) => !nicheSources.some((n) => n.id === r.id))];
  return combined.length > 0 ? combined : sources;
}

export function scoreAllOpportunities(
  sources: TrafficSource[],
  audienceNiche: string,
  goal: TrafficGoal,
  activatedIds: Set<string>,
  snapshot?: OfferSnapshot,
): ScoredOpportunity[] {
  const filtered = filterSourcesForAudience(sources, audienceNiche);
  return filtered
    .map((source) =>
      scoreOpportunity(source, audienceNiche, goal, activatedIds.has(source.id), snapshot),
    )
    .sort((a, b) => b.score - a.score);
}

export function summarizeOpportunities(scored: ScoredOpportunity[]): {
  total: number;
  quickWins: number;
  longTerm: number;
  highPotential: number;
  content: number;
} {
  return {
    total: scored.length,
    quickWins: scored.filter((s) => s.bucket === "quick_win").length,
    longTerm: scored.filter((s) => s.bucket === "long_term").length,
    highPotential: scored.filter((s) => s.bucket === "high_potential").length,
    content: scored.filter((s) => s.bucket === "content").length,
  };
}
