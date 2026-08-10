import { callChatGPT } from "@/lib/llm";
import { parseJsonFromLlm, clampScore, opportunityLabel } from "./parse-json";
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

export function scorePostHeuristic(post: SocialPost, snapshot: OfferSnapshot): ScoredOpportunity {
    const text = `${post.title || ""} ${post.text || ""}`.toLowerCase();
    const keywords = [
        snapshot.productName,
        snapshot.category,
        ...snapshot.painPoints,
        ...snapshot.primaryBenefits,
    ].map((k) => k.toLowerCase());

    let relevance = 45;
    for (const kw of keywords) {
        if (kw.length > 3 && text.includes(kw.slice(0, Math.min(kw.length, 12)))) relevance += 8;
    }
    if (/best|recommend|how|help|looking|need|advice|which|what/.test(text)) relevance += 10;

    let intent = 50;
    if (/looking for|need help|recommend|which|what should|how do i|best/.test(text)) intent += 25;
    if (/buy|purchase|worth it|alternative|vs/.test(text)) intent += 15;

    const engagementNum = typeof post.engagement === "number"
        ? post.engagement
        : parseInt(String(post.engagement || "0").replace(/\D/g, ""), 10) || 0;
    if (engagementNum > 500) intent += 5;

    relevance = clampScore(relevance);
    intent = clampScore(intent);
    const opportunityScore = clampScore(Math.round(relevance * 0.45 + intent * 0.55));

    return {
        post,
        relevanceScore: relevance,
        intentScore: intent,
        opportunityScore,
        label: opportunityLabel(opportunityScore),
        whySelected: "This conversation shows someone actively looking for guidance related to your offer.",
        recommendedApproach: "Give a helpful educational answer first, then introduce the relevant resource naturally.",
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
        const prompt = `For each conversation, create promotion replies for "${snapshot.productName}".
Offer URL to weave naturally when appropriate: ${offerUrl}

Rules:
- Do NOT claim the user personally used the product unless framed as "one angle you could use".
- Be helpful first, promotional second.
- Match the conversation context.
- Return ONLY JSON array:
[{"id":"post_id","whySelected":"...","recommendedApproach":"...","recommendedReply":"...","alternativeReplies":[{"style":"Helpful","text":"..."},{"style":"Personal angle","text":"..."},{"style":"Short","text":"..."}]}]

Conversations:
${JSON.stringify(chunk.map((c) => ({ id: c.post.id, platform: c.post.platform, title: c.post.title, text: c.post.text })))}`;

        try {
            const raw = await callChatGPT([{ role: "user", content: prompt }]);
            const parsed = parseJsonFromLlm<Array<{
                id: string;
                whySelected?: string;
                recommendedApproach?: string;
                recommendedReply?: string;
                alternativeReplies?: { style: string; text: string }[];
            }>>(raw, []);

            for (const item of chunk) {
                const ai = parsed.find((p) => p.id === item.post.id);
                results.push({
                    ...item,
                    whySelected: ai?.whySelected || item.whySelected,
                    recommendedApproach: ai?.recommendedApproach || item.recommendedApproach,
                    recommendedReply: ai?.recommendedReply || `One helpful angle: share practical steps first, then mention ${snapshot.productName} as a resource if it fits: ${offerUrl}`,
                    alternativeReplies: ai?.alternativeReplies?.length
                        ? ai.alternativeReplies
                        : [
                            { style: "Helpful", text: `Focus on the core problem first, then suggest a resource like ${offerUrl} if relevant.` },
                            { style: "Short", text: `Worth comparing a few options — ${offerUrl} might fit if you want a beginner-friendly path.` },
                        ],
                });
            }
        } catch {
            for (const item of chunk) {
                results.push({
                    ...item,
                    recommendedReply: `One angle you could use: share a practical tip related to their question, then mention ${snapshot.productName} as a resource: ${offerUrl}`,
                    alternativeReplies: [
                        { style: "Helpful", text: `I'd start with the basics they asked about, then share ${offerUrl} if it matches what they need.` },
                        { style: "Short", text: `Check ${offerUrl} — it covers this in a beginner-friendly way.` },
                    ],
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

export async function generateHooks(snapshot: OfferSnapshot): Promise<Array<{ content: string; meta: { category: string } }>> {
    const prompt = `Create 20 short hooks for "${snapshot.productName}".
Return ONLY JSON: [{"content":"...","meta":{"category":"Curiosity|Problem|Benefit|Contrarian|Story|Question|Beginner|Mistake"}}]`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Array<{ content: string; meta: { category: string } }>>(raw, []);
        if (parsed.length >= 10) return parsed.slice(0, 20);
    } catch { /* fallback */ }

    const categories = ["Curiosity", "Problem", "Benefit", "Question", "Beginner"];
    return Array.from({ length: 15 }, (_, i) => ({
        content: `${categories[i % categories.length]}: What if ${snapshot.mainPromise.toLowerCase()} was simpler than you think?`,
        meta: { category: categories[i % categories.length] },
    }));
}

export async function generateCtas(snapshot: OfferSnapshot, offerUrl: string): Promise<Array<{ content: string; meta: { type: string; recommended?: boolean } }>> {
    const types = ["Soft CTA", "Educational CTA", "Resource CTA", "Curiosity CTA", "Direct CTA", "Comment CTA"];
    return types.map((type, i) => ({
        content: type === "Direct CTA"
            ? `Ready to try it? ${offerUrl}`
            : type === "Educational CTA"
                ? `If you want a beginner-friendly walkthrough, this breaks it down: ${offerUrl}`
                : `Worth a look if this matches what you need: ${offerUrl}`,
        meta: { type, recommended: i === 1 },
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
): Promise<Array<{ kind: "post"; channel: string; content: string; meta: { weekday: string; angle: string; section: string } }>> {
    const prompt = `Create a 5-day content pack (Mon-Fri) for keyword "${keyword}" promoting "${snapshot.productName}".
Offer URL: ${offerUrl}

Return ONLY JSON:
[{"weekday":"Mon"|"Tue"|"Wed"|"Thu"|"Fri","channel":"Facebook"|"Reddit"|"Blog","content":"...","meta":{"angle":"..."}}]

Rules: diversified angles, platform-appropriate, non-spammy, no fake personal stories.`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<Array<{ weekday: string; channel: string; content: string; meta?: { angle?: string } }>>(raw, []);
        if (parsed.length >= 5) {
            return parsed.slice(0, 5).map((item) => ({
                kind: "post" as const,
                channel: item.channel,
                content: item.content,
                meta: { weekday: item.weekday, angle: item.meta?.angle || "tips", section: "weekly_batch" },
            }));
        }
    } catch { /* fallback */ }

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    return days.map((weekday, i) => ({
        kind: "post" as const,
        channel: i % 2 === 0 ? "Facebook" : "Reddit",
        content: `${weekday} post about ${keyword}: ${snapshot.contentAngles[i % snapshot.contentAngles.length]} — ${snapshot.mainPromise}. ${offerUrl}`,
        meta: { weekday, angle: snapshot.contentAngles[i % snapshot.contentAngles.length], section: "weekly_batch" },
    }));
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
