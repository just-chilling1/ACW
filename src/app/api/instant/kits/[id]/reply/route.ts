import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { generateSmartReply } from "@/lib/instant/content-engine";
import type { OfferSnapshot } from "@/lib/dfy/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
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
        const body = await req.json();
        const comment = clampString(body.comment, 2000);
        if (!comment) {
            return NextResponse.json({ error: "Paste the comment first." }, { status: 400 });
        }

        const snapshot = kit.offer_snapshot as OfferSnapshot;
        const result = await generateSmartReply(snapshot, kit.offer_url, comment);
        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: "Could not generate reply." }, { status: 500 });
    }
}
