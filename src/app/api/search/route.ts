import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { expandKeywords } from "@/lib/llm";

const MAX_KEYWORD_LENGTH = 200;

export async function POST(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;

    try {
        const body = await req.json();
        const keyword = clampString(body.keyword, MAX_KEYWORD_LENGTH);

        if (!keyword) {
            return NextResponse.json({ error: "Niche keyword required" }, { status: 400 });
        }

        let variations: string[] = [];
        const { data: existingVariations } = await supabase
            .from("keyword_variations")
            .select("variations")
            .eq("parent_keyword", keyword)
            .single();

        if (existingVariations) {
            variations = existingVariations.variations;
        } else {
            variations = await expandKeywords(keyword);
            await supabase.from("keyword_variations").insert([
                {
                    parent_keyword: keyword,
                    variations,
                },
            ]);
        }

        await supabase.from("search_history").insert([
            { keyword, user_id: user.id },
        ]);

        return NextResponse.json({ variations });
    } catch {
        return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
    }
}
