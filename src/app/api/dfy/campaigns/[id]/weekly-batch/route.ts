import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { runWeeklyBatchForCampaign } from "@/lib/dfy/campaign-engine";
import type { CampaignRow } from "@/lib/dfy/types";

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

    if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    if (campaign.status !== "ready") {
        return NextResponse.json({ error: "Finish building your campaign first." }, { status: 400 });
    }

    try {
        const count = await runWeeklyBatchForCampaign(auth.supabase, campaign as CampaignRow);
        const { data: assets } = await auth.supabase
            .from("campaign_assets")
            .select("*")
            .eq("campaign_id", id)
            .order("created_at", { ascending: true });

        const weeklyAssets = (assets || []).filter(
            (a) => (a.meta as { section?: string })?.section === "weekly_batch",
        );

        return NextResponse.json({ assets: weeklyAssets, count, ok: true });
    } catch {
        return NextResponse.json({ error: "We couldn't generate your weekly content. Try again." }, { status: 500 });
    }
}
