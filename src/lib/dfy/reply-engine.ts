import type { SupabaseClient } from "@supabase/supabase-js";
import { callChatGPT } from "@/lib/llm";
import { searchSocialData } from "@/lib/rapidapi";
import { APP_NICHES, getNicheById, type NicheId } from "@/lib/niches";
import { SAFETY_RULES_PROMPT } from "@/lib/instant/safety";
import { analyzeOffer } from "./offer-analyze";
import { parseJsonFromLlm } from "./parse-json";
import { isRealPostUrl, normalizePostUrl } from "./post-url";
import {
    HUMANIZE_PROMPT,
    LINK_PLACEHOLDER,
    humanizeText,
    injectLink,
} from "./humanize";
import { fetchSeedPostsForNiche } from "./seed-posts";
import type { OfferSnapshot, SocialPost } from "./types";

export const CUSTOM_REPLY_TARGET = 8;

export type CustomReplyInput = {
    niche: NicheId;
    idealCustomer: string;
    problemSolved: string;
    offerUrl: string;
};

export type GeneratedReply = {
    platform: string;
    url: string;
    title: string;
    context: string;
    body: string;
    style: string;
    meta: Record<string, unknown>;
};

function enrichSnapshot(
    snapshot: OfferSnapshot,
    input: CustomReplyInput,
): OfferSnapshot {
    return {
        ...snapshot,
        targetAudience: input.idealCustomer || snapshot.targetAudience,
        painPoints: input.problemSolved
            ? [input.problemSolved, ...snapshot.painPoints.filter((p) => p !== input.problemSolved)].slice(0, 6)
            : snapshot.painPoints,
        recommendedAudienceMode: input.niche,
    };
}

async function discoverRealPosts(
    supabase: SupabaseClient,
    nicheId: NicheId,
    problemSolved: string,
    limit: number,
): Promise<SocialPost[]> {
    const niche = getNicheById(nicheId);
    const queries = [
        problemSolved.slice(0, 80),
        ...(niche?.searchTerms || []).slice(0, 3),
    ].filter((q) => q.trim().length > 2);

    const seen = new Set<string>();
    const collected: SocialPost[] = [];

    for (const q of queries) {
        if (collected.length >= limit) break;
        try {
            const results = await searchSocialData(q);
            for (const raw of results) {
                const url = normalizePostUrl(String(raw.url || ""));
                if (!isRealPostUrl(url) || seen.has(url)) continue;
                seen.add(url);
                collected.push({
                    id: String(raw.id || url),
                    platform: String(raw.platform || "Reddit"),
                    title: String(raw.title || ""),
                    text: String(raw.text || ""),
                    url,
                    engagement: raw.engagement,
                });
                if (collected.length >= limit) break;
            }
        } catch (e) {
            console.warn(`[dfy-reply] search failed for "${q}":`, e);
        }
    }

    if (collected.length < limit) {
        const seeded = await fetchSeedPostsForNiche(supabase, nicheId, limit);
        for (const post of seeded) {
            if (seen.has(post.url)) continue;
            seen.add(post.url);
            collected.push(post);
            if (collected.length >= limit) break;
        }
    }

    return collected.slice(0, limit);
}

async function generateReplyForPost(
    post: SocialPost,
    snapshot: OfferSnapshot,
    offerUrl: string,
): Promise<GeneratedReply> {
    const prompt = `Write one helpful promotional reply for this conversation.

${HUMANIZE_PROMPT}

${SAFETY_RULES_PROMPT}

OFFER:
- Product: ${snapshot.productName}
- Audience: ${snapshot.targetAudience}
- Problem solved: ${snapshot.painPoints.join("; ")}
- Main promise: ${snapshot.mainPromise}
- Offer URL: ${offerUrl}

THREAD:
Platform: ${post.platform}
Title: ${post.title || "N/A"}
Text: ${(post.text || "").slice(0, 500)}

RULES:
1. Address THIS thread specifically.
2. Be useful first; soft-mention the offer once.
3. Include the offer URL naturally once (not as ${LINK_PLACEHOLDER}).
4. 3–5 sentences. No bullets. No fake testimonials.

Return ONLY JSON:
{"style":"helpful","body":"..."}`;

    try {
        const raw = await callChatGPT([{ role: "user", content: prompt }]);
        const parsed = parseJsonFromLlm<{ style?: string; body?: string }>(raw, {});
        let body = humanizeText(String(parsed.body || ""));
        if (!body) {
            body = fallbackReply(post, snapshot, offerUrl);
        } else if (!body.includes(offerUrl)) {
            body = `${body} ${offerUrl}`.trim();
        }
        return {
            platform: post.platform,
            url: post.url,
            title: post.title || "",
            context: (post.text || "").slice(0, 400),
            body,
            style: String(parsed.style || "helpful"),
            meta: { source: "ai" },
        };
    } catch {
        return {
            platform: post.platform,
            url: post.url,
            title: post.title || "",
            context: (post.text || "").slice(0, 400),
            body: fallbackReply(post, snapshot, offerUrl),
            style: "helpful",
            meta: { source: "fallback" },
        };
    }
}

function fallbackReply(post: SocialPost, snapshot: OfferSnapshot, offerUrl: string): string {
    const topic = post.title || post.text.slice(0, 80) || "this";
    const pain = snapshot.painPoints[0] || "getting started";
    const draft = `On "${topic}" — a lot of people get stuck on ${pain.toLowerCase()}. One practical path is focusing on ${snapshot.mainPromise.toLowerCase()} instead of trying everything at once. ${snapshot.productName} walks through that for ${snapshot.targetAudience.toLowerCase()}: ${LINK_PLACEHOLDER}`;
    return injectLink(humanizeText(draft), offerUrl);
}

export async function runCustomReplyGeneration(
    supabase: SupabaseClient,
    userId: string,
    input: CustomReplyInput,
): Promise<{ requestId: string; replies: GeneratedReply[] }> {
    if (!APP_NICHES.some((n) => n.id === input.niche)) {
        throw new Error("Invalid niche");
    }
    if (!input.offerUrl.trim()) throw new Error("Offer URL required");
    if (!input.idealCustomer.trim()) throw new Error("Ideal customer required");
    if (!input.problemSolved.trim()) throw new Error("Problem solved required");

    const { data: request, error: reqErr } = await supabase
        .from("dfy_reply_requests")
        .insert({
            user_id: userId,
            niche: input.niche,
            ideal_customer: input.idealCustomer.trim(),
            problem_solved: input.problemSolved.trim(),
            offer_url: input.offerUrl.trim(),
            status: "building",
        })
        .select("id")
        .single();

    if (reqErr || !request) {
        throw new Error(reqErr?.message || "Could not create reply request");
    }

    try {
        const rawSnapshot = await analyzeOffer(input.offerUrl.trim(), input.niche);
        const snapshot = enrichSnapshot(rawSnapshot, input);

        await supabase
            .from("dfy_reply_requests")
            .update({
                offer_snapshot: snapshot,
                updated_at: new Date().toISOString(),
            })
            .eq("id", request.id);

        const posts = await discoverRealPosts(
            supabase,
            input.niche,
            input.problemSolved,
            CUSTOM_REPLY_TARGET,
        );

        if (posts.length === 0) {
            throw new Error("No real posts found for this niche. Try again later.");
        }

        const replies: GeneratedReply[] = [];
        for (let i = 0; i < posts.length; i += 3) {
            const chunk = posts.slice(i, i + 3);
            const settled = await Promise.allSettled(
                chunk.map((post) => generateReplyForPost(post, snapshot, input.offerUrl.trim())),
            );
            for (const s of settled) {
                if (s.status === "fulfilled") replies.push(s.value);
            }
        }

        if (replies.length === 0) {
            throw new Error("Could not generate replies.");
        }

        const { error: insertErr } = await supabase.from("dfy_generated_replies").insert(
            replies.map((r) => ({
                request_id: request.id,
                platform: r.platform,
                url: r.url,
                title: r.title,
                context: r.context,
                body: r.body,
                style: r.style,
                meta: r.meta,
            })),
        );

        if (insertErr) throw new Error(insertErr.message);

        await supabase
            .from("dfy_reply_requests")
            .update({ status: "ready", updated_at: new Date().toISOString() })
            .eq("id", request.id);

        return { requestId: request.id, replies };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        await supabase
            .from("dfy_reply_requests")
            .update({
                status: "failed",
                error: message,
                updated_at: new Date().toISOString(),
            })
            .eq("id", request.id);
        throw err;
    }
}
