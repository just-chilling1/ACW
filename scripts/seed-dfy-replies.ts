/**
 * Seed DFY replies: find real Reddit threads + generate humanized replies with gpt-4o-mini.
 *
 * Usage (from repo root, with .env.local populated):
 *   npm run seed:dfy -- --niche=weight_loss --dry-run
 *   npm run seed:dfy -- --niche=weight_loss
 *   npm run seed:dfy
 *
 * Requires: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createRequire } from "node:module";
import { resolve } from "node:path";
import { config } from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const require = createRequire(import.meta.url);

// Load TS modules via tsx path resolution — register @/* manually for scripts
import { APP_NICHES, type NicheId } from "../src/lib/niches";
import { isRealPostUrl, normalizePostUrl } from "../src/lib/dfy/post-url";
import {
    HUMANIZE_PROMPT,
    LINK_PLACEHOLDER,
    humanizeText,
} from "../src/lib/dfy/humanize";
import { SAFETY_RULES_PROMPT } from "../src/lib/instant/safety";

const TARGET_PER_NICHE = 60;
const BATCH_SIZE = 5;
const USER_AGENT = "AICashWaveSeedBot/1.0 (local seed script; contact: support@reliteagency.com)";
const MODEL = "gpt-4o-mini";

type RedditChild = {
    data?: {
        id?: string;
        title?: string;
        selftext?: string;
        permalink?: string;
        url?: string;
        score?: number;
        over_18?: boolean;
        locked?: boolean;
        archived?: boolean;
        removed_by_category?: string | null;
        subreddit?: string;
        stickied?: boolean;
    };
};

type SeedPost = {
    niche: NicheId;
    platform: string;
    subreddit: string;
    title: string;
    body: string;
    url: string;
    engagement: number;
};

function parseArgs() {
    const args = process.argv.slice(2);
    let niche: NicheId | null = null;
    let dryRun = false;
    for (const a of args) {
        if (a === "--dry-run") dryRun = true;
        if (a.startsWith("--niche=")) niche = a.slice("--niche=".length) as NicheId;
    }
    return { niche, dryRun };
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function mapRedditChildren(children: RedditChild[]): Promise<SeedPost[]> {
    return children
        .map((c) => c.data)
        .filter(Boolean)
        .filter((d) => !d!.over_18 && !d!.locked && !d!.stickied && !d!.removed_by_category)
        .map((d) => {
            const permalink = d!.permalink
                ? (String(d!.permalink).startsWith("http")
                    ? String(d!.permalink)
                    : `https://www.reddit.com${d!.permalink}`)
                : d!.url || "";
            const url = normalizePostUrl(permalink);
            return {
                niche: "make_money_online" as NicheId,
                platform: "Reddit",
                subreddit: d!.subreddit || "",
                title: (d!.title || "").trim(),
                body: (d!.selftext || "").trim().slice(0, 1200),
                url,
                engagement: Number(d!.score) || 0,
            };
        })
        .filter((p) => isRealPostUrl(p.url) && p.title.length > 10);
}

async function redditSearchPublic(query: string, limit = 25): Promise<SeedPost[]> {
    const endpoints = [
        `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=year&limit=${limit}&type=link`,
        `https://old.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=year&limit=${limit}&type=link`,
    ];

    for (const url of endpoints) {
        try {
            const res = await fetch(url, {
                headers: {
                    "User-Agent": USER_AGENT,
                    Accept: "application/json",
                },
                cache: "no-store",
            });
            if (!res.ok) {
                console.warn(`[reddit] ${url.includes("old.") ? "old" : "www"} ${res.status} for "${query}"`);
                continue;
            }
            const data = await res.json();
            const children: RedditChild[] = data?.data?.children || [];
            const posts = await mapRedditChildren(children);
            if (posts.length > 0) return posts;
        } catch (e) {
            console.warn(`[reddit] fetch error for "${query}":`, e);
        }
    }
    return [];
}

/** Fallback when public Reddit JSON is blocked (403) — uses RAPIDAPI_KEY if set. */
async function redditSearchRapidApi(query: string): Promise<SeedPost[]> {
    const key = process.env.RAPIDAPI_KEY?.trim();
    const host = process.env.RAPIDAPI_HOST_REDDIT?.trim();
    if (!key || !host) return [];

    try {
        const url = `https://${host}/search?query=${encodeURIComponent(query)}&sort=relevance&time=year`;
        const res = await fetch(url, {
            headers: {
                "x-rapidapi-key": key,
                "x-rapidapi-host": host,
            },
            cache: "no-store",
        });
        if (!res.ok) {
            console.warn(`[rapidapi-reddit] ${res.status} for "${query}"`);
            return [];
        }
        const data = await res.json();
        const children: RedditChild[] = data?.data?.children || [];
        if (children.length) return mapRedditChildren(children);

        const items = data.results || data.posts || (Array.isArray(data) ? data : []);
        if (!Array.isArray(items)) return [];
        return items
            .map((item: Record<string, unknown>) => {
                const permalink = String(item.permalink || item.url || item.link || "");
                const url = normalizePostUrl(
                    permalink.startsWith("/") ? `https://www.reddit.com${permalink}` : permalink,
                );
                return {
                    niche: "make_money_online" as NicheId,
                    platform: "Reddit",
                    subreddit: String(item.subreddit || ""),
                    title: String(item.title || "").trim(),
                    body: String(item.selftext || item.text || item.body || "").trim().slice(0, 1200),
                    url,
                    engagement: Number(item.score || item.ups || 0),
                };
            })
            .filter((p: SeedPost) => isRealPostUrl(p.url) && p.title.length > 10);
    } catch (e) {
        console.warn(`[rapidapi-reddit] error:`, e);
        return [];
    }
}

async function redditSearch(query: string, limit = 25): Promise<SeedPost[]> {
    const publicPosts = await redditSearchPublic(query, limit);
    if (publicPosts.length > 0) return publicPosts;
    return redditSearchRapidApi(query);
}

async function collectPostsForNiche(nicheId: NicheId): Promise<SeedPost[]> {
    const niche = APP_NICHES.find((n) => n.id === nicheId);
    if (!niche) return [];

    const seen = new Set<string>();
    const collected: SeedPost[] = [];

    for (const term of niche.searchTerms) {
        if (collected.length >= TARGET_PER_NICHE) break;
        console.log(`[${nicheId}] searching "${term}"…`);
        const posts = await redditSearch(term, 40);
        await sleep(1100);
        for (const post of posts) {
            if (seen.has(post.url)) continue;
            seen.add(post.url);
            collected.push({ ...post, niche: nicheId });
            if (collected.length >= TARGET_PER_NICHE * 2) break;
        }
    }

    collected.sort((a, b) => b.engagement - a.engagement);
    return collected.slice(0, TARGET_PER_NICHE);
}

async function generateRepliesBatch(
    openai: OpenAI,
    nicheLabel: string,
    posts: SeedPost[],
): Promise<{ url: string; body: string; style: string }[]> {
    const payload = posts.map((p, i) => ({
        index: i,
        title: p.title,
        body: p.body.slice(0, 400),
        subreddit: p.subreddit,
    }));

    const genPrompt = `You write helpful Reddit replies for the "${nicheLabel}" niche.

${HUMANIZE_PROMPT}

${SAFETY_RULES_PROMPT}

For EACH post below, write ONE reply that:
1. Addresses the specific question/problem in that thread.
2. Is useful first; soft-mention a relevant resource at the end.
3. Ends with the exact placeholder ${LINK_PLACEHOLDER} (not a real URL).
4. Is 3–5 sentences.

POSTS:
${JSON.stringify(payload)}

Return ONLY JSON object:
{"replies":[{"index":0,"style":"helpful","body":"...${LINK_PLACEHOLDER}"}]}`;

    const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.85,
        messages: [{ role: "user", content: genPrompt }],
        response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return [];
    }

    const rows = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { replies?: unknown }).replies)
          ? (parsed as { replies: unknown[] }).replies
          : Array.isArray((parsed as { results?: unknown }).results)
            ? (parsed as { results: unknown[] }).results
            : [];

    return rows
        .map((row: { index?: number; style?: string; body?: string }) => {
            const idx = Number(row.index);
            const post = posts[idx];
            if (!post || !row.body) return null;
            return {
                url: post.url,
                style: String(row.style || "helpful"),
                body: humanizeText(String(row.body)),
            };
        })
        .filter(Boolean) as { url: string; body: string; style: string }[];
}

async function humanizePass(
    openai: OpenAI,
    bodies: { url: string; body: string; style: string }[],
): Promise<{ url: string; body: string; style: string }[]> {
    const out: { url: string; body: string; style: string }[] = [];
    for (let i = 0; i < bodies.length; i += BATCH_SIZE) {
        const chunk = bodies.slice(i, i + BATCH_SIZE);
        const prompt = `Rewrite each reply to sound more human. Keep meaning and keep ${LINK_PLACEHOLDER} exactly.

${HUMANIZE_PROMPT}

INPUT:
${JSON.stringify(chunk.map((c, idx) => ({ index: idx, body: c.body })))}

Return ONLY JSON object:
{"replies":[{"index":0,"body":"..."}]}`;

        try {
            const completion = await openai.chat.completions.create({
                model: MODEL,
                temperature: 0.7,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            });
            const raw = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(raw);
            const rows = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed.replies)
                  ? parsed.replies
                  : Array.isArray(parsed.results)
                    ? parsed.results
                    : [];
            for (let j = 0; j < chunk.length; j++) {
                const rewrite = rows.find((r: { index?: number }) => Number(r.index) === j);
                const body = humanizeText(String(rewrite?.body || chunk[j].body));
                out.push({ ...chunk[j], body });
            }
        } catch {
            out.push(...chunk.map((c) => ({ ...c, body: humanizeText(c.body) })));
        }
    }
    return out;
}

async function main() {
    const { niche: nicheFilter, dryRun } = parseArgs();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!openaiKey && !dryRun) {
        console.error("Missing OPENAI_API_KEY in .env.local");
        process.exit(1);
    }
    if ((!supabaseUrl || !serviceKey) && !dryRun) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }

    const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
    const supabase =
        supabaseUrl && serviceKey
            ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
            : null;

    const niches = nicheFilter
        ? APP_NICHES.filter((n) => n.id === nicheFilter)
        : [...APP_NICHES];

    if (nicheFilter && niches.length === 0) {
        console.error(`Unknown niche: ${nicheFilter}`);
        console.error(`Valid: ${APP_NICHES.map((n) => n.id).join(", ")}`);
        process.exit(1);
    }

    console.log(`Seeding ${niches.length} niche(s). dryRun=${dryRun}. target=${TARGET_PER_NICHE}/niche`);

    for (const niche of niches) {
        console.log(`\n=== ${niche.label} (${niche.id}) ===`);
        const posts = await collectPostsForNiche(niche.id);
        console.log(`Found ${posts.length} real permalinks`);

        if (posts.length === 0) {
            console.warn(`No posts for ${niche.id}, skipping`);
            continue;
        }

        if (dryRun) {
            console.log("Sample URLs:");
            for (const p of posts.slice(0, 5)) {
                console.log(`  - [${p.engagement}] ${p.url}`);
                console.log(`    ${p.title.slice(0, 80)}`);
            }
            continue;
        }

        if (!openai || !supabase) {
            console.error("OpenAI / Supabase required when not in dry-run");
            process.exit(1);
        }

        const allReplies: { url: string; body: string; style: string }[] = [];
        for (let i = 0; i < posts.length; i += BATCH_SIZE) {
            const chunk = posts.slice(i, i + BATCH_SIZE);
            console.log(`Generating replies ${i + 1}–${i + chunk.length}…`);
            const batch = await generateRepliesBatch(openai, niche.label, chunk);
            allReplies.push(...batch);
            await sleep(400);
        }

        console.log(`Humanize pass on ${allReplies.length} replies…`);
        const humanized = await humanizePass(openai, allReplies);
        const byUrl = new Map(humanized.map((r) => [r.url, r]));

        let upserted = 0;
        for (const post of posts) {
            const reply = byUrl.get(post.url);
            if (!reply?.body) continue;

            const { data: postRow, error: postErr } = await supabase
                .from("dfy_seed_posts")
                .upsert(
                    {
                        niche: niche.id,
                        platform: post.platform,
                        subreddit: post.subreddit,
                        title: post.title,
                        body: post.body,
                        url: post.url,
                        engagement: post.engagement,
                        verified_at: new Date().toISOString(),
                        active: true,
                    },
                    { onConflict: "url" },
                )
                .select("id")
                .single();

            if (postErr || !postRow) {
                console.warn(`Post upsert failed for ${post.url}: ${postErr?.message}`);
                continue;
            }

            // Replace existing replies for this post
            await supabase.from("dfy_seed_replies").delete().eq("post_id", postRow.id);
            const { error: replyErr } = await supabase.from("dfy_seed_replies").insert({
                post_id: postRow.id,
                niche: niche.id,
                style: reply.style,
                body: reply.body.includes(LINK_PLACEHOLDER)
                    ? reply.body
                    : `${reply.body} ${LINK_PLACEHOLDER}`,
                model: MODEL,
            });

            if (replyErr) {
                console.warn(`Reply insert failed: ${replyErr.message}`);
                continue;
            }
            upserted += 1;
        }

        console.log(`Upserted ${upserted} post+reply pairs for ${niche.id}`);
    }

    console.log("\nDone.");
    // silence unused require in case tsx resolves differently
    void require;
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
