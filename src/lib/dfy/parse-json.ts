export function parseJsonFromLlm<T>(raw: string, fallback: T): T {
    try {
        const cleaned = raw.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned) as T;
    } catch {
        return fallback;
    }
}

export function clampScore(value: unknown, min = 0, max = 100): number {
    const n = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
}

export function opportunityLabel(score: number): import("./types").OpportunityLabel {
    if (score >= 85) return "excellent";
    if (score >= 70) return "strong";
    if (score >= 50) return "good";
    return "low";
}

export function labelDisplay(label: import("./types").OpportunityLabel): string {
    switch (label) {
        case "excellent": return "Excellent";
        case "strong": return "Strong";
        case "good": return "Good";
        default: return "Low";
    }
}
