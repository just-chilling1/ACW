import { callChatGPT } from "@/lib/llm";
import { parseJsonFromLlm } from "./parse-json";
import type { AudienceMode, CampaignStrategy, OfferSnapshot } from "./types";

async function fetchPageSignals(url: string): Promise<{ title: string; description: string; hostname: string }> {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.replace(/^www\./, "");
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0 (compatible; CashwaveBot/1.0)" },
            redirect: "follow",
        });
        clearTimeout(timeout);
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
        return {
            title: titleMatch?.[1]?.trim() || hostname,
            description: descMatch?.[1]?.trim() || "",
            hostname,
        };
    } catch {
        try {
            const parsed = new URL(url);
            return {
                title: parsed.hostname.replace(/^www\./, ""),
                description: "",
                hostname: parsed.hostname.replace(/^www\./, ""),
            };
        } catch {
            return { title: "Your Offer", description: "", hostname: "unknown" };
        }
    }
}

const DEFAULT_SNAPSHOT: OfferSnapshot = {
    productName: "Your Offer",
    category: "Digital Product",
    mainPromise: "A practical solution for people looking for results.",
    primaryBenefits: ["Easy to get started", "Saves time", "Beginner-friendly"],
    secondaryBenefits: ["Flexible approach", "Step-by-step guidance"],
    targetAudience: "Beginners looking for a simple way to get started",
    buyerIntent: "High — actively searching for solutions",
    painPoints: ["Overwhelmed by options", "Unsure where to start"],
    desiredOutcome: "Clear next steps and confidence",
    objections: ["Is this legit?", "Will it work for me?"],
    strongestAngle: "Simple beginner-friendly approach",
    contentAngles: ["problem/solution", "beginner education", "tips", "FAQ"],
    ctaStyle: "Educational + soft resource recommendation",
    promotionChannels: ["Reddit", "YouTube", "Facebook groups", "Q&A sites"],
    recommendedAudienceMode: "auto",
    promotionStyle: "Educational + problem/solution",
};

export async function analyzeOffer(url: string, audienceMode: AudienceMode = "auto"): Promise<OfferSnapshot> {
    const signals = await fetchPageSignals(url);
    const prompt = `Analyze this product/affiliate offer for a beginner-friendly promotional campaign.

URL: ${url}
Page title: ${signals.title}
Meta description: ${signals.description}
Domain: ${signals.hostname}
Preferred audience mode: ${audienceMode}

Return ONLY JSON with these keys:
{
  "productName": string,
  "category": string,
  "mainPromise": string,
  "primaryBenefits": string[],
  "secondaryBenefits": string[],
  "targetAudience": string,
  "buyerIntent": string,
  "painPoints": string[],
  "desiredOutcome": string,
  "objections": string[],
  "strongestAngle": string,
  "contentAngles": string[],
  "ctaStyle": string,
  "promotionChannels": string[],
  "recommendedAudienceMode": "auto"|"make_money"|"solve_problem"|"beginners"|"business_owners"|"professionals"|"hobby",
  "promotionStyle": string
}

Rules:
- Be specific to the offer signals when available.
- Do not invent fake testimonials, stats, or personal experiences.
- Keep language simple for non-marketers.`;

    try {
        const result = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Partial<OfferSnapshot>>(result, {});
        return {
            ...DEFAULT_SNAPSHOT,
            ...parsed,
            productName: parsed.productName || signals.title || DEFAULT_SNAPSHOT.productName,
            primaryBenefits: parsed.primaryBenefits?.length ? parsed.primaryBenefits : DEFAULT_SNAPSHOT.primaryBenefits,
            secondaryBenefits: parsed.secondaryBenefits?.length ? parsed.secondaryBenefits : DEFAULT_SNAPSHOT.secondaryBenefits,
            painPoints: parsed.painPoints?.length ? parsed.painPoints : DEFAULT_SNAPSHOT.painPoints,
            objections: parsed.objections?.length ? parsed.objections : DEFAULT_SNAPSHOT.objections,
            contentAngles: parsed.contentAngles?.length ? parsed.contentAngles : DEFAULT_SNAPSHOT.contentAngles,
            promotionChannels: parsed.promotionChannels?.length ? parsed.promotionChannels : DEFAULT_SNAPSHOT.promotionChannels,
        };
    } catch {
        return {
            ...DEFAULT_SNAPSHOT,
            productName: signals.title || DEFAULT_SNAPSHOT.productName,
        };
    }
}

export async function buildStrategy(
    snapshot: OfferSnapshot,
    audienceMode: AudienceMode,
    channels: string[],
    primaryKeyword: string,
): Promise<CampaignStrategy> {
    const prompt = `Create a beginner-friendly campaign strategy.

Offer: ${snapshot.productName}
Promise: ${snapshot.mainPromise}
Audience: ${snapshot.targetAudience}
Audience mode: ${audienceMode}
Channels: ${channels.join(", ")}
Primary keyword: ${primaryKeyword}

Return ONLY JSON:
{
  "summary": "2-3 sentence plain-English strategy",
  "whoToTarget": string,
  "whatToSay": string,
  "whereToPromote": string,
  "whatToStartWith": string,
  "strongestOpportunities": string,
  "ctaStyle": string,
  "whatToAvoid": string,
  "firstStep": string
}`;

    try {
        const result = await callChatGPT([{ role: "user", content: prompt }]);
        return parseJsonFromLlm<CampaignStrategy>(result, {
            summary: `Start with educational content for ${snapshot.targetAudience.toLowerCase()}, then move into problem/solution posts.`,
            whoToTarget: snapshot.targetAudience,
            whatToSay: snapshot.strongestAngle,
            whereToPromote: channels.includes("everywhere") ? "Reddit, YouTube, and social communities" : channels.join(", "),
            whatToStartWith: "Answer high-intent questions with helpful replies",
            strongestOpportunities: "People actively asking for recommendations",
            ctaStyle: snapshot.ctaStyle,
            whatToAvoid: "Aggressive sales language and spammy link drops",
            firstStep: "Copy the recommended reply for the top opportunity",
        });
    } catch {
        return {
            summary: `Start with educational content for beginners, then move into problem/solution posts and comparison content.`,
            whoToTarget: snapshot.targetAudience,
            whatToSay: snapshot.strongestAngle,
            whereToPromote: "Reddit, YouTube, and relevant communities",
            whatToStartWith: "Helpful replies to high-intent conversations",
            strongestOpportunities: "Questions from people actively looking for solutions",
            ctaStyle: snapshot.ctaStyle,
            whatToAvoid: "Pushy promotion and fake personal stories",
            firstStep: "Start with the best opportunity Cashwave found",
        };
    }
}

export function derivePrimaryKeyword(snapshot: OfferSnapshot): string {
    const base = `${snapshot.productName} ${snapshot.mainPromise}`.toLowerCase();
    if (/money|income|earn|side hustle|ai tool/.test(base)) {
        return `how to ${snapshot.mainPromise.toLowerCase().slice(0, 60)} reddit`;
    }
    return `best ${snapshot.category.toLowerCase()} ${snapshot.productName} reddit`;
}

export function deriveSearchQueries(snapshot: OfferSnapshot, primaryKeyword: string): string[] {
    return [
        primaryKeyword,
        `${snapshot.productName} recommendation reddit`,
        `${snapshot.painPoints[0] || snapshot.mainPromise} help reddit`,
    ].slice(0, 3);
}
