import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { sanitizeExternalUrl } from "@/lib/safe-url";
import { generatePromotionPack } from "@/lib/llm";
import { runTrustCheck, getPrimaryReply } from "@/lib/campaign/trust-check";
import type {
  CampaignStrategy,
  OfferAnalysis,
  Opportunity,
} from "@/lib/campaign/types";

const MAX_LINK_LENGTH = 2048;

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const body = await req.json();
    const analysis = body.analysis as OfferAnalysis;
    const opportunity = body.opportunity as Opportunity;
    const strategy = body.strategy as CampaignStrategy;
    const affiliateLink = sanitizeExternalUrl(
      clampString(body.affiliateLink, MAX_LINK_LENGTH)
    );

    if (!analysis || !opportunity?.post || !strategy) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const offerSummary = [
      analysis.productName,
      analysis.mainBenefit,
      analysis.positioning,
    ].join(". ");

    const conversationSummary = `${opportunity.post.title ?? ""} — ${opportunity.post.text}`.slice(
      0,
      600
    );

    const promotionPack = await generatePromotionPack(
      offerSummary,
      conversationSummary,
      strategy,
      affiliateLink
    );

    const trustCheck = runTrustCheck(
      getPrimaryReply(promotionPack),
      opportunity.post,
      affiliateLink
    );

    return NextResponse.json({ promotionPack, trustCheck });
  } catch {
    return NextResponse.json({ error: "Promotion pack generation failed" }, { status: 500 });
  }
}
