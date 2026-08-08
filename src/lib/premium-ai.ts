import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { callChatGPT } from "@/lib/llm";
import type {
    CampaignExtras,
    CampaignKeyword,
    RepurposePlatform,
    WritingStyle,
} from "@/lib/premium-types";
import { WRITING_STYLES } from "@/lib/premium-types";
import {
    buildCampaignCopyAll,
    getAutopilotPlan,
    getTodayPlanSources,
    parseTrafficEstimate,
} from "@/lib/premium-copy";

export {
    buildCampaignCopyAll,
    getAutopilotPlan,
    getTodayPlanSources,
    parseTrafficEstimate,
};

export const DAILY_GENERATION_LIMIT = 40;

export type PremiumTool =
    | "campaign"
    | "rewrite"
    | "repurpose"
    | "submission"
    | "keywords";

function styleLabel(style: WritingStyle): string {
    return WRITING_STYLES.find((s) => s.id === style)?.label ?? "Personal Story";
}

export function hashInput(payload: unknown): string {
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 32);
}

export function extractJson<T>(raw: string): T {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    try {
        return JSON.parse(cleaned) as T;
    } catch {
        const start = cleaned.indexOf("{");
        const arrayStart = cleaned.indexOf("[");
        const useArray = arrayStart !== -1 && (start === -1 || arrayStart < start);
        const sliceStart = useArray ? arrayStart : start;
        const sliceEnd = useArray ? cleaned.lastIndexOf("]") + 1 : cleaned.lastIndexOf("}") + 1;
        if (sliceStart === -1 || sliceEnd <= sliceStart) {
            throw new Error("Could not parse AI response");
        }
        return JSON.parse(cleaned.slice(sliceStart, sliceEnd)) as T;
    }
}

async function callChatGPTWithRetry(
    messages: { role: string; content: string }[],
    retries = 1
): Promise<string> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await callChatGPT(messages);
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError;
}

export async function checkAndIncrementUsage(
    supabase: SupabaseClient,
    userId: string
): Promise<{ allowed: boolean; count: number }> {
    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabase
        .from("ai_usage_daily")
        .select("generation_count")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle();

    const count = existing?.generation_count ?? 0;
    if (count >= DAILY_GENERATION_LIMIT) {
        return { allowed: false, count };
    }

    if (existing) {
        await supabase
            .from("ai_usage_daily")
            .update({ generation_count: count + 1 })
            .eq("user_id", userId)
            .eq("usage_date", today);
    } else {
        await supabase.from("ai_usage_daily").insert({
            user_id: userId,
            usage_date: today,
            generation_count: 1,
        });
    }

    return { allowed: true, count: count + 1 };
}

export async function getCachedOrGenerate<T>(opts: {
    supabase: SupabaseClient;
    userId: string;
    tool: PremiumTool;
    input: unknown;
    generate: () => Promise<T>;
    skipCache?: boolean;
}): Promise<{ data: T; cached: boolean }> {
    const inputHash = hashInput(opts.input);

    if (!opts.skipCache) {
        const { data: cached } = await opts.supabase
            .from("ai_cache")
            .select("result")
            .eq("user_id", opts.userId)
            .eq("tool", opts.tool)
            .eq("input_hash", inputHash)
            .maybeSingle();

        if (cached?.result) {
            return { data: cached.result as T, cached: true };
        }
    }

    const usage = await checkAndIncrementUsage(opts.supabase, opts.userId);
    if (!usage.allowed) {
        throw new Error(
            `Daily AI limit reached (${DAILY_GENERATION_LIMIT} generations). Try again tomorrow.`
        );
    }

    const data = await opts.generate();

    await opts.supabase.from("ai_cache").upsert(
        {
            user_id: opts.userId,
            tool: opts.tool,
            input_hash: inputHash,
            result: data as object,
        },
        { onConflict: "user_id,tool,input_hash" }
    );

    return { data, cached: false };
}

export async function generateCampaignKeywords(
    niche: string,
    affiliateLink: string
): Promise<CampaignKeyword[]> {
    const prompt = `You are an affiliate marketing expert. For the niche "${niche}", generate exactly 5 high-intent search keywords that people use on Reddit and YouTube when looking to buy or solve a problem.

Return ONLY a JSON array of objects with this shape:
[{"label":"Best natural appetite suppressant","search":"best natural appetite suppressant reddit 2024","niche":"${niche}","description":"One sentence about buyer intent."}]

Rules:
- Labels should sound like real search queries
- search field should be optimized for Reddit/YouTube search
- niche must be "${niche}"
- Make each keyword distinct and high buying intent`;

    const result = await callChatGPTWithRetry([{ role: "user", content: prompt }]);
    const parsed = extractJson<CampaignKeyword[]>(result);
    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Failed to generate keywords");
    }
    return parsed.slice(0, 5).map((k) => ({
        ...k,
        niche: niche || k.niche,
    }));
}

export async function generateCampaignExtras(
    niche: string,
    affiliateLink: string,
    style: WritingStyle
): Promise<CampaignExtras> {
    const prompt = `Write 3 promotional pieces for the "${niche}" niche. Affiliate link to include: ${affiliateLink}
Writing style: ${styleLabel(style)}

Return ONLY JSON:
{
  "facebookPost": "A Facebook group post (150-200 words) with the link naturally included",
  "quoraAnswer": "A Quora answer (150-250 words) that helps someone and includes the link",
  "pinterestDescription": "A Pinterest pin description (80-120 words) with keywords and the link"
}

Sound human, conversational, not salesy. Include the full affiliate link in each piece.`;

    const result = await callChatGPTWithRetry([{ role: "user", content: prompt }]);
    return extractJson<CampaignExtras>(result);
}

export async function rewritePost(opts: {
    seedText: string;
    affiliateLink: string;
    style: WritingStyle;
    niche: string;
}): Promise<string> {
    const prompt = `Rewrite this social media post for the "${opts.niche}" niche in a "${styleLabel(opts.style)}" style.
Include this affiliate link naturally: ${opts.affiliateLink}

Original post (for inspiration only — do NOT copy verbatim):
${opts.seedText.replace("{LINK}", opts.affiliateLink)}

Return ONLY the rewritten post text. No labels, no quotes, no explanation. Must include the affiliate link.`;

    const result = await callChatGPTWithRetry([{ role: "user", content: prompt }]);
    return result.trim().replace(/^["']|["']$/g, "");
}

export async function repurposePost(opts: {
    text: string;
    affiliateLink: string;
    niche: string;
}): Promise<Record<RepurposePlatform, string>> {
    const prompt = `Reformat this promotional message for 6 platforms. Niche: ${opts.niche}. Link: ${opts.affiliateLink}

Original message:
${opts.text}

Return ONLY JSON with these exact keys:
{
  "facebook": "Facebook group post version",
  "reddit": "Reddit comment version (casual, helpful)",
  "quora": "Quora answer version (detailed, helpful)",
  "whatsapp": "Short WhatsApp message to a friend",
  "email": "Short email to a contact",
  "sms": "Text message under 160 characters if possible"
}

Each must include the affiliate link. Sound natural for each platform.`;

    const result = await callChatGPTWithRetry([{ role: "user", content: prompt }]);
    return extractJson<Record<RepurposePlatform, string>>(result);
}

export async function generateSubmissionCopy(opts: {
    sourceName: string;
    sourceType: string;
    niche: string;
    affiliateLink: string;
    instructions: string[];
}): Promise<string> {
    const prompt = `Write submission copy for posting on "${opts.sourceName}" (${opts.sourceType}) in the "${opts.niche}" niche.
Affiliate link to include: ${opts.affiliateLink}

Site instructions:
${opts.instructions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Write the exact text the user should copy and paste. Match the format expected for ${opts.sourceType} (forum post, Quora answer, Pinterest description, etc.).
Return ONLY the copy text. No labels. Include the affiliate link naturally.`;

    const result = await callChatGPTWithRetry([{ role: "user", content: prompt }]);
    return result.trim().replace(/^["']|["']$/g, "");
}
