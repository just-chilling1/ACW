import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { getCachedOrGenerate, rewritePost } from "@/lib/premium-ai";
import type { WritingStyle } from "@/lib/premium-types";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(request: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;
    const body = await request.json().catch(() => ({}));

    const seedText = clampString(body.seedText, 4000);
    const postId = clampString(body.postId, 80);
    const seedNiche = clampString(body.niche, 120);

    if (!seedText) {
        return NextResponse.json({ error: "Post text required" }, { status: 400 });
    }

    const { data: profile } = await supabase
        .from("member_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!profile?.affiliate_link) {
        return NextResponse.json({ error: "Complete your profile setup first." }, { status: 400 });
    }

    const style = (body.writingStyle || profile.writing_style || "personal_story") as WritingStyle;
    const niche = seedNiche || profile.niche;

    try {
        const result = await getCachedOrGenerate({
            supabase,
            userId: user.id,
            tool: "rewrite",
            input: { seedText, affiliateLink: profile.affiliate_link, style, niche, postId },
            generate: () =>
                rewritePost({
                    seedText,
                    affiliateLink: profile.affiliate_link,
                    style,
                    niche,
                }),
        });

        await supabase.from("saved_content").insert({
            user_id: user.id,
            tool: "instant",
            content_type: "post",
            title: `Personalized post — ${niche}`,
            body: result.data,
            metadata: { postId, style, seedNiche: niche },
            status: "saved",
        });

        return NextResponse.json({ text: result.data, cached: result.cached });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Rewrite failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
