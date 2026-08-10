import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";

export async function GET() {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { data, error } = await auth.supabase
        .from("campaigns")
        .select("id, name, offer_url, status, score, stats, created_at, updated_at")
        .order("updated_at", { ascending: false });

    if (error) return NextResponse.json({ error: "Could not load campaigns." }, { status: 500 });
    return NextResponse.json({ campaigns: data || [] });
}

export async function POST(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    try {
        const body = await req.json();
        const offerUrl = clampString(body.offerUrl, 500);
        const name = clampString(body.name, 120);
        const audienceMode = clampString(body.audienceMode, 30) || "auto";
        const channels = Array.isArray(body.channels) ? body.channels.slice(0, 5) : ["everywhere"];
        const offerSnapshot = body.offerSnapshot || {};
        const sourceOfferId = clampString(body.sourceOfferId, 80);

        if (!offerUrl) {
            return NextResponse.json({ error: "Please paste your product or affiliate link." }, { status: 400 });
        }

        const { data, error } = await auth.supabase
            .from("campaigns")
            .insert({
                user_id: auth.user.id,
                name: name || offerSnapshot.productName || "New Campaign",
                offer_url: offerUrl,
                offer_snapshot: offerSnapshot,
                audience_mode: audienceMode,
                channels,
                status: "draft",
                build_progress: { completedStages: [] },
            })
            .select("*")
            .single();

        if (error) return NextResponse.json({ error: "Could not create campaign." }, { status: 500 });

        if (sourceOfferId && offerSnapshot && Object.keys(offerSnapshot).length > 0) {
            await auth.supabase.from("dfy_offers").upsert({
                id: sourceOfferId,
                user_id: auth.user.id,
                url: offerUrl,
                name: offerSnapshot.productName || name || "Saved Offer",
                snapshot: offerSnapshot,
                updated_at: new Date().toISOString(),
            }, { onConflict: "id" });
        }

        return NextResponse.json({ campaign: data });
    } catch {
        return NextResponse.json({ error: "Could not create campaign." }, { status: 500 });
    }
}
