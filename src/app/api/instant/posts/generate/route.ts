import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { runCustomFacebookPostGeneration } from "@/lib/instant/post-engine";

export async function POST(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    try {
        const body = await req.json();
        const niche = clampString(body.niche, 64) as NicheId;
        const idealCustomer = clampString(body.idealCustomer ?? body.ideal_customer, 400);
        const problemSolved = clampString(body.problemSolved ?? body.problem_solved, 400);
        const offerUrl = clampString(body.offerUrl ?? body.offer_url, 500);

        if (!APP_NICHES.some((n) => n.id === niche)) {
            return NextResponse.json({ error: "Invalid niche." }, { status: 400 });
        }
        if (!idealCustomer) {
            return NextResponse.json({ error: "Please describe your ideal customer." }, { status: 400 });
        }
        if (!problemSolved) {
            return NextResponse.json(
                { error: "Please describe the problem they need solved." },
                { status: 400 },
            );
        }
        if (!offerUrl) {
            return NextResponse.json({ error: "Offer URL is required." }, { status: 400 });
        }

        const result = await runCustomFacebookPostGeneration({
            niche,
            idealCustomer,
            problemSolved,
            offerUrl,
        });

        return NextResponse.json({ posts: result.posts });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Could not generate posts.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
