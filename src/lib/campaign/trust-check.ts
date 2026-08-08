import type { CampaignPost, PromotionPackContent, TrustCheckResult } from "./types";
import { scoreLabel } from "./scoring";

const SALES_PHRASES = [
  "buy now",
  "limited offer",
  "don't miss",
  "act fast",
  "guaranteed",
  "make money fast",
  "click here",
];

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(
    a
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
  );
  const tb = new Set(
    b
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
  );
  if (ta.size === 0 || tb.size === 0) return 0;
  let hits = 0;
  for (const w of ta) if (tb.has(w)) hits++;
  return hits / ta.size;
}

export function runTrustCheck(
  reply: string,
  post: CampaignPost,
  affiliateLink: string
): TrustCheckResult {
  const postContext = `${post.title ?? ""} ${post.text}`;
  const lower = reply.toLowerCase();
  const items = [];

  const contextOverlap = tokenOverlap(reply, postContext);
  items.push({
    id: "context",
    label: "Matches the conversation",
    passed: contextOverlap >= 0.08 || reply.length > 80,
    note: contextOverlap >= 0.08 ? undefined : "Consider referencing the question more directly.",
  });

  const promoCount = SALES_PHRASES.filter((p) => lower.includes(p)).length;
  items.push({
    id: "promo",
    label: "Doesn't sound overly promotional",
    passed: promoCount <= 1,
    note: promoCount > 1 ? "Tone down sales language for a more natural feel." : undefined,
  });

  const linkCount = affiliateLink
    ? (reply.match(new RegExp(affiliateLink.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || [])
        .length
    : 0;
  items.push({
    id: "cta",
    label: "CTA is appropriate",
    passed: linkCount <= 1,
    note: linkCount > 1 ? "One link is enough — multiple links can feel spammy." : undefined,
  });

  const linkIndex = affiliateLink ? reply.indexOf(affiliateLink) : -1;
  items.push({
    id: "link",
    label: "Link placement is natural",
    passed: linkIndex === -1 || linkIndex > 40,
    note: linkIndex >= 0 && linkIndex <= 40 ? "Lead with helpful context before the link." : undefined,
  });

  const words = reply.toLowerCase().split(/\s+/);
  const uniqueRatio = new Set(words).size / Math.max(words.length, 1);
  items.push({
    id: "repeat",
    label: "Not repetitive",
    passed: uniqueRatio >= 0.55,
  });

  const passed = items.filter((i) => i.passed).length;
  const score = Math.round((passed / items.length) * 100);

  return {
    items,
    score,
    label: scoreLabel(score),
  };
}

export function getPrimaryReply(pack: PromotionPackContent): string {
  return pack.recommendedReply;
}
