import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { fetchSeededReplies } from "@/lib/dfy/seed-posts";

export async function GET(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { searchParams } = new URL(req.url);
    const niche = clampString(searchParams.get("niche"), 64) as NicheId;
    const limitRaw = Number(searchParams.get("limit") || 60);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 60) : 60;

    if (!APP_NICHES.some((n) => n.id === niche)) {
        return NextResponse.json({ error: "Invalid niche." }, { status: 400 });
    }

    const replies = await fetchSeededReplies(auth.supabase, niche, limit);
    return NextResponse.json({
        niche,
        count: replies.length,
        replies,
        emptyHint:
            replies.length === 0
                ? "No seeded replies for this niche yet. Seed dfy_seed_replies (not only posts), and ensure SUPABASE_SERVICE_ROLE_KEY matches NEXT_PUBLIC_SUPABASE_URL."
                : undefined,
    });
}
