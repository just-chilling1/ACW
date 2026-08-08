import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { sanitizeExternalUrl } from "@/lib/safe-url";
import { fetchOfferPageContext, isValidAffiliateLink } from "@/lib/campaign/offer-fetch";
import { analyzeOfferFromLink } from "@/lib/llm";
import { scoreOfferPotential } from "@/lib/campaign/scoring";
import type { OfferAnalysis } from "@/lib/campaign/types";

const MAX_LINK_LENGTH = 2048;

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const body = await req.json();
    const affiliateLink = sanitizeExternalUrl(
      clampString(body.affiliateLink, MAX_LINK_LENGTH)
    );

    if (!isValidAffiliateLink(affiliateLink)) {
      return NextResponse.json(
        { error: "invalid_link", message: "We couldn't read this offer. Check the link and try again." },
        { status: 400 }
      );
    }

    const pageContext = await fetchOfferPageContext(affiliateLink);
    const raw = await analyzeOfferFromLink(affiliateLink, pageContext);

    const partial: Partial<OfferAnalysis> = {
      ...raw,
      searchKeywords: raw.searchKeywords?.length
        ? raw.searchKeywords
        : [`${raw.category} recommendations reddit`],
    };

    const opportunityScore = scoreOfferPotential(partial);

    const analysis: OfferAnalysis = {
      productName: raw.productName || "Your Offer",
      category: raw.category || "General",
      mainProblem: raw.mainProblem,
      targetAudience: raw.targetAudience,
      mainBenefit: raw.mainBenefit,
      positioning: raw.positioning,
      searchKeywords: partial.searchKeywords ?? [],
      opportunityScore,
    };

    return NextResponse.json({ analysis, pageContextFound: Boolean(pageContext) });
  } catch {
    return NextResponse.json(
      {
        error: "analysis_failed",
        message: "We couldn't analyze this offer right now.",
      },
      { status: 500 }
    );
  }
}
