import { callChatGPT } from "@/lib/llm";
import { APP_NICHES, getNicheById, type NicheId } from "@/lib/niches";
import { SAFETY_RULES_PROMPT } from "@/lib/instant/safety";
import { analyzeOffer } from "@/lib/dfy/offer-analyze";
import { parseJsonFromLlm } from "@/lib/dfy/parse-json";
import {
    HUMANIZE_PROMPT,
    LINK_PLACEHOLDER,
    humanizeText,
    injectLink,
} from "@/lib/dfy/humanize";
import type { OfferSnapshot } from "@/lib/dfy/types";
import { INSTANT_POST_STYLES } from "@/lib/instant/content/types";

export const CUSTOM_POST_TARGET = 8;

export type CustomPostInput = {
    niche: NicheId;
    idealCustomer: string;
    problemSolved: string;
    offerUrl: string;
};

export type GeneratedFacebookPost = {
    title: string;
    body: string;
    style: string;
    platform: string;
};

function enrichSnapshot(snapshot: OfferSnapshot, input: CustomPostInput): OfferSnapshot {
    return {
        ...snapshot,
        targetAudience: input.idealCustomer || snapshot.targetAudience,
        painPoints: input.problemSolved
            ? [input.problemSolved, ...snapshot.painPoints.filter((p) => p !== input.problemSolved)].slice(
                  0,
                  6,
              )
            : snapshot.painPoints,
        recommendedAudienceMode: input.niche,
    };
}

function fallbackPosts(snapshot: OfferSnapshot, offerUrl: string, nicheLabel: string): GeneratedFacebookPost[] {
    const pain = snapshot.painPoints[0] || "getting started";
    const audience = snapshot.targetAudience || "people in this niche";
    const product = snapshot.productName || "this resource";
    const promise = snapshot.mainPromise || "a clearer next step";

    const drafts: Array<{ title: string; style: string; body: string }> = [
        {
            title: `Tip for ${nicheLabel} groups`,
            style: "helpful",
            body: `Quick tip if ${pain.toLowerCase()} keeps coming up.\n\nFocus on one repeatable action before adding tools. For ${audience.toLowerCase()}, ${promise.toLowerCase()} usually beats jumping between methods.\n\nIf a longer checklist helps: ${LINK_PLACEHOLDER}`,
        },
        {
            title: "Honest take",
            style: "skeptical_friend",
            body: `Honest take: most posts in these groups overpromise.\n\nA grounded approach for ${audience.toLowerCase()} is to solve ${pain.toLowerCase()} with one clear next step — not a pile of tactics.\n\n${product} lays that out here: ${LINK_PLACEHOLDER}`,
        },
        {
            title: "Curious what worked for you",
            style: "curiosity",
            body: `Curious how other people handle ${pain.toLowerCase()} without burning out?\n\nI have been sticking to one small daily action and ignoring shiny new methods for a bit. What is the smallest version that worked for you?\n\nWalkthrough I found useful: ${LINK_PLACEHOLDER}`,
        },
        {
            title: "If this week feels heavy",
            style: "empathetic",
            body: `If ${pain.toLowerCase()} has been frustrating, you are not alone.\n\nBusy weeks happen. The goal is a plan that bends without breaking — especially for ${audience.toLowerCase()}.\n\nA calmer sequence is here if you want it: ${LINK_PLACEHOLDER}`,
        },
        {
            title: "Practical order of operations",
            style: "expert",
            body: `A practical way to approach ${pain.toLowerCase()}:\n\n1) Clarify the audience question.\n2) Ship one helpful post.\n3) Only then share a resource.\n\n${product} follows that order for ${promise.toLowerCase()}: ${LINK_PLACEHOLDER}`,
        },
        {
            title: "Short version",
            style: "short",
            body: `${pain}. Keep the next step small enough to repeat.\n\nMore detail if useful: ${LINK_PLACEHOLDER}`,
        },
        {
            title: "Worth saving",
            style: "soft_sell",
            body: `For anyone researching ${pain.toLowerCase()}, this framing helped me stay grounded.\n\nYou do not need a perfect setup. You need a clear next step that fits ${audience.toLowerCase()}.\n\nLonger resource version: ${LINK_PLACEHOLDER}`,
        },
        {
            title: "Longer take for beginners",
            style: "detailed",
            body: `I have been thinking about ${pain.toLowerCase()} a lot lately, so here is the longer version.\n\nWrite the next action on a sticky note. When you feel like adding three more habits, read the note and finish the one action first. That is how plans survive real weeks for ${audience.toLowerCase()}.\n\nStep-by-step version so this post stays readable: ${LINK_PLACEHOLDER}`,
        },
    ];

    return drafts.map((d) => ({
        title: d.title,
        style: d.style,
        platform: "Facebook",
        body: injectLink(humanizeText(d.body), offerUrl),
    }));
}

async function generateBatch(
    snapshot: OfferSnapshot,
    offerUrl: string,
    nicheLabel: string,
): Promise<GeneratedFacebookPost[]> {
    const styles = INSTANT_POST_STYLES.join(", ");
    const prompt = `Create ${CUSTOM_POST_TARGET} ready-to-post Facebook group posts.

${HUMANIZE_PROMPT}

${SAFETY_RULES_PROMPT}

CONTEXT:
- Niche: ${nicheLabel}
- Product: ${snapshot.productName}
- Audience: ${snapshot.targetAudience}
- Pain points: ${snapshot.painPoints.join("; ")}
- Main promise: ${snapshot.mainPromise}
- Offer URL: ${offerUrl}

REQUIREMENTS:
- Write like a real person in a Facebook group (not an ad).
- Rotate styles among: ${styles}
- Each post needs a short title (hook) and a body.
- Include the offer URL naturally once near the end of each body (plain URL, not ${LINK_PLACEHOLDER}).
- No fake testimonials, earnings, or personal product-use stories.
- Vary angles. Some posts can be conversation starters with a soft resource close.
- No bullets in the post body. Short paragraphs are fine.
- No markdown.

Return ONLY JSON:
{"posts":[{"title":"...","style":"helpful","body":"..."}]}`;

    const raw = await callChatGPT([{ role: "user", content: prompt }]);
    const parsed = parseJsonFromLlm<{ posts?: Array<{ title?: string; style?: string; body?: string }> }>(
        raw,
        {},
    );
    const rows = Array.isArray(parsed.posts) ? parsed.posts : [];

    const out: GeneratedFacebookPost[] = [];
    for (const row of rows) {
        let body = humanizeText(String(row.body || ""));
        if (!body) continue;
        if (!body.includes(offerUrl)) {
            body = `${body}\n\n${offerUrl}`.trim();
        }
        out.push({
            title: String(row.title || "Facebook post").slice(0, 120),
            style: String(row.style || "helpful"),
            platform: "Facebook",
            body,
        });
        if (out.length >= CUSTOM_POST_TARGET) break;
    }

    return out;
}

export async function runCustomFacebookPostGeneration(
    input: CustomPostInput,
): Promise<{ posts: GeneratedFacebookPost[] }> {
    if (!APP_NICHES.some((n) => n.id === input.niche)) {
        throw new Error("Invalid niche");
    }
    if (!input.offerUrl.trim()) throw new Error("Offer URL required");
    if (!input.idealCustomer.trim()) throw new Error("Ideal customer required");
    if (!input.problemSolved.trim()) throw new Error("Problem solved required");

    const nicheLabel = getNicheById(input.niche)?.label || input.niche;
    const rawSnapshot = await analyzeOffer(input.offerUrl.trim(), input.niche);
    const snapshot = enrichSnapshot(rawSnapshot, input);

    try {
        const generated = await generateBatch(snapshot, input.offerUrl.trim(), nicheLabel);
        if (generated.length >= 4) {
            return { posts: generated.slice(0, CUSTOM_POST_TARGET) };
        }
        const fallback = fallbackPosts(snapshot, input.offerUrl.trim(), nicheLabel);
        const merged = [...generated];
        for (const f of fallback) {
            if (merged.length >= CUSTOM_POST_TARGET) break;
            merged.push(f);
        }
        return { posts: merged.slice(0, CUSTOM_POST_TARGET) };
    } catch {
        return { posts: fallbackPosts(snapshot, input.offerUrl.trim(), nicheLabel) };
    }
}
