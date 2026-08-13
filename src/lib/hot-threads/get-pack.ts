import type { SupabaseClient } from "@supabase/supabase-js";
import { getNicheById, type NicheId } from "@/lib/niches";
import { buildQuickHotThreadPack, enrichHotThreadPack } from "./build-pack";
import {
  DISPLAY_LINK_LABEL,
  isQuickPack,
  type HotThreadPackResponse,
  type HotThreadPackRow,
} from "./types";
import { expiresAtFrom, isStale, substituteLinksInItems } from "./ttl";

function asPackRow(row: {
  id: string;
  niche_id: string;
  pack_date: string;
  items: unknown;
  refreshed_at: string;
}): HotThreadPackRow {
  return {
    id: row.id,
    niche_id: row.niche_id,
    pack_date: row.pack_date,
    items: Array.isArray(row.items) ? row.items : [],
    refreshed_at: row.refreshed_at,
  };
}

function toResponse(pack: HotThreadPackRow, _affiliateLink?: string, upgrading?: boolean): HotThreadPackResponse {
  return {
    nicheId: String(pack.niche_id),
    packDate: pack.pack_date,
    refreshedAt: pack.refreshed_at,
    expiresAt: expiresAtFrom(pack.refreshed_at),
    // Always surface a manual paste cue — users add their URL when posting.
    items: substituteLinksInItems(pack.items, DISPLAY_LINK_LABEL),
    ...(upgrading ? { upgrading: true } : {}),
  };
}

export async function loadExistingPack(
  supabase: SupabaseClient,
  nicheId: NicheId,
): Promise<HotThreadPackRow | null> {
  const { data: latest } = await supabase
    .from("hot_thread_packs")
    .select("id, niche_id, pack_date, items, refreshed_at")
    .eq("niche_id", nicheId)
    .order("refreshed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest || isStale(latest.refreshed_at)) return null;
  return asPackRow(latest);
}

export type GetPackResult = {
  response: HotThreadPackResponse;
  /** Caller should schedule enrichHotThreadPack when true. */
  shouldEnrich: boolean;
};

export async function getHotThreadPack(
  supabase: SupabaseClient,
  nicheId: NicheId,
  affiliateLink = "",
  options?: { force?: boolean },
): Promise<GetPackResult> {
  if (!getNicheById(nicheId)) {
    throw new Error("Invalid niche");
  }

  if (options?.force) {
    const pack = await enrichHotThreadPack(supabase, nicheId);
    if (pack) return { response: toResponse(pack, affiliateLink), shouldEnrich: false };
    const quick = await buildQuickHotThreadPack(supabase, nicheId);
    return { response: toResponse(quick, affiliateLink, true), shouldEnrich: true };
  }

  const existing = await loadExistingPack(supabase, nicheId);
  if (existing) {
    const needsEnrich = isQuickPack(existing.items);
    return {
      response: toResponse(existing, affiliateLink, needsEnrich),
      shouldEnrich: needsEnrich,
    };
  }

  // Cold start: return instantly from cache/fallbacks, enrich after response
  const quick = await buildQuickHotThreadPack(supabase, nicheId);
  return { response: toResponse(quick, affiliateLink, true), shouldEnrich: true };
}

export { enrichHotThreadPack };
