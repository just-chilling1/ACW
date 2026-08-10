import type { SupabaseClient } from "@supabase/supabase-js";
import { searchSocialData, sanitizePosts } from "@/lib/rapidapi";
import { APP_NICHES } from "@/lib/niches";
import type { OfferSnapshot, SocialPost } from "./types";
import { detectOfferNiche, getFallbackPostsForOffer, scoreOfferRelevance } from "./search-fallbacks";

const MIN_OPPORTUNITIES = 12;
const MAX_OPPORTUNITIES = 20;

function filterRelevantPosts(posts: SocialPost[], snapshot: OfferSnapshot, minScore: number): SocialPost[] {
    return posts
        .map((post) => ({
            post,
            relevance: scoreOfferRelevance(`${post.title || ""} ${post.text || ""}`, snapshot),
        }))
        .filter(({ relevance }) => relevance >= minScore)
        .sort((a, b) => b.relevance - a.relevance)
        .map(({ post }) => post);
}

function pickRelevantPosts(posts: SocialPost[], snapshot: OfferSnapshot): SocialPost[] {
    for (const threshold of [14, 8, 0]) {
        const filtered = filterRelevantPosts(posts, snapshot, threshold);
        if (filtered.length > 0) return filtered;
    }
    return posts;
}

export async function discoverPosts(
    supabase: SupabaseClient,
    queries: string[],
    snapshot: OfferSnapshot,
    audienceMode?: string,
): Promise<SocialPost[]> {
    const seen = new Set<string>();
    const collected: SocialPost[] = [];

    for (const query of queries) {
        if (collected.length >= MAX_OPPORTUNITIES) break;

        const { data: cached } = await supabase
            .from("analysis_results")
            .select("data")
            .eq("keyword", query)
            .order("created_at", { ascending: false })
            .limit(1);

        let posts: SocialPost[] = [];
        if (cached?.[0]?.data?.threads?.length) {
            posts = sanitizePosts(cached[0].data.threads);
        } else {
            try {
                posts = sanitizePosts(await searchSocialData(query));
                if (posts.length > 0) {
                    await supabase.from("analysis_results").insert([{ keyword: query, data: { threads: posts } }]);
                }
            } catch {
                posts = [];
            }
        }

        const relevant = pickRelevantPosts(posts, snapshot);

        for (const post of relevant) {
            const key = post.url || post.id;
            if (!key || seen.has(key)) continue;
            seen.add(key);
            collected.push({
                id: post.id || key,
                platform: post.platform || "Reddit",
                text: post.text || post.title || "",
                title: post.title,
                url: post.url,
                engagement: post.engagement,
            });
            if (collected.length >= MAX_OPPORTUNITIES) break;
        }
    }

    const fallback = getFallbackPostsForOffer(snapshot, audienceMode);
    for (const post of fallback) {
        if (collected.length >= MIN_OPPORTUNITIES) break;
        const key = post.url || post.id;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        collected.push(post);
    }

    if (collected.length === 0) {
        return fallback.slice(0, MIN_OPPORTUNITIES);
    }

    return collected.slice(0, MAX_OPPORTUNITIES);
}

export function buildOfferSearchQueries(snapshot: OfferSnapshot, audienceMode?: string): string[] {
    const niche = APP_NICHES.find((n) => n.id === detectOfferNiche(snapshot, audienceMode));
    const product = snapshot.productName.trim();
    const category = snapshot.category.trim();
    const pain = snapshot.painPoints[0]?.trim() || snapshot.mainPromise.trim();

    const queries = [
        `${product} recommendation reddit`,
        `${product} review reddit`,
        `best ${category.toLowerCase()} for beginners reddit`,
        `${pain} help reddit`,
        `${product} worth it reddit`,
        `${category.toLowerCase()} beginner tips reddit`,
        `how to ${category.toLowerCase()} reddit`,
    ];

    if (niche) {
        for (const term of niche.searchTerms.slice(0, 4)) {
            queries.unshift(`${term} ${category.toLowerCase()} reddit`);
        }
        queries.push(`${niche.label.toLowerCase()} ${product} reddit`);
        queries.push(`${niche.searchTerms[0]} beginner reddit`);
    }

    return [...new Set(queries.map((q) => q.replace(/\s+/g, " ").trim()))].slice(0, 12);
}
