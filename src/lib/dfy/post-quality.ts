/**
 * Filters Reddit/YouTube posts that are unusable for replies:
 * deleted, removed, archived, or older than Reddit's comment lock window.
 *
 * Reddit typically archives submissions after ~6 months — new comments cannot
 * be posted. We reject earlier (150 days) so users don't open dead threads.
 */

/** Stay under Reddit's ~180-day archive lock. */
export const MAX_COMMENTABLE_AGE_DAYS = 150;

const DEAD_CONTENT_RE =
    /\[deleted\]|\[removed\]|deleted by user|removed by moderator|\/deleted_by_user\b/i;

/** Known-dead Reddit submission IDs (base36) that still appear in seeds/fallbacks. */
const KNOWN_DEAD_REDDIT_IDS = new Set([
    "1q4p1lx", // r/EmailMarketing — deleted by user / archived
]);

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

/** Normalize created time to unix seconds (Reddit-style). */
export function toCreatedUtcSeconds(post: PostQualityFields): number | null {
    const raw =
        asFiniteNumber(post.created_utc) ??
        asFiniteNumber(post.createdUtc) ??
        asFiniteNumber(post.createdAt);
    if (raw == null) return null;
    // ms timestamps from some APIs
    if (raw > 1e12) return Math.floor(raw / 1000);
    return Math.floor(raw);
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
    if (created == null) return true; // unknown age — keep; prefer sources that supply timestamps
    const ageMs = nowMs - created * 1000;
    if (ageMs < 0) return true;
    return ageMs <= maxAgeDays * 24 * 60 * 60 * 1000;
}

/**
 * True when a post is safe to surface for commenting.
 * Unknown age is allowed (Google scrape often lacks timestamps) but deleted /
 * archived flags and dead title/url patterns always reject.
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
