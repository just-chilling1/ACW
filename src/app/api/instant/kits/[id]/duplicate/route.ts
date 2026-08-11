import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { getKitWithAssets } from "@/lib/instant/kit-engine";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;

    const result = await getKitWithAssets(auth.supabase, id, auth.user.id);
    if (!result) return NextResponse.json({ error: "Kit not found." }, { status: 404 });

    const { kit, assets } = result;

    const { data: duplicate, error } = await auth.supabase
        .from("promotion_kits")
        .insert({
            user_id: auth.user.id,
            name: `${kit.name} (Copy)`,
            offer_url: kit.offer_url,
            offer_snapshot: kit.offer_snapshot,
            status: "ready",
            build_progress: kit.build_progress,
            recommendations: kit.recommendations,
            quick_plan: kit.quick_plan,
            checklist: kit.checklist,
            stats: kit.stats,
        })
        .select("*")
        .single();

    if (error || !duplicate) {
        return NextResponse.json({ error: "Could not duplicate kit." }, { status: 500 });
    }

    for (const asset of assets) {
        await auth.supabase.from("promotion_assets").insert({
            kit_id: duplicate.id,
            type: asset.type,
            platform: asset.platform,
            title: asset.title,
            content: asset.content,
            angle: asset.angle,
            cta: asset.cta,
            why: asset.why,
            include_link: asset.include_link,
            status: "ready",
            meta: asset.meta,
        });
    }

    return NextResponse.json({ kit: duplicate });
}
