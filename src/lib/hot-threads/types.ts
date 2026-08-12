import type { NicheId } from "@/lib/niches";

export const LINK_PLACEHOLDER = "__LINK__";
export const TARGET_PACK_SIZE = 5;
export const MIN_PACK_SIZE = 4;
export const PACK_TTL_MS = 24 * 60 * 60 * 1000;
/** Marker stored on quick packs so we know to enrich in the background. */
export const QUICK_PACK_MARKER = "__quick__";

export type HotThreadItem = {
  id: string;
  platform: string;
  title?: string;
  text: string;
  url: string;
  engagement: string | number;
  replies: string[];
  /** Present on fast provisional packs awaiting live enrichment. */
  source?: "quick" | "live";
};

export type HotThreadPackRow = {
  id: string;
  niche_id: NicheId | string;
  pack_date: string;
  items: HotThreadItem[];
  refreshed_at: string;
};

export type HotThreadPackResponse = {
  nicheId: string;
  packDate: string;
  refreshedAt: string;
  expiresAt: string;
  items: HotThreadItem[];
  /** True when a background upgrade to live threads/replies is running. */
  upgrading?: boolean;
};

export function isQuickPack(items: HotThreadItem[]): boolean {
  return items.some((item) => item.source === "quick" || item.id.startsWith(QUICK_PACK_MARKER));
}
