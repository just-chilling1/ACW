import type { OfferSnapshot } from "@/lib/dfy/types";
import type { TrafficSource } from "./sources";
import type { PromotionKit } from "./types";

function linkify(text: string, url: string): string {
  return text.replace(/\{LINK\}/g, url || "[YOUR_LINK]");
}

export function buildPromotionKit(
  source: TrafficSource,
  offerUrl: string,
  snapshot?: OfferSnapshot,
): PromotionKit {
  const productName = snapshot?.productName || "this resource";
  const promise = snapshot?.mainPromise || "practical results";
  const headline = `${productName} — ${promise}`.slice(0, 120);
  const shortDescription = linkify(source.description, offerUrl);
  const longDescription = [
    linkify(source.description, offerUrl),
    snapshot?.targetAudience ? `Built for ${snapshot.targetAudience.toLowerCase()}.` : "",
    snapshot?.strongestAngle ? snapshot.strongestAngle : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const cta =
    source.type === "Q&A"
      ? `Learn more: ${offerUrl}`
      : source.type === "Social"
        ? `Check it out → ${offerUrl}`
        : `Get the full guide: ${offerUrl}`;

  const nicheWords = source.niche.toLowerCase().split(/\s+/);
  const keywords = [
    ...nicheWords,
    source.type.toLowerCase(),
    productName.toLowerCase().split(/\s+/).slice(0, 3),
  ]
    .flat()
    .filter((k, i, arr) => k.length > 2 && arr.indexOf(k) === i)
    .slice(0, 8);

  const anchorText = `free ${source.niche.toLowerCase()} guide`;

  const copyAll = [
    `Headline: ${headline}`,
    "",
    shortDescription,
    "",
    longDescription,
    "",
    cta,
    "",
    `Keywords: ${keywords.join(", ")}`,
  ].join("\n");

  return {
    headline,
    shortDescription,
    longDescription,
    cta,
    keywords,
    anchorText,
    copyAll,
  };
}

export async function generatePromotionKitWithAi(
  source: TrafficSource,
  offerUrl: string,
  snapshot?: OfferSnapshot,
): Promise<PromotionKit> {
  const fallback = buildPromotionKit(source, offerUrl, snapshot);
  try {
    const { callChatGPT } = await import("@/lib/llm");
    const prompt = `Create promotion copy for this traffic source. Return ONLY JSON:
{
  "headline": string,
  "shortDescription": string (1-2 sentences, include URL ${offerUrl}),
  "longDescription": string (2-3 sentences),
  "cta": string,
  "keywords": string[],
  "anchorText": string
}
Source: ${source.name} (${source.type})
Niche: ${source.niche}
Product: ${snapshot?.productName || "offer"}
Promise: ${snapshot?.mainPromise || ""}
Template: ${source.description.replace("{LINK}", offerUrl)}`;

    const raw = await callChatGPT([{ role: "user", content: prompt }]);
    const { parseJsonFromLlm } = await import("@/lib/dfy/parse-json");
    const parsed = parseJsonFromLlm<Partial<PromotionKit>>(raw, {});
    if (parsed?.headline && parsed?.shortDescription) {
      return {
        headline: parsed.headline,
        shortDescription: parsed.shortDescription,
        longDescription: parsed.longDescription || fallback.longDescription,
        cta: parsed.cta || fallback.cta,
        keywords: parsed.keywords || fallback.keywords,
        anchorText: parsed.anchorText || fallback.anchorText,
        copyAll: [
          `Headline: ${parsed.headline}`,
          "",
          parsed.shortDescription,
          "",
          parsed.longDescription || fallback.longDescription,
          "",
          parsed.cta || fallback.cta,
        ].join("\n"),
      };
    }
  } catch {
    // fall through
  }
  return fallback;
}
