import type { CampaignPost, OfferAnalysis, ScoreBreakdown, ScoreLabel } from "./types";

const INTENT_WORDS = [
  "best",
  "recommend",
  "looking for",
  "anyone tried",
  "help",
  "what should",
  "how do",
  "which",
  "alternative",
  "vs",
  "experience",
  "?",
];

const PROMO_WORDS = ["buy now", "limited time", "click here", "affiliate", "discount code", "promo"];

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function scoreLabel(score: number): ScoreLabel {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 55) return "Good";
  return "Weak";
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 40;
  let hits = 0;
  for (const w of a) {
    if (b.has(w)) hits++;
  }
  const ratio = hits / Math.max(a.size, 1);
  return clamp(35 + ratio * 65);
}

function engagementScore(engagement: string | number): number {
  const n = typeof engagement === "number" ? engagement : parseInt(String(engagement), 10);
  if (!Number.isFinite(n) || n <= 0) return 55;
  if (n >= 500) return 95;
  if (n >= 200) return 85;
  if (n >= 80) return 72;
  return 60;
}

export function scoreOfferPotential(analysis: Partial<OfferAnalysis>): ScoreBreakdown {
  const fields = [
    analysis.productName,
    analysis.mainProblem,
    analysis.targetAudience,
    analysis.mainBenefit,
    analysis.category,
  ].filter(Boolean);
  const richness = clamp(50 + fields.length * 8 + (analysis.searchKeywords?.length ?? 0) * 2);
  const overall = clamp(richness);
  return {
    overall,
    label: scoreLabel(overall),
    audienceMatch: clamp(richness - 4),
    buyingIntent: clamp(richness + 2),
    opportunity: clamp(richness - 2),
    offerMatch: clamp(richness),
  };
}

export function scoreOpportunity(post: CampaignPost, analysis: OfferAnalysis): ScoreBreakdown {
  const offerTokens = tokenize(
    [
      analysis.productName,
      analysis.category,
      analysis.mainProblem,
      analysis.mainBenefit,
      analysis.targetAudience,
      ...(analysis.searchKeywords ?? []),
    ].join(" ")
  );
  const postText = `${post.title ?? ""} ${post.text}`.toLowerCase();
  const postTokens = tokenize(postText);

  const offerMatch = overlapScore(offerTokens, postTokens);
  const audienceMatch = overlapScore(tokenize(analysis.targetAudience), postTokens);

  let intentHits = 0;
  for (const w of INTENT_WORDS) {
    if (postText.includes(w)) intentHits++;
  }
  const buyingIntent = clamp(45 + intentHits * 9);

  let promoHits = 0;
  for (const w of PROMO_WORDS) {
    if (postText.includes(w)) promoHits++;
  }
  const competitionScore = clamp(88 - promoHits * 15);
  const engagement = engagementScore(post.engagement);

  const overall = clamp(
    offerMatch * 0.32 +
      buyingIntent * 0.28 +
      audienceMatch * 0.18 +
      competitionScore * 0.12 +
      engagement * 0.1
  );

  return {
    overall,
    label: scoreLabel(overall),
    audienceMatch,
    buyingIntent,
    opportunity: competitionScore,
    offerMatch,
  };
}

export function opportunityIndicators(score: ScoreBreakdown, post: CampaignPost): string[] {
  const items: string[] = [];
  if ((score.buyingIntent ?? 0) >= 70) items.push("High buying intent");
  if ((score.offerMatch ?? 0) >= 70) items.push("Strong offer match");
  if ((score.opportunity ?? 0) >= 75) items.push("Low promotional competition");
  if (typeof post.engagement === "number" && post.engagement >= 200) {
    items.push("Active conversation");
  }
  if (items.length === 0) items.push("Relevant conversation");
  return items.slice(0, 3);
}

export function filterOpportunities<T extends { score: ScoreBreakdown; post: CampaignPost }>(
  items: T[],
  filter: "best_match" | "highest_intent" | "lowest_competition" | "newest"
): T[] {
  const sorted = [...items];
  switch (filter) {
    case "highest_intent":
      sorted.sort((a, b) => (b.score.buyingIntent ?? 0) - (a.score.buyingIntent ?? 0));
      break;
    case "lowest_competition":
      sorted.sort((a, b) => (b.score.opportunity ?? 0) - (a.score.opportunity ?? 0));
      break;
    case "newest":
      sorted.sort((a, b) => b.post.id.localeCompare(a.post.id));
      break;
    default:
      sorted.sort((a, b) => b.score.overall - a.score.overall);
  }
  return sorted;
}

export function campaignStrength(campaign: {
  actionPlan: { status: string }[];
  offer: { analysis: OfferAnalysis };
}): number {
  const total = campaign.actionPlan.length || 1;
  const done = campaign.actionPlan.filter((a) => a.status === "completed").length;
  const progress = (done / total) * 35;
  const base = campaign.offer.analysis.opportunityScore.overall * 0.65;
  return clamp(base + progress);
}
