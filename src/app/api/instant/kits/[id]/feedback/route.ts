import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id: kitId } = await params;

    const { data: kit } = await auth.supabase
        .from("promotion_kits")
        .select("id")
        .eq("id", kitId)
        .eq("user_id", auth.user.id)
        .single();

    if (!kit) return NextResponse.json({ error: "Kit not found." }, { status: 404 });

    try {
        const body = await req.json();
        const result = clampString(body.result, 20) || "not_sure";
        const notes = clampString(body.notes, 1000);
        const assetId = clampString(body.assetId, 80) || null;
        const signals = body.signals || {};

        const { data, error } = await auth.supabase
            .from("promotion_feedback")
            .insert({
                user_id: auth.user.id,
                kit_id: kitId,
                asset_id: assetId,
                result,
                signals,
                notes,
            })
            .select("*")
            .single();

        if (error) return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
        return NextResponse.json({ feedback: data });
    } catch {
        return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
    }
}
