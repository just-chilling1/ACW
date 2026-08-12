import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { normalizeOfferUrlKey } from "@/lib/dfy/offer-url";

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
        const productName =
            typeof offerSnapshot.productName === "string" ? offerSnapshot.productName : "";

        if (!offerUrl && !productName) {
            return NextResponse.json({ error: "Please provide your offer details." }, { status: 400 });
        }

        const { data, error } = await auth.supabase
            .from("promotion_kits")
            .insert({
                user_id: auth.user.id,
                name: name || productName || "New Promotion Kit",
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
                const { data: existingRows } = await auth.supabase
                    .from("dfy_offers")
                    .select("id, url")
                    .eq("user_id", auth.user.id);

                const key = normalizeOfferUrlKey(offerUrl);
                const existing = (existingRows || []).find(
                    (row) => normalizeOfferUrlKey(row.url) === key,
                );
                const offerName = productName || name || "Saved Offer";

                if (existing) {
                    await auth.supabase
                        .from("dfy_offers")
                        .update({
                            url: offerUrl,
                            name: offerName,
                            snapshot: offerSnapshot,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", existing.id);
                } else {
                    await auth.supabase.from("dfy_offers").insert({
                        user_id: auth.user.id,
                        url: offerUrl,
                        name: offerName,
                        snapshot: offerSnapshot,
                    });
                }
            } catch {
                /* non-fatal */
            }
        }

        return NextResponse.json({ kit: data });
    } catch {
        return NextResponse.json({ error: "Could not create kit." }, { status: 500 });
    }
}
