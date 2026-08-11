import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { rotateContent } from "@/lib/instant/content-engine";
import type { OfferSnapshot } from "@/lib/dfy/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id: kitId } = await params;

    const { data: kit } = await auth.supabase
        .from("promotion_kits")
        .select("*")
        .eq("id", kitId)
        .eq("user_id", auth.user.id)
        .single();

    if (!kit) return NextResponse.json({ error: "Kit not found." }, { status: 404 });

    try {
        const { data: usedPosts } = await auth.supabase
            .from("promotion_assets")
            .select("angle")
            .eq("kit_id", kitId)
            .eq("type", "post")
            .eq("status", "used");

        const usedAngles = (usedPosts || []).map((p) => p.angle).filter(Boolean);
        const snapshot = kit.offer_snapshot as OfferSnapshot;

        const post = await rotateContent(snapshot, kit.offer_url, usedAngles);

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
                meta: { ...post.meta, rotated: true },
            })
            .select("*")
            .single();

        if (error) return NextResponse.json({ error: "Could not generate new content." }, { status: 500 });

        const stats = kit.stats || {};
        await auth.supabase.from("promotion_kits").update({
            stats: { ...stats, postCount: ((stats as { postCount?: number }).postCount || 0) + 1 },
            updated_at: new Date().toISOString(),
        }).eq("id", kitId);

        return NextResponse.json({ asset: created });
    } catch {
        return NextResponse.json({ error: "Could not generate new content." }, { status: 500 });
    }
}
