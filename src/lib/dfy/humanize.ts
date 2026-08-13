import { sanitizeContent } from "@/lib/instant/safety";

export const LINK_PLACEHOLDER = "{{LINK}}";

export const HUMANIZE_PROMPT = `
Write like a real person posting a helpful Reddit comment — not like marketing copy or an AI assistant.

VOICE RULES:
- Varied sentence length. Mix short and longer sentences. Never write three similar-length sentences in a row.
- Casual but clear. Contractionsions are fine. Occasional lowercase opener is fine.
- One concrete, specific detail that fits the thread (a habit, a timeframe, a practical tip).
- Soft close — no hard sell. Soft resource language only.
- End with the link placeholder exactly as {{LINK}} when a link belongs in the reply.

FORBIDDEN:
- Em-dashes (—) or en-dashes (–). Use commas, periods, or hyphens.
- AI tells: "delve", "moreover", "furthermore", "it's worth noting", "in today's world", "landscape", "leverage", "robust", "seamless", "game-changer", "unlock".
- Tricolon lists ("X, Y, and Z" stacked as a rhetorical device).
- Fake personal testimonials ("I used this and made $X").
- Uniform polished rhythm that sounds corporate.
- Markdown bold/italic, bullet lists, or numbered lists.
- Closing with "Hope this helps!" or "Let me know if you have questions!".
`.trim();

const AI_TELLS: [RegExp, string][] = [
    [/\bdelve(?:s|d|ing)?\b/gi, "look"],
    [/\bmoreover\b/gi, "also"],
    [/\bfurthermore\b/gi, "also"],
    [/\bit'?s worth noting that\b/gi, ""],
    [/\bin today'?s (?:world|digital age)\b/gi, ""],
    [/\bgame[- ]changer\b/gi, "useful option"],
    [/\bunlock(?:s|ed|ing)?\b/gi, "open up"],
    [/\bleverage\b/gi, "use"],
    [/\brobust\b/gi, "solid"],
    [/\bseamless(?:ly)?\b/gi, "smooth"],
    [/\blandscape\b/gi, "space"],
];

const BOILERPLATE_CLOSERS = [
    /\s*hope this helps!?\.?\s*$/i,
    /\s*let me know if you have (?:any )?questions!?\.?\s*$/i,
    /\s*feel free to (?:ask|reach out).*?\.?\s*$/i,
    /\s*happy to help!?\.?\s*$/i,
];

/**
 * Deterministic post-processing to strip common AI tells and polish replies.
 */
export function humanizeText(text: string): string {
    let out = (text || "").trim();
    if (!out) return out;

    // Strip markdown
    out = out.replace(/\*\*([^*]+)\*\*/g, "$1");
    out = out.replace(/\*([^*]+)\*/g, "$1");
    out = out.replace(/^#+\s+/gm, "");
    out = out.replace(/^\s*[-*•]\s+/gm, "");
    out = out.replace(/^\s*\d+\.\s+/gm, "");

    // Em/en dashes → commas or hyphens
    out = out.replace(/\s*[—–]\s*/g, ", ");

    for (const [pattern, replacement] of AI_TELLS) {
        out = out.replace(pattern, replacement);
    }

    for (const pattern of BOILERPLATE_CLOSERS) {
        out = out.replace(pattern, "");
    }

    // Collapse whitespace
    out = out.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();

    // Preserve link placeholder casing
    out = out.replace(/\{\{\s*link\s*\}\}/gi, LINK_PLACEHOLDER);

    out = sanitizeContent(out);

    return out.trim();
}

/** Swap {{LINK}} for a real URL (or strip the placeholder if no URL). */
export function injectLink(body: string, offerUrl?: string | null): string {
    const text = body || "";
    if (!offerUrl?.trim()) {
        return text
            .replace(new RegExp(`\\s*${LINK_PLACEHOLDER}`, "gi"), "")
            .replace(/\s{2,}/g, " ")
            .trim();
    }
    return text.replace(new RegExp(LINK_PLACEHOLDER, "gi"), offerUrl.trim());
}
