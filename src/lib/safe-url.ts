export function isSafeHttpUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

/** Trim, add https:// if missing, and return a safe http(s) URL — or "" if invalid. */
export function normalizeHttpUrl(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return isSafeHttpUrl(withProtocol) ? withProtocol : "";
}

export function sanitizeExternalUrl(url: unknown): string {
    if (typeof url !== "string") return "";
    const trimmed = url.trim();
    return isSafeHttpUrl(trimmed) ? trimmed : "";
}
