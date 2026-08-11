import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { generatePostFromAngle } from "@/lib/instant/content-engine";
import type { OfferSnapshot } from "@/lib/dfy/types";

type RouteParams = { params: Promise<{ id: string; angleId: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id: kitId, angleId } = await params;

    const { data: kit } = await auth.supabase
        .from("promotion_kits")
        .select("*")
        .eq("id", kitId)
        .eq("user_id", auth.user.id)
        .single();

    if (!kit) return NextResponse.json({ error: "Kit not found." }, { status: 404 });

    const { data: angle } = await auth.supabase
        .from("promotion_assets")
        .select("*")
        .eq("id", angleId)
        .eq("kit_id", kitId)
        .eq("type", "angle")
        .single();

    if (!angle) return NextResponse.json({ error: "Angle not found." }, { status: 404 });

    try {
        const snapshot = kit.offer_snapshot as OfferSnapshot;
        const platforms = snapshot.promotionChannels?.slice(0, 3) || ["Facebook Groups", "Reddit", "Social"];
        const platform = platforms[0];

        const post = await generatePostFromAngle(
            snapshot,
            kit.offer_url,
            angle.title || angle.angle,
            angle.content,
            platform,
        );

        const { data: created, error } = await auth.supabase
            .from("promotion_assets")
            .insert({
                kit_id: kitId,
                type: "post",
                platform: post.platform,
                title: post.title,
                content: post.content,
                angle: post.angle,
                cta: post.cta,
                why: post.why,
                include_link: post.include_link,
                meta: { ...post.meta, fromAngleId: angleId },
            })
            .select("*")
            .single();

        if (error) return NextResponse.json({ error: "Could not create post." }, { status: 500 });

        const stats = kit.stats || {};
        await auth.supabase.from("promotion_kits").update({
            stats: { ...stats, postCount: ((stats as { postCount?: number }).postCount || 0) + 1 },
            updated_at: new Date().toISOString(),
        }).eq("id", kitId);

        return NextResponse.json({ asset: created });
    } catch {
        return NextResponse.json({ error: "Could not create post." }, { status: 500 });
    }
}
