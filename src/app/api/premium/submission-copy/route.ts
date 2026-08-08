import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { getCachedOrGenerate, generateSubmissionCopy } from "@/lib/premium-ai";
import { TRAFFIC_SOURCES } from "@/lib/content/traffic-sources";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(request: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;
    const body = await request.json().catch(() => ({}));

    const sourceId = clampString(body.sourceId, 80);
    if (!sourceId) {
        return NextResponse.json({ error: "Source ID required" }, { status: 400 });
    }

    const source = TRAFFIC_SOURCES.find((s) => s.id === sourceId);
    if (!source) {
        return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
        .from("member_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!profile?.affiliate_link) {
        return NextResponse.json({ error: "Complete your profile setup first." }, { status: 400 });
    }

    const { data: existing } = await supabase
        .from("autopilot_progress")
        .select("submission_copy")
        .eq("user_id", user.id)
        .eq("source_id", sourceId)
        .maybeSingle();

    if (existing?.submission_copy) {
        return NextResponse.json({ copy: existing.submission_copy, cached: true });
    }

    try {
        const result = await getCachedOrGenerate({
            supabase,
            userId: user.id,
            tool: "submission",
            input: {
                sourceId,
                affiliateLink: profile.affiliate_link,
                niche: profile.niche,
            },
            generate: () =>
                generateSubmissionCopy({
                    sourceName: source.name,
                    sourceType: source.type,
                    niche: profile.niche,
                    affiliateLink: profile.affiliate_link,
                    instructions: source.instructions,
                }),
        });

        await supabase.from("autopilot_progress").upsert(
            {
                user_id: user.id,
                source_id: sourceId,
                submission_copy: result.data,
            },
            { onConflict: "user_id,source_id" }
        );

        return NextResponse.json({ copy: result.data, cached: result.cached });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Generation failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;
    const body = await request.json().catch(() => ({}));
    const sourceId = clampString(body.sourceId, 80);
    const completed = Boolean(body.completed);

    if (!sourceId) {
        return NextResponse.json({ error: "Source ID required" }, { status: 400 });
    }

    if (completed) {
        await supabase.from("autopilot_progress").upsert(
            {
                user_id: user.id,
                source_id: sourceId,
                completed_at: new Date().toISOString(),
            },
            { onConflict: "user_id,source_id" }
        );
    } else {
        await supabase
            .from("autopilot_progress")
            .update({ completed_at: null })
            .eq("user_id", user.id)
            .eq("source_id", sourceId);
    }

    return NextResponse.json({ ok: true });
}

export async function GET() {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;

    const { data } = await supabase
        .from("autopilot_progress")
        .select("*")
        .eq("user_id", user.id);

    return NextResponse.json({ progress: data ?? [] });
}
