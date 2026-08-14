/**
 * Filters Reddit/YouTube posts that are unusable for replies:
 * deleted, removed, archived, or older than Reddit's comment lock window.
 *
 * Reddit typically archives submissions after ~6 months — new comments cannot
 * be posted. We reject earlier (150 days) so users don't open dead threads.
 *
 * Curated fallbacks and Google scrapes often omit `created_utc` / `archived`.
 * For those, age is estimated from the Reddit submission id (monotonic base36).
 */

/** Stay under Reddit's ~180-day archive lock. */
export const MAX_COMMENTABLE_AGE_DAYS = 150;

const DEAD_CONTENT_RE =
    /\[deleted\]|\[removed\]|deleted by user|removed by moderator|\/deleted_by_user\b|archived post/i;

/** Known-dead Reddit submission IDs (base36) that still appear in seeds/fallbacks. */
const KNOWN_DEAD_REDDIT_IDS = new Set([
    "1q4p1lx", // r/EmailMarketing — deleted by user / archived
    "1nd8t83", // r/Marriage — archived (~1y)
]);

/**
 * Confirmed (id, unix-seconds) pairs from live Reddit timestamps.
 * IDs are sequential; we interpolate/extrapolate between these anchors.
 */
const REDDIT_ID_CALIBRATION: Array<[number, number]> = [
    [parseInt("1nd8t83", 36), Date.UTC(2025, 7, 14) / 1000], // ~1y ago as of 2026-08-14
    [parseInt("1q4p1lx", 36), Date.UTC(2026, 0, 14) / 1000], // ~7mo ago as of 2026-08-14
].sort((a, b) => a[0] - b[0]) as Array<[number, number]>;

export type PostQualityFields = {
    title?: string | null;
    text?: string | null;
    body?: string | null;
    selftext?: string | null;
    url?: string | null;
    author?: string | null;
    archived?: boolean | null;
    locked?: boolean | null;
    removed_by_category?: string | null;
    created_utc?: number | string | null;
    createdUtc?: number | string | null;
    createdAt?: number | string | null;
};

function asFiniteNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
    }
    return null;
}

/** Extract Reddit submission id from a comments permalink. */
export function redditSubmissionIdFromUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const m = String(url).match(/reddit\.com\/r\/[^/]+\/comments\/([a-z0-9]+)/i);
    return m?.[1]?.toLowerCase() || null;
}

/** Approximate created_utc from a Reddit base36 submission id. */
export function estimateCreatedUtcFromRedditId(id: string): number | null {
    const n = parseInt(id, 36);
    if (!Number.isFinite(n) || n <= 0) return null;

    const points = REDDIT_ID_CALIBRATION;
    if (points.length < 2) return null;

    let left = points[0];
    let right = points[points.length - 1];
    for (let i = 0; i < points.length - 1; i++) {
        if (n >= points[i][0] && n <= points[i + 1][0]) {
            left = points[i];
            right = points[i + 1];
            break;
        }
        if (n < points[0][0]) {
            left = points[0];
            right = points[1];
            break;
        }
        if (n > points[points.length - 1][0]) {
            left = points[points.length - 2];
            right = points[points.length - 1];
        }
    }

    const [idA, tA] = left;
    const [idB, tB] = right;
    if (idB === idA) return Math.floor(tA);
    const t = tA + ((n - idA) / (idB - idA)) * (tB - tA);
    return Math.floor(t);
}

/** Normalize created time to unix seconds (Reddit-style). */
export function toCreatedUtcSeconds(post: PostQualityFields): number | null {
    const raw =
        asFiniteNumber(post.created_utc) ??
        asFiniteNumber(post.createdUtc) ??
        asFiniteNumber(post.createdAt);
    if (raw != null) {
        if (raw > 1e12) return Math.floor(raw / 1000);
        return Math.floor(raw);
    }

    const id = redditSubmissionIdFromUrl(post.url);
    if (id) return estimateCreatedUtcFromRedditId(id);
    return null;
}

export function isDeletedOrRemovedContent(post: PostQualityFields): boolean {
    const title = String(post.title || "");
    const text = String(post.text || post.body || post.selftext || "");
    const url = String(post.url || "");
    const author = String(post.author || "");
    const submissionId = redditSubmissionIdFromUrl(url);

    if (submissionId && KNOWN_DEAD_REDDIT_IDS.has(submissionId)) return true;
    if (DEAD_CONTENT_RE.test(title) || DEAD_CONTENT_RE.test(text) || DEAD_CONTENT_RE.test(url)) {
        return true;
    }
    if (author === "[deleted]" || author === "[removed]") return true;
    if (post.removed_by_category) return true;
    return false;
}

export function isArchivedOrLocked(post: PostQualityFields): boolean {
    return post.archived === true || post.locked === true;
}

export function isWithinCommentableAge(
    post: PostQualityFields,
    maxAgeDays = MAX_COMMENTABLE_AGE_DAYS,
    nowMs = Date.now(),
): boolean {
    const created = toCreatedUtcSeconds(post);
    if (created == null) {
        // Reddit without an estimable id cannot be trusted as commentable.
        if (/reddit\.com/i.test(String(post.url || ""))) return false;
        return true;
    }
    const ageMs = nowMs - created * 1000;
    if (ageMs < 0) return true;
    return ageMs <= maxAgeDays * 24 * 60 * 60 * 1000;
}

/**
 * True when a post is safe to surface for commenting.
 * Reddit age is taken from `created_utc` when present, otherwise estimated
 * from the submission id so curated/scraped permalinks still get filtered.
 */
export function isUsableReplyTarget(post: PostQualityFields): boolean {
    if (isDeletedOrRemovedContent(post)) return false;
    if (isArchivedOrLocked(post)) return false;
    if (!isWithinCommentableAge(post)) return false;
    return true;
}

/** ISO date string for Google `after:YYYY-MM-DD` (rolling freshness window). */
export function googleAfterDate(maxAgeDays = MAX_COMMENTABLE_AGE_DAYS, now = new Date()): string {
    const d = new Date(now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
}

/** Unix seconds lower bound for archive APIs (PullPush `after`). */
export function minCreatedUtc(maxAgeDays = MAX_COMMENTABLE_AGE_DAYS, nowMs = Date.now()): number {
    return Math.floor(nowMs / 1000) - maxAgeDays * 24 * 60 * 60;
}

function parseRedditListing(data: unknown): PostQualityFields | null {
    const listing = Array.isArray(data) ? data[0] : data;
    const child = (listing as { data?: { children?: Array<{ data?: Record<string, unknown> }> } })
        ?.data?.children?.[0]?.data;
    if (!child) return null;
    return {
        title: typeof child.title === "string" ? child.title : "",
        text: typeof child.selftext === "string" ? child.selftext : "",
        author: typeof child.author === "string" ? child.author : "",
        url: typeof child.permalink === "string"
            ? `https://www.reddit.com${child.permalink}`
            : undefined,
        archived: Boolean(child.archived),
        locked: Boolean(child.locked),
        removed_by_category: typeof child.removed_by_category === "string"
            ? child.removed_by_category
            : null,
        created_utc: asFiniteNumber(child.created_utc),
    };
}

function parsePullPushItem(data: unknown): PostQualityFields | null {
    const items = (data as { data?: unknown })?.data;
    const row = Array.isArray(items) ? items[0] : null;
    if (!row || typeof row !== "object") return null;
    const d = row as Record<string, unknown>;
    return {
        title: typeof d.title === "string" ? d.title : "",
        text: typeof d.selftext === "string" ? d.selftext : "",
        author: typeof d.author === "string" ? d.author : "",
        archived: Boolean(d.archived),
        locked: Boolean(d.locked),
        removed_by_category: typeof d.removed_by_category === "string" ? d.removed_by_category : null,
        created_utc: asFiniteNumber(d.created_utc),
    };
}

/**
 * Live-inspect a Reddit permalink for archived / deleted / locked status.
 * Returns merged quality fields, or a deleted stub on 404. Null if all sources fail.
 */
export async function inspectRedditSubmission(url: string): Promise<PostQualityFields | null> {
    const id = redditSubmissionIdFromUrl(url);
    if (!id) return { url };

    const endpoints = [
        `https://old.reddit.com/comments/${id}.json?raw_json=1&limit=1`,
        `https://api.pullpush.io/reddit/search/submission/?ids=${id}`,
    ];

    for (const endpoint of endpoints) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(endpoint, {
                headers: {
                    Accept: "application/json",
                    "User-Agent": "AICashWave/1.0 (seed quality; support@reliteagency.com)",
                },
                signal: controller.signal,
                cache: "no-store",
            });
            if (response.status === 404) {
                return { url, title: "[deleted]", removed_by_category: "deleted" };
            }
            if (!response.ok) continue;
            const json = await response.json();
            const parsed = endpoint.includes("pullpush")
                ? parsePullPushItem(json)
                : parseRedditListing(json);
            if (parsed) return { ...parsed, url };
        } catch {
            // try next source
        } finally {
            clearTimeout(timeout);
        }
    }

    return null;
}

/** Local filter first; if the post looks usable, confirm against live Reddit when possible. */
export async function isUsableReplyTargetLive(post: PostQualityFields): Promise<boolean> {
    if (!isUsableReplyTarget(post)) return false;
    if (!/reddit\.com/i.test(String(post.url || ""))) return true;

    const live = await inspectRedditSubmission(String(post.url));
    if (!live) return isUsableReplyTarget(post);
    return isUsableReplyTarget({ ...post, ...live, url: post.url });
}
