import { callChatGPT } from "@/lib/llm";
import { parseJsonFromLlm } from "./parse-json";
import { APP_NICHES } from "@/lib/niches";
import { detectOfferNiche } from "./search-fallbacks";
import type { AudienceMode, CampaignStrategy, OfferSnapshot } from "./types";

async function fetchPageSignals(url: string): Promise<{
    title: string;
    description: string;
    hostname: string;
    pageText: string;
}> {
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
        const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
        const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const stripped = html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 1800);
        const h1 = (h1Match?.[1] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        return {
            title: titleMatch?.[1]?.trim() || ogTitle?.[1]?.trim() || h1 || hostname,
            description: descMatch?.[1]?.trim() || "",
            hostname,
            pageText: [h1, stripped].filter(Boolean).join(" ").slice(0, 2000),
        };
    } catch {
        try {
            const parsed = new URL(url);
            return {
                title: parsed.hostname.replace(/^www\./, ""),
                description: "",
                hostname: parsed.hostname.replace(/^www\./, ""),
                pageText: "",
            };
        } catch {
            return { title: "Your Offer", description: "", hostname: "unknown", pageText: "" };
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
    const modeHint =
        audienceMode && audienceMode !== "auto"
            ? `User-selected niche hint (only use if it fits the page): ${audienceMode}`
            : "No niche selected yet — infer the best niche ONLY from the affiliate/product page content.";

    const prompt = `Analyze this affiliate/product page BEFORE choosing audience and angle.
Base targetAudience and strongestAngle on the page content below — do not use generic beginner filler.

URL: ${url}
Page title: ${signals.title}
Meta description: ${signals.description}
Domain: ${signals.hostname}
Page text excerpt: ${signals.pageText || "(unavailable — infer carefully from title/domain)"}
${modeHint}
Available niche audiences: ${APP_NICHES.map((n) => n.id).join(", ")}

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
  "recommendedAudienceMode": "auto"|"weight_loss"|"make_money_online"|"health_fitness"|"beauty_skincare"|"relationships"|"tech_gadgets"|"pets"|"home_garden",
  "promotionStyle": string
}

Rules:
- targetAudience must name who actually buys this offer (specific, not "beginners looking for a simple way to get started" unless that truly fits).
- strongestAngle must be a concrete promotion angle for THIS product.
- Be specific to the offer signals when available.
- Do not invent fake testimonials, stats, or personal experiences.
- Keep language simple for non-marketers.`;

    try {
        const result = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Partial<OfferSnapshot>>(result, {});
        const productName = parsed.productName || signals.title || DEFAULT_SNAPSHOT.productName;
        const fromSignals = Boolean(signals.title || signals.description || signals.pageText);
        const snapshot: OfferSnapshot = {
            ...DEFAULT_SNAPSHOT,
            ...parsed,
            productName,
            mainPromise:
                parsed.mainPromise && parsed.mainPromise !== DEFAULT_SNAPSHOT.mainPromise
                    ? parsed.mainPromise
                    : signals.description || parsed.mainPromise || DEFAULT_SNAPSHOT.mainPromise,
            targetAudience:
                parsed.targetAudience && parsed.targetAudience !== DEFAULT_SNAPSHOT.targetAudience
                    ? parsed.targetAudience
                    : fromSignals
                      ? `People interested in ${productName}`
                      : DEFAULT_SNAPSHOT.targetAudience,
            strongestAngle:
                parsed.strongestAngle && parsed.strongestAngle !== DEFAULT_SNAPSHOT.strongestAngle
                    ? parsed.strongestAngle
                    : fromSignals
                      ? `Helpful ${productName} resource recommendation`
                      : DEFAULT_SNAPSHOT.strongestAngle,
            primaryBenefits: parsed.primaryBenefits?.length ? parsed.primaryBenefits : DEFAULT_SNAPSHOT.primaryBenefits,
            secondaryBenefits: parsed.secondaryBenefits?.length ? parsed.secondaryBenefits : DEFAULT_SNAPSHOT.secondaryBenefits,
            painPoints: parsed.painPoints?.length ? parsed.painPoints : DEFAULT_SNAPSHOT.painPoints,
            objections: parsed.objections?.length ? parsed.objections : DEFAULT_SNAPSHOT.objections,
            contentAngles: parsed.contentAngles?.length ? parsed.contentAngles : DEFAULT_SNAPSHOT.contentAngles,
            promotionChannels: parsed.promotionChannels?.length ? parsed.promotionChannels : DEFAULT_SNAPSHOT.promotionChannels,
            recommendedAudienceMode: "auto",
        };
        snapshot.recommendedAudienceMode = detectOfferNiche(snapshot, audienceMode === "auto" ? "auto" : audienceMode);
        return snapshot;
    } catch {
        const productName = signals.title || DEFAULT_SNAPSHOT.productName;
        const partial: OfferSnapshot = {
            ...DEFAULT_SNAPSHOT,
            productName,
            mainPromise: signals.description || DEFAULT_SNAPSHOT.mainPromise,
            targetAudience: signals.pageText || signals.description
                ? `People interested in ${productName}`
                : DEFAULT_SNAPSHOT.targetAudience,
            strongestAngle: `Helpful ${productName} resource recommendation`,
            category: signals.hostname !== "unknown" ? signals.hostname : DEFAULT_SNAPSHOT.category,
        };
        return {
            ...partial,
            recommendedAudienceMode: detectOfferNiche(partial, audienceMode === "auto" ? "auto" : audienceMode),
        };
    }
}

export async function buildStrategy(
    snapshot: OfferSnapshot,
    audienceMode: AudienceMode,
    channels: string[],
    primaryKeyword: string,
): Promise<CampaignStrategy> {
    const niche = APP_NICHES.find((n) => n.id === detectOfferNiche(snapshot, audienceMode));
    const prompt = `Create a specific, actionable campaign strategy for promoting this exact offer.

Product: ${snapshot.productName}
Category: ${snapshot.category}
Main promise: ${snapshot.mainPromise}
Target audience: ${snapshot.targetAudience}
Primary benefits: ${snapshot.primaryBenefits.join(", ")}
Pain points solved: ${snapshot.painPoints.join(", ")}
Strongest angle: ${snapshot.strongestAngle}
Content angles: ${snapshot.contentAngles.join(", ")}
Objections to address: ${snapshot.objections.join(", ")}
Niche focus: ${niche?.label || "General"}
Audience mode: ${audienceMode}
Channels: ${channels.join(", ")}
Primary search keyword: ${primaryKeyword}

Return ONLY JSON:
{
  "summary": "2-3 sentences referencing the specific product, audience, and promotion approach",
  "whoToTarget": "specific audience description tied to this offer",
  "whatToSay": "specific messaging angles using product benefits and pain points",
  "whereToPromote": "specific platforms and community types for this niche",
  "whatToStartWith": "specific first content type for this offer",
  "strongestOpportunities": "what kinds of conversations to look for",
  "ctaStyle": "recommended CTA approach for this product",
  "whatToAvoid": "specific mistakes for this niche/offer",
  "firstStep": "concrete first action referencing the offer"
}

Rules:
- Every field must mention specifics from this offer — no generic filler.
- Do not invent fake testimonials or results.`;

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
        const nicheLabel = niche?.label || snapshot.category;
        return {
            summary: `Promote ${snapshot.productName} to ${snapshot.targetAudience.toLowerCase()} by leading with ${snapshot.strongestAngle.toLowerCase()} in ${nicheLabel} communities.`,
            whoToTarget: snapshot.targetAudience,
            whatToSay: `Focus on ${snapshot.primaryBenefits.slice(0, 2).join(" and ").toLowerCase()}, addressing ${snapshot.painPoints[0]?.toLowerCase() || "their main frustration"}.`,
            whereToPromote: channels.includes("everywhere") ? `${snapshot.promotionChannels.slice(0, 3).join(", ")}` : channels.join(", "),
            whatToStartWith: `Reply to people asking for ${snapshot.category.toLowerCase()} recommendations`,
            strongestOpportunities: `Questions from ${snapshot.targetAudience.toLowerCase()} comparing options or asking for beginner advice`,
            ctaStyle: snapshot.ctaStyle,
            whatToAvoid: `Aggressive sales language, unrelated niches, and claims not supported by ${snapshot.productName}`,
            firstStep: `Find a conversation about ${snapshot.painPoints[0]?.toLowerCase() || snapshot.mainPromise.toLowerCase()} and share a helpful reply`,
        };
    }
}

export function derivePrimaryKeyword(snapshot: OfferSnapshot, audienceMode?: string): string {
    const product = snapshot.productName.trim();
    const category = snapshot.category.trim().toLowerCase();
    const pain = snapshot.painPoints[0]?.trim() || snapshot.mainPromise.trim();
    const niche = APP_NICHES.find((n) => n.id === detectOfferNiche(snapshot, audienceMode));

    if (niche?.id === "make_money_online") {
        return `${product} make money online reddit`;
    }

    return `${pain} ${category} ${product} reddit`.replace(/\s+/g, " ").trim().slice(0, 80);
}

export function deriveSearchQueries(snapshot: OfferSnapshot, primaryKeyword: string, audienceMode?: string): string[] {
    const product = snapshot.productName.trim();
    const category = snapshot.category.trim().toLowerCase();
    const pain = snapshot.painPoints[0]?.trim() || snapshot.mainPromise.trim();
    const niche = APP_NICHES.find((n) => n.id === detectOfferNiche(snapshot, audienceMode));

    const queries = [
        primaryKeyword,
        `${product} recommendation reddit`,
        `${product} review reddit`,
        `${pain} help reddit`,
        `best ${category} for beginners reddit`,
        `${product} worth it reddit`,
        `${category} beginner tips reddit`,
        `how to ${category} reddit`,
    ];

    if (niche) {
        for (const term of niche.searchTerms.slice(0, 4)) {
            queries.push(`${term} ${category} reddit`);
        }
        queries.push(`${niche.label.toLowerCase()} ${product} reddit`);
    }

    return [...new Set(queries.map((q) => q.replace(/\s+/g, " ").trim()))].slice(0, 12);
}
