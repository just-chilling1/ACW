import type { SupabaseClient } from "@supabase/supabase-js";
import { searchSocialData, sanitizePosts } from "@/lib/rapidapi";
import type { OfferSnapshot, SocialPost } from "./types";
import { detectOfferNiche, getFallbackPostsForOffer, scoreOfferRelevance } from "./search-fallbacks";

export const MIN_OPPORTUNITIES = 10;
export const MAX_OPPORTUNITIES = 15;

function dedupeKey(post: SocialPost): string {
    return post.id || post.url || `${post.platform}-${post.title}`;
}

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

function pickRelevantPosts(posts: SocialPost[], snapshot: OfferSnapshot, minCount: number): SocialPost[] {
    for (const threshold of [10, 6, 0]) {
        const filtered = filterRelevantPosts(posts, snapshot, threshold);
        if (filtered.length >= minCount || threshold === 0) {
            return filtered.length > 0 ? filtered : posts;
        }
    }
    return posts;
}

function addPost(seen: Set<string>, collected: SocialPost[], post: SocialPost): boolean {
    const key = dedupeKey(post);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    collected.push({
        id: post.id || key,
        platform: post.platform || "Reddit",
        text: post.text || post.title || "",
        title: post.title,
        url: post.url,
        engagement: post.engagement,
    });
    return true;
}

export async function discoverPosts(
    supabase: SupabaseClient,
    queries: string[],
    snapshot: OfferSnapshot,
    audienceMode?: string,
): Promise<SocialPost[]> {
    const seen = new Set<string>();
    const collected: SocialPost[] = [];
    const rawPool: SocialPost[] = [];

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

        for (const post of posts) {
            rawPool.push(post);
        }

        const relevant = pickRelevantPosts(posts, snapshot, 3);
        for (const post of relevant) {
            addPost(seen, collected, post);
            if (collected.length >= MAX_OPPORTUNITIES) break;
        }
    }

    if (collected.length < MIN_OPPORTUNITIES) {
        for (const post of pickRelevantPosts(rawPool, snapshot, 1)) {
            addPost(seen, collected, post);
            if (collected.length >= MAX_OPPORTUNITIES) break;
        }
    }

    const fallback = getFallbackPostsForOffer(snapshot, audienceMode);
    for (const post of fallback) {
        if (collected.length >= MIN_OPPORTUNITIES) break;
        addPost(seen, collected, post);
    }

    if (collected.length < MIN_OPPORTUNITIES) {
        for (const post of fallback) {
            if (collected.length >= MAX_OPPORTUNITIES) break;
            addPost(seen, collected, post);
        }
    }

    if (collected.length === 0) {
        return fallback.slice(0, MIN_OPPORTUNITIES);
    }

    return collected.slice(0, MAX_OPPORTUNITIES);
}
