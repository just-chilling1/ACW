import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { runFullBuild } from "@/lib/dfy/campaign-engine";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;

    const { data: campaign } = await auth.supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .eq("user_id", auth.user.id)
        .single();

    if (!campaign) {
        return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    try {
        await runFullBuild(auth.supabase, id);
        const { data: updated } = await auth.supabase.from("campaigns").select("*").eq("id", id).single();
        return NextResponse.json({ campaign: updated, ok: true });
    } catch {
        const { data: failed } = await auth.supabase.from("campaigns").select("*").eq("id", id).single();
        return NextResponse.json(
            {
                error: "We couldn't finish building your campaign. Please try again.",
                campaign: failed,
            },
            { status: 500 },
        );
    }
}

export async function GET(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;
    const { data: campaign } = await auth.supabase
        .from("campaigns")
        .select("build_progress, status")
        .eq("id", id)
        .eq("user_id", auth.user.id)
        .single();

    if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    return NextResponse.json({ progress: campaign.build_progress, status: campaign.status });
}
