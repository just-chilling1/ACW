import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { buildMarkdownExport, buildOpportunitiesCsv } from "@/lib/dfy/export";
import type { CampaignAssetRow, CampaignOpportunityRow, CampaignRow } from "@/lib/dfy/types";

type RouteParams = { params: Promise<{ id: string }> };

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

    if (format === "csv") {
        const csv = buildOpportunitiesCsv((opportunities || []) as CampaignOpportunityRow[]);
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${campaign.name.replace(/[^a-z0-9]/gi, "-")}-opportunities.csv"`,
            },
        });
    }

    const markdown = buildMarkdownExport(
        campaign as CampaignRow,
        (opportunities || []) as CampaignOpportunityRow[],
        (assets || []) as CampaignAssetRow[],
    );

    return new NextResponse(markdown, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="${campaign.name.replace(/[^a-z0-9]/gi, "-")}-campaign.md"`,
        },
    });
}
