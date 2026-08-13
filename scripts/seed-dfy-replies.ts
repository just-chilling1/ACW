/**
 * Seed DFY replies: find real Reddit threads + generate humanized replies.
 *
 * Usage (from repo root, with .env.local populated):
 *   npm run seed:dfy -- --niche=weight_loss --dry-run
 *   npm run seed:dfy -- --niche=weight_loss
 *   npm run seed:dfy
 *   npm run seed:dfy -- --no-wipe   # keep existing posts; still regenerates replies
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
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { APP_NICHES, type NicheId } from "../src/lib/niches";
import { isRealPostUrl, normalizePostUrl } from "../src/lib/dfy/post-url";
import {
    HUMANIZE_PROMPT,
    LINK_PLACEHOLDER,
    humanizeText,
} from "../src/lib/dfy/humanize";
import { getFallbackPostsForNiche } from "../src/lib/dfy/search-fallbacks";
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
const BATCH_SIZE = 3;
const OPENAI_MODEL = "gpt-4o-mini";
const RAPIDAPI_MODEL = "rapidapi-chatgpt";

const REPLY_STYLES = [
    "helpful",
    "short",
    "detailed",
    "curiosity",
    "empathetic",
    "expert",
    "soft_sell",
    "skeptical_friend",
] as const;

type ReplyStyle = (typeof REPLY_STYLES)[number];

const STYLE_GUIDE: Record<ReplyStyle, string> = {
    helpful: "Practical and clear. Give one actionable tip that fits the thread.",
    short: "2-3 short sentences max. Punchy, casual, still useful.",
    detailed: "4-6 sentences. Walk through a small process or checklist in prose.",
    curiosity: "Lead with a thoughtful question or angle, then share a useful observation.",
    empathetic: "Acknowledge the frustration first, then offer a gentle next step.",
    expert: "Confident but humble. Use specific terminology without sounding salesy.",
    soft_sell: "Helpful first; mention a resource lightly at the end without hype.",
    skeptical_friend: "Slightly skeptical of gimmicks. Keep it real and grounded.",
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

type ReplyJob = {
    post: SeedPost;
    style: ReplyStyle;
    slot: number;
};

/** Extra curated permalinks beyond search-fallbacks — used when live search is thin. */
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
    let wipe = true;
    let emitSql = "";
    let curatedOnly = false;
    for (const a of args) {
        if (a === "--dry-run") dryRun = true;
        if (a === "--no-wipe") wipe = false;
        if (a === "--curated-only") curatedOnly = true;
        if (a.startsWith("--niche=")) niche = a.slice("--niche=".length) as NicheId;
        if (a.startsWith("--emit-sql=")) emitSql = a.slice("--emit-sql=".length);
    }
    return { niche, dryRun, wipe, emitSql, curatedOnly };
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function subredditFromUrl(url: string): string {
    const m = url.match(/reddit\.com\/r\/([^/]+)/i);
    return m?.[1] || "";
}

function expandSearchTerms(nicheId: NicheId): string[] {
    const niche = APP_NICHES.find((n) => n.id === nicheId);
    if (!niche) return [];
    const extras: Record<NicheId, string[]> = {
        weight_loss: ["glp-1 alternatives", "appetite suppressant", "lose belly fat", "calorie deficit stuck", "cravings at night"],
        make_money_online: ["affiliate marketing beginners", "side hustle 2025", "freelance writing AI", "passive income realistic", "email marketing tools"],
        health_fitness: ["joint pain supplements", "energy crash afternoon", "protein powder bloating", "home workout beginners", "muscle loss aging"],
        beauty_skincare: ["acne routine adults", "anti aging serum", "dry skin barrier", "k beauty beginners", "retinoid irritation"],
        relationships: ["marriage communication", "rebuild trust", "dating advice", "argument patterns", "feel like roommates"],
        tech_gadgets: ["best vpn streaming", "ergonomic chair under 300", "wifi extender", "noise cancelling headphones", "smart home beginners"],
        pets: ["puppy biting", "crate training schedule", "dog reactivity", "cat litter recommendations", "pet anxiety"],
        home_garden: ["beginner herb garden", "indoor vegetable garden", "composting basics", "raised bed soil", "grow tomatoes containers"],
    };
    return [...niche.searchTerms, ...(extras[nicheId] || [])];
}

function scoreNicheRelevance(nicheId: NicheId, title: string, body: string): number {
    const niche = APP_NICHES.find((n) => n.id === nicheId);
    if (!niche) return 0;
    const text = `${title} ${body}`.toLowerCase();
    let score = 0;
    for (const term of niche.searchTerms) {
        if (text.includes(term.toLowerCase())) score += 8;
    }
    for (const term of expandSearchTerms(nicheId)) {
        if (term.length > 4 && text.includes(term.toLowerCase())) score += 4;
    }
    // Prefer ask/recommend intent over story posts
    if (/\b(help|advice|recommend|anyone tried|looking for|what worked|how do i|suggestions?)\b/i.test(text)) {
        score += 12;
    }
    // Penalize obvious off-topic viral formats
    if (/\b(aitah|am i overreacting|choosingbeggars|relationship_advice|wholesome|confession)\b/i.test(text)) {
        score -= 10;
    }
    return score;
}

/** Collect unique real posts; curated fallbacks first, then filtered live search. */
async function collectPostsForNiche(nicheId: NicheId, curatedOnly = false): Promise<SeedPost[]> {
    const niche = APP_NICHES.find((n) => n.id === nicheId);
    if (!niche) return [];

    const seen = new Set<string>();
    const collected: SeedPost[] = [];

    const add = (post: SeedPost, minScore = 0) => {
        const url = normalizePostUrl(post.url);
        if (!isRealPostUrl(url) || seen.has(url)) return;
        const score = scoreNicheRelevance(nicheId, post.title, post.body);
        if (score < minScore) return;
        seen.add(url);
        collected.push({ ...post, url, niche: nicheId, engagement: post.engagement + score });
    };

    // Curated first — these are known-good affiliate-intent threads.
    for (const fb of getFallbackPostsForNiche(nicheId)) {
        add(
            {
                niche: nicheId,
                platform: fb.platform || "Reddit",
                subreddit: subredditFromUrl(fb.url),
                title: fb.title || "",
                body: (fb.text || "").slice(0, 1200),
                url: fb.url,
                engagement: Number(fb.engagement) || 0,
            },
            0,
        );
    }
    for (const post of CASHTAP_BOOTSTRAP[nicheId] || []) {
        add(post, 0);
    }

    if (curatedOnly) {
        collected.sort((a, b) => b.engagement - a.engagement);
        return collected.slice(0, TARGET_PER_NICHE);
    }

    for (const term of expandSearchTerms(nicheId)) {
        if (collected.length >= TARGET_PER_NICHE) break;
        console.log(`[${nicheId}] searchSocialData("${term}")…`);
        try {
            const results = await searchSocialData(term);
            for (const raw of results) {
                add(
                    {
                        niche: nicheId,
                        platform: String(raw.platform || "Reddit"),
                        subreddit: subredditFromUrl(String(raw.url || "")),
                        title: String(raw.title || "").trim(),
                        body: String(raw.text || "").trim().slice(0, 1200),
                        url: String(raw.url || ""),
                        engagement: Number(raw.engagement) || 0,
                    },
                    10,
                );
                if (collected.length >= TARGET_PER_NICHE) break;
            }
            console.log(`[${nicheId}]   → ${results.length} raw, ${collected.length} kept so far`);
        } catch (e) {
            console.warn(`[${nicheId}] search failed for "${term}":`, e instanceof Error ? e.message : e);
        }
        await sleep(350);
    }

    collected.sort((a, b) => b.engagement - a.engagement);
    // Multi-tone replies can fill to 60 even with fewer unique posts.
    return collected.slice(0, TARGET_PER_NICHE);
}

/** Build 60 reply jobs with rotating tones; reuse posts when discovery is short. */
function buildReplyJobs(posts: SeedPost[]): ReplyJob[] {
    if (posts.length === 0) return [];
    const jobs: ReplyJob[] = [];
    for (let i = 0; i < TARGET_PER_NICHE; i++) {
        jobs.push({
            post: posts[i % posts.length],
            style: REPLY_STYLES[i % REPLY_STYLES.length],
            slot: i,
        });
    }
    return jobs;
}

type LlmClient = {
    kind: "rapidapi" | "openai";
    openai?: OpenAI;
};

async function llmComplete(client: LlmClient, prompt: string): Promise<string> {
    if (client.kind === "openai" && client.openai) {
        const completion = await client.openai.chat.completions.create({
            model: OPENAI_MODEL,
            temperature: 0.9,
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
    jobs: ReplyJob[],
): Promise<{ url: string; style: string; body: string; slot: number }[]> {
    const payload = jobs.map((job, i) => ({
        index: i,
        style: job.style,
        styleGuide: STYLE_GUIDE[job.style],
        title: job.post.title,
        body: job.post.body.slice(0, 400),
        subreddit: job.post.subreddit,
    }));

    const genPrompt = `You write Reddit replies for the "${nicheLabel}" niche.

${HUMANIZE_PROMPT}

${SAFETY_RULES_PROMPT}

For EACH item below, write ONE reply that:
1. Matches the requested style exactly (see styleGuide).
2. Addresses the specific question/problem in that thread.
3. Is useful first; soft-mention a relevant resource only when natural.
4. Ends with the exact placeholder ${LINK_PLACEHOLDER} (not a real URL).
5. Does NOT copy another reply's wording — each must sound distinct.

ITEMS:
${JSON.stringify(payload)}

Return ONLY JSON object:
{"replies":[{"index":0,"style":"helpful","body":"...${LINK_PLACEHOLDER}"}]}`;

    const raw = await llmComplete(client, genPrompt);
    const parsed = parseJsonFromLlm<unknown>(raw, {});
    const rows = extractReplyRows(parsed);

    const mapped = jobs.map((job, i) => {
        const row = rows.find((r) => Number(r.index) === i) || rows[i];
        if (!row?.body) return null;
        return {
            url: job.post.url,
            style: job.style,
            slot: job.slot,
            body: humanizeText(String(row.body)),
        };
    });

    const missing = mapped
        .map((row, i) => (row ? null : jobs[i]))
        .filter(Boolean) as ReplyJob[];

    if (missing.length > 0) {
        console.warn(`Retrying ${missing.length} missing replies in batch…`);
        await sleep(600);
        const retryRaw = await llmComplete(client, genPrompt.replace(
            "ITEMS:\n" + JSON.stringify(payload),
            "ITEMS:\n" + JSON.stringify(
                missing.map((job, i) => ({
                    index: i,
                    style: job.style,
                    styleGuide: STYLE_GUIDE[job.style],
                    title: job.post.title,
                    body: job.post.body.slice(0, 400),
                    subreddit: job.post.subreddit,
                })),
            ),
        ));
        const retryParsed = parseJsonFromLlm<unknown>(retryRaw, {});
        const retryRows = extractReplyRows(retryParsed);
        for (let i = 0; i < missing.length; i++) {
            const job = missing[i];
            const row = retryRows.find((r) => Number(r.index) === i) || retryRows[i];
            if (!row?.body) continue;
            const idx = jobs.findIndex((j) => j.slot === job.slot);
            if (idx >= 0) {
                mapped[idx] = {
                    url: job.post.url,
                    style: job.style,
                    slot: job.slot,
                    body: humanizeText(String(row.body)),
                };
            }
        }
    }

    return mapped.filter(Boolean) as { url: string; style: string; body: string; slot: number }[];
}

async function humanizePass(
    client: LlmClient,
    bodies: { url: string; body: string; style: string; slot: number }[],
): Promise<{ url: string; body: string; style: string; slot: number }[]> {
    const out: { url: string; body: string; style: string; slot: number }[] = [];
    for (let i = 0; i < bodies.length; i += BATCH_SIZE) {
        const chunk = bodies.slice(i, i + BATCH_SIZE);
        const prompt = `Rewrite each reply to sound more human and keep its style distinct. Keep meaning and keep ${LINK_PLACEHOLDER} exactly.

${HUMANIZE_PROMPT}

INPUT:
${JSON.stringify(chunk.map((c, idx) => ({ index: idx, style: c.style, body: c.body })))}

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

async function wipeNiche(supabase: SupabaseClient, nicheId: NicheId) {
    const { data: posts } = await supabase.from("dfy_seed_posts").select("id").eq("niche", nicheId);
    const ids = (posts || []).map((p) => p.id as string);
    if (ids.length > 0) {
        await supabase.from("dfy_seed_replies").delete().in("post_id", ids);
    }
    await supabase.from("dfy_seed_replies").delete().eq("niche", nicheId);
    await supabase.from("dfy_seed_posts").delete().eq("niche", nicheId);
    console.log(`Wiped existing seed data for ${nicheId}`);
}

function sqlString(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

function buildNicheSql(
    nicheId: NicheId,
    posts: SeedPost[],
    replies: { url: string; body: string; style: string; slot: number }[],
    modelLabel: string,
): string {
    const lines: string[] = [];
    lines.push(`-- DFY seed for ${nicheId}`);
    lines.push(`DELETE FROM dfy_seed_replies WHERE niche = ${sqlString(nicheId)};`);
    lines.push(`DELETE FROM dfy_seed_posts WHERE niche = ${sqlString(nicheId)};`);

    for (const post of posts) {
        lines.push(
            `INSERT INTO dfy_seed_posts (niche, platform, subreddit, title, body, url, engagement, verified_at, active)` +
                ` VALUES (${sqlString(nicheId)}, ${sqlString(post.platform)}, ${sqlString(post.subreddit)}, ${sqlString(post.title)}, ${sqlString(post.body)}, ${sqlString(post.url)}, ${Number(post.engagement) || 0}, now(), true)` +
                ` ON CONFLICT (url) DO UPDATE SET niche = EXCLUDED.niche, platform = EXCLUDED.platform, subreddit = EXCLUDED.subreddit, title = EXCLUDED.title, body = EXCLUDED.body, engagement = EXCLUDED.engagement, verified_at = now(), active = true;`,
        );
    }

    for (const reply of replies) {
        const body = reply.body.includes(LINK_PLACEHOLDER)
            ? reply.body
            : `${reply.body} ${LINK_PLACEHOLDER}`;
        lines.push(
            `INSERT INTO dfy_seed_replies (post_id, niche, style, body, model)` +
                ` SELECT id, ${sqlString(nicheId)}, ${sqlString(reply.style)}, ${sqlString(body)}, ${sqlString(modelLabel)}` +
                ` FROM dfy_seed_posts WHERE url = ${sqlString(reply.url)} LIMIT 1;`,
        );
    }

    return lines.join("\n");
}

async function main() {
    const { niche: nicheFilter, dryRun, wipe, emitSql, curatedOnly } = parseArgs();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const rapidKey = process.env.RAPIDAPI_KEY?.trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const emitOnly = Boolean(emitSql);

    if (!rapidKey && !openaiKey && !dryRun) {
        console.error("Missing RAPIDAPI_KEY (preferred) or OPENAI_API_KEY in .env.local");
        process.exit(1);
    }
    if ((!supabaseUrl || !serviceKey) && !dryRun && !emitOnly) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }

    if (supabaseUrl && serviceKey && !dryRun && !emitOnly) {
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
        !emitOnly && supabaseUrl && serviceKey
            ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
            : null;

    const niches = nicheFilter
        ? APP_NICHES.filter((n) => n.id === nicheFilter)
        : [...APP_NICHES];

    if (nicheFilter && niches.length === 0) {
        console.error(`Unknown niche: ${nicheFilter}`);
        process.exit(1);
    }

    if (emitOnly) {
        const { mkdirSync } = await import("node:fs");
        mkdirSync(emitSql, { recursive: true });
    }

    console.log(
        `Seeding ${niches.length} niche(s). dryRun=${dryRun}. wipe=${wipe}. curatedOnly=${curatedOnly}. emitSql=${emitSql || "(none)"}. target=${TARGET_PER_NICHE}/niche. llm=${llm?.kind || "none"}`,
    );

    for (const niche of niches) {
        console.log(`\n=== ${niche.label} (${niche.id}) ===`);
        const posts = await collectPostsForNiche(niche.id, curatedOnly);
        console.log(`Found ${posts.length} real permalinks`);

        const jobs = buildReplyJobs(posts);
        console.log(`Built ${jobs.length} reply jobs`);

        if (jobs.length === 0) {
            console.warn(`No posts for ${niche.id}, skipping`);
            continue;
        }

        if (dryRun) {
            for (const job of jobs.slice(0, 8)) {
                console.log(`  - [${job.style}] ${job.post.title.slice(0, 80)}`);
            }
            continue;
        }

        if (!llm) {
            console.error("LLM required when not in dry-run");
            process.exit(1);
        }
        if (!emitOnly && !supabase) {
            console.error("Supabase required when not using --emit-sql");
            process.exit(1);
        }

        if (!emitOnly && wipe && supabase) {
            await wipeNiche(supabase, niche.id);
        }

        const allReplies: { url: string; body: string; style: string; slot: number }[] = [];
        for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
            const chunk = jobs.slice(i, i + BATCH_SIZE);
            console.log(`Generating replies ${i + 1}–${i + chunk.length}…`);
            allReplies.push(...(await generateRepliesBatch(llm, niche.label, chunk)));
            await sleep(500);
        }

        console.log(`Humanize pass on ${allReplies.length} replies…`);
        const humanized = await humanizePass(llm, allReplies);

        if (emitOnly) {
            const { writeFileSync } = await import("node:fs");
            const { join } = await import("node:path");
            const file = join(emitSql, `${niche.id}.sql`);
            writeFileSync(file, buildNicheSql(niche.id, posts, humanized, modelLabel), "utf8");
            console.log(`Wrote ${file} (${posts.length} posts, ${humanized.length} replies)`);
            continue;
        }

        const postIdByUrl = new Map<string, string>();
        let upserted = 0;

        for (const post of posts) {
            const { data: postRow, error: postErr } = await supabase!
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
            postIdByUrl.set(post.url, postRow.id as string);
        }

        if (!wipe) {
            const postIds = [...postIdByUrl.values()];
            if (postIds.length > 0) {
                await supabase!.from("dfy_seed_replies").delete().in("post_id", postIds);
            }
        }

        for (const reply of humanized) {
            const postId = postIdByUrl.get(reply.url);
            if (!postId) continue;
            const body = reply.body.includes(LINK_PLACEHOLDER)
                ? reply.body
                : `${reply.body} ${LINK_PLACEHOLDER}`;
            const { error: replyErr } = await supabase!.from("dfy_seed_replies").insert({
                post_id: postId,
                niche: niche.id,
                style: reply.style,
                body,
                model: modelLabel,
            });
            if (replyErr) {
                console.warn(`Reply insert failed: ${replyErr.message}`);
                continue;
            }
            upserted += 1;
        }

        console.log(`Upserted ${postIdByUrl.size} posts + ${upserted} replies for ${niche.id}`);
    }

    console.log("\nDone.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
