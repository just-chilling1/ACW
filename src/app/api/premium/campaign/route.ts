import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { searchSocialData } from "@/lib/rapidapi";
import { generateReplies } from "@/lib/llm";
import {
    generateCampaignExtras,
    generateCampaignKeywords,
    getCachedOrGenerate,
} from "@/lib/premium-ai";
import { buildCampaignCopyAll } from "@/lib/premium-copy";
import type { CampaignData, WritingStyle } from "@/lib/premium-types";
import { DFY_KEYWORDS } from "@/lib/content/dfy-keywords";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;
    const body = await request.json().catch(() => ({}));

    const useFallbackKeyword = Boolean(body.useFallbackKeyword);
    const fallbackSearch = clampString(body.fallbackSearch, 200);

    const { data: profile } = await supabase
        .from("member_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!profile?.affiliate_link) {
        return NextResponse.json({ error: "Complete your profile setup first." }, { status: 400 });
    }

    const niche = profile.niche;
    const affiliateLink = profile.affiliate_link;
    const style = (profile.writing_style || "personal_story") as WritingStyle;

    try {
        let keywords;
        if (useFallbackKeyword && fallbackSearch) {
            const match = DFY_KEYWORDS.find((k) => k.search === fallbackSearch);
            keywords = match ? [match] : DFY_KEYWORDS.slice(0, 1);
        } else {
            const kwResult = await getCachedOrGenerate({
                supabase,
                userId: user.id,
                tool: "keywords",
                input: { niche, affiliateLink },
                generate: () => generateCampaignKeywords(niche, affiliateLink),
            });
            keywords = kwResult.data;
        }

        const primaryKeyword = keywords[0]?.search || niche;
        const posts = await searchSocialData(primaryKeyword);
        const topPosts = posts.slice(0, 8);

        let postsWithReplies: CampaignData["posts"] = [];
        if (topPosts.length > 0) {
            const repliesResults = await generateReplies(topPosts, affiliateLink);
            postsWithReplies = topPosts.map((post) => {
                const match = repliesResults.find((r: { id: string }) => r.id === post.id);
                return {
                    ...post,
                    replies: match?.replies || [],
                };
            }).filter((p) => p.replies.length > 0);
        }

        const extrasResult = await getCachedOrGenerate({
            supabase,
            userId: user.id,
            tool: "campaign",
            input: { niche, affiliateLink, style, type: "extras" },
            generate: () => generateCampaignExtras(niche, affiliateLink, style),
        });

        const campaignData: CampaignData = {
            keywords,
            posts: postsWithReplies,
            extras: extrasResult.data,
            niche,
            affiliateLink,
        };

        const { data: saved } = await supabase
            .from("campaigns")
            .insert({
                user_id: user.id,
                name: `${niche} Campaign`,
                data: campaignData,
            })
            .select()
            .single();

        await supabase.from("saved_content").insert({
            user_id: user.id,
            tool: "dfy",
            content_type: "campaign",
            title: `${niche} Campaign`,
            body: buildCampaignCopyAll(campaignData),
            metadata: { campaignId: saved?.id, keywordCount: keywords.length, postCount: postsWithReplies.length },
            status: "saved",
        });

        return NextResponse.json({
            campaign: saved,
            data: campaignData,
            copyAll: buildCampaignCopyAll(campaignData),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Campaign build failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET() {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;

    const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

    return NextResponse.json({ campaigns: data ?? [] });
}
