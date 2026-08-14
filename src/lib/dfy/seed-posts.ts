import type { SupabaseClient } from "@supabase/supabase-js";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { isRealPostUrl, normalizePostUrl } from "./post-url";
import { isUsableReplyTarget, isUsableReplyTargetLive } from "./post-quality";
import type { SocialPost } from "./types";

export type SeededReplyRow = {
    id: string;
    style: string;
    body: string;
    post: {
        id: string;
        niche: string;
        platform: string;
        subreddit: string | null;
        title: string;
        body: string;
        url: string;
        engagement: number;
    };
};

/** Load active seed posts for a niche from Supabase (real permalinks). */
export async function fetchSeedPostsForNiche(
    supabase: SupabaseClient,
    nicheId: NicheId,
    limit = 60,
): Promise<SocialPost[]> {
    const { data, error } = await supabase
        .from("dfy_seed_posts")
        .select("id, platform, title, body, url, engagement")
        .eq("niche", nicheId)
        .eq("active", true)
        .order("engagement", { ascending: false })
        .limit(limit);

    if (error || !data) {
        console.warn(`[dfy-seed] fetch posts failed: ${error?.message}`);
        return [];
    }

    return data
        .map((row) => {
            const url = normalizePostUrl(row.url);
            return {
                id: row.id,
                platform: row.platform || "Reddit",
                title: row.title || "",
                text: row.body || "",
                url,
                engagement: row.engagement || 0,
            } satisfies SocialPost;
        })
        .filter((p) => isRealPostUrl(p.url) && isUsableReplyTarget(p));
}

/** Load seed replies joined with their posts for the browse UI. */
export async function fetchSeededReplies(
    supabase: SupabaseClient,
    nicheId: NicheId,
    limit = 60,
): Promise<SeededReplyRow[]> {
    const { data, error } = await supabase
        .from("dfy_seed_replies")
        .select(
            `
            id,
            style,
            body,
            post:dfy_seed_posts!inner (
                id,
                niche,
                platform,
                subreddit,
                title,
                body,
                url,
                engagement,
                active
            )
        `,
        )
        .eq("niche", nicheId)
        .order("created_at", { ascending: false })
        .limit(limit * 2);

    if (error || !data) {
        console.warn(`[dfy-seed] fetch replies failed: ${error?.message}`);
        return [];
    }

    const rows: SeededReplyRow[] = [];
    for (const row of data as unknown as Array<{
        id: string;
        style: string;
        body: string;
        post:
            | {
                  id: string;
                  niche: string;
                  platform: string;
                  subreddit: string | null;
                  title: string;
                  body: string;
                  url: string;
                  engagement: number;
                  active: boolean;
              }
            | Array<{
                  id: string;
                  niche: string;
                  platform: string;
                  subreddit: string | null;
                  title: string;
                  body: string;
                  url: string;
                  engagement: number;
                  active: boolean;
              }>;
    }>) {
        const post = Array.isArray(row.post) ? row.post[0] : row.post;
        if (!post || post.active === false) continue;
        const url = normalizePostUrl(post.url);
        if (!isRealPostUrl(url) || !isUsableReplyTarget({ ...post, url })) continue;
        rows.push({
            id: row.id,
            style: row.style,
            body: row.body,
            post: {
                id: post.id,
                niche: post.niche,
                platform: post.platform,
                subreddit: post.subreddit,
                title: post.title,
                body: post.body,
                url,
                engagement: post.engagement,
            },
        });
    }

    return rows.slice(0, limit);
}

/** Load seeded replies for every app niche (browse preload). */
export async function fetchAllSeededReplies(
    supabase: SupabaseClient,
    limitPerNiche = 60,
): Promise<Record<NicheId, SeededReplyRow[]>> {
    const out = {} as Record<NicheId, SeededReplyRow[]>;

    await Promise.all(
        APP_NICHES.map(async (niche) => {
            out[niche.id] = await fetchSeededReplies(supabase, niche.id, limitPerNiche);
        }),
    );

    return out;
}

export type PruneSeedResult = {
    checked: number;
    deactivatedPosts: number;
    deletedReplies: number;
};

/**
 * Deactivate existing seed posts (and delete their replies) when the Reddit
 * thread is archived, deleted, locked, or too old to accept comments.
 */
export async function pruneUnusableSeededReplies(
    supabase: SupabaseClient,
    nicheId?: NicheId,
    liveCheck = true,
): Promise<PruneSeedResult> {
    let query = supabase
        .from("dfy_seed_posts")
        .select("id, url, title, body, active, niche");
    if (nicheId) query = query.eq("niche", nicheId);

    const { data: posts, error } = await query;
    if (error || !posts) {
        console.warn(`[dfy-seed] prune fetch failed: ${error?.message}`);
        return { checked: 0, deactivatedPosts: 0, deletedReplies: 0 };
    }

    const deadIds: string[] = [];
    for (const post of posts) {
        const url = normalizePostUrl(post.url);
        const fields = { ...post, url, text: post.body };
        const usable = liveCheck
            ? await isUsableReplyTargetLive(fields)
            : isUsableReplyTarget(fields);
        if (!usable) deadIds.push(post.id);
    }

    if (deadIds.length === 0) {
        return { checked: posts.length, deactivatedPosts: 0, deletedReplies: 0 };
    }

    const { data: removedReplies } = await supabase
        .from("dfy_seed_replies")
        .delete()
        .in("post_id", deadIds)
        .select("id");

    await supabase.from("dfy_seed_posts").update({ active: false }).in("id", deadIds);

    return {
        checked: posts.length,
        deactivatedPosts: deadIds.length,
        deletedReplies: removedReplies?.length || 0,
    };
}
