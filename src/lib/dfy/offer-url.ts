/** Normalize offer URLs for dedupe (same page = same offer, ignore aff hash/query). */
export function normalizeOfferUrlKey(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) return "";
    try {
        const u = new URL(trimmed);
        const host = u.hostname.replace(/^www\./i, "").toLowerCase();
        let path = u.pathname || "/";
        if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
        return `${host}${path.toLowerCase()}`;
    } catch {
        return trimmed.toLowerCase().replace(/\/+$/, "");
    }
}

export function dedupeOffersByUrl<T extends { url: string }>(offers: T[]): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const offer of offers) {
        const key = normalizeOfferUrlKey(offer.url);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        result.push(offer);
    }
    return result;
}
