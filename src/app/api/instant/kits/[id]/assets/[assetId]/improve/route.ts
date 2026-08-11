import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { improveAssetContent } from "@/lib/instant/content-engine";
import type { OfferSnapshot } from "@/lib/dfy/types";

type RouteParams = { params: Promise<{ id: string; assetId: string }> };

export async function POST(req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id: kitId, assetId } = await params;

    const { data: kit } = await auth.supabase
        .from("promotion_kits")
        .select("*")
        .eq("id", kitId)
        .eq("user_id", auth.user.id)
        .single();

    if (!kit) return NextResponse.json({ error: "Kit not found." }, { status: 404 });

    const { data: asset } = await auth.supabase
        .from("promotion_assets")
        .select("*")
        .eq("id", assetId)
        .eq("kit_id", kitId)
        .single();

    if (!asset) return NextResponse.json({ error: "Asset not found." }, { status: 404 });

    try {
        const body = await req.json();
        const option = clampString(body.option, 50) || "more_natural";
        const snapshot = kit.offer_snapshot as OfferSnapshot;

        const improved = await improveAssetContent(
            snapshot,
            kit.offer_url,
            asset.content,
            asset.type,
            option,
        );

        const { data: updated, error } = await auth.supabase
            .from("promotion_assets")
            .update({ content: improved, updated_at: new Date().toISOString() })
            .eq("id", assetId)
            .select("*")
            .single();

        if (error) return NextResponse.json({ error: "Could not improve content." }, { status: 500 });
        return NextResponse.json({ asset: updated });
    } catch {
        return NextResponse.json({ error: "Could not improve content." }, { status: 500 });
    }
}
