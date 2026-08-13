export function parseJsonFromLlm<T>(raw: string, fallback: T): T {
    if (!raw || typeof raw !== "string") return fallback;

    let cleaned = raw.replace(/```json|```/g, "").trim();

    // RapidAPI chatgpt-42 often wraps JSON as {"result":"{...}"} or a stringified JSON blob.
    try {
        const outer = JSON.parse(cleaned) as unknown;
        if (outer && typeof outer === "object" && "result" in (outer as object)) {
            const result = (outer as { result: unknown }).result;
            if (typeof result === "string") cleaned = result.replace(/```json|```/g, "").trim();
            else if (result && typeof result === "object") return result as T;
        } else if (outer && typeof outer === "object") {
            return outer as T;
        }
    } catch {
        /* fall through — extract embedded JSON */
    }

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
