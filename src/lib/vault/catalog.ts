import { APP_NICHES, type NicheId } from "@/lib/niches";
import { substituteLink } from "@/lib/hot-threads/ttl";
import { VAULT_ENTRIES } from "@/lib/vault/content";
import type { VaultEntry, VaultPlatform } from "@/lib/vault/types";

const ENTRY_BY_ID = new Map(VAULT_ENTRIES.map((entry) => [entry.id, entry]));

export function getVaultEntryById(id: string): VaultEntry | undefined {
  return ENTRY_BY_ID.get(id);
}

export function isVaultEntryId(id: string): boolean {
  return ENTRY_BY_ID.has(id);
}

export function getVaultEntriesForNiche(
  nicheId: NicheId,
  platform?: VaultPlatform | "all",
): VaultEntry[] {
  return VAULT_ENTRIES.filter((entry) => {
    if (entry.nicheId !== nicheId) return false;
    if (!platform || platform === "all") return true;
    return entry.platform === platform;
  });
}

export function applyAffiliateLink(entry: VaultEntry, affiliateLink: string): VaultEntry {
  if (entry.platform === "quora") {
    return { ...entry, answer: substituteLink(entry.answer, affiliateLink) };
  }
  return { ...entry, pinDescription: substituteLink(entry.pinDescription, affiliateLink) };
}

export function isNicheId(value: string): value is NicheId {
  return APP_NICHES.some((n) => n.id === value);
}
