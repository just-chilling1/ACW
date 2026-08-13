import type { OfferSnapshot } from "@/lib/dfy/types";
import type { NicheId } from "@/lib/niches";
import type { VaultPlatform } from "@/lib/vault/types";

export type VaultKitStatus = "draft" | "building" | "ready" | "failed";
export type VaultAssetStatus = "ready" | "used" | "saved";

export type VaultKitStage =
  | "understand_offer"
  | "lock_niche"
  | "write_quora"
  | "write_pinterest"
  | "finalize";

export interface VaultKitBuildProgress {
  currentStage?: VaultKitStage;
  completedStages: VaultKitStage[];
  error?: string;
}

export interface VaultKitStats {
  quoraCount: number;
  pinterestCount: number;
}

export interface VaultKitRow {
  id: string;
  user_id: string;
  offer_url: string;
  offer_snapshot: OfferSnapshot;
  niche_id: NicheId | string;
  name: string;
  status: VaultKitStatus;
  build_progress: VaultKitBuildProgress;
  stats: VaultKitStats;
  created_at: string;
  updated_at: string;
}

export interface VaultAssetRow {
  id: string;
  kit_id: string;
  type: "post";
  platform: VaultPlatform;
  title: string;
  content: string;
  angle: string;
  why: string;
  status: VaultAssetStatus;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const VAULT_KIT_STAGES: { key: VaultKitStage; label: string }[] = [
  { key: "understand_offer", label: "Understanding your offer" },
  { key: "lock_niche", label: "Locking your niche" },
  { key: "write_quora", label: "Writing Quora answers" },
  { key: "write_pinterest", label: "Writing Pinterest pins" },
  { key: "finalize", label: "Finalizing your vault kit" },
];

export const EMPTY_VAULT_STATS: VaultKitStats = {
  quoraCount: 0,
  pinterestCount: 0,
};
