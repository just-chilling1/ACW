/**
 * Thin compatibility layer. Prefer submission-pack.ts for new code.
 */
import type { OfferSnapshot } from "@/lib/dfy/types";
import type { TrafficSource } from "./sources";
import type { PromotionKit, SubmissionPack } from "./types";
import {
  buildSubmissionPack,
  generateSubmissionPackWithAi,
} from "./submission-pack";

export function buildPromotionKit(
  source: TrafficSource,
  offerUrl: string,
  snapshot?: OfferSnapshot,
): PromotionKit {
  const pack = buildSubmissionPack(source, offerUrl, snapshot);
  return packToLegacyKit(pack, offerUrl);
}

export async function generatePromotionKitWithAi(
  source: TrafficSource,
  offerUrl: string,
  snapshot?: OfferSnapshot,
): Promise<PromotionKit> {
  const pack = await generateSubmissionPackWithAi(source, offerUrl, snapshot);
  return packToLegacyKit(pack, offerUrl);
}

function packToLegacyKit(pack: SubmissionPack, offerUrl: string): PromotionKit {
  const byKey = Object.fromEntries(pack.fields.map((f) => [f.key, f.value]));
  const headline =
    byKey.listingTitle ||
    byKey.articleTitle ||
    byKey.adTitle ||
    byKey.threadTitle ||
    byKey.headline ||
    pack.fields[0]?.value ||
    "";
  const shortDescription =
    byKey.shortDescription ||
    byKey.replyText ||
    byKey.postText ||
    byKey.answer ||
    byKey.adBody ||
    byKey.description ||
    pack.fields[1]?.value ||
    "";
  const longDescription =
    byKey.longDescription ||
    byKey.threadBody ||
    byKey.intro ||
    shortDescription;
  const cta = byKey.caption || byKey.linkPlacement || `Learn more: ${offerUrl}`;
  const keywords = (byKey.keywords || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    headline,
    shortDescription,
    longDescription,
    cta,
    keywords,
    anchorText: byKey.profileBio || byKey.signature || headline,
    copyAll: pack.copyAll,
  };
}
