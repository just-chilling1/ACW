import * as cheerio from 'cheerio';
import { sanitizeExternalUrl } from '@/lib/safe-url';
import { isRealPostUrl, normalizePostUrl } from '@/lib/dfy/post-url';
import {
    googleAfterDate,
    isUsableReplyTarget,
    minCreatedUtc,
    toCreatedUtcSeconds,
} from '@/lib/dfy/post-quality';

/**
 * Generates a stable ID from a string (usually a URL).
 */
function generateStableId(input: string, fallback: string): string {
    if (!input) return fallback;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function keepSearchPost(post: any): boolean {
    if (!post) return false;
    if (!isRealPostUrl(post.url)) return false;
    return isUsableReplyTarget(post);
}

/**
 * Sanitizes an array of posts by removing JavaScript snippets, 
 * tracking code, and low-quality fragments.
 */
export function sanitizePosts(posts: any[]): any[] {
    if (!posts || !Array.isArray(posts)) return [];

    return posts.filter(post => {
        const text = (post.text || post.title || "").toLowerCase();

        // Block known JS/Tracking fingerprint matches
        const isCode =
            text.includes('(function()') ||
            text.includes('var id=') ||
            text.includes('document.getelementbyid') ||
            text.includes('setattribute') ||
            (text.includes('.js') && text.includes('script')) ||
            text.length < 15; // Too short to be meaningful

        if (isCode) return false;
        // Drop deleted / archived / too-old Reddit threads (cannot accept replies).
        return isUsableReplyTarget(post);
    }).map(post => {
        let text = post.text || post.title || "";

        // Remove duplicated YouTube metadata (channel name, views, time ago patterns)
        text = text
            .replace(/YouTube\s*·\s*[^·]*?\d+[KMB]?\+?\s*views?\s*·\s*\d+\s*(month|week|day|hour|year|minute)s?\s*ago/gi, '')
            .replace(/\d+\.?\d*[KMB]?\+?\s*views?\s*/gi, '')
            .replace(/·\s*\d+\s*(month|week|day|hour|year|minute)s?\s*ago/gi, '')
            .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '')
            .replace(/\bYouTube\b\s*·?/gi, '')
            .replace(/\breddit\b\s*·?/gi, '')
            .replace(/·\s*[A-Za-z0-9_]+\s*·?/g, ' ')
            .replace(/^.*?Read more/gi, '')
            .replace(/\s+/g, ' ')
            .replace(/^[\s·\-|]+|[\s·\-|]+$/g, '')
            .trim();

        if (text.length < 20 && post.title && post.title.length > text.length) {
            text = post.title;
        }

        const url = sanitizeExternalUrl(post.url);

        return { ...post, text, url };
    });
}

/** After RapidAPI 429/401/403, skip paid Reddit/YouTube so we don't keep hammering a dead quota. */
let rapidApiCooldownUntil = 0;

function markRapidApiUnavailable(source: string, status: number) {
    // 401/403 usually won't recover in-process; 429 gets a cooldown window.
    const ms = status === 429 ? 10 * 60 * 1000 : 60 * 60 * 1000;
    rapidApiCooldownUntil = Date.now() + ms;
    console.warn(`[SEARCH] RapidAPI unavailable via ${source} (HTTP ${status}); skipping paid search for ${Math.round(ms / 60000)}m`);
}

function isRapidApiCoolingDown(): boolean {
    return Date.now() < rapidApiCooldownUntil;
}

function keywordMatchesPost(keyword: string, title: string, text: string): boolean {
    const needle = keyword.toLowerCase().trim();
    if (!needle) return true;
    const titleL = title.toLowerCase();
    // Multi-word queries must hit the title — body-only phrase matches are usually incidental.
    if (/\s/.test(needle)) return titleL.includes(needle);
    return titleL.includes(needle) || text.toLowerCase().includes(needle);
}

// ─── Strategy 1: ScraperAPI (Google scrape) ─────────────────────────
async function fetchViaScraperAPI(keyword: string): Promise<any[]> {
    const scraperKey = (process.env.SCRAPERAPI_KEY || process.env.SCRAPER_API_KEY)?.trim();
    if (!scraperKey) throw new Error("Missing SCRAPERAPI_KEY / SCRAPER_API_KEY");

    console.log(`[SEARCH] Strategy 1: ScraperAPI for "${keyword}"`);
    // Prefer real Reddit threads (/comments/) and YouTube watch pages — not category/subreddit roots.
    // Rolling after: window keeps results inside Reddit's commentable age (~6 months).
    const after = googleAfterDate();
    const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:reddit.com/r/*/comments/ OR site:youtube.com/watch ${keyword} after:${after}`)}`;
    const scraperUrl = `https://api.scraperapi.com/?api_key=${scraperKey}&url=${encodeURIComponent(targetUrl)}&render=true&premium=true`;

    const response = await fetch(scraperUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`ScraperAPI status: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: any[] = [];

    const extractFromSelector = (selector: string) => {
        $(selector).each((_, el) => {
            $(el).find('script, style, meta, link, noscript').remove();
            const url = $(el).find('a').first().attr('href') || '';
            const title = $(el).find('h3').first().text().trim() || '';
            let snippet = $(el).find('div[data-sncf]').text() ||
                $(el).find('.VwiC3b').text() ||
                $(el).find('.y4550c').text() || "";
            if (!snippet || snippet.length < 20) snippet = $(el).text().trim().substring(0, 200);

            if (url && title && (url.includes('reddit.com') || url.includes('youtube.com'))) {
                const normalized = normalizePostUrl(url);
                if (!isRealPostUrl(normalized)) return;
                if (!isUsableReplyTarget({ title, text: snippet, url: normalized })) return;
                if (!results.find(r => r.url === normalized)) {
                    results.push({
                        id: generateStableId(normalized, Math.random().toString(36).substring(2, 10)),
                        platform: normalized.includes('reddit.com') ? 'Reddit' : 'YouTube',
                        title, text: snippet, url: normalized,
                        engagement: Math.floor(Math.random() * (normalized.includes('reddit.com') ? 200 : 500)) + 10
                    });
                }
            }
        });
    };

    extractFromSelector('.tF2Cxc');
    if (results.length < 5) extractFromSelector('#search div.g');
    if (results.length < 5) extractFromSelector('div.MjjYud');

    if (results.length === 0) throw new Error("ScraperAPI: 0 results parsed");
    return results;
}

// ─── Strategy 2: RapidAPI Reddit Search ─────────────────────────────
async function fetchRedditViaRapidAPI(keyword: string): Promise<any[]> {
    const key = process.env.RAPIDAPI_KEY?.trim();
    const host = process.env.RAPIDAPI_HOST_REDDIT?.trim();
    if (!key || !host) throw new Error("Missing RapidAPI Reddit credentials");

    if (isRapidApiCoolingDown()) {
        throw new Error("RapidAPI Reddit skipped (cooling down after 429)");
    }

    console.log(`[SEARCH] Strategy 2: RapidAPI Reddit for "${keyword}"`);
    // Prefer month over year — year-old threads are often archived (no new comments).
    const url = `https://${host}/search?query=${encodeURIComponent(keyword)}&sort=relevance&time=month`;
    const response = await fetch(url, {
        headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': host,
        },
        cache: "no-store",
    });

    if (response.status === 401 || response.status === 403 || response.status === 429) {
        markRapidApiUnavailable("Reddit", response.status);
        throw new Error(`RapidAPI Reddit status: ${response.status}`);
    }
    if (!response.ok) throw new Error(`RapidAPI Reddit status: ${response.status}`);
    const data = await response.json();

    // Parse Reddit API response — different APIs structure responses differently
    let posts: any[] = [];
    if (data.data?.children) {
        // Standard Reddit-like API
        posts = data.data.children.map((child: any) => {
            const d = child.data || child;
            const permalink = d.permalink
                ? (String(d.permalink).startsWith("http") ? d.permalink : `https://www.reddit.com${d.permalink}`)
                : (d.url || "");
            const url = normalizePostUrl(permalink);
            return {
                id: generateStableId(url || '', Math.random().toString(36).substring(2, 10)),
                platform: 'Reddit',
                title: d.title || '',
                text: d.selftext || d.body || d.title || '',
                url,
                engagement: d.score || d.ups || Math.floor(Math.random() * 200) + 10,
                author: d.author || '',
                archived: Boolean(d.archived),
                locked: Boolean(d.locked),
                removed_by_category: d.removed_by_category || null,
                created_utc: toCreatedUtcSeconds(d),
            };
        });
    } else if (Array.isArray(data.results || data.posts || data)) {
        const items = data.results || data.posts || data;
        posts = items.map((item: any) => {
            const url = normalizePostUrl(item.url || item.link || item.permalink || '');
            return {
                id: generateStableId(url || '', Math.random().toString(36).substring(2, 10)),
                platform: 'Reddit',
                title: item.title || '',
                text: item.text || item.selftext || item.body || item.title || '',
                url,
                engagement: item.score || item.ups || Math.floor(Math.random() * 200) + 10,
                author: item.author || '',
                archived: Boolean(item.archived),
                locked: Boolean(item.locked),
                removed_by_category: item.removed_by_category || null,
                created_utc: toCreatedUtcSeconds(item),
            };
        });
    }

    posts = posts.filter(keepSearchPost);
    if (posts.length === 0) throw new Error("RapidAPI Reddit: 0 usable (non-deleted/recent) results");
    return posts.slice(0, 20);
}

// ─── Strategy 3: RapidAPI YouTube Search ────────────────────────────
async function fetchYouTubeViaRapidAPI(keyword: string): Promise<any[]> {
    const key = process.env.RAPIDAPI_KEY?.trim();
    const host = process.env.RAPIDAPI_HOST_YOUTUBE?.trim();
    if (!key || !host) throw new Error("Missing RapidAPI YouTube credentials");

    if (isRapidApiCoolingDown()) {
        throw new Error("RapidAPI YouTube skipped (cooling down after 429)");
    }

    console.log(`[SEARCH] Strategy 3: RapidAPI YouTube for "${keyword}"`);
    const url = `https://${host}/search?query=${encodeURIComponent(keyword)}&sort=relevance`;
    const response = await fetch(url, {
        headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': host,
        },
        cache: "no-store",
    });

    if (response.status === 401 || response.status === 403 || response.status === 429) {
        markRapidApiUnavailable("YouTube", response.status);
        throw new Error(`RapidAPI YouTube status: ${response.status}`);
    }
    if (!response.ok) throw new Error(`RapidAPI YouTube status: ${response.status}`);
    const data = await response.json();

    let videos: any[] = [];
    const items = data.contents || data.items || data.results || data.videos || data;
    if (Array.isArray(items)) {
        videos = items.map((item: any) => {
            const video = item.video || item.snippet || item;
            const url = video.videoId
                ? `https://www.youtube.com/watch?v=${video.videoId}`
                : normalizePostUrl(video.url || video.link || '');
            return {
                id: generateStableId(video.videoId || url || '', Math.random().toString(36).substring(2, 10)),
                platform: 'YouTube',
                title: video.title || '',
                text: video.description || video.descriptionSnippet || video.title || '',
                url,
                engagement: video.viewCount || video.views || Math.floor(Math.random() * 500) + 10,
            };
        });
    }

    videos = videos.filter((v) => isRealPostUrl(v.url));
    if (videos.length === 0) throw new Error("RapidAPI YouTube: 0 results");
    return videos.slice(0, 15);
}

// ─── Strategy 4: PullPush (free Reddit archive — no API key) ────────
async function pullPushQuery(q: string): Promise<any[]> {
    const after = minCreatedUtc();
    const url =
        `https://api.pullpush.io/reddit/search/submission/` +
        `?q=${encodeURIComponent(q)}&size=50&sort=desc&sort_type=score&after=${after}`;

    const response = await fetch(url, {
        headers: {
            Accept: "application/json",
            "User-Agent": "AICashWave/1.0 (local search; support@reliteagency.com)",
        },
        cache: "no-store",
    });

    if (!response.ok) throw new Error(`PullPush status: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data?.data) ? data.data : [];
}

async function fetchRedditViaPullPush(keyword: string): Promise<any[]> {
    console.log(`[SEARCH] Strategy 4: PullPush Reddit for "${keyword}"`);
    const trimmed = keyword.trim();
    // Quote multi-word queries first so PullPush prefers phrase matches.
    const primaryQ = /\s/.test(trimmed) ? `"${trimmed}"` : trimmed;
    let items = await pullPushQuery(primaryQ);
    if (items.length < 5 && primaryQ !== trimmed) {
        items = [...items, ...(await pullPushQuery(trimmed))];
    }

    const seen = new Set<string>();
    const posts = items
        .filter((d: any) => !d?.over_18)
        .map((d: any) => {
            const permalink = d.permalink
                ? (String(d.permalink).startsWith("http")
                    ? d.permalink
                    : `https://www.reddit.com${d.permalink}`)
                : "";
            const postUrl = normalizePostUrl(permalink || "");
            const title = String(d.title || "");
            const text = String(d.selftext || d.title || "");
            return {
                id: generateStableId(postUrl || String(d.id || ""), Math.random().toString(36).substring(2, 10)),
                platform: "Reddit",
                title,
                text,
                url: postUrl,
                engagement: Number(d.score || d.ups) || Math.floor(Math.random() * 200) + 10,
                author: d.author || "",
                archived: Boolean(d.archived),
                locked: Boolean(d.locked),
                removed_by_category: d.removed_by_category || null,
                created_utc: toCreatedUtcSeconds(d),
            };
        })
        .filter((p: any) => {
            if (!keepSearchPost(p) || !keywordMatchesPost(keyword, p.title, p.text)) return false;
            if (seen.has(p.url)) return false;
            seen.add(p.url);
            return true;
        });

    if (posts.length === 0) throw new Error("PullPush Reddit: 0 usable recent results");
    return posts.slice(0, 20);
}

// ─── Main: Try all strategies with graceful fallback ────────────────
export async function searchSocialData(keyword: string) {
    const hasScraperKey = Boolean(
        (process.env.SCRAPERAPI_KEY || process.env.SCRAPER_API_KEY)?.trim()
    );

    // Strategy 1: ScraperAPI (Google scrape) — only when keyed
    if (hasScraperKey) {
        try {
            const results = await fetchViaScraperAPI(keyword);
            const sanitized = sanitizePosts(results).filter(keepSearchPost);
            if (sanitized.length > 0) {
                console.log(`[SEARCH] ✅ ScraperAPI returned ${sanitized.length} usable posts`);
                return sanitized.sort((a, b) => b.engagement - a.engagement);
            }
        } catch (e: any) {
            console.warn(`[SEARCH] ⚠️ ScraperAPI failed: ${e.message}`);
        }
    } else {
        console.log(`[SEARCH] Skipping ScraperAPI (no SCRAPERAPI_KEY)`);
    }

    // Strategy 2+3: RapidAPI Reddit + YouTube (skip while cooling down after 429)
    const combined: any[] = [];
    if (!isRapidApiCoolingDown()) {
        console.log(`[SEARCH] Falling back to RapidAPI direct search...`);
        const [redditResult, youtubeResult] = await Promise.allSettled([
            fetchRedditViaRapidAPI(keyword),
            fetchYouTubeViaRapidAPI(keyword),
        ]);

        if (redditResult.status === "fulfilled") {
            combined.push(...redditResult.value);
            console.log(`[SEARCH] ✅ Reddit returned ${redditResult.value.length} results`);
        } else {
            console.warn(`[SEARCH] ⚠️ Reddit failed: ${(redditResult as any).reason?.message}`);
        }

        if (youtubeResult.status === "fulfilled") {
            combined.push(...youtubeResult.value);
            console.log(`[SEARCH] ✅ YouTube returned ${youtubeResult.value.length} results`);
        } else {
            console.warn(`[SEARCH] ⚠️ YouTube failed: ${(youtubeResult as any).reason?.message}`);
        }
    } else {
        console.log(`[SEARCH] Skipping RapidAPI (unavailable / cooling down)`);
    }

    if (combined.length > 0) {
        const sanitized = sanitizePosts(combined).filter(keepSearchPost);
        if (sanitized.length > 0) {
            return sanitized.sort((a, b) => b.engagement - a.engagement);
        }
    }

    // Strategy 4: free PullPush archive when paid APIs are missing/throttled
    try {
        const results = await fetchRedditViaPullPush(keyword);
        const sanitized = sanitizePosts(results).filter(keepSearchPost);
        if (sanitized.length > 0) {
            console.log(`[SEARCH] ✅ PullPush returned ${sanitized.length} usable posts`);
            return sanitized.sort((a, b) => b.engagement - a.engagement);
        }
    } catch (e: any) {
        console.warn(`[SEARCH] ⚠️ PullPush failed: ${e.message}`);
    }

    throw new Error("All search strategies failed. No usable (recent, non-deleted) post URLs available.");
}
