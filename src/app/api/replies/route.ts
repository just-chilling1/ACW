import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { generateReplies } from "@/lib/llm";
import { sanitizeExternalUrl } from "@/lib/safe-url";

const MAX_ADS = 25;
const MAX_AFFILIATE_LINK_LENGTH = 2048;

export async function POST(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    let ads: unknown[] = [];
    let affiliateLink = "";

    try {
        const body = await req.json();
        const rawAds = body.ads || body.posts || [];
        ads = Array.isArray(rawAds) ? rawAds.slice(0, MAX_ADS) : [];
        affiliateLink = sanitizeExternalUrl(clampString(body.affiliateLink, MAX_AFFILIATE_LINK_LENGTH));

        if (ads.length === 0) {
            return NextResponse.json({ error: "Ads required" }, { status: 400 });
        }

        const results = await generateReplies(ads, affiliateLink);
        return NextResponse.json({ results });
    } catch {
        const mockResults = (ads as Array<Record<string, unknown>>).map((ad) => {
            const topic = String(ad.title || ad.text || "this").substring(0, 60);
            const link = affiliateLink || "";
            return {
                id: ad.id,
                text: ad.text,
                replies: [
                    `This is exactly what I was looking for! I've been researching "${topic}" and honestly, the best thing I found was this: ${link} — it literally changed my results within the first week.`,
                    `I was in the same situation a few months ago. Tried a bunch of different options and wasted way too much time. What finally worked for me was a method I found here: ${link} — it breaks everything down step by step and it actually delivers. Highly recommend giving it a shot before spending money on stuff that doesn't work.`,
                    `Has anyone else tried ${link}? I keep seeing people get results with it and I'm curious if it actually lives up to the hype. Thinking about giving it a go this week.`,
                ],
            };
        });

        return NextResponse.json({ results: mockResults });
    }
}
