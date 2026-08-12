import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { analyzeOffer } from "@/lib/dfy/offer-analyze";
import type { AudienceMode } from "@/lib/dfy/types";
import { buildManualOfferSnapshot } from "@/lib/instant/fallbacks";

export async function POST(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    try {
        const body = await req.json();
        const url = clampString(body.url, 500);
        const manualDescription = clampString(body.manualDescription, 2000);
        // Prefer auto so audience/angle come from the affiliate page, not a pre-selected niche.
        const audienceMode = (clampString(body.audienceMode, 30) || "auto") as AudienceMode;

        if (!url && !manualDescription) {
            return NextResponse.json(
                { error: "Paste your offer link or tell us what you're promoting." },
                { status: 400 },
            );
        }

        if (manualDescription && !url) {
            const snapshot = buildManualOfferSnapshot(manualDescription, body.niche);
            return NextResponse.json({ snapshot, source: "manual" });
        }

        try {
            const snapshot = await analyzeOffer(url, audienceMode);
            return NextResponse.json({ snapshot, source: "url", url });
        } catch {
            if (manualDescription) {
                const snapshot = buildManualOfferSnapshot(manualDescription, body.niche);
                return NextResponse.json({ snapshot, source: "manual" });
            }
            return NextResponse.json(
                { error: "We couldn't analyze that link. Tell us what you're promoting instead.", needsManual: true },
                { status: 422 },
            );
        }
    } catch {
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}
