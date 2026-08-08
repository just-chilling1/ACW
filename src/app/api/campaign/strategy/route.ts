import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { generateCampaignStrategy } from "@/lib/llm";
import type { OfferAnalysis, Opportunity } from "@/lib/campaign/types";

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const body = await req.json();
    const analysis = body.analysis as OfferAnalysis;
    const opportunity = body.opportunity as Opportunity;

    if (!analysis || !opportunity?.post) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const offerSummary = [
      analysis.productName,
      analysis.mainProblem,
      analysis.positioning,
    ].join(". ");

    const conversationSummary = `${opportunity.post.title ?? ""} — ${opportunity.post.text}`.slice(
      0,
      600
    );

    const strategy = await generateCampaignStrategy(offerSummary, conversationSummary);
    return NextResponse.json({ strategy });
  } catch {
    return NextResponse.json({ error: "Strategy generation failed" }, { status: 500 });
  }
}
