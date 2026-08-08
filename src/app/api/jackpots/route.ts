import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { searchSocialData, sanitizePosts } from "@/lib/rapidapi";
import { getFallbackPosts, FALLBACK_POSTS } from "@/lib/fallback-posts";

const MAX_KEYWORD_LENGTH = 200;

export async function POST(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase } = auth;

    let keyword = "";
    try {
        const body = await req.json();
        keyword = clampString(body.keyword, MAX_KEYWORD_LENGTH);

        if (!keyword) return NextResponse.json({ error: "Keyword required" }, { status: 400 });

        console.log(">>> [API/JACKPOTS] Searching for:", keyword);

        const { data: existingAnalysis } = await supabase
            .from("analysis_results")
            .select("data")
            .eq("keyword", keyword)
            .order("created_at", { ascending: false })
            .limit(1);

        if (existingAnalysis?.[0]?.data?.threads?.length > 0) {
            console.log(">>> [API/JACKPOTS] Cache HIT — using stored threads");
            const cleanThreads = sanitizePosts(existingAnalysis![0].data.threads);
            if (cleanThreads.length > 0) {
                return NextResponse.json({ results: cleanThreads });
            }
            console.log(">>> [API/JACKPOTS] Cached threads were all filtered out, fetching live");
        }

        console.log(">>> [API/JACKPOTS] Fetching live data...");
        let results: any[] = [];

        try {
            results = await searchSocialData(keyword);
        } catch (e: any) {
            console.warn(`>>> [API/JACKPOTS] Attempt 1 failed: ${e.message}`);

            const simplified = keyword.split(/\s+/).slice(0, 3).join(" ");
            if (simplified !== keyword) {
                console.log(`>>> [API/JACKPOTS] Retrying with simplified keyword: "${simplified}"`);
                try {
                    results = await searchSocialData(simplified);
                } catch (e2: any) {
                    console.warn(`>>> [API/JACKPOTS] Attempt 2 failed: ${e2.message}`);
                }
            }
        }

        const cleanResults = sanitizePosts(results);
        console.log(`>>> [API/JACKPOTS] Got ${cleanResults.length} clean results`);

        if (cleanResults.length > 0) {
            const { data: existingEntry } = await supabase
                .from("analysis_results")
                .select("id, data")
                .eq("keyword", keyword)
                .order("created_at", { ascending: false })
                .limit(1);

            if (existingEntry?.[0]) {
                await supabase
                    .from("analysis_results")
                    .update({ data: { ...existingEntry[0].data, threads: cleanResults } })
                    .eq("id", existingEntry[0].id);
            } else {
                await supabase
                    .from("analysis_results")
                    .insert([{ keyword, data: { threads: cleanResults } }]);
            }

            return NextResponse.json({ results: cleanResults });
        }

        console.log(">>> [API/JACKPOTS] Live search empty — using fallback posts");
        const fallback = getFallbackPosts(keyword);
        console.log(`>>> [API/JACKPOTS] Fallback returned ${fallback.length} posts`);
        return NextResponse.json({ results: fallback, source: "fallback" });
    } catch (error: any) {
        console.error("Jackpots Error:", error);
        const fallback = keyword
            ? getFallbackPosts(keyword)
            : FALLBACK_POSTS["how to make money with ai tools reddit"];
        if (fallback.length > 0) {
            return NextResponse.json({ results: fallback, source: "fallback" });
        }
        return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
    }
}
