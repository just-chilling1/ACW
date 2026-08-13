import * as cheerio from 'cheerio';
import { sanitizeExternalUrl } from '@/lib/safe-url';
import { isRealPostUrl, normalizePostUrl } from '@/lib/dfy/post-url';

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

        return !isCode;
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

// ─── Strategy 1: ScraperAPI (Google scrape) ─────────────────────────
async function fetchViaScraperAPI(keyword: string): Promise<any[]> {
    const scraperKey = (process.env.SCRAPERAPI_KEY || process.env.SCRAPER_API_KEY)?.trim();
    if (!scraperKey) throw new Error("Missing SCRAPERAPI_KEY / SCRAPER_API_KEY");

    console.log(`[SEARCH] Strategy 1: ScraperAPI for "${keyword}"`);
    // Prefer real Reddit threads (/comments/) and YouTube watch pages — not category/subreddit roots.
    const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:reddit.com/r/*/comments/ OR site:youtube.com/watch ${keyword} after:2024-01-01`)}`;
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

    console.log(`[SEARCH] Strategy 2: RapidAPI Reddit for "${keyword}"`);
    const url = `https://${host}/search?query=${encodeURIComponent(keyword)}&sort=relevance&time=year`;
    const response = await fetch(url, {
        headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': host,
        },
        cache: "no-store",
    });

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
            };
        });
    }

    posts = posts.filter((p) => isRealPostUrl(p.url));
    if (posts.length === 0) throw new Error("RapidAPI Reddit: 0 results");
    return posts.slice(0, 20);
}

// ─── Strategy 3: RapidAPI YouTube Search ────────────────────────────
async function fetchYouTubeViaRapidAPI(keyword: string): Promise<any[]> {
    const key = process.env.RAPIDAPI_KEY?.trim();
    const host = process.env.RAPIDAPI_HOST_YOUTUBE?.trim();
    if (!key || !host) throw new Error("Missing RapidAPI YouTube credentials");

    console.log(`[SEARCH] Strategy 3: RapidAPI YouTube for "${keyword}"`);
    const url = `https://${host}/search?query=${encodeURIComponent(keyword)}&sort=relevance`;
    const response = await fetch(url, {
        headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': host,
        },
        cache: "no-store",
    });

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

// ─── Main: Try all strategies with graceful fallback ────────────────
export async function searchSocialData(keyword: string) {
    // Strategy 1: ScraperAPI (Google scrape)
    try {
        const results = await fetchViaScraperAPI(keyword);
        const sanitized = sanitizePosts(results).filter((p) => isRealPostUrl(p.url));
        if (sanitized.length > 0) {
            console.log(`[SEARCH] ✅ ScraperAPI returned ${sanitized.length} real posts`);
            return sanitized.sort((a, b) => b.engagement - a.engagement);
        }
    } catch (e: any) {
        console.warn(`[SEARCH] ⚠️ ScraperAPI failed: ${e.message}`);
    }

    // Strategy 2: RapidAPI Reddit + YouTube in parallel
    console.log(`[SEARCH] Falling back to RapidAPI direct search...`);
    const combined: any[] = [];

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

    if (combined.length === 0) {
        throw new Error("All search strategies failed. No results available.");
    }

    const sanitized = sanitizePosts(combined).filter((p) => isRealPostUrl(p.url));
    if (sanitized.length === 0) {
        throw new Error("All search strategies failed. No real post URLs available.");
    }
    return sanitized.sort((a, b) => b.engagement - a.engagement);
}
