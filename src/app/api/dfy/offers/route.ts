import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { dedupeOffersByUrl, normalizeOfferUrlKey } from "@/lib/dfy/offer-url";
import { isSafeHttpUrl } from "@/lib/safe-url";

export async function GET() {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { data, error } = await auth.supabase
        .from("dfy_offers")
        .select("*")
        .order("updated_at", { ascending: false });

    if (error) return NextResponse.json({ error: "Could not load saved offers." }, { status: 500 });
    return NextResponse.json({ offers: dedupeOffersByUrl(data || []) });
}

export async function POST(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    try {
        const body = await req.json();
        const url = clampString(body.url, 500);
        const name = clampString(body.name, 120) || "Saved Offer";
        const snapshot = body.snapshot && typeof body.snapshot === "object" ? body.snapshot : {};

        if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });
        if (!isSafeHttpUrl(url)) {
            return NextResponse.json({ error: "Enter a valid http(s) URL." }, { status: 400 });
        }

        const { data: existingRows } = await auth.supabase
            .from("dfy_offers")
            .select("id, url")
            .eq("user_id", auth.user.id);

        const key = normalizeOfferUrlKey(url);
        const existing = (existingRows || []).find((row) => normalizeOfferUrlKey(row.url) === key);

        if (existing) {
            const { data: current } = await auth.supabase
                .from("dfy_offers")
                .select("snapshot")
                .eq("id", existing.id)
                .maybeSingle();

            const prevSnapshot =
                current?.snapshot && typeof current.snapshot === "object" && !Array.isArray(current.snapshot)
                    ? (current.snapshot as Record<string, unknown>)
                    : {};

            const nextSnapshot = {
                ...prevSnapshot,
                ...(snapshot as Record<string, unknown>),
            };

            const { data, error } = await auth.supabase
                .from("dfy_offers")
                .update({
                    url,
                    name,
                    snapshot: nextSnapshot,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existing.id)
                .select("*")
                .single();
            if (error) return NextResponse.json({ error: "Could not save offer." }, { status: 500 });
            return NextResponse.json({ offer: data });
        }

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

export async function PATCH(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    try {
        const body = await req.json();
        const id = clampString(body.id, 64);
        const url = clampString(body.url, 500);
        const name = clampString(body.name, 120) || "Saved Offer";
        const tag = clampString(body.tag, 60);
        const description = clampString(body.description, 400);

        if (!id) return NextResponse.json({ error: "Link id required." }, { status: 400 });
        if (!url) return NextResponse.json({ error: "URL required." }, { status: 400 });
        if (!isSafeHttpUrl(url)) {
            return NextResponse.json({ error: "Enter a valid http(s) URL." }, { status: 400 });
        }

        const { data: current, error: currentError } = await auth.supabase
            .from("dfy_offers")
            .select("id, snapshot")
            .eq("id", id)
            .eq("user_id", auth.user.id)
            .maybeSingle();

        if (currentError || !current) {
            return NextResponse.json({ error: "Link not found." }, { status: 404 });
        }

        const prevSnapshot =
            current.snapshot && typeof current.snapshot === "object" && !Array.isArray(current.snapshot)
                ? (current.snapshot as Record<string, unknown>)
                : {};

        const snapshot = {
            ...prevSnapshot,
            ...(tag ? { tag } : { tag: undefined }),
            ...(description ? { description } : { description: undefined }),
        };

        if (!tag) delete snapshot.tag;
        if (!description) delete snapshot.description;

        const { data, error } = await auth.supabase
            .from("dfy_offers")
            .update({
                url,
                name,
                snapshot,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("user_id", auth.user.id)
            .select("*")
            .single();

        if (error) return NextResponse.json({ error: "Could not update link." }, { status: 500 });
        return NextResponse.json({ offer: data });
    } catch {
        return NextResponse.json({ error: "Could not update link." }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    try {
        const body = await req.json().catch(() => ({}));
        const id = clampString(body.id, 64);
        if (!id) return NextResponse.json({ error: "Link id required." }, { status: 400 });

        const { error } = await auth.supabase
            .from("dfy_offers")
            .delete()
            .eq("id", id)
            .eq("user_id", auth.user.id);

        if (error) return NextResponse.json({ error: "Could not delete link." }, { status: 500 });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Could not delete link." }, { status: 500 });
    }
}
