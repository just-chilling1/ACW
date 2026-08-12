import type { SupabaseClient } from "@supabase/supabase-js";
import { getNicheById, type NicheId } from "@/lib/niches";
import { buildHotThreadPack } from "./build-pack";
import type { HotThreadPackResponse, HotThreadPackRow } from "./types";
import { expiresAtFrom, isStale, substituteLinksInItems, utcPackDate } from "./ttl";

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

export async function loadExistingPack(
  supabase: SupabaseClient,
  nicheId: NicheId,
): Promise<HotThreadPackRow | null> {
  const packDate = utcPackDate();
  const { data } = await supabase
    .from("hot_thread_packs")
    .select("id, niche_id, pack_date, items, refreshed_at")
    .eq("niche_id", nicheId)
    .eq("pack_date", packDate)
    .maybeSingle();

  if (!data) {
    // Also accept yesterday's pack if still within 24h TTL
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

  if (isStale(data.refreshed_at)) return null;
  return asPackRow(data);
}

export async function getHotThreadPack(
  supabase: SupabaseClient,
  nicheId: NicheId,
  affiliateLink = "",
  options?: { force?: boolean },
): Promise<HotThreadPackResponse> {
  if (!getNicheById(nicheId)) {
    throw new Error("Invalid niche");
  }

  let pack: HotThreadPackRow | null = null;
  if (!options?.force) {
    pack = await loadExistingPack(supabase, nicheId);
  }
  if (!pack) {
    pack = await buildHotThreadPack(supabase, nicheId);
  }

  const items = substituteLinksInItems(pack.items, affiliateLink);

  return {
    nicheId: String(pack.niche_id),
    packDate: pack.pack_date,
    refreshedAt: pack.refreshed_at,
    expiresAt: expiresAtFrom(pack.refreshed_at),
    items,
  };
}
