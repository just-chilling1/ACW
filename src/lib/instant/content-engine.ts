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
    | "side_effects"
    | "price"
    | "skeptical"
    | "learn_more"
    | "beginner"
    | "frequency"
    | "whats_included"
    | "how"
    | "shipping"
    | "results_timeline"
    | "who_for"
    | "comparison"
    | "generic";

function detectCommentIntent(comment: string): CommentIntent {
    const c = comment.toLowerCase().trim();

    if (/\b(side effects?|adverse|allergic|allergy|safe(?:ty)?|reaction|interact|contraindic|harmful|risk(?:y)?|negative effects?|bad for|make (me )?sick|nausea|headache)\b/.test(c)) {
        return "side_effects";
    }
    if (/\b(how often|how many times|how frequently|dosage|dose|schedule|per day|per week|daily|weekly|times a (day|week)|frequency)\b/.test(c)) {
        return "frequency";
    }
    if (/\b(how long|when will|how soon|time to see|see results|start working|how fast|weeks?|months?)\b/.test(c) && /\b(result|work|notice|effect|change)\b/.test(c)) {
        return "results_timeline";
    }
    if (/\b(cost|price|how much|\$|expensive|cheap|afford|pricing|free trial|subscription)\b/.test(c)) {
        return "price";
    }
    if (/\b(scam|legit|fake|trust|worth it|really work|does it work|does this work|skeptic|real)\b/.test(c)) {
        return "skeptical";
    }
    if (/\b(ship|shipping|deliver|delivery|arrive|return policy|refund|money back|guarantee)\b/.test(c)) {
        return "shipping";
    }
    if (/\b(vs\.?|versus|compared to|better than|alternative|instead of|difference between)\b/.test(c)) {
        return "comparison";
    }
    if (/\b(right for me|for me|my age|pregnant|diabetes|condition|who is this for|is this for)\b/.test(c)) {
        return "who_for";
    }
    if (/\b(what'?s included|what is included|what do (i|you) get|what'?s in|includes?|package|kit contain|ingredients?)\b/.test(c)) {
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
    return "generic";
}

function cleanSnapshotPhrase(text: string, fallback: string): string {
    const trimmed = text.replace(/[.]+$/, "").trim();
    if (!trimmed) return fallback;
    if (/people looking for results.*people interested in/i.test(trimmed)) return fallback;
    if (trimmed.length > 100) return trimmed.slice(0, 100).trim().toLowerCase() + "…";
    return trimmed.toLowerCase();
}

function summarizeCommentTopic(comment: string): string {
    const topic = comment.trim().replace(/\?+$/, "").replace(/^["']|["']$/g, "");
    if (topic.length <= 90) return topic;
    return topic.slice(0, 90).trim() + "…";
}

function getIntentAnswerGuidance(intent: CommentIntent, product: string): string {
    const guidance: Record<CommentIntent, string> = {
        side_effects:
            `Acknowledge that reactions vary by person. Do NOT claim "no side effects." Say to check ingredients/cautions on the official page and consult a doctor if they have health conditions or take medication.`,
        frequency:
            `Say the recommended schedule is on the product page — do not invent a dosage or frequency.`,
        price:
            `Say pricing is on the official page and may vary by package — do not invent a dollar amount.`,
        skeptical:
            `Validate their skepticism. Explain what the product is for in plain terms without hype. Invite them to review the page themselves.`,
        shipping:
            `Say shipping times and return/refund terms are listed on the official checkout page — do not invent delivery dates.`,
        results_timeline:
            `Say timelines vary by person and the product page may note typical expectations — do not promise specific results in X days.`,
        who_for:
            `Say who the product is generally aimed at, but recommend they check suitability on the official page and with a professional if health-related.`,
        comparison:
            `Do not trash competitors. Briefly note what this product focuses on and suggest they compare details on the official page.`,
        whats_included:
            `Say exact contents/ingredients are listed on the official page and can vary by package.`,
        how:
            `Give a plain 1-sentence explanation of what the product does, then point to the page for the full walkthrough.`,
        learn_more:
            `Briefly say what the product helps with, then share the link.`,
        beginner:
            `Confirm whether it's beginner-friendly based on the audience info, without overpromising.`,
        generic:
            `Restate their question in your own words in the first sentence, then give a direct helpful answer before mentioning the link.`,
    };
    return guidance[intent];
}

function isDeflectiveReply(reply: string, comment: string): boolean {
    const r = reply.toLowerCase();
    const deflectivePatterns = [
        /clearest answer is on the .* page/,
        /the details are on the .* page/,
        /covers a practical solution for people looking for results/,
        /for people interested in/,
        /since it covers .* for .*:/,
    ];
    if (deflectivePatterns.some((p) => p.test(r))) return true;

    const commentWords = comment.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const keyWords = [...new Set(commentWords)].filter(
        (w) => !["does", "have", "what", "this", "that", "with", "about", "any", "there", "they", "your", "from"].includes(w),
    );
    if (keyWords.length === 0) return false;
    const matched = keyWords.filter((w) => r.includes(w));
    return matched.length === 0;
}

function buildCommentAwareFallbackReply(
    snapshot: OfferSnapshot,
    offerUrl: string,
    comment: string,
): { recommended: string; alternatives: Array<{ style: string; text: string }> } {
    const intent = detectCommentIntent(comment);
    const product = snapshot.productName;
    const topic = summarizeCommentTopic(comment);
    const audience = snapshot.targetAudience.toLowerCase();
    const benefit = cleanSnapshotPhrase(
        snapshot.primaryBenefits[0] || "",
        "the main benefits listed on the site",
    );
    const pain = cleanSnapshotPhrase(snapshot.painPoints[0] || "", "getting started");
    const category = snapshot.category.toLowerCase();
    const isHealth = /\b(supplement|health|fitness|nutrition|vitamin|amino|weight|muscle|skin|wellness)\b/i.test(category + " " + product);

    const byIntent: Record<CommentIntent, string> = {
        side_effects: isHealth
            ? `Side effects depend on the person — I can't speak to your specific health situation from a comment. ${product} lists its ingredients and any cautions on the official page; if you're on medication, pregnant, or have allergies, run it by your doctor first. Full details here: ${offerUrl}`
            : `Good question on safety. I haven't seen widespread issues reported, but everyone's situation is different. Check the official ${product} page for any listed cautions or terms before trying it: ${offerUrl}`,
        frequency:
            `For how often to use it, I'd follow whatever schedule ${product} lists on the official page rather than guessing — that's the accurate source for dosage/cadence: ${offerUrl}`,
        price:
            `Pricing can change and may vary by package, so the official ${product} page is the source of truth. It's aimed at ${audience}. Current details: ${offerUrl}`,
        skeptical:
            `Fair to be skeptical. ${product} is a ${category} offer focused on ${benefit}. I'd skim the official page yourself and decide if it fits your situation: ${offerUrl}`,
        shipping:
            `Shipping times and any return/refund policy are spelled out on the official ${product} checkout page — I wouldn't guess delivery dates from memory: ${offerUrl}`,
        results_timeline:
            `Results timing varies a lot person to person, so I wouldn't promise a specific timeline. The ${product} page may note what to expect; worth reading before you commit: ${offerUrl}`,
        who_for:
            `${product} is generally aimed at ${audience}, especially if you're dealing with ${pain}. Whether it's right for your specific situation is something the official page (and your doctor, if health-related) can help you judge: ${offerUrl}`,
        comparison:
            `Hard to compare without knowing what you're weighing it against. ${product} focuses on ${benefit} — I'd compare the specifics on the official page side by side with whatever else you're considering: ${offerUrl}`,
        learn_more:
            `${product} is built around ${benefit} for ${audience}. Here's the full breakdown on the official page: ${offerUrl}`,
        beginner:
            `Yes — it's geared toward ${audience}, especially if you're still figuring out ${pain}. ${product} keeps things focused on ${benefit}. More here: ${offerUrl}`,
        whats_included:
            `Exact contents and ingredients are listed on the official ${product} page (they can vary by package). That's the best place to see what's included: ${offerUrl}`,
        how:
            `In short, ${product} is designed to help with ${benefit} for ${audience}. The official page walks through how it works step by step: ${offerUrl}`,
        generic:
            `On "${topic}" — I don't want to guess wrong from a comment. The official ${product} page has the most accurate answer for that, especially around ${benefit}. Check here: ${offerUrl}`,
    };

    const recommended = polishReplyText(byIntent[intent]);

    return {
        recommended,
        alternatives: [
            {
                style: "Shorter",
                text: polishReplyText(
                    intent === "side_effects"
                        ? `Reactions vary — check ingredients/cautions on the ${product} page and ask your doctor if unsure: ${offerUrl}`
                        : intent === "frequency"
                          ? `Follow the schedule on the ${product} page — that's the accurate source: ${offerUrl}`
                          : `Best answer for that is on the official ${product} page: ${offerUrl}`,
                ),
            },
            {
                style: "More casual",
                text: polishReplyText(
                    intent === "side_effects"
                        ? `Honestly everyone's different with this stuff — I'd read the ingredients/cautions on ${product}'s page and check with your doc if you have health concerns: ${offerUrl}`
                        : `Yeah, for that I'd just check the ${product} page directly rather than guessing: ${offerUrl}`,
                ),
            },
            {
                style: "More helpful",
                text: polishReplyText(recommended),
            },
        ],
    };
}

function formatSmartReplyResult(
    recommended: string,
    alternatives: Array<{ style: string; text: string }>,
): { recommended: string; alternatives: Array<{ style: string; text: string }> } {
    return {
        recommended: safeContent(recommended),
        alternatives: alternatives
            .map((a) => ({ style: a.style, text: safeContent(a.text || "") }))
            .filter((a) => a.text),
    };
}

export async function generateSmartReply(
    snapshot: OfferSnapshot,
    offerUrl: string,
    comment: string,
): Promise<{ recommended: string; alternatives: Array<{ style: string; text: string }> }> {
    const intent = detectCommentIntent(comment);
    const intentGuidance = getIntentAnswerGuidance(intent, snapshot.productName);
    const objections = snapshot.objections?.length
        ? snapshot.objections.join("; ")
        : "None listed";

    const prompt = `You are writing a helpful reply to a REAL comment on a social post. Your job is to ANSWER THE QUESTION first — not deflect to a link.

COMMENT TO ANSWER:
"""
${comment}
"""

Question type: ${intent}
How to answer this type: ${intentGuidance}

Product context (supporting info only — answer the comment FIRST):
- Product: ${snapshot.productName}
- Category: ${snapshot.category}
- Audience: ${snapshot.targetAudience}
- Key benefits: ${snapshot.primaryBenefits.slice(0, 3).join("; ")}
- Common objections: ${objections}
- Offer URL: ${offerUrl}

STRICT RULES:
1. Sentence 1 MUST directly address their question or concern. Never open with "Good question" followed only by a link.
2. If you lack a specific fact (exact price, dosage, side effects, shipping time), say so honestly — then tell them where to find it on the official page.
3. Never invent statistics, testimonials, medical claims, or guaranteed outcomes.
4. 2–4 sentences total. Sound like a helpful peer on Reddit/Facebook, not a sales bot.
5. Include the URL once, naturally, at the end.
6. BANNED phrases: "clearest answer is on the page", "practical solution for people looking for results", "for people interested in", empty marketing filler.

EXAMPLES (match this quality):

Q: "does it have any side effects?"
A: "Side effects can vary — some people tolerate it fine, others may not. I wouldn't guess on your situation; the official page lists ingredients and any cautions, and your doctor knows your history best if you're on meds. Details here: ${offerUrl}"

Q: "How much does it cost?"
A: "Pricing depends on the package and can change, so I wouldn't quote a number from memory. The current price is on the official checkout page here: ${offerUrl}"

Q: "Is this a scam?"
A: "Totally fair to ask — I'd be skeptical too. It's a ${snapshot.category} product aimed at ${snapshot.targetAudience.toLowerCase()}. Worth reading the official page yourself and deciding if it fits: ${offerUrl}"

Return ONLY JSON:
{"recommended":"...","alternatives":[{"style":"Shorter","text":"..."},{"style":"More casual","text":"..."},{"style":"More helpful","text":"..."}]}

${SAFETY_RULES_PROMPT}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<{ recommended: string; alternatives: Array<{ style: string; text: string }> }>(raw, {
            recommended: "",
            alternatives: [],
        });
        const recommended = parsed.recommended?.trim() || "";
        if (recommended && !isDeflectiveReply(recommended, comment)) {
            return formatSmartReplyResult(recommended, parsed.alternatives || []);
        }
    } catch { /* retry below */ }

    try {
        const retryPrompt = `Write a 2–4 sentence reply to this comment: "${comment}"

Product: ${snapshot.productName} (${snapshot.category})
URL: ${offerUrl}

Rules: Answer their question in the FIRST sentence. If unsure of exact facts, say so honestly. Include URL once at end. No marketing filler.

Return ONLY the reply text, no JSON.`;
        const raw = await callChatGPT([{ role: "user", content: retryPrompt }]);
        const text = raw.trim();
        if (text && !isDeflectiveReply(text, comment)) {
            return formatSmartReplyResult(text, []);
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
