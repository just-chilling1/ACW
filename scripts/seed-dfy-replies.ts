/**
 * Seed DFY replies: find real Reddit threads + generate humanized replies.
 *
 * Usage (from repo root, with .env.local populated):
 *   npm run seed:dfy -- --niche=weight_loss --dry-run
 *   npm run seed:dfy -- --niche=weight_loss
 *   npm run seed:dfy
 *
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (upsert)
 *   - RAPIDAPI_KEY (ChatGPT generation via chatgpt-42; also Reddit search fallback)
 *   - RAPIDAPI_HOST_REDDIT (optional but recommended when public Reddit is blocked)
 *   - OPENAI_API_KEY (optional alternative to RapidAPI ChatGPT)
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

import { APP_NICHES, type NicheId } from "../src/lib/niches";
import { isRealPostUrl, normalizePostUrl } from "../src/lib/dfy/post-url";
import {
    HUMANIZE_PROMPT,
    LINK_PLACEHOLDER,
    humanizeText,
} from "../src/lib/dfy/humanize";
import { SAFETY_RULES_PROMPT } from "../src/lib/instant/safety";
import { callChatGPT } from "../src/lib/llm";
import { parseJsonFromLlm } from "../src/lib/dfy/parse-json";
import { searchSocialData } from "../src/lib/rapidapi";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

function assertSupabaseServiceRoleMatchesUrl(url: string, serviceKey: string) {
    let urlRef = "";
    try {
        urlRef = new URL(url).hostname.split(".")[0] || "";
    } catch {
        throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${url}`);
    }

    let serviceRef = "";
    try {
        const payload = JSON.parse(Buffer.from(serviceKey.split(".")[1] || "", "base64url").toString("utf8"));
        serviceRef = typeof payload.ref === "string" ? payload.ref : "";
    } catch {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not a valid JWT");
    }

    if (!urlRef || !serviceRef || urlRef !== serviceRef) {
        throw new Error(
            `Supabase project mismatch: URL is "${urlRef}" but SUPABASE_SERVICE_ROLE_KEY is for "${serviceRef || "unknown"}". ` +
                `Update SUPABASE_SERVICE_ROLE_KEY in .env.local to the service_role key from the same project as NEXT_PUBLIC_SUPABASE_URL (${urlRef}).`,
        );
    }
}

const TARGET_PER_NICHE = 60;
const BATCH_SIZE = 5;
const OPENAI_MODEL = "gpt-4o-mini";
const RAPIDAPI_MODEL = "rapidapi-chatgpt";

type SeedPost = {
    niche: NicheId;
    platform: string;
    subreddit: string;
    title: string;
    body: string;
    url: string;
    engagement: number;
};

/** Curated real Reddit permalinks from CashTapAI jackpots fallbacks — used when live search is empty. */
const CASHTAP_BOOTSTRAP: Partial<Record<NicheId, SeedPost[]>> = {
    weight_loss: [
        { niche: "weight_loss", platform: "Reddit", subreddit: "Supplements", title: "L Tyrosine and L Theanine for appetite and cravings", body: "Has anyone tried L-Tyrosine and L-Theanine for reducing appetite?", url: "https://www.reddit.com/r/Supplements/comments/1oyicqr/l_tyrosine_and_l_theanine/", engagement: 342 },
        { niche: "weight_loss", platform: "Reddit", subreddit: "intermittentfasting", title: "Almonds for appetite control - largest study of its kind", body: "Australian researchers found that including almonds in an energy restricted diet helped people lose weight.", url: "https://www.reddit.com/r/intermittentfasting/comments/16mzi0l/in_the_largest_study_of_its_kind_australian/", engagement: 456 },
        { niche: "weight_loss", platform: "Reddit", subreddit: "raypeat", title: "Appetite Suppression vs High Metabolism weight loss strategy", body: "What's the better approach — suppressing appetite or boosting metabolism?", url: "https://www.reddit.com/r/raypeat/comments/1if6tsg/appetite_supression_vs_high_metabolism_weight/", engagement: 287 },
        { niche: "weight_loss", platform: "Reddit", subreddit: "IrishWomensHealth", title: "Wegovy or any weight loss injectable experience?", body: "Looking for real experiences with weight loss solutions and natural alternatives for appetite control.", url: "https://www.reddit.com/r/IrishWomensHealth/comments/1qzd7ui/wegovy_or_any_weight_loss_injectable_experience/", engagement: 521 },
    ],
    make_money_online: [
        { niche: "make_money_online", platform: "Reddit", subreddit: "AIContentAutomators", title: "Most AI monetization advice is BS - I spent 3 months testing ChatGPT & Midjourney", body: "I spent 3 months testing ChatGPT and Midjourney for freelance writing and made $750 profit.", url: "https://www.reddit.com/r/AIContentAutomators/comments/1qzgzp3/most_ai_monetization_advice_is_bs_i_spent_3/", engagement: 1102 },
        { niche: "make_money_online", platform: "Reddit", subreddit: "passive_income", title: "I tested using AI to make money for 30 days. Here's what actually worked.", body: "After 30 days of testing various AI money-making methods, here are the results.", url: "https://www.reddit.com/r/passive_income/comments/1r4txwl/i_tested_using_ai_to_make_money_for_30_days_heres/", engagement: 892 },
        { niche: "make_money_online", platform: "Reddit", subreddit: "sidehustle", title: "Real talk, who in here is actually making money with an AI side hustle?", body: "I want to hear from people who are ACTUALLY making money with AI tools.", url: "https://www.reddit.com/r/sidehustle/comments/1r5o1c9/real_talk_who_in_here_is_actually_making_money/", engagement: 723 },
        { niche: "make_money_online", platform: "Reddit", subreddit: "thesidehustle", title: "Realistic ways to make money with AI in 2025 (my action plan)", body: "Here's my realistic action plan for making money with AI.", url: "https://www.reddit.com/r/thesidehustle/comments/1jfnz7d/realistic_ways_to_make_money_with_ai_in_2025_my/", engagement: 654 },
        { niche: "make_money_online", platform: "Reddit", subreddit: "passive_income", title: "6 ways to monetize your expertise using AI", body: "Here are 6 practical ways to use AI tools to monetize your existing skills.", url: "https://www.reddit.com/r/passive_income/comments/1q5pj94/6_ways_to_monetize_your_expertise_using_ai_in_2026/", engagement: 367 },
    ],
    tech_gadgets: [
        { niche: "tech_gadgets", platform: "Reddit", subreddit: "surfshark", title: "Surfshark not working with Netflix anymore", body: "Surfshark stopped working with Netflix today. Looking for alternatives.", url: "https://www.reddit.com/r/surfshark/comments/1r442gn/surfshark_not_work_with_netflix_from_today/", engagement: 612 },
        { niche: "tech_gadgets", platform: "Reddit", subreddit: "VPN_Question", title: "Best cheap VPN right now? Any recommendation?", body: "Looking for a reliable VPN that works for streaming without breaking the bank.", url: "https://www.reddit.com/r/VPN_Question/comments/1r3rvf9/best_cheap_vpn_right_now_any_recommendation/", engagement: 834 },
        { niche: "tech_gadgets", platform: "Reddit", subreddit: "VPN_Question", title: "Any VPN still bypassing proxy detection?", body: "Netflix's proxy detection has gotten absurdly good. Has anyone found a service that still works?", url: "https://www.reddit.com/r/VPN_Question/comments/1pavchj/any_vpn_still_bypassing_proxy_detection/", engagement: 389 },
        { niche: "tech_gadgets", platform: "Reddit", subreddit: "OfficeChairs", title: "Need help finding a comfortable ergonomic chair with adjustable armrests", body: "Looking for a comfortable ergonomic chair with fully adjustable armrests under $300.", url: "https://www.reddit.com/r/OfficeChairs/comments/1pbpb9u/need_help_finding_a_comfortable_ergonomic_chair/", engagement: 478 },
    ],
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

function subredditFromUrl(url: string): string {
    const m = url.match(/reddit\.com\/r\/([^/]+)/i);
    return m?.[1] || "";
}

/** CashTap-style discovery: ScraperAPI Google scrape → RapidAPI Reddit/YouTube. */
async function collectPostsForNiche(nicheId: NicheId): Promise<SeedPost[]> {
    const niche = APP_NICHES.find((n) => n.id === nicheId);
    if (!niche) return [];

    const seen = new Set<string>();
    const collected: SeedPost[] = [];

    const add = (post: SeedPost) => {
        const url = normalizePostUrl(post.url);
        if (!isRealPostUrl(url) || seen.has(url)) return;
        seen.add(url);
        collected.push({ ...post, url, niche: nicheId });
    };

    for (const term of niche.searchTerms) {
        if (collected.length >= TARGET_PER_NICHE) break;
        console.log(`[${nicheId}] searchSocialData("${term}")…`);
        try {
            const results = await searchSocialData(term);
            for (const raw of results) {
                add({
                    niche: nicheId,
                    platform: String(raw.platform || "Reddit"),
                    subreddit: subredditFromUrl(String(raw.url || "")),
                    title: String(raw.title || "").trim(),
                    body: String(raw.text || "").trim().slice(0, 1200),
                    url: String(raw.url || ""),
                    engagement: Number(raw.engagement) || 0,
                });
                if (collected.length >= TARGET_PER_NICHE * 2) break;
            }
            console.log(`[${nicheId}]   → ${results.length} raw, ${collected.length} kept so far`);
        } catch (e) {
            console.warn(`[${nicheId}] search failed for "${term}":`, e instanceof Error ? e.message : e);
        }
        await sleep(500);
    }

    // Bootstrap from CashTap curated real permalinks when live search is thin
    for (const post of CASHTAP_BOOTSTRAP[nicheId] || []) {
        add(post);
    }

    collected.sort((a, b) => b.engagement - a.engagement);
    return collected.slice(0, TARGET_PER_NICHE);
}

type LlmClient = {
    kind: "rapidapi" | "openai";
    openai?: OpenAI;
};

async function llmComplete(client: LlmClient, prompt: string): Promise<string> {
    if (client.kind === "openai" && client.openai) {
        const completion = await client.openai.chat.completions.create({
            model: OPENAI_MODEL,
            temperature: 0.8,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });
        return completion.choices[0]?.message?.content || "{}";
    }
    return callChatGPT([{ role: "user", content: prompt }]);
}

function extractReplyRows(parsed: unknown): Array<{ index?: number; style?: string; body?: string }> {
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
        const obj = parsed as { replies?: unknown; results?: unknown };
        if (Array.isArray(obj.replies)) return obj.replies as Array<{ index?: number; style?: string; body?: string }>;
        if (Array.isArray(obj.results)) return obj.results as Array<{ index?: number; style?: string; body?: string }>;
    }
    return [];
}

async function generateRepliesBatch(
    client: LlmClient,
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

    const raw = await llmComplete(client, genPrompt);
    const parsed = parseJsonFromLlm<unknown>(raw, {});
    const rows = extractReplyRows(parsed);

    return rows
        .map((row) => {
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
    client: LlmClient,
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
            const raw = await llmComplete(client, prompt);
            const parsed = parseJsonFromLlm<unknown>(raw, {});
            const rows = extractReplyRows(parsed);
            for (let j = 0; j < chunk.length; j++) {
                const rewrite = rows.find((r) => Number(r.index) === j);
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
    const rapidKey = process.env.RAPIDAPI_KEY?.trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!rapidKey && !openaiKey && !dryRun) {
        console.error("Missing RAPIDAPI_KEY (preferred) or OPENAI_API_KEY in .env.local");
        console.error("Note: RAPIDAPI_HOST_CHATGPT is only a hostname — the secret is RAPIDAPI_KEY.");
        process.exit(1);
    }
    if (!rapidKey) {
        console.warn(
            "WARNING: RAPIDAPI_KEY is empty. Live Reddit search needs it (and preferably SCRAPERAPI_KEY + RAPIDAPI_HOST_REDDIT). Will use CashTap curated bootstrap posts only.",
        );
    }
    if (!process.env.SCRAPERAPI_KEY?.trim() && !process.env.SCRAPER_API_KEY?.trim()) {
        console.warn("WARNING: SCRAPERAPI_KEY missing — CashTap uses ScraperAPI as primary search.");
    }
    if (!process.env.RAPIDAPI_HOST_REDDIT?.trim()) {
        console.warn("WARNING: RAPIDAPI_HOST_REDDIT missing — set to your RapidAPI Reddit host (same as CashTap/1tap).");
    }
    if ((!supabaseUrl || !serviceKey) && !dryRun) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }

    if (supabaseUrl && serviceKey && !dryRun) {
        try {
            assertSupabaseServiceRoleMatchesUrl(supabaseUrl, serviceKey);
        } catch (err) {
            console.error(err instanceof Error ? err.message : err);
            process.exit(1);
        }
    }

    const llm: LlmClient | null = rapidKey
        ? { kind: "rapidapi" }
        : openaiKey
          ? { kind: "openai", openai: new OpenAI({ apiKey: openaiKey }) }
          : null;

    const modelLabel = llm?.kind === "openai" ? OPENAI_MODEL : RAPIDAPI_MODEL;

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

    console.log(
        `Seeding ${niches.length} niche(s). dryRun=${dryRun}. target=${TARGET_PER_NICHE}/niche. llm=${llm?.kind || "none"}`,
    );

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

        if (!llm || !supabase) {
            console.error("LLM + Supabase required when not in dry-run");
            process.exit(1);
        }

        const allReplies: { url: string; body: string; style: string }[] = [];
        for (let i = 0; i < posts.length; i += BATCH_SIZE) {
            const chunk = posts.slice(i, i + BATCH_SIZE);
            console.log(`Generating replies ${i + 1}–${i + chunk.length}…`);
            const batch = await generateRepliesBatch(llm, niche.label, chunk);
            allReplies.push(...batch);
            await sleep(400);
        }

        console.log(`Humanize pass on ${allReplies.length} replies…`);
        const humanized = await humanizePass(llm, allReplies);
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

            await supabase.from("dfy_seed_replies").delete().eq("post_id", postRow.id);
            const { error: replyErr } = await supabase.from("dfy_seed_replies").insert({
                post_id: postRow.id,
                niche: niche.id,
                style: reply.style,
                body: reply.body.includes(LINK_PLACEHOLDER)
                    ? reply.body
                    : `${reply.body} ${LINK_PLACEHOLDER}`,
                model: modelLabel,
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
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
