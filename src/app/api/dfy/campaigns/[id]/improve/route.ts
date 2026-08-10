import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { runBuildStage } from "@/lib/dfy/campaign-engine";
import type { BuildStage, CampaignRow } from "@/lib/dfy/types";

type RouteParams = { params: Promise<{ id: string }> };

const WEAK_STAGE_MAP: Record<string, BuildStage[]> = {
    "opportunity quality": ["discover_opportunities", "generate_replies"],
    "content variety": ["generate_content", "generate_hooks", "generate_ctas"],
    "campaign coverage": ["build_calendar", "generate_content"],
    "offer clarity": ["analyze_offer", "determine_strategy"],
    "audience fit": ["determine_audience", "determine_strategy"],
    "cta quality": ["generate_ctas", "generate_hooks"],
};

const BASE_IMPROVE_STAGES: BuildStage[] = [
    "discover_opportunities",
    "generate_replies",
    "generate_content",
    "generate_hooks",
    "generate_ctas",
    "score_campaign",
    "finalize",
];

async function fetchCampaign(
    supabase: NonNullable<Awaited<ReturnType<typeof requireApiUser>>["supabase"]>,
    id: string,
    userId: string,
) {
    const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();
    return data as CampaignRow | null;
}

export async function POST(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;

    const campaign = await fetchCampaign(auth.supabase, id, auth.user.id);
    if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

    const previousScore = campaign.score;
    const previousOpportunityCount = campaign.stats?.opportunityCount ?? 0;

    const weakAreas = (campaign.score_breakdown as { weakAreas?: string[] })?.weakAreas || [];
    const stagesToRun: BuildStage[] = [...BASE_IMPROVE_STAGES];

    for (const area of weakAreas) {
        const stages = WEAK_STAGE_MAP[area];
        if (stages) stagesToRun.push(...stages);
    }

    const uniqueStages = [...new Set(stagesToRun)];

    try {
        for (const stage of uniqueStages) {
            const fresh = await fetchCampaign(auth.supabase, id, auth.user.id);
            if (!fresh) break;
            await runBuildStage(auth.supabase, fresh, stage);
        }

        const updated = await fetchCampaign(auth.supabase, id, auth.user.id);
        const [{ data: opportunities }, { data: assets }] = await Promise.all([
            auth.supabase
                .from("campaign_opportunities")
                .select("*")
                .eq("campaign_id", id)
                .order("opportunity_score", { ascending: false }),
            auth.supabase
                .from("campaign_assets")
                .select("*")
                .eq("campaign_id", id)
                .order("created_at", { ascending: true }),
        ]);

        const newScore = updated?.score ?? previousScore;
        const newOpportunityCount = opportunities?.length ?? previousOpportunityCount;

        return NextResponse.json({
            campaign: updated,
            opportunities: opportunities || [],
            assets: assets || [],
            ok: true,
            improved: uniqueStages,
            previousScore,
            newScore,
            previousOpportunityCount,
            newOpportunityCount,
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Could not improve campaign. Try again.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
