import { searchSocialData, sanitizePosts } from "@/lib/rapidapi";
import { getFallbackPosts } from "@/lib/fallback-posts";
import type { CampaignPost, OfferAnalysis, Opportunity } from "./types";
import {
  opportunityIndicators,
  scoreOpportunity,
} from "./scoring";
import { explainOpportunityPick } from "@/lib/llm";

const FALLBACK_KEY = "how to make money with ai tools reddit";

async function fetchPostsForKeyword(keyword: string): Promise<CampaignPost[]> {
  try {
    const results = await searchSocialData(keyword);
    const clean = sanitizePosts(results);
    if (clean.length > 0) return clean.slice(0, 12) as CampaignPost[];
  } catch {
    // continue
  }

  try {
    const simplified = keyword.split(/\s+/).slice(0, 4).join(" ");
    if (simplified !== keyword) {
      const retry = sanitizePosts(await searchSocialData(simplified));
      if (retry.length > 0) return retry.slice(0, 12) as CampaignPost[];
    }
  } catch {
    // ignore
  }

  return getFallbackPosts(keyword);
}

export async function findOpportunities(
  analysis: OfferAnalysis,
  explainTopN = 5
): Promise<Opportunity[]> {
  const keywords = analysis.searchKeywords?.length
    ? analysis.searchKeywords
    : [FALLBACK_KEY];

  let posts: CampaignPost[] = [];
  for (const kw of keywords) {
    posts = await fetchPostsForKeyword(kw);
    if (posts.length >= 3) break;
  }

  if (posts.length === 0) {
    posts = await fetchPostsForKeyword(FALLBACK_KEY);
  }

  const offerSummary = [
    analysis.productName,
    analysis.mainProblem,
    analysis.targetAudience,
    analysis.mainBenefit,
  ].join(". ");

  const scored: Opportunity[] = posts.map((post) => {
    const score = scoreOpportunity(post, analysis);
    return {
      id: post.id,
      post,
      score,
      indicators: opportunityIndicators(score, post),
      whyPicked: "",
    };
  });

  scored.sort((a, b) => b.score.overall - a.score.overall);

  const top = scored.slice(0, 10);
  if (top.length > 0) top[0].recommended = true;

  await Promise.all(
    top.slice(0, explainTopN).map(async (opp) => {
      opp.whyPicked = await explainOpportunityPick(
        offerSummary,
        opp.post.title ?? "",
        opp.post.text
      );
    })
  );

  for (const opp of top.slice(explainTopN)) {
    if (!opp.whyPicked) {
      opp.whyPicked =
        "This conversation matches your offer's problem space. A helpful reply can feel natural here.";
    }
  }

  return top;
}
