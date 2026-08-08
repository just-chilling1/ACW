import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { findOpportunities } from "@/lib/campaign/find-opportunities";
import type { OfferAnalysis } from "@/lib/campaign/types";

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const body = await req.json();
    const analysis = body.analysis as OfferAnalysis;

    if (!analysis?.productName || !analysis?.searchKeywords?.length) {
      return NextResponse.json({ error: "Analysis required" }, { status: 400 });
    }

    const opportunities = await findOpportunities(analysis);

    if (opportunities.length === 0) {
      return NextResponse.json({
        error: "no_opportunities",
        message: "We couldn't find strong opportunities yet.",
        opportunities: [],
      });
    }

    return NextResponse.json({ opportunities });
  } catch {
    return NextResponse.json(
      { error: "discovery_failed", message: "We couldn't find opportunities right now." },
      { status: 500 }
    );
  }
}
