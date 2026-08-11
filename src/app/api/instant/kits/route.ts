import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";

export async function GET() {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { data, error } = await auth.supabase
        .from("promotion_kits")
        .select("id, name, offer_url, status, stats, recommendations, created_at, updated_at")
        .order("updated_at", { ascending: false });

    if (error) return NextResponse.json({ error: "Could not load kits." }, { status: 500 });
    return NextResponse.json({ kits: data || [] });
}

export async function POST(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    try {
        const body = await req.json();
        const offerUrl = clampString(body.offerUrl, 500);
        const name = clampString(body.name, 120);
        const offerSnapshot = body.offerSnapshot || {};

        if (!offerUrl && !offerSnapshot?.productName) {
            return NextResponse.json({ error: "Please provide your offer details." }, { status: 400 });
        }

        const { data, error } = await auth.supabase
            .from("promotion_kits")
            .insert({
                user_id: auth.user.id,
                name: name || offerSnapshot.productName || "New Promotion Kit",
                offer_url: offerUrl,
                offer_snapshot: offerSnapshot,
                status: "draft",
                build_progress: { completedStages: [] },
            })
            .select("*")
            .single();

        if (error) return NextResponse.json({ error: "Could not create kit." }, { status: 500 });

        if (offerUrl && offerSnapshot && Object.keys(offerSnapshot).length > 0) {
            try {
                await auth.supabase.from("dfy_offers").insert({
                    user_id: auth.user.id,
                    url: offerUrl,
                    name: offerSnapshot.productName || name || "Saved Offer",
                    snapshot: offerSnapshot,
                });
            } catch {
                /* offer may already exist */
            }
        }

        return NextResponse.json({ kit: data });
    } catch {
        return NextResponse.json({ error: "Could not create kit." }, { status: 500 });
    }
}
