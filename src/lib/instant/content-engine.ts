import { callChatGPT } from "@/lib/llm";
import { parseJsonFromLlm } from "@/lib/dfy/parse-json";
import type { OfferSnapshot } from "@/lib/dfy/types";
import {
    buildFallbackAngles,
    buildFallbackCtas,
    buildFallbackHooks,
    buildFallbackPostContent,
    buildFallbackPosts,
    buildFallbackQuickPlan,
    buildFallbackReplies,
    isAngleLabelStub,
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

function polishReplyText(text: string): string {
    return text
        .replace(/\s+([,.;!?])/g, "$1")
        .replace(/([.!?]),/g, "$1")
        .replace(/\.{2,}/g, ".")
        .replace(/,{2,}/g, ",")
        .replace(/\s{2,}/g, " ")
        .trim();
}

function safeContent(text: string): string {
    const cleaned = polishReplyText(sanitizeContent(text));
    const validation = validateAssetContent(cleaned);
    return validation.ok ? cleaned : polishReplyText(sanitizeContent(text.replace(/guaranteed|I made \$|I earned/gi, "")));
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
Put the angle ONLY in metadata — never write labels like "Problem/solution angle for…" inside the post content.
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
            return parsed.slice(0, 12).map((p, i) => {
                const angle = p.angle || "problem/solution";
                const content = isAngleLabelStub(p.content)
                    ? buildFallbackPostContent(snapshot, angle, offerUrl, i)
                    : safeContent(p.content);
                return {
                    ...p,
                    content,
                    include_link: p.include_link ?? i % 3 !== 2,
                    meta: { style: angle, recommended: i === 0 },
                };
            });
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
Main promise: ${snapshot.mainPromise}
Benefits: ${snapshot.primaryBenefits.join(", ")}
Pain points: ${snapshot.painPoints.join(", ")}

Create replies for these scenarios (title = the trigger question people ask):
- "How does this work?"
- "How often should I use it?" / frequency-or-schedule questions
- "How much does it cost?"
- "Is this legit?"
- "Where can I learn more?"
- "Does this work for beginners?"
- "What's included?"
- "Has anyone tried this?"

Quality rules for EACH reply:
1. Answer the trigger question in the first 1–2 sentences.
2. Sound like a helpful peer — short, natural, conversational (2–4 sentences).
3. Mention ${snapshot.productName} only as a useful resource AFTER answering.
4. Include the offer URL once near the end when it helps; otherwise keep it conversational.
5. No generic filler like "practical solution for people looking for results."
6. Clean grammar — no doubled punctuation.

Return ONLY JSON:
[{"title":"trigger question","content":"natural reply","meta":{"triggerComment":"...","style":"interested|frequency|price|skeptical|learn_more|beginner|whats_included|generic"}}]

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
        content: safeContent(r.content),
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

type CommentIntent =
    | "price"
    | "skeptical"
    | "learn_more"
    | "beginner"
    | "frequency"
    | "whats_included"
    | "how"
    | "generic";

function detectCommentIntent(comment: string): CommentIntent {
    const c = comment.toLowerCase().trim();

    // More specific patterns first — "how often" must not fall through to generic "how".
    if (/\b(how often|how many times|how frequently|how long|dosage|dose|schedule|per day|per week|daily|weekly|times a (day|week)|frequency)\b/.test(c)) {
        return "frequency";
    }
    if (/\b(cost|price|how much|\$|expensive|cheap|afford|pricing|free trial|subscription)\b/.test(c)) {
        return "price";
    }
    if (/\b(scam|legit|fake|trust|worth it|really work|does it work|does this work|skeptic|real)\b/.test(c)) {
        return "skeptical";
    }
    if (/\b(what'?s included|what is included|what do (i|you) get|what'?s in|includes?|package|kit contain)\b/.test(c)) {
        return "whats_included";
    }
    if (/\b(learn more|more info|details|where (can|do)|website|tell me more|link please)\b/.test(c)) {
        return "learn_more";
    }
    if (/\b(beginner|new to|just starting|starting out|newbie|never (done|tried)|for newbies)\b/.test(c)) {
        return "beginner";
    }
    if (/\b(how does|how do|how it works|how this works|what is this|what's this|explain)\b/.test(c)) {
        return "how";
    }
    if (/^(how|what|why|where|when|who)\b/.test(c)) {
        return "generic";
    }
    return "generic";
}

function buildCommentAwareFallbackReply(
    snapshot: OfferSnapshot,
    offerUrl: string,
    comment: string,
): { recommended: string; alternatives: Array<{ style: string; text: string }> } {
    const intent = detectCommentIntent(comment);
    const product = snapshot.productName;
    const promise = snapshot.mainPromise.replace(/[.]+$/, "").toLowerCase();
    const audience = snapshot.targetAudience.toLowerCase();
    const benefit = (snapshot.primaryBenefits[0] || "a practical, beginner-friendly approach").replace(/[.]+$/, "").toLowerCase();
    const pain = (snapshot.painPoints[0] || "getting started").replace(/[.]+$/, "").toLowerCase();
    const category = snapshot.category.toLowerCase();

    const byIntent: Record<CommentIntent, string> = {
        frequency:
            `Great question — the best schedule depends on your setup, and the ${product} page usually spells out the recommended cadence clearly. I wouldn't guess from memory; check the instructions there so you follow what matches the kit: ${offerUrl}`,
        price:
            `Pricing is listed on the official ${product} page (it can change, so the site is the source of truth). It's aimed at ${audience} who want help with ${promise}. Details: ${offerUrl}`,
        skeptical:
            `Totally fair to question it. ${product} is a ${category} resource focused on ${benefit} for people dealing with ${pain}. Best move is to skim the page yourself and decide if it fits: ${offerUrl}`,
        learn_more:
            `Happy to point you in the right direction. ${product} focuses on ${promise} for ${audience}. Here's the full breakdown: ${offerUrl}`,
        beginner:
            `Yes — it's geared toward ${audience}, especially if you're still figuring out ${pain}. ${product} keeps the focus on ${benefit}. More here: ${offerUrl}`,
        whats_included:
            `What's inside is listed on the official page (ingredients/modules can vary by package). ${product} is built around ${promise}. See the current contents here: ${offerUrl}`,
        how:
            `Short version: ${product} is set up to help with ${promise}, with an emphasis on ${benefit}. If you want the step-by-step, the page walks through it here: ${offerUrl}`,
        generic:
            `Good question. On "${comment.slice(0, 100).trim()}${comment.length > 100 ? "…" : ""}" — the clearest answer is on the ${product} page, since it covers ${promise} for ${audience}: ${offerUrl}`,
    };

    return {
        recommended: polishReplyText(byIntent[intent]),
        alternatives: [
            {
                style: "Shorter",
                text: polishReplyText(
                    intent === "frequency"
                        ? `Check the recommended schedule on the ${product} page — that's the accurate source: ${offerUrl}`
                        : `Quick answer for that: the details are on the ${product} page → ${offerUrl}`,
                ),
            },
            {
                style: "More casual",
                text: polishReplyText(
                    intent === "frequency"
                        ? `Honestly I'd follow whatever cadence they list for ${product} rather than guessing. It's here: ${offerUrl}`
                        : `Yeah — for that, ${product} is the resource I'd check. It covers ${promise}. Link: ${offerUrl}`,
                ),
            },
            {
                style: "More helpful",
                text: polishReplyText(
                    `Direct answer to your comment: ${byIntent[intent]}`,
                ),
            },
        ],
    };
}

export async function generateSmartReply(
    snapshot: OfferSnapshot,
    offerUrl: string,
    comment: string,
): Promise<{ recommended: string; alternatives: Array<{ style: string; text: string }> }> {
    const intent = detectCommentIntent(comment);
    const prompt = `You are helping an affiliate marketer reply to a real comment under their promotional post.

THEIR COMMENT (answer this exactly):
"""
${comment}
"""

Detected intent: ${intent}

Product context (use only as support AFTER answering):
- Product: ${snapshot.productName}
- Category: ${snapshot.category}
- Audience: ${snapshot.targetAudience}
- Promise: ${snapshot.mainPromise}
- Benefits: ${snapshot.primaryBenefits.join("; ")}
- Pain points: ${snapshot.painPoints.join("; ")}
- Offer URL: ${offerUrl}

Reply requirements:
1. First sentence must answer the commenter's question or concern. Do not pitch first.
2. If you do not know a precise product fact (dosage, exact price, exact contents), say so honestly and point them to the official page — never invent numbers or schedules.
3. Sound like a helpful peer in a Facebook/Reddit thread: 2–4 short sentences, natural tone.
4. Mention the product only as a useful resource after the answer, then include the URL once.
5. Ban generic filler such as "practical solution for people looking for results" or "easy to get started" as empty phrases.
6. Clean grammar and punctuation. No doubled punctuation like "results.,".

Example quality bar for "How often should I use it?":
"I'd follow the schedule on the product page rather than guessing — it usually lists the recommended cadence clearly. For ${snapshot.productName}, check here: ${offerUrl}"

Return ONLY JSON:
{"recommended":"best reply that answers the comment","alternatives":[{"style":"Shorter","text":"..."},{"style":"More casual","text":"..."},{"style":"More helpful","text":"..."},{"style":"More persuasive","text":"..."}]}

${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<{ recommended: string; alternatives: Array<{ style: string; text: string }> }>(raw, {
            recommended: "",
            alternatives: [],
        });
        if (parsed.recommended?.trim()) {
            return {
                recommended: safeContent(parsed.recommended),
                alternatives: (parsed.alternatives || []).map((a) => ({
                    style: a.style,
                    text: safeContent(a.text || ""),
                })).filter((a) => a.text),
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
