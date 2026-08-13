import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeOffer } from "@/lib/dfy/offer-analyze";
import type { OfferSnapshot } from "@/lib/dfy/types";
import { generatePinterestPins, generateQuoraAnswers } from "@/lib/vault/kit-content-engine";
import {
  EMPTY_VAULT_STATS,
  type VaultAssetRow,
  type VaultKitBuildProgress,
  type VaultKitRow,
  type VaultKitStage,
  type VaultKitStats,
} from "@/lib/vault/kit-types";

type AssetInsert = {
  platform: "quora" | "pinterest";
  title: string;
  content: string;
  angle?: string;
  why?: string;
  meta?: Record<string, unknown>;
};

export async function updateVaultKitProgress(
  supabase: SupabaseClient,
  kitId: string,
  progress: VaultKitBuildProgress,
  extra: Record<string, unknown> = {},
) {
  await supabase
    .from("vault_kits")
    .update({ build_progress: progress, updated_at: new Date().toISOString(), ...extra })
    .eq("id", kitId);
}

async function markStagesComplete(
  supabase: SupabaseClient,
  kitId: string,
  completed: VaultKitStage[],
  currentStage?: VaultKitStage,
) {
  const progress: VaultKitBuildProgress = {
    completedStages: completed,
    currentStage,
  };
  await updateVaultKitProgress(supabase, kitId, progress);
  return progress;
}

async function insertAssets(
  supabase: SupabaseClient,
  kitId: string,
  assets: AssetInsert[],
): Promise<VaultAssetRow[]> {
  if (!assets.length) return [];

  const payload = assets.map((asset) => ({
    kit_id: kitId,
    type: "post" as const,
    platform: asset.platform,
    title: asset.title || "",
    content: asset.content,
    angle: asset.angle || "",
    why: asset.why || "",
    meta: asset.meta || {},
  }));

  const { data, error } = await supabase.from("vault_assets").insert(payload).select("*");
  if (error || !data) return [];
  return data as VaultAssetRow[];
}

export async function getVaultKitWithAssets(
  supabase: SupabaseClient,
  kitId: string,
  userId: string,
): Promise<{ kit: VaultKitRow; assets: VaultAssetRow[] } | null> {
  const { data: kit } = await supabase
    .from("vault_kits")
    .select("*")
    .eq("id", kitId)
    .eq("user_id", userId)
    .single();

  if (!kit) return null;

  const { data: assets } = await supabase
    .from("vault_assets")
    .select("*")
    .eq("kit_id", kitId)
    .order("created_at", { ascending: true });

  return {
    kit: kit as VaultKitRow,
    assets: (assets || []) as VaultAssetRow[],
  };
}

/**
 * Staged vault kit build: understand offer → niche → Quora + Pinterest in parallel → finalize.
 */
export async function runVaultKitBuild(supabase: SupabaseClient, kitId: string): Promise<void> {
  await supabase.from("vault_kits").update({
    status: "building",
    updated_at: new Date().toISOString(),
  }).eq("id", kitId);

  const { data: kitRow, error } = await supabase
    .from("vault_kits")
    .select("*")
    .eq("id", kitId)
    .single();

  if (error || !kitRow) throw new Error("Kit not found");

  const kit = kitRow as VaultKitRow;
  const completed: VaultKitStage[] = [];

  try {
    await markStagesComplete(supabase, kitId, completed, "understand_offer");

    let snapshot = kit.offer_snapshot as OfferSnapshot;
    if (!snapshot?.productName || snapshot.productName === "Your Offer") {
      if (kit.offer_url) {
        const analyzed = await analyzeOffer(kit.offer_url, "auto");
        await supabase
          .from("vault_kits")
          .update({
            offer_snapshot: analyzed,
            name: analyzed.productName,
          })
          .eq("id", kitId);
        snapshot = analyzed;
        kit.offer_snapshot = analyzed;
        kit.name = analyzed.productName;
      }
    }
    completed.push("understand_offer");

    await markStagesComplete(supabase, kitId, completed, "lock_niche");
    completed.push("lock_niche");

    await markStagesComplete(supabase, kitId, completed, "write_quora");

    const nicheId = kit.niche_id || "make_money_online";
    const offerUrl = kit.offer_url;

    const [quora, pins] = await Promise.all([
      generateQuoraAnswers(snapshot, offerUrl, nicheId),
      generatePinterestPins(snapshot, offerUrl, nicheId),
    ]);

    await supabase.from("vault_assets").delete().eq("kit_id", kitId);

    await insertAssets(
      supabase,
      kitId,
      quora.map((q) => ({
        platform: "quora" as const,
        title: q.question,
        content: q.answer,
        angle: q.angle,
        why: q.why,
        meta: {
          question: q.question,
          searchQuery: q.searchQuery,
          topics: q.topics,
        },
      })),
    );
    completed.push("write_quora");
    await markStagesComplete(supabase, kitId, completed, "write_pinterest");

    await insertAssets(
      supabase,
      kitId,
      pins.map((p) => ({
        platform: "pinterest" as const,
        title: p.pinTitle,
        content: p.pinDescription,
        angle: p.angle,
        why: p.why,
        meta: {
          pinTitle: p.pinTitle,
          boardName: p.boardName,
          imageConcept: p.imageConcept,
          keywords: p.keywords,
        },
      })),
    );
    completed.push("write_pinterest");
    await markStagesComplete(supabase, kitId, completed, "finalize");

    const stats: VaultKitStats = {
      quoraCount: quora.length,
      pinterestCount: pins.length,
    };

    await supabase
      .from("vault_kits")
      .update({
        stats,
        status: "ready",
        build_progress: { completedStages: [...completed, "finalize"] },
        updated_at: new Date().toISOString(),
      })
      .eq("id", kitId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Build failed";
    await supabase
      .from("vault_kits")
      .update({
        status: "failed",
        build_progress: {
          completedStages: completed,
          error: message,
        },
        stats: kit.stats || EMPTY_VAULT_STATS,
        updated_at: new Date().toISOString(),
      })
      .eq("id", kitId);
    throw err;
  }
}
