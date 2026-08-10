import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { runBuildStage } from "@/lib/dfy/campaign-engine";
import type { BuildStage, CampaignRow } from "@/lib/dfy/types";

type RouteParams = { params: Promise<{ id: string }> };

const WEAK_STAGE_MAP: Record<string, BuildStage[]> = {
    "opportunity quality": ["discover_opportunities", "generate_replies"],
    "content variety": ["generate_content", "generate_hooks", "generate_ctas"],
    "campaign coverage": ["build_calendar", "generate_content"],
};

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

    const weakAreas = (campaign.score_breakdown as { weakAreas?: string[] })?.weakAreas || [];
    const stagesToRun: BuildStage[] = [];

    for (const area of weakAreas) {
        const stages = WEAK_STAGE_MAP[area];
        if (stages) stagesToRun.push(...stages);
    }

    if (stagesToRun.length === 0) {
        stagesToRun.push("discover_opportunities", "generate_replies", "generate_content");
    } else if (stagesToRun.includes("discover_opportunities") && !stagesToRun.includes("generate_replies")) {
        stagesToRun.push("generate_replies");
    }

    const uniqueStages = [...new Set(stagesToRun)];

    try {
        for (const stage of uniqueStages) {
            const fresh = await fetchCampaign(auth.supabase, id, auth.user.id);
            if (!fresh) break;
            await runBuildStage(auth.supabase, fresh, stage);
        }

        let fresh = await fetchCampaign(auth.supabase, id, auth.user.id);
        if (fresh) {
            await runBuildStage(auth.supabase, fresh, "score_campaign");
            fresh = await fetchCampaign(auth.supabase, id, auth.user.id);
        }
        if (fresh) {
            await runBuildStage(auth.supabase, fresh, "finalize");
        }

        const updated = await fetchCampaign(auth.supabase, id, auth.user.id);
        const { data: opportunities } = await auth.supabase
            .from("campaign_opportunities")
            .select("*")
            .eq("campaign_id", id)
            .order("opportunity_score", { ascending: false });

        return NextResponse.json({
            campaign: updated,
            opportunities: opportunities || [],
            ok: true,
            improved: uniqueStages,
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Could not improve campaign. Try again.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
