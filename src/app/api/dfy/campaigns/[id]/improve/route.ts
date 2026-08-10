import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { runBuildStage } from "@/lib/dfy/campaign-engine";
import type { BuildStage, CampaignRow } from "@/lib/dfy/types";

type RouteParams = { params: Promise<{ id: string }> };

const WEAK_STAGE_MAP: Record<string, BuildStage> = {
    "opportunity quality": "discover_opportunities",
    "content variety": "generate_content",
    "campaign coverage": "build_calendar",
};

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

    const weakAreas = (campaign.score_breakdown as { weakAreas?: string[] })?.weakAreas || [];
    const stagesToRun: BuildStage[] = [];

    for (const area of weakAreas) {
        const stage = WEAK_STAGE_MAP[area];
        if (stage) stagesToRun.push(stage);
    }
    if (stagesToRun.length === 0) {
        stagesToRun.push("generate_content", "discover_opportunities");
    }

    try {
        for (const stage of stagesToRun) {
            await runBuildStage(auth.supabase, campaign as CampaignRow, stage);
        }
        await runBuildStage(auth.supabase, campaign as CampaignRow, "score_campaign");
        await runBuildStage(auth.supabase, campaign as CampaignRow, "finalize");

        const { data: updated } = await auth.supabase.from("campaigns").select("*").eq("id", id).single();
        return NextResponse.json({ campaign: updated, ok: true });
    } catch {
        return NextResponse.json({ error: "Could not improve campaign. Try again." }, { status: 500 });
    }
}
