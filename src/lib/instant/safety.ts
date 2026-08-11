const BANNED_PATTERNS = [
    /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:per|\/)\s*(?:day|week|month|hour)/i,
    /\b(?:made|earned|generated)\s+\$\d/i,
    /\bguaranteed?\s+(?:income|results|earnings|profit)/i,
    /\b\d{1,3}%\s+(?:success|conversion|guarantee)/i,
    /\b(?:proven|guaranteed)\s+to\s+(?:make|earn|lose|gain)/i,
    /\bi\s+(?:personally|myself)\s+(?:used|tried|made|earned)/i,
    /\b(?:fake|fabricated)\b/i,
    /\b(?:blast|spam)\s+(?:groups|communities|everyone)/i,
    /\bevade\s+(?:moderation|rules|bans)/i,
    /\bpretend\s+(?:to\s+be|you're)\s+(?:a\s+customer|not\s+affiliated)/i,
];

const SOFT_WARNINGS = [
    /\bamazing\b/i,
    /\blife[- ]changing\b/i,
    /\bsecret\b/i,
    /\b(?:everyone|nobody)\s+(?:is|knows)/i,
];

export function hasBannedContent(text: string): boolean {
    return BANNED_PATTERNS.some((p) => p.test(text));
}

export function sanitizeContent(text: string): string {
    let cleaned = text.trim();
    for (const pattern of BANNED_PATTERNS) {
        cleaned = cleaned.replace(pattern, "");
    }
    return cleaned.replace(/\s{2,}/g, " ").trim();
}

export function validateAssetContent(content: string): { ok: boolean; warnings: string[] } {
    const warnings: string[] = [];
    if (hasBannedContent(content)) {
        return { ok: false, warnings: ["Content contains unsupported claims or prohibited language."] };
    }
    for (const pattern of SOFT_WARNINGS) {
        if (pattern.test(content)) {
            warnings.push("Consider softening promotional language.");
        }
    }
    return { ok: true, warnings };
}

export const SAFETY_RULES_PROMPT = `
CRITICAL CONTENT RULES:
- Do NOT invent testimonials, personal experiences, earnings, or statistics.
- Do NOT guarantee results, income, health outcomes, or weight loss.
- Do NOT use fake urgency, deceptive clickbait, or manipulative language.
- Do NOT pretend the user personally used the product.
- Do NOT encourage spam, rule evasion, or hiding affiliate relationships.
- Be useful first; promotion should feel natural and honest.
- Use soft resource language: "worth exploring", "may help", "if you're interested".
- Some content should be conversation starters WITHOUT a link.
`.trim();

export const AFFILIATE_DISCLOSURE_TIP =
    "Affiliate disclosure may be required depending on the platform and your relationship with the product.";

export const PLATFORM_SAFETY_TIP =
    "Find relevant communities, follow their rules, contribute something useful, and promote naturally where allowed.";
