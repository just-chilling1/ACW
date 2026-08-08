import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { getCachedOrGenerate, repurposePost } from "@/lib/premium-ai";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(request: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;
    const body = await request.json().catch(() => ({}));

    const text = clampString(body.text, 4000);
    if (!text) {
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

    try {
        const result = await getCachedOrGenerate({
            supabase,
            userId: user.id,
            tool: "repurpose",
            input: { text, affiliateLink: profile.affiliate_link, niche: profile.niche },
            generate: () =>
                repurposePost({
                    text,
                    affiliateLink: profile.affiliate_link,
                    niche: profile.niche,
                }),
        });

        return NextResponse.json({ platforms: result.data, cached: result.cached });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Repurpose failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
