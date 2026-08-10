import { callChatGPT } from "@/lib/llm";
import { parseJsonFromLlm, clampScore, opportunityLabel } from "./parse-json";
import { scoreOfferRelevance } from "./search-fallbacks";
import type { OfferSnapshot, ScoreBreakdown, SocialPost } from "./types";

export interface ScoredOpportunity {
    post: SocialPost;
    relevanceScore: number;
    intentScore: number;
    opportunityScore: number;
    label: ReturnType<typeof opportunityLabel>;
    whySelected: string;
    recommendedApproach: string;
}

export function buildFallbackReply(item: ScoredOpportunity, snapshot: OfferSnapshot, offerUrl: string): string {
    const topic = item.post.title || item.post.text.slice(0, 80);
    const pain = snapshot.painPoints[0]?.toLowerCase() || snapshot.category.toLowerCase();
    const benefit = snapshot.primaryBenefits[0]?.toLowerCase() || snapshot.mainPromise.toLowerCase();

    return [
        `Great question about ${topic.toLowerCase()}.`,
        `For ${pain}, a simple starting point is focusing on ${benefit}.`,
        `I've seen beginners get better results when they follow a structured guide instead of piecing random tips together.`,
        `If you want something built for ${snapshot.targetAudience.toLowerCase()}, ${snapshot.productName} walks through it step by step: ${offerUrl}`,
    ].join(" ");
}

export function buildFallbackAlternatives(item: ScoredOpportunity, snapshot: OfferSnapshot, offerUrl: string): { style: string; text: string }[] {
    const topic = item.post.title || "this topic";
    return [
        {
            style: "Helpful expert",
            text: `For ${topic.toLowerCase()}, I'd compare a few options and look for something that covers ${snapshot.primaryBenefits[0]?.toLowerCase() || "the basics"}. ${snapshot.productName} is worth a look: ${offerUrl}`,
        },
        {
            style: "Relatable angle",
            text: `A lot of people feel stuck on ${snapshot.painPoints[0]?.toLowerCase() || "getting started"}. A beginner-friendly resource like ${snapshot.productName} can help: ${offerUrl}`,
        },
        {
            style: "Short & direct",
            text: `${snapshot.productName} covers this well for beginners — ${offerUrl}`,
        },
    ];
}

export function scorePostHeuristic(post: SocialPost, snapshot: OfferSnapshot): ScoredOpportunity {
    const text = `${post.title || ""} ${post.text || ""}`;
    const offerRelevance = scoreOfferRelevance(text, snapshot);

    let relevance = clampScore(35 + offerRelevance);
    let intent = 50;
    const lower = text.toLowerCase();
    if (/looking for|need help|recommend|which|what should|how do i|best|worth it|anyone tried/.test(lower)) intent += 25;
    if (/buy|purchase|alternative|vs|review/.test(lower)) intent += 15;

    const engagementNum = typeof post.engagement === "number"
        ? post.engagement
        : parseInt(String(post.engagement || "0").replace(/\D/g, ""), 10) || 0;
    if (engagementNum > 500) intent += 5;

    intent = clampScore(intent);
    const opportunityScore = clampScore(Math.round(relevance * 0.45 + intent * 0.55));

    const topicSnippet = (post.title || post.text).slice(0, 60).toLowerCase();

    return {
        post,
        relevanceScore: relevance,
        intentScore: intent,
        opportunityScore,
        label: opportunityLabel(opportunityScore),
        whySelected: `This ${post.platform} thread asks about "${topicSnippet}" — a strong match for ${snapshot.productName} because it relates to ${snapshot.painPoints[0]?.toLowerCase() || snapshot.category.toLowerCase()}.`,
        recommendedApproach: `Acknowledge their question about ${topicSnippet}, share a practical tip, then mention ${snapshot.productName} as a resource for ${snapshot.primaryBenefits[0]?.toLowerCase() || "getting started"}.`,
    };
}

export async function enrichOpportunitiesWithAi(
    scored: ScoredOpportunity[],
    snapshot: OfferSnapshot,
    offerUrl: string,
): Promise<(ScoredOpportunity & {
    recommendedReply: string;
    alternativeReplies: { style: string; text: string }[];
})[]> {
    const results: (ScoredOpportunity & {
        recommendedReply: string;
        alternativeReplies: { style: string; text: string }[];
    })[] = [];

    for (let i = 0; i < scored.length; i += 3) {
        const chunk = scored.slice(i, i + 3);
        const chunkResults = await Promise.allSettled(
            chunk.map(async (item) => {
                const prompt = `Write a unique, high-quality promotional reply for this specific conversation.

OFFER DETAILS:
- Product: ${snapshot.productName}
- Category: ${snapshot.category}
- Main promise: ${snapshot.mainPromise}
- Benefits: ${snapshot.primaryBenefits.join(", ")}
- Pain points solved: ${snapshot.painPoints.join(", ")}
- Offer URL: ${offerUrl}

CONVERSATION:
Platform: ${item.post.platform}
Title: ${item.post.title || "N/A"}
Text: ${item.post.text}

RULES:
1. Reply must directly address THIS person's question or problem — not a generic template.
2. Be genuinely helpful first. Add real value before mentioning the offer.
3. Include the offer URL naturally once in the recommended reply.
4. Write 3 alternative replies with different styles: "Helpful expert", "Relatable angle", "Short & direct".
5. Each reply must be unique to this conversation — do NOT reuse phrasing across posts.
6. Do NOT claim you personally used the product. Frame as a useful resource.
7. 3-6 sentences for the recommended reply. Alternatives can be shorter.

Return ONLY JSON:
{"id":"${item.post.id}","whySelected":"why this post fits ${snapshot.productName}","recommendedApproach":"how to approach this specific thread","recommendedReply":"...","alternativeReplies":[{"style":"Helpful expert","text":"..."},{"style":"Relatable angle","text":"..."},{"style":"Short & direct","text":"..."}]}`;

                const raw = await callChatGPT([{ role: "user", content: prompt }]);
                const parsed = parseJsonFromLlm<{
                    id: string;
                    whySelected?: string;
                    recommendedApproach?: string;
                    recommendedReply?: string;
                    alternativeReplies?: { style: string; text: string }[];
                }>(raw, { id: item.post.id });

                return {
                    ...item,
                    whySelected: parsed.whySelected || item.whySelected,
                    recommendedApproach: parsed.recommendedApproach || item.recommendedApproach,
                    recommendedReply: (parsed.recommendedReply?.trim() || buildFallbackReply(item, snapshot, offerUrl)),
                    alternativeReplies: parsed.alternativeReplies?.length
                        ? parsed.alternativeReplies
                        : buildFallbackAlternatives(item, snapshot, offerUrl),
                };
            }),
        );

        for (let j = 0; j < chunk.length; j++) {
            const settled = chunkResults[j];
            const item = chunk[j];
            if (settled.status === "fulfilled") {
                results.push(settled.value);
            } else {
                results.push({
                    ...item,
                    recommendedReply: buildFallbackReply(item, snapshot, offerUrl),
                    alternativeReplies: buildFallbackAlternatives(item, snapshot, offerUrl),
                });
            }
        }
    }

    return results.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

export async function generateContentPack(
    snapshot: OfferSnapshot,
    offerUrl: string,
    channels: string[],
): Promise<Array<{ kind: "post" | "comment" | "submission_copy"; channel: string; content: string; meta: Record<string, unknown> }>> {
    const prompt = `Create diversified promotional content for "${snapshot.productName}".
Offer URL: ${offerUrl}
Channels: ${channels.join(", ")}
Angles: ${snapshot.contentAngles.join(", ")}

Return ONLY JSON array of 12 items:
[{"kind":"post"|"comment"|"submission_copy","channel":"Facebook"|"Reddit"|"YouTube"|"Blog"|"Q&A","content":"...","meta":{"angle":"problem/solution","day":1}}]

Rules:
- Ready to copy, natural, non-spammy.
- Vary angles and CTAs.
- No fake testimonials or invented personal experiences.`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Array<{ kind: "post" | "comment" | "submission_copy"; channel: string; content: string; meta?: Record<string, unknown> }>>(raw, []);
        if (parsed.length >= 6) {
            return parsed.map((item, idx) => ({
                kind: item.kind,
                channel: item.channel || "Social",
                content: item.content,
                meta: { ...(item.meta || {}), angle: item.meta?.angle || snapshot.contentAngles[idx % snapshot.contentAngles.length], day: idx + 1 },
            }));
        }
    } catch { /* fallback below */ }

    return snapshot.contentAngles.slice(0, 8).map((angle, idx) => ({
        kind: idx % 3 === 0 ? "post" as const : idx % 3 === 1 ? "comment" as const : "submission_copy" as const,
        channel: ["Facebook", "Reddit", "Blog", "Q&A"][idx % 4],
        content: `${angle.charAt(0).toUpperCase() + angle.slice(1)} angle for ${snapshot.productName}: ${snapshot.mainPromise}. Learn more: ${offerUrl}`,
        meta: { angle, day: idx + 1 },
    }));
}

export async function generateHooks(snapshot: OfferSnapshot): Promise<Array<{ content: string; meta: { category: string; recommended?: boolean; bestForAngle?: string } }>> {
    const prompt = `Create 20 short hooks for "${snapshot.productName}".
Product promise: ${snapshot.mainPromise}
Target audience: ${snapshot.targetAudience}
Content angles: ${snapshot.contentAngles.join(", ")}

Return ONLY JSON:
[{"content":"...","meta":{"category":"Curiosity|Problem|Benefit|Contrarian|Story|Question|Beginner|Mistake","bestForAngle":"problem/solution","recommended":false}}]

Rules:
- Each hook must reference the product, audience, or pain point — no generic filler.
- Mark "recommended": true on exactly ONE hook that best fits the strongest angle "${snapshot.strongestAngle}".
- Set "bestForAngle" on each hook to the content angle it fits best.`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Array<{ content: string; meta: { category: string; recommended?: boolean; bestForAngle?: string } }>>(raw, []);
        if (parsed.length >= 10) {
            const hasRecommended = parsed.some((h) => h.meta?.recommended);
            if (!hasRecommended) {
                const bestIdx = parsed.findIndex((h) =>
                    h.meta?.bestForAngle === snapshot.contentAngles[0] ||
                    h.content.toLowerCase().includes(snapshot.productName.toLowerCase().slice(0, 12)),
                );
                parsed[bestIdx >= 0 ? bestIdx : 0].meta = { ...parsed[bestIdx >= 0 ? bestIdx : 0].meta, recommended: true };
            }
            return parsed.slice(0, 20);
        }
    } catch { /* fallback */ }

    const categories = ["Curiosity", "Problem", "Benefit", "Question", "Beginner", "Contrarian", "Story", "Mistake"];
    const angles = snapshot.contentAngles.length ? snapshot.contentAngles : [snapshot.mainPromise, snapshot.strongestAngle];
    return Array.from({ length: 15 }, (_, i) => ({
        content: `${categories[i % categories.length]}: What if ${angles[i % angles.length].toLowerCase()} with ${snapshot.productName} was simpler than you think?`,
        meta: {
            category: categories[i % categories.length],
            bestForAngle: snapshot.contentAngles[i % snapshot.contentAngles.length],
            recommended: snapshot.contentAngles[i % snapshot.contentAngles.length] === snapshot.contentAngles[0],
        },
    }));
}

export async function generateCtas(snapshot: OfferSnapshot, offerUrl: string): Promise<Array<{ content: string; meta: { type: string; recommended?: boolean; bestForAngle?: string } }>> {
    const prompt = `Create 6 call-to-action lines for "${snapshot.productName}".
Offer URL: ${offerUrl}
Target audience: ${snapshot.targetAudience}
Main promise: ${snapshot.mainPromise}
Content angles: ${snapshot.contentAngles.join(", ")}

Return ONLY JSON:
[{"content":"...","meta":{"type":"Soft CTA|Educational CTA|Resource CTA|Curiosity CTA|Direct CTA|Comment CTA","bestForAngle":"problem/solution","recommended":false}}]

Rules:
- Each CTA must mention the product benefit or audience need — include the URL in every CTA.
- Mark "recommended": true on the ONE CTA best suited for ${snapshot.targetAudience}.`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Array<{ content: string; meta: { type: string; recommended?: boolean; bestForAngle?: string } }>>(raw, []);
        if (parsed.length >= 4) {
            const hasRecommended = parsed.some((c) => c.meta?.recommended);
            if (!hasRecommended) parsed[0].meta = { ...parsed[0].meta, recommended: true };
            return parsed.slice(0, 6);
        }
    } catch { /* fallback below */ }

    const types = ["Soft CTA", "Educational CTA", "Resource CTA", "Curiosity CTA", "Direct CTA", "Comment CTA"];
    return types.map((type, i) => ({
        content: type === "Direct CTA"
            ? `Ready to try ${snapshot.productName}? ${offerUrl}`
            : type === "Educational CTA"
                ? `If you want a beginner-friendly walkthrough of ${snapshot.mainPromise.toLowerCase()}, this breaks it down: ${offerUrl}`
                : `Worth a look if ${snapshot.productName} matches what you need: ${offerUrl}`,
        meta: { type, bestForAngle: snapshot.contentAngles[i % snapshot.contentAngles.length], recommended: i === 1 },
    }));
}

export async function generateCalendar(
    snapshot: OfferSnapshot,
    offerUrl: string,
): Promise<Array<{ kind: "post"; channel: string; content: string; meta: { day: number; weekday: string; angle: string; section?: string } }>> {
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const items: Array<{ kind: "post"; channel: string; content: string; meta: { day: number; weekday: string; angle: string; section?: string } }> = [];

    for (let day = 1; day <= 30; day++) {
        const angle = snapshot.contentAngles[(day - 1) % snapshot.contentAngles.length];
        items.push({
            kind: "post",
            channel: day % 2 === 0 ? "Reddit" : "Facebook",
            content: `Day ${day} (${weekdays[(day - 1) % 7]}): ${angle} — ${snapshot.mainPromise}. Resource: ${offerUrl}`,
            meta: { day, weekday: weekdays[(day - 1) % 7], angle, section: "calendar" },
        });
    }
    return items;
}

export async function generateWeeklyBatch(
    snapshot: OfferSnapshot,
    offerUrl: string,
    keyword: string,
    dayHooks?: Record<string, string>,
    dayCtas?: Record<string, string>,
): Promise<Array<{ kind: "post"; channel: string; content: string; meta: { weekday: string; angle: string; section: string; hook: string; cta: string } }>> {
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const prompt = `Create a complete 5-day content pack (Mon-Fri) for "${snapshot.productName}".
Keyword context: ${keyword}
Offer URL: ${offerUrl}
Target audience: ${snapshot.targetAudience}
Main promise: ${snapshot.mainPromise}
Benefits: ${snapshot.primaryBenefits.join(", ")}
Pain points: ${snapshot.painPoints.join(", ")}
Content angles to rotate: ${snapshot.contentAngles.join(", ")}

Return ONLY JSON:
[{"weekday":"Mon"|"Tue"|"Wed"|"Thu"|"Fri","channel":"Facebook"|"Reddit"|"Blog","hook":"attention-grabbing opening line","content":"MIDDLE BODY ONLY — 120-200 words of detailed, valuable post content","cta":"call to action with link","meta":{"angle":"..."}}]

CRITICAL RULES:
- "content" must be ONLY the post body — do NOT repeat the hook or CTA inside content.
- Each day's content must be unique, detailed (120-200 words), and specific to ${snapshot.productName}.
- Reference real benefits, pain points, and use cases — not generic filler.
- Vary angles, platforms, and writing style across days.
- No fake personal stories or invented results.
- The hook and CTA are stored separately — keep them out of the body text.`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Array<{ weekday: string; channel: string; hook?: string; content: string; cta?: string; meta?: { angle?: string } }>>(raw, []);
        if (parsed.length >= 5) {
            return parsed.slice(0, 5).map((item, i) => {
                const angle = item.meta?.angle || snapshot.contentAngles[i % snapshot.contentAngles.length];
                const hook = item.hook || dayHooks?.[item.weekday] || `${angle}: A practical look at ${snapshot.mainPromise.toLowerCase()}`;
                const cta = item.cta || dayCtas?.[item.weekday] || `Learn more about ${snapshot.productName}: ${offerUrl}`;
                return {
                    kind: "post" as const,
                    channel: item.channel,
                    content: stripHookAndCtaFromBody(item.content, hook, cta),
                    meta: {
                        weekday: item.weekday,
                        angle,
                        section: "weekly_batch",
                        hook,
                        cta,
                    },
                };
            });
        }
    } catch { /* fallback below */ }

    return weekdays.map((weekday, i) => {
        const angle = snapshot.contentAngles[i % snapshot.contentAngles.length];
        const hook = dayHooks?.[weekday] || `${angle}: What most people get wrong about ${snapshot.category.toLowerCase()}`;
        const cta = dayCtas?.[weekday] || `If ${snapshot.productName} fits what you're looking for, see the full breakdown here: ${offerUrl}`;
        const content = buildDetailedPostBody(snapshot, angle, keyword, weekday, i);
        return {
            kind: "post" as const,
            channel: i % 2 === 0 ? "Facebook" : "Reddit",
            content,
            meta: { weekday, angle, section: "weekly_batch", hook, cta },
        };
    });
}

function stripHookAndCtaFromBody(body: string, hook: string, cta: string): string {
    let cleaned = body.trim();
    if (hook && cleaned.startsWith(hook.trim())) {
        cleaned = cleaned.slice(hook.trim().length).trim();
    }
    if (cta && cleaned.endsWith(cta.trim())) {
        cleaned = cleaned.slice(0, -cta.trim().length).trim();
    }
    return cleaned.replace(/^\n+|\n+$/g, "");
}

function buildDetailedPostBody(snapshot: OfferSnapshot, angle: string, keyword: string, weekday: string, dayIndex = 0): string {
    const benefit = snapshot.primaryBenefits[dayIndex % snapshot.primaryBenefits.length] || snapshot.mainPromise;
    const pain = snapshot.painPoints[0] || "getting started";
    return [
        `When it comes to ${keyword}, one of the biggest challenges is ${pain.toLowerCase()}.`,
        `That's why I wanted to share a ${angle} perspective on ${snapshot.productName}.`,
        `Instead of jumping between random tips, it helps to focus on ${benefit.toLowerCase()} — especially if you're ${snapshot.targetAudience.toLowerCase()}.`,
        `${snapshot.productName} is built around ${snapshot.mainPromise.toLowerCase()}, which makes it easier to understand what to do next without feeling overwhelmed.`,
        `On ${weekday}, this angle works well because people are actively looking for practical guidance they can use right away — not hype.`,
        `If you've been comparing options, look at whether the solution actually addresses ${pain.toLowerCase()} and gives you clear next steps.`,
    ].join("\n\n");
}

export function computeCampaignScore(
    opportunityCount: number,
    assetCount: number,
    channelCount: number,
    contentDays: number,
    snapshot: OfferSnapshot,
): { score: number; breakdown: ScoreBreakdown } {
    const breakdown: ScoreBreakdown = {
        offerClarity: clampScore(snapshot.mainPromise.length > 20 ? 88 : 72),
        audienceFit: clampScore(snapshot.targetAudience.length > 15 ? 90 : 75),
        opportunityQuality: clampScore(Math.min(95, 55 + opportunityCount * 2)),
        contentVariety: clampScore(Math.min(95, 50 + assetCount)),
        ctaQuality: clampScore(80),
        campaignCoverage: clampScore(Math.min(95, 40 + channelCount * 8 + Math.min(contentDays, 30))),
    };
    const score = clampScore(
        Math.round(
            (breakdown.offerClarity +
                breakdown.audienceFit +
                breakdown.opportunityQuality +
                breakdown.contentVariety +
                breakdown.ctaQuality +
                breakdown.campaignCoverage) / 6,
        ),
    );
    const weakAreas: string[] = [];
    if (breakdown.opportunityQuality < 70) weakAreas.push("opportunity quality");
    if (breakdown.contentVariety < 70) weakAreas.push("content variety");
    if (breakdown.campaignCoverage < 70) weakAreas.push("campaign coverage");
    breakdown.weakAreas = weakAreas;
    breakdown.improveSuggestions = weakAreas.map((w) => `Regenerate content to strengthen ${w}.`);
    return { score, breakdown };
}
