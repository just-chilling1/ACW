import { NextResponse } from "next/server";
import { evaluateSpecialistEligibility } from "@/lib/specialist-popup-eligibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveCountry(request: Request): string | null {
    const headerCountry = request.headers.get("x-vercel-ip-country");
    if (headerCountry) return headerCountry;

    // Local/dev only: allow ?debugCountry=US to exercise the gate safely.
    if (process.env.NODE_ENV === "development") {
        const url = new URL(request.url);
        const debug = url.searchParams.get("debugCountry");
        if (debug) return debug;
    }

    return null;
}

export async function GET(request: Request) {
    const country = resolveCountry(request);
    const result = evaluateSpecialistEligibility(country, new Date());

    return NextResponse.json(result, {
        headers: {
            "Cache-Control": "no-store, max-age=0",
        },
    });
}
