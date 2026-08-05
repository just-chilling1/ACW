const MAX_TOPIC_LENGTH = 80;
const MAX_DISPLAY_LENGTH = 36;
const MAX_TOPIC_WORDS = 6;
const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const DOMAIN_PATTERN = /\b[\w-]+\.(com|net|org|io|co|me)\b[^\s]*/gi;

/** Strip URLs and normalize whitespace for ad-topic keywords. */
export function sanitizeTopicKeyword(raw: unknown): string {
    if (typeof raw !== "string") return "";

    let value = raw
        .replace(URL_PATTERN, " ")
        .replace(DOMAIN_PATTERN, " ")
        .replace(/\baffid=\S+/gi, " ")
        .replace(/[""''·|]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const firstLine = value.split(/[\n\r]/)[0]?.trim() ?? "";
    return firstLine.slice(0, MAX_TOPIC_LENGTH).trim();
}

export function isValidTopicKeyword(topic: string): boolean {
    const cleaned = sanitizeTopicKeyword(topic);
    if (cleaned.length < 2 || cleaned.length > 50) return false;
    if (/https?:\/\//i.test(cleaned) || /\.(com|net|org|io|co|me)\b/i.test(cleaned)) return false;
    if (/\baffid=/i.test(cleaned)) return false;
    const words = cleaned.split(/\s+/);
    if (words.length > MAX_TOPIC_WORDS) return false;
    return true;
}

export function formatTopicLabel(topic: string, maxLen = MAX_DISPLAY_LENGTH): string {
    const cleaned = sanitizeTopicKeyword(topic);
    if (cleaned.length <= maxLen) return cleaned;
    return `${cleaned.slice(0, maxLen - 1).trimEnd()}…`;
}

/** Dedupe, sanitize, and cap recent topic history for display and storage. */
export function cleanHistoryItems(items: unknown[], limit = 5): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const item of items) {
        const cleaned = sanitizeTopicKeyword(item);
        const key = cleaned.toLowerCase();
        if (!isValidTopicKeyword(cleaned) || seen.has(key)) continue;
        seen.add(key);
        result.push(cleaned);
        if (result.length >= limit) break;
    }

    return result;
}
