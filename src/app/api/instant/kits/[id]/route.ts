import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { getKitWithAssets } from "@/lib/instant/kit-engine";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;
    const result = await getKitWithAssets(auth.supabase, id, auth.user.id);
    if (!result) return NextResponse.json({ error: "Kit not found." }, { status: 404 });

    return NextResponse.json(result);
}

export async function PATCH(req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;

    const { data: existing } = await auth.supabase
        .from("promotion_kits")
        .select("id")
        .eq("id", id)
        .eq("user_id", auth.user.id)
        .single();

    if (!existing) return NextResponse.json({ error: "Kit not found." }, { status: 404 });

    try {
        const body = await req.json();
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (body.name) updates.name = clampString(body.name, 120);
        if (body.offerSnapshot) updates.offer_snapshot = body.offerSnapshot;
        if (body.checklist) updates.checklist = body.checklist;

        const { data, error } = await auth.supabase
            .from("promotion_kits")
            .update(updates)
            .eq("id", id)
            .select("*")
            .single();

        if (error) return NextResponse.json({ error: "Could not update kit." }, { status: 500 });
        return NextResponse.json({ kit: data });
    } catch {
        return NextResponse.json({ error: "Could not update kit." }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;

    const { error } = await auth.supabase
        .from("promotion_kits")
        .delete()
        .eq("id", id)
        .eq("user_id", auth.user.id);

    if (error) return NextResponse.json({ error: "Could not delete kit." }, { status: 500 });
    return NextResponse.json({ ok: true });
}
