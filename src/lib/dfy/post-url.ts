/**
 * Validates that a URL points to an actual post/thread, not a category
 * (e.g. subreddit root) or search page.
 */

const REDDIT_THREAD =
    /^https?:\/\/(?:www\.|old\.|np\.)?reddit\.com\/r\/[^/]+\/comments\/[a-z0-9]+(?:\/[^/?#]*)?/i;

const YOUTUBE_WATCH =
    /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^#]*v=[\w-]{6,}|youtu\.be\/[\w-]{6,})/i;

export function isRealPostUrl(url: string | null | undefined): boolean {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed) return false;

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    } catch {
        return false;
    }

    if (/reddit\.com/i.test(trimmed)) {
        // Reject subreddit roots, search, user pages, etc.
        if (/\/r\/[^/]+\/?$/i.test(trimmed.replace(/\?.*$/, ""))) return false;
        if (/\/search\b/i.test(trimmed)) return false;
        return REDDIT_THREAD.test(trimmed);
    }

    if (/youtube\.com|youtu\.be/i.test(trimmed)) {
        return YOUTUBE_WATCH.test(trimmed);
    }

    return false;
}

/** Normalize Reddit permalinks to a canonical https://www.reddit.com/... form. */
export function normalizePostUrl(url: string): string {
    const trimmed = url.trim();
    try {
        const parsed = new URL(trimmed);
        if (/reddit\.com$/i.test(parsed.hostname) || /\.reddit\.com$/i.test(parsed.hostname)) {
            parsed.hostname = "www.reddit.com";
            parsed.protocol = "https:";
            // Drop tracking query params
            parsed.search = "";
            parsed.hash = "";
            let path = parsed.pathname;
            if (!path.endsWith("/")) path += "/";
            return `https://www.reddit.com${path}`;
        }
        return parsed.toString();
    } catch {
        return trimmed;
    }
}

export function filterRealPostUrls<T extends { url?: string | null }>(items: T[]): T[] {
    return items.filter((item) => isRealPostUrl(item.url));
}
