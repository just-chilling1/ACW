import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { getAllPostsByNiche, getPostsByNiche } from "@/lib/instant/content/catalog";

export async function GET(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "1";
    const nicheParam = searchParams.get("niche") as NicheId | null;

    if (all) {
        return NextResponse.json({ byNiche: getAllPostsByNiche() });
    }

    if (!nicheParam || !APP_NICHES.some((n) => n.id === nicheParam)) {
        return NextResponse.json({ error: "Valid niche is required (or use all=1)." }, { status: 400 });
    }

    return NextResponse.json({ posts: getPostsByNiche(nicheParam) });
}
