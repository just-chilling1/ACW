import type { NicheId } from "@/lib/niches";
import type { VaultEntry } from "@/lib/vault/types";
import type { VaultAssetRow } from "@/lib/vault/kit-types";

export function assetToVaultEntry(asset: VaultAssetRow, nicheId: NicheId | string): VaultEntry {
  const meta = asset.meta || {};
  if (asset.platform === "quora") {
    return {
      id: asset.id,
      platform: "quora",
      nicheId: nicheId as NicheId,
      angle: asset.angle || "problem/solution",
      question: String(meta.question || asset.title || ""),
      searchQuery: String(meta.searchQuery || ""),
      answer: asset.content,
      topics: Array.isArray(meta.topics) ? (meta.topics as string[]) : [],
    };
  }
  return {
    id: asset.id,
    platform: "pinterest",
    nicheId: nicheId as NicheId,
    angle: asset.angle || "educational",
    pinTitle: String(meta.pinTitle || asset.title || ""),
    pinDescription: asset.content,
    boardName: String(meta.boardName || "Ideas"),
    imageConcept: String(meta.imageConcept || ""),
    keywords: Array.isArray(meta.keywords) ? (meta.keywords as string[]) : [],
  };
}
