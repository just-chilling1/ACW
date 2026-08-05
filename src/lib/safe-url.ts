export function isSafeHttpUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

export function sanitizeExternalUrl(url: unknown): string {
    if (typeof url !== "string") return "";
    const trimmed = url.trim();
    return isSafeHttpUrl(trimmed) ? trimmed : "";
}
