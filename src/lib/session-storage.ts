/** User-scoped localStorage keys for SearchContext session state. */

const LEGACY_KEYS = [
    "cashtap_current_keyword",
    "cashtap_current_variations",
    "cashtap_current_chip",
    "cashtap_current_affiliate",
    "cashtap_selected_posts",
    "cashtap_history",
] as const;

type SessionField = "keyword" | "variations" | "chip" | "affiliate" | "selected_posts" | "history";

function key(userId: string, field: SessionField): string {
    return `cashtap_${userId}_${field}`;
}

export type SessionSnapshot = {
    keyword: string;
    variations: string[];
    activeChip: string;
    affiliateLink: string;
    history: string[];
};

export function readSession(userId: string): Partial<SessionSnapshot> {
    const keyword = localStorage.getItem(key(userId, "keyword"));
    const variationsRaw = localStorage.getItem(key(userId, "variations"));
    const activeChip = localStorage.getItem(key(userId, "chip"));
    const affiliateLink = localStorage.getItem(key(userId, "affiliate"));
    const historyRaw = localStorage.getItem(key(userId, "history"));

    return {
        ...(keyword ? { keyword } : {}),
        ...(variationsRaw ? { variations: JSON.parse(variationsRaw) as string[] } : {}),
        ...(activeChip ? { activeChip } : {}),
        ...(affiliateLink ? { affiliateLink } : {}),
        ...(historyRaw ? { history: JSON.parse(historyRaw) as string[] } : {}),
    };
}

export function writeSession(
    userId: string,
    data: Partial<SessionSnapshot> & { selectedAds?: unknown[] }
): void {
    if (data.keyword) localStorage.setItem(key(userId, "keyword"), data.keyword);
    if (data.variations && data.variations.length > 0) {
        localStorage.setItem(key(userId, "variations"), JSON.stringify(data.variations));
    }
    if (data.activeChip) localStorage.setItem(key(userId, "chip"), data.activeChip);
    if (data.affiliateLink) localStorage.setItem(key(userId, "affiliate"), data.affiliateLink);
    if (data.history) localStorage.setItem(key(userId, "history"), JSON.stringify(data.history));
    if (data.selectedAds !== undefined) {
        localStorage.setItem(key(userId, "selected_posts"), JSON.stringify(data.selectedAds));
    }
}

export function clearSession(userId: string): void {
    const fields: SessionField[] = ["keyword", "variations", "chip", "affiliate", "selected_posts", "history"];
    fields.forEach((field) => localStorage.removeItem(key(userId, field)));
}

/** One-time migration from unscoped legacy keys into the current user's namespace. */
export function migrateLegacySession(userId: string): void {
    const hasUserData = localStorage.getItem(key(userId, "keyword"));
    if (hasUserData) {
        clearLegacySession();
        return;
    }

    const legacyKeyword = localStorage.getItem("cashtap_current_keyword");
    const legacyVariations = localStorage.getItem("cashtap_current_variations");
    const legacyChip = localStorage.getItem("cashtap_current_chip");
    const legacyAffiliate = localStorage.getItem("cashtap_current_affiliate");
    const legacyHistory = localStorage.getItem("cashtap_history");

    if (legacyKeyword) localStorage.setItem(key(userId, "keyword"), legacyKeyword);
    if (legacyVariations) localStorage.setItem(key(userId, "variations"), legacyVariations);
    if (legacyChip) localStorage.setItem(key(userId, "chip"), legacyChip);
    if (legacyAffiliate) localStorage.setItem(key(userId, "affiliate"), legacyAffiliate);
    if (legacyHistory) localStorage.setItem(key(userId, "history"), legacyHistory);

    clearLegacySession();
}

export function clearLegacySession(): void {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
}
