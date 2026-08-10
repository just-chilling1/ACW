import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import type { CampaignRow } from "@/lib/dfy/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;

    const { data: campaign, error } = await auth.supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .eq("user_id", auth.user.id)
        .single();

    if (error || !campaign) {
        return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    const [{ data: opportunities }, { data: assets }, { data: actions }] = await Promise.all([
        auth.supabase.from("campaign_opportunities").select("*").eq("campaign_id", id).order("opportunity_score", { ascending: false }),
        auth.supabase.from("campaign_assets").select("*").eq("campaign_id", id).order("created_at", { ascending: true }),
        auth.supabase.from("campaign_actions").select("*").eq("campaign_id", id).order("created_at", { ascending: true }),
    ]);

    return NextResponse.json({
        campaign,
        opportunities: opportunities || [],
        assets: assets || [],
        actions: actions || [],
    });
}

export async function PATCH(req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;
    const body = await req.json();
    const name = body.name != null ? clampString(body.name, 120) : undefined;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;

    const { data, error } = await auth.supabase
        .from("campaigns")
        .update(updates)
        .eq("id", id)
        .eq("user_id", auth.user.id)
        .select("*")
        .single();

    if (error || !data) return NextResponse.json({ error: "Could not update campaign." }, { status: 404 });
    return NextResponse.json({ campaign: data });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;
    const { error } = await auth.supabase
        .from("campaigns")
        .delete()
        .eq("id", id)
        .eq("user_id", auth.user.id);

    if (error) return NextResponse.json({ error: "Could not delete campaign." }, { status: 500 });
    return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    if (body.action === "duplicate") {
        const { data: original } = await auth.supabase
            .from("campaigns")
            .select("*")
            .eq("id", id)
            .eq("user_id", auth.user.id)
            .single();

        if (!original) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

        const { data: copy, error } = await auth.supabase
            .from("campaigns")
            .insert({
                user_id: auth.user.id,
                name: `${original.name} (Copy)`,
                offer_url: original.offer_url,
                offer_snapshot: original.offer_snapshot,
                audience_mode: original.audience_mode,
                channels: original.channels,
                status: "draft",
                build_progress: { completedStages: [] },
                strategy: original.strategy,
                primary_keyword: original.primary_keyword,
            })
            .select("*")
            .single();

        if (error || !copy) return NextResponse.json({ error: "Could not duplicate campaign." }, { status: 500 });
        return NextResponse.json({ campaign: copy });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
