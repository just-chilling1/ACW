import { callChatGPT } from "@/lib/llm";
import { parseJsonFromLlm } from "@/lib/dfy/parse-json";
import type { OfferSnapshot } from "@/lib/dfy/types";
import {
    buildFallbackAngles,
    buildFallbackCtas,
    buildFallbackHooks,
    buildFallbackPosts,
    buildFallbackQuickPlan,
    buildFallbackReplies,
} from "./fallbacks";
import { sanitizeContent, SAFETY_RULES_PROMPT, validateAssetContent } from "./safety";
import type { KitRecommendations, QuickPlanDay } from "./types";

export interface GeneratedPost {
    platform: string;
    title: string;
    content: string;
    angle: string;
    cta: string;
    why: string;
    include_link: boolean;
    meta: Record<string, unknown>;
}

export interface GeneratedAsset {
    type: "hook" | "reply" | "cta" | "angle";
    platform?: string;
    title?: string;
    content: string;
    angle?: string;
    cta?: string;
    why?: string;
    include_link?: boolean;
    meta: Record<string, unknown>;
}

function safeContent(text: string): string {
    const cleaned = sanitizeContent(text);
    const validation = validateAssetContent(cleaned);
    return validation.ok ? cleaned : sanitizeContent(text.replace(/guaranteed|I made \$|I earned/gi, ""));
}

export async function generatePromotionAngles(snapshot: OfferSnapshot): Promise<GeneratedAsset[]> {
    const prompt = `Create 5 promotion angles for "${snapshot.productName}".
Target audience: ${snapshot.targetAudience}
Main promise: ${snapshot.mainPromise}
Pain points: ${snapshot.painPoints.join(", ")}

Return ONLY JSON array:
[{"title":"Beginner|Problem/Solution|Education|Curiosity|Comparison","content":"1-2 sentence explanation of how to promote using this angle","angle":"beginner|problem_solution|education|curiosity|comparison"}]

${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Array<{ title: string; content: string; angle: string }>>(raw, []);
        if (parsed.length >= 3) {
            return parsed.slice(0, 5).map((a) => ({
                type: "angle" as const,
                title: a.title,
                content: safeContent(a.content),
                angle: a.angle,
                why: `Use this angle when promoting to ${snapshot.targetAudience.toLowerCase()}.`,
                meta: { angleType: a.title },
            }));
        }
    } catch { /* fallback */ }

    return buildFallbackAngles(snapshot).map((a) => ({
        type: "angle" as const,
        title: a.title,
        content: a.content,
        angle: a.angle,
        why: `Use this angle when promoting to ${snapshot.targetAudience.toLowerCase()}.`,
        meta: a.meta,
    }));
}

export async function generatePromotionPosts(
    snapshot: OfferSnapshot,
    offerUrl: string,
    platforms: string[],
): Promise<GeneratedPost[]> {
    const prompt = `Create 12 ready-to-use promotional posts for "${snapshot.productName}".
Offer URL: ${offerUrl}
Target audience: ${snapshot.targetAudience}
Main promise: ${snapshot.mainPromise}
Benefits: ${snapshot.primaryBenefits.join(", ")}
Pain points: ${snapshot.painPoints.join(", ")}
Angles to use: problem/solution, educational, beginner, curiosity, mistake, checklist, comparison, FAQ, story-style, resource
Platforms to rotate: ${platforms.join(", ")}

Return ONLY JSON array:
[{"platform":"Facebook Groups|Reddit|Q&A|X|LinkedIn|Instagram|General","title":"short label","content":"full post text","angle":"...","cta":"...","why":"why this works","include_link":true|false}]

Rules:
- Vary angles and platforms. Not every post needs the link.
- Some posts should be conversation starters without links.
- Ready to copy and paste. Natural, helpful, non-spammy.
${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Array<GeneratedPost>>(raw, []);
        if (parsed.length >= 8) {
            return parsed.slice(0, 12).map((p, i) => ({
                ...p,
                content: safeContent(p.content),
                include_link: p.include_link ?? i % 3 !== 2,
                meta: { style: p.angle, recommended: i === 0 },
            }));
        }
    } catch { /* fallback */ }

    return buildFallbackPosts(snapshot, offerUrl);
}

export async function generatePromotionHooks(snapshot: OfferSnapshot): Promise<GeneratedAsset[]> {
    const prompt = `Create 12 strong hooks for "${snapshot.productName}".
Target audience: ${snapshot.targetAudience}
Main promise: ${snapshot.mainPromise}

Return ONLY JSON:
[{"content":"hook text","meta":{"category":"Curiosity|Problem|Benefit|Question|Contrarian|Beginner|Mistake|Story|Practical tip|What I wish I knew","recommended":false}}]

Mark exactly ONE hook with "recommended": true.
${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Array<{ content: string; meta: { category: string; recommended?: boolean } }>>(raw, []);
        if (parsed.length >= 8) {
            return parsed.slice(0, 15).map((h) => ({
                type: "hook" as const,
                content: safeContent(h.content),
                meta: h.meta,
            }));
        }
    } catch { /* fallback */ }

    return buildFallbackHooks(snapshot).map((h) => ({
        type: "hook" as const,
        content: h.content,
        meta: h.meta,
    }));
}

export async function generatePromotionReplies(snapshot: OfferSnapshot, offerUrl: string): Promise<GeneratedAsset[]> {
    const prompt = `Create 8 ready-to-use community replies for promoting "${snapshot.productName}".
Offer URL: ${offerUrl}
Target audience: ${snapshot.targetAudience}

Create replies for these scenarios:
- Someone asks "How does this work?"
- Price question
- Skeptical / "Is this legit?"
- "Where can I learn more?"
- Generic interested question
- "Does this work for beginners?"

Return ONLY JSON:
[{"title":"trigger question","content":"natural reply","meta":{"triggerComment":"...","style":"interested|price|skeptical|learn_more|generic"}}]

${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Array<{ title: string; content: string; meta: Record<string, unknown> }>>(raw, []);
        if (parsed.length >= 6) {
            return parsed.slice(0, 10).map((r) => ({
                type: "reply" as const,
                title: r.title,
                content: safeContent(r.content),
                meta: r.meta,
            }));
        }
    } catch { /* fallback */ }

    return buildFallbackReplies(snapshot, offerUrl).map((r) => ({
        type: "reply" as const,
        title: r.title,
        content: r.content,
        meta: r.meta,
    }));
}

export async function generatePromotionCtas(snapshot: OfferSnapshot, offerUrl: string): Promise<GeneratedAsset[]> {
    const prompt = `Create 6 call-to-action lines for "${snapshot.productName}".
Offer URL: ${offerUrl}
Use human language: Learn More, See How It Works, Explore the Resource, Want the Details?, Take a Look

Return ONLY JSON:
[{"content":"CTA text","meta":{"type":"Soft|Educational|Resource|Curiosity|Direct|Conversation","recommended":false}}]

Mark ONE as recommended.
${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Array<{ content: string; meta: { type: string; recommended?: boolean } }>>(raw, []);
        if (parsed.length >= 4) {
            return parsed.slice(0, 6).map((c) => ({
                type: "cta" as const,
                content: safeContent(c.content),
                meta: c.meta,
            }));
        }
    } catch { /* fallback */ }

    return buildFallbackCtas(snapshot, offerUrl).map((c) => ({
        type: "cta" as const,
        content: c.content,
        meta: c.meta,
    }));
}

export async function generateQuickPlan(
    snapshot: OfferSnapshot,
    postIds: string[],
    hookIds: string[],
    replyIds: string[],
): Promise<QuickPlanDay[]> {
    const prompt = `Create a 3-5 day quick-start promotion plan for "${snapshot.productName}".
Target audience: ${snapshot.targetAudience}

Return ONLY JSON:
[{"day":1,"label":"Today","actions":[{"label":"action description","type":"copy|view|info"}]}]

Keep it simple — NOT a 30-day calendar. 3-5 days max.
${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<QuickPlanDay[]>(raw, []);
        if (parsed.length >= 3) {
            return parsed.slice(0, 7).map((day, di) => ({
                ...day,
                actions: day.actions.map((a, ai) => ({
                    ...a,
                    assetId: ai === 0 && postIds[di] ? postIds[di] : ai === 1 && hookIds[di] ? hookIds[di] : replyIds[0],
                })),
            }));
        }
    } catch { /* fallback */ }

    const plan = buildFallbackQuickPlan(snapshot);
    if (postIds[0]) plan[0].actions[0].assetId = postIds[0];
    if (hookIds[0]) plan[0].actions[1].assetId = hookIds[0];
    return plan;
}

export function selectPlatforms(snapshot: OfferSnapshot): string[] {
    const channels = snapshot.promotionChannels?.length
        ? snapshot.promotionChannels
        : ["Facebook Groups", "Reddit", "Q&A", "Social"];
    return channels.slice(0, 5);
}

export function buildRecommendations(
    posts: Array<{ id: string; content: string; platform: string; cta: string; why: string; meta?: Record<string, unknown> }>,
    hooks: Array<{ id: string; content: string; meta?: Record<string, unknown> }>,
    replies: Array<{ id: string; content: string }>,
    ctas: Array<{ id: string; content: string; meta?: Record<string, unknown> }>,
): KitRecommendations {
    const bestPost = posts.find((p) => p.meta?.recommended) || posts[0];
    const bestHook = hooks.find((h) => h.meta?.recommended) || hooks[0];
    const bestReply = replies[0];
    const bestCta = ctas.find((c) => c.meta?.recommended) || ctas[0];

    return {
        bestPostId: bestPost?.id,
        bestReplyId: bestReply?.id,
        bestHookId: bestHook?.id,
        bestCtaId: bestCta?.id,
        bestPromotionId: bestPost?.id,
        bestPromotionWhy: bestPost?.why || "This angle focuses on the main problem your offer solves and starts a conversation naturally.",
        bestPromotionPlatform: bestPost?.platform || "Facebook Groups",
        bestPromotionCta: bestPost?.cta || bestCta?.content || "",
        nextAction: `Start with this ${bestPost?.platform || "social"} post.`,
        nextActionAssetId: bestPost?.id,
    };
}

export async function improveAssetContent(
    snapshot: OfferSnapshot,
    offerUrl: string,
    currentContent: string,
    assetType: string,
    option: string,
): Promise<string> {
    const optionLabels: Record<string, string> = {
        more_natural: "Make it more natural and conversational",
        shorter: "Make it shorter while keeping the key message",
        stronger_opening: "Strengthen the opening hook",
        more_helpful: "Make it more helpful and educational",
        less_salesy: "Make it less salesy, more resource-focused",
        more_conversational: "Make it more conversational",
        better_cta: "Improve the call-to-action",
    };

    const prompt = `Improve this ${assetType} for "${snapshot.productName}".
Offer URL: ${offerUrl}
Instruction: ${optionLabels[option] || option}

Current content:
${currentContent}

Return ONLY the improved text. No JSON, no quotes.
${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        return safeContent(raw.trim());
    } catch {
        return currentContent;
    }
}

export async function regenerateAssetContent(
    snapshot: OfferSnapshot,
    offerUrl: string,
    currentContent: string,
    assetType: string,
    platform: string,
    option: string,
): Promise<string> {
    const optionLabels: Record<string, string> = {
        different_angle: "Use a completely different promotional angle",
        shorter: "Make a shorter version",
        more_casual: "Make it more casual",
        more_educational: "Make it more educational",
        more_direct: "Make it more direct but still honest",
        completely_different: "Create a completely different version",
    };

    const prompt = `Create a new ${assetType} for "${snapshot.productName}".
Platform: ${platform}
Offer URL: ${offerUrl}
Instruction: ${optionLabels[option] || option}
Previous version (create something different):
${currentContent.slice(0, 300)}

Return ONLY the new content text. No JSON.
${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        return safeContent(raw.trim());
    } catch {
        return currentContent;
    }
}

function detectCommentIntent(comment: string): "price" | "skeptical" | "learn_more" | "beginner" | "how" | "generic" {
    const c = comment.toLowerCase();
    if (/\b(cost|price|how much|\$|expensive|cheap|afford|pricing)\b/.test(c)) return "price";
    if (/\b(scam|legit|fake|trust|worth it|really work|does it work|skeptic)\b/.test(c)) return "skeptical";
    if (/\b(learn more|more info|details|link|where|website|tell me more)\b/.test(c)) return "learn_more";
    if (/\b(beginner|new to|start|starting|newbie)\b/.test(c)) return "beginner";
    if (/\b(how|work|works|what is|what's included|include)\b/.test(c)) return "how";
    return "generic";
}

function buildCommentAwareFallbackReply(
    snapshot: OfferSnapshot,
    offerUrl: string,
    comment: string,
): { recommended: string; alternatives: Array<{ style: string; text: string }> } {
    const intent = detectCommentIntent(comment);
    const product = snapshot.productName;
    const promise = snapshot.mainPromise.toLowerCase();
    const audience = snapshot.targetAudience.toLowerCase();
    const benefit = snapshot.primaryBenefits[0]?.toLowerCase() || "practical guidance";

    const byIntent: Record<typeof intent, string> = {
        price: `Good question about cost — pricing is listed on the official page for ${product}. It focuses on ${promise}. You can check the details here: ${offerUrl}`,
        skeptical: `Fair to ask. ${product} is a resource for ${audience} and focuses on ${benefit}. Best to review the page yourself and decide: ${offerUrl}`,
        learn_more: `Happy to share more. ${product} covers ${promise}. Full details are here: ${offerUrl}`,
        beginner: `Yes — ${product} is geared toward ${audience}. It walks through ${promise} in a simple way. More here: ${offerUrl}`,
        how: `It works like this: ${product} helps with ${promise}, especially around ${benefit}. Here's the breakdown: ${offerUrl}`,
        generic: `Thanks for asking about that. For "${comment.slice(0, 120)}", ${product} is a useful resource for ${audience} — it covers ${promise}. Details: ${offerUrl}`,
    };

    return {
        recommended: byIntent[intent],
        alternatives: [
            { style: "Shorter", text: `Quick answer: check ${product} here — ${offerUrl}` },
            { style: "More casual", text: `Yeah, for that question I'd point you to ${product}. It covers ${promise}. Link: ${offerUrl}` },
            {
                style: "More helpful",
                text: `Addressing your comment ("${comment.slice(0, 80)}"): ${product} is built for ${audience} and focuses on ${benefit}. See: ${offerUrl}`,
            },
        ],
    };
}

export async function generateSmartReply(
    snapshot: OfferSnapshot,
    offerUrl: string,
    comment: string,
): Promise<{ recommended: string; alternatives: Array<{ style: string; text: string }> }> {
    const prompt = `Someone left this exact comment under a post:
"""
${comment}
"""

Write a reply that DIRECTLY answers that comment (price, skepticism, how-it-works, beginners, etc.).
Do NOT use a generic template. Mirror the question's intent.
Promote "${snapshot.productName}" only as a helpful resource after answering.
Offer URL: ${offerUrl}
Target audience: ${snapshot.targetAudience}
Main promise: ${snapshot.mainPromise}
Benefits: ${snapshot.primaryBenefits.join(", ")}

Return ONLY JSON:
{"recommended":"best reply that answers the comment","alternatives":[{"style":"Shorter","text":"..."},{"style":"More casual","text":"..."},{"style":"More helpful","text":"..."},{"style":"More persuasive","text":"..."}]}

${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<{ recommended: string; alternatives: Array<{ style: string; text: string }> }>(raw, {
            recommended: "",
            alternatives: [],
        });
        if (parsed.recommended) {
            return {
                recommended: safeContent(parsed.recommended),
                alternatives: (parsed.alternatives || []).map((a) => ({
                    style: a.style,
                    text: safeContent(a.text),
                })),
            };
        }
    } catch { /* fallback */ }

    return buildCommentAwareFallbackReply(snapshot, offerUrl, comment);
}

export async function generatePostFromAngle(
    snapshot: OfferSnapshot,
    offerUrl: string,
    angleTitle: string,
    angleDescription: string,
    platform: string,
): Promise<GeneratedPost> {
    const prompt = `Create one polished promotional post for "${snapshot.productName}".
Angle: ${angleTitle} — ${angleDescription}
Platform: ${platform}
Offer URL: ${offerUrl}
Target audience: ${snapshot.targetAudience}

Return ONLY JSON:
{"platform":"...","title":"...","content":"full post","angle":"...","cta":"...","why":"why this works","include_link":true}

${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<GeneratedPost>(raw, {} as GeneratedPost);
        if (parsed.content) {
            return { ...parsed, content: safeContent(parsed.content), meta: { fromAngle: angleTitle } };
        }
    } catch { /* fallback */ }

    const fallbacks = buildFallbackPosts(snapshot, offerUrl);
    const match =
        fallbacks.find((p) => p.angle.toLowerCase() === angleTitle.toLowerCase()) ||
        fallbacks.find((p) => angleTitle.toLowerCase().includes(p.angle.toLowerCase())) ||
        fallbacks[Math.floor(Math.random() * fallbacks.length)] ||
        fallbacks[0];
    return { ...match, angle: angleTitle, platform, meta: { fromAngle: angleTitle } };
}

export async function rotateContent(
    snapshot: OfferSnapshot,
    offerUrl: string,
    usedAngles: string[],
    existingContents: string[] = [],
): Promise<GeneratedPost> {
    const unusedAngles = ["problem/solution", "educational", "beginner", "curiosity", "mistake", "checklist", "comparison", "FAQ", "resource"]
        .filter((a) => !usedAngles.map((x) => x.toLowerCase()).includes(a.toLowerCase()));
    const angle = unusedAngles[Math.floor(Math.random() * Math.max(unusedAngles.length, 1))] || "educational";
    const platforms = selectPlatforms(snapshot);
    const platform = platforms[Math.floor(Math.random() * platforms.length)];

    const post = await generatePostFromAngle(snapshot, offerUrl, angle, `Fresh ${angle} approach`, platform);
    const normalizedExisting = new Set(existingContents.map((c) => c.trim().toLowerCase()));
    if (!normalizedExisting.has(post.content.trim().toLowerCase())) {
        return post;
    }

    // If AI/fallback repeated an existing post, pick a different fallback angle.
    const fallbacks = buildFallbackPosts(snapshot, offerUrl).filter(
        (p) => !normalizedExisting.has(p.content.trim().toLowerCase()),
    );
    const alt = fallbacks[0] || post;
    return { ...alt, platform, meta: { ...alt.meta, rotated: true } };
}
