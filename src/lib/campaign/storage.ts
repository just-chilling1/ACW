import type { Campaign } from "./types";

const STORAGE_PREFIX = "cashtap_campaigns";

function storageKey(userId?: string | null): string {
  return userId ? `${STORAGE_PREFIX}_${userId}` : STORAGE_PREFIX;
}

export function readCampaigns(userId?: string | null): Campaign[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Campaign[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCampaigns(campaigns: Campaign[], userId?: string | null): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(campaigns));
}

export function saveCampaign(campaign: Campaign, userId?: string | null): Campaign[] {
  const existing = readCampaigns(userId);
  const idx = existing.findIndex((c) => c.id === campaign.id);
  const next =
    idx >= 0
      ? existing.map((c, i) => (i === idx ? campaign : c))
      : [campaign, ...existing];
  writeCampaigns(next, userId);
  return next;
}

export function getCampaign(id: string, userId?: string | null): Campaign | null {
  return readCampaigns(userId).find((c) => c.id === id) ?? null;
}

export function deleteCampaign(id: string, userId?: string | null): Campaign[] {
  const next = readCampaigns(userId).filter((c) => c.id !== id);
  writeCampaigns(next, userId);
  return next;
}

export function createCampaignId(): string {
  return `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
