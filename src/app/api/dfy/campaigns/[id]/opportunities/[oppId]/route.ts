import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";

type RouteParams = { params: Promise<{ id: string; oppId: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id, oppId } = await params;
    const body = await req.json().catch(() => ({}));
    const done = body.done === true;

    const { data: campaign } = await auth.supabase
        .from("campaigns")
        .select("id")
        .eq("id", id)
        .eq("user_id", auth.user.id)
        .single();

    if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

    const { data: opportunity } = await auth.supabase
        .from("campaign_opportunities")
        .select("*")
        .eq("id", oppId)
        .eq("campaign_id", id)
        .single();

    if (!opportunity) return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });

    const meta = {
        ...(opportunity.meta as Record<string, unknown> || {}),
        done,
        completedAt: done ? new Date().toISOString() : null,
    };

    const { data: updated, error } = await auth.supabase
        .from("campaign_opportunities")
        .update({ meta })
        .eq("id", oppId)
        .eq("campaign_id", id)
        .select("*")
        .single();

    if (error || !updated) {
        return NextResponse.json({ error: "Could not update opportunity." }, { status: 500 });
    }

    return NextResponse.json({ opportunity: updated });
}
