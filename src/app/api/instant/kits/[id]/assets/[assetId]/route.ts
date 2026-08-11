import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";

type RouteParams = { params: Promise<{ id: string; assetId: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id: kitId, assetId } = await params;

    const { data: kit } = await auth.supabase
        .from("promotion_kits")
        .select("id")
        .eq("id", kitId)
        .eq("user_id", auth.user.id)
        .single();

    if (!kit) return NextResponse.json({ error: "Kit not found." }, { status: 404 });

    try {
        const body = await req.json();
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (body.status) updates.status = clampString(body.status, 20);
        if (body.content) updates.content = clampString(body.content, 10000);
        if (typeof body.include_link === "boolean") updates.include_link = body.include_link;

        const { data, error } = await auth.supabase
            .from("promotion_assets")
            .update(updates)
            .eq("id", assetId)
            .eq("kit_id", kitId)
            .select("*")
            .single();

        if (error) return NextResponse.json({ error: "Could not update asset." }, { status: 500 });
        return NextResponse.json({ asset: data });
    } catch {
        return NextResponse.json({ error: "Could not update asset." }, { status: 500 });
    }
}
