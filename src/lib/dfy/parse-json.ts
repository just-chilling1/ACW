export function parseJsonFromLlm<T>(raw: string, fallback: T): T {
    if (!raw || typeof raw !== "string") return fallback;

    const cleaned = raw.replace(/```json|```/g, "").trim();
    try {
        return JSON.parse(cleaned) as T;
    } catch {
        /* fall through — extract embedded JSON */
    }

    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
        try {
            return JSON.parse(objectMatch[0]) as T;
        } catch {
            /* try array next */
        }
    }

    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
        try {
            return JSON.parse(arrayMatch[0]) as T;
        } catch {
            /* give up */
        }
    }

    return fallback;
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
