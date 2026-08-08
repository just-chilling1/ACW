import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import type { WritingStyle } from "@/lib/premium-types";

export const maxDuration = 30;

const VALID_STYLES: WritingStyle[] = ["personal_story", "straightforward", "curious_question"];

export async function GET() {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;

    const { data, error } = await supabase
        .from("member_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
}

export async function POST(request: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;
    const body = await request.json().catch(() => ({}));

    const affiliateLink = clampString(body.affiliateLink, 2048);
    const niche = clampString(body.niche, 120);
    const writingStyle = clampString(body.writingStyle, 40) as WritingStyle;

    if (!affiliateLink.startsWith("http")) {
        return NextResponse.json({ error: "Please enter a valid affiliate link starting with http." }, { status: 400 });
    }
    if (!niche) {
        return NextResponse.json({ error: "Please enter what you are promoting." }, { status: 400 });
    }
    if (!VALID_STYLES.includes(writingStyle)) {
        return NextResponse.json({ error: "Please pick a writing style." }, { status: 400 });
    }

    const row = {
        user_id: user.id,
        affiliate_link: affiliateLink,
        niche,
        writing_style: writingStyle,
        setup_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from("member_profile")
        .upsert(row, { onConflict: "user_id" })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
}
