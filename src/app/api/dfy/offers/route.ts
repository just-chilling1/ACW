import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";

export async function GET() {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { data, error } = await auth.supabase
        .from("dfy_offers")
        .select("*")
        .order("updated_at", { ascending: false });

    if (error) return NextResponse.json({ error: "Could not load saved offers." }, { status: 500 });
    return NextResponse.json({ offers: data || [] });
}

export async function POST(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    try {
        const body = await req.json();
        const url = clampString(body.url, 500);
        const name = clampString(body.name, 120) || "Saved Offer";
        const snapshot = body.snapshot || {};

        if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

        const { data, error } = await auth.supabase
            .from("dfy_offers")
            .insert({ user_id: auth.user.id, url, name, snapshot })
            .select("*")
            .single();

        if (error) return NextResponse.json({ error: "Could not save offer." }, { status: 500 });
        return NextResponse.json({ offer: data });
    } catch {
        return NextResponse.json({ error: "Could not save offer." }, { status: 500 });
    }
}
