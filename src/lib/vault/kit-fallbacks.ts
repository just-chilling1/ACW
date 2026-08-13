import type { OfferSnapshot } from "@/lib/dfy/types";
import type { NicheId } from "@/lib/niches";
import { APP_NICHES } from "@/lib/niches";

export type GeneratedQuora = {
  question: string;
  searchQuery: string;
  answer: string;
  topics: string[];
  angle: string;
  why: string;
};

export type GeneratedPinterest = {
  pinTitle: string;
  pinDescription: string;
  boardName: string;
  imageConcept: string;
  keywords: string[];
  angle: string;
  why: string;
};

function nicheLabel(nicheId: string): string {
  return APP_NICHES.find((n) => n.id === nicheId)?.label || nicheId.replace(/_/g, " ");
}

export function buildManualOfferSnapshot(description: string, niche?: string): OfferSnapshot {
  const name = description.split(/[.!?]/)[0]?.slice(0, 80) || "Your Offer";
  const nicheText = niche ? nicheLabel(niche) : undefined;
  return {
    productName: name,
    category: nicheText || "Digital Product",
    mainPromise: description.slice(0, 200),
    primaryBenefits: ["Easy to get started", "Practical approach", "Beginner-friendly"],
    secondaryBenefits: ["Flexible", "Step-by-step guidance"],
    targetAudience: nicheText
      ? `People interested in ${nicheText}`
      : "Beginners looking for a simple starting point",
    buyerIntent: "Moderate — exploring options",
    painPoints: ["Unsure where to start", "Overwhelmed by options"],
    desiredOutcome: "Clear next steps and confidence",
    objections: ["Is this legit?", "Will it work for me?"],
    strongestAngle: "Simple beginner-friendly approach",
    contentAngles: ["problem/solution", "beginner education", "tips", "FAQ", "curiosity"],
    ctaStyle: "Educational + soft resource recommendation",
    promotionChannels: ["Quora", "Pinterest"],
    recommendedAudienceMode: (niche as OfferSnapshot["recommendedAudienceMode"]) || "auto",
    promotionStyle: "Educational + problem/solution",
  };
}

const QUORA_ANGLES = [
  "problem/solution",
  "beginner",
  "mistake",
  "checklist",
  "comparison",
  "FAQ",
] as const;

const PINTEREST_ANGLES = [
  "curiosity",
  "educational",
  "checklist",
  "beginner",
  "resource",
  "story-style",
] as const;

export function buildFallbackQuoraAnswers(
  snapshot: OfferSnapshot,
  offerUrl: string,
  nicheId: NicheId | string,
): GeneratedQuora[] {
  const niche = nicheLabel(nicheId);
  return QUORA_ANGLES.map((angle, i) => {
    const pain = snapshot.painPoints[i % Math.max(snapshot.painPoints.length, 1)] || "getting started";
    const benefit =
      snapshot.primaryBenefits[i % Math.max(snapshot.primaryBenefits.length, 1)] ||
      snapshot.mainPromise;
    const question = `What actually helps with ${pain.toLowerCase()} for people in ${niche}?`;
    const searchQuery = `${pain} ${niche} tips`;
    const answer = [
      `A lot of people in ${niche} run into ${pain.toLowerCase()} and jump straight into complicated tactics.`,
      `A clearer starting point is to focus on ${benefit.toLowerCase()} and keep the first week simple.`,
      `What tends to work better is one practical routine, honest expectations, and a resource that explains the next step without hype.`,
      `${snapshot.productName} is built around ${snapshot.mainPromise.toLowerCase()}, which can be useful if that matches what you need.`,
      `If you want a concrete place to start, this is worth a look: ${offerUrl}`,
      `Take what fits, ignore what doesn't, and adjust based on your situation rather than copying someone else's full plan.`,
    ].join("\n\n");
    return {
      question,
      searchQuery,
      answer,
      topics: [niche, snapshot.category, "tips", "beginners"].slice(0, 4),
      angle,
      why: `Helpful Quora-style answer using a ${angle} angle for ${niche}.`,
    };
  });
}

export function buildFallbackPinterestPins(
  snapshot: OfferSnapshot,
  offerUrl: string,
  nicheId: NicheId | string,
): GeneratedPinterest[] {
  const niche = nicheLabel(nicheId);
  return PINTEREST_ANGLES.map((angle, i) => {
    const pain = snapshot.painPoints[i % Math.max(snapshot.painPoints.length, 1)] || "getting started";
    const benefit =
      snapshot.primaryBenefits[i % Math.max(snapshot.primaryBenefits.length, 1)] ||
      snapshot.mainPromise;
    const pinTitle = `${niche}: simpler take on ${pain}`.slice(0, 100);
    const pinDescription = [
      `Save this if you're exploring ${niche.toLowerCase()} and want a clearer path around ${pain.toLowerCase()}.`,
      `${snapshot.productName} focuses on ${benefit.toLowerCase()}.`,
      `Soft next step: ${offerUrl}`,
    ]
      .join(" ")
      .slice(0, 500);
    return {
      pinTitle,
      pinDescription,
      boardName: `${niche} Ideas`,
      imageConcept: `Clean ${niche.toLowerCase()} pin with one bold tip about ${pain.toLowerCase()}`,
      keywords: [
        niche.toLowerCase(),
        pain.toLowerCase().split(" ").slice(0, 2).join(" "),
        "tips",
        "beginner",
        snapshot.category.toLowerCase(),
        "ideas",
      ]
        .filter(Boolean)
        .slice(0, 8),
      angle,
      why: `Pinterest pin using a ${angle} angle for ${niche}.`,
    };
  });
}
