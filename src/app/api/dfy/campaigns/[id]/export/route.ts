import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { buildMarkdownExport, buildOpportunitiesCsv, buildWeeklyPlanExport } from "@/lib/dfy/export";
import type { CampaignAssetRow, CampaignOpportunityRow, CampaignRow } from "@/lib/dfy/types";

type RouteParams = { params: Promise<{ id: string }> };

function safeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, "-") || "campaign";
}

export async function GET(req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;
    const format = new URL(req.url).searchParams.get("format") || "markdown";

    const { data: campaign } = await auth.supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .eq("user_id", auth.user.id)
        .single();

    if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

    const [{ data: opportunities }, { data: assets }] = await Promise.all([
        auth.supabase.from("campaign_opportunities").select("*").eq("campaign_id", id).order("opportunity_score", { ascending: false }),
        auth.supabase.from("campaign_assets").select("*").eq("campaign_id", id),
    ]);

    const campaignRow = campaign as CampaignRow;
    const assetRows = (assets || []) as CampaignAssetRow[];
    const baseName = safeFilename(campaignRow.name);

    if (format === "csv") {
        const csv = buildOpportunitiesCsv((opportunities || []) as CampaignOpportunityRow[]);
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${baseName}-opportunities.csv"`,
            },
        });
    }

    if (format === "week") {
        const weekly = buildWeeklyPlanExport(campaignRow, assetRows);
        return new NextResponse(weekly, {
            headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                "Content-Disposition": `attachment; filename="${baseName}-weekly-plan.md"`,
            },
        });
    }

    const markdown = buildMarkdownExport(
        campaignRow,
        (opportunities || []) as CampaignOpportunityRow[],
        assetRows,
    );

    return new NextResponse(markdown, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="${baseName}-campaign.md"`,
        },
    });
}
