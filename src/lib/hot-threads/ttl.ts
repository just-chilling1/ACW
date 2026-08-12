import { PACK_TTL_MS } from "./types";

export function utcPackDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function isStale(refreshedAt: string | Date, now = Date.now()): boolean {
  const ts = typeof refreshedAt === "string" ? new Date(refreshedAt).getTime() : refreshedAt.getTime();
  if (Number.isNaN(ts)) return true;
  return now - ts >= PACK_TTL_MS;
}

export function expiresAtFrom(refreshedAt: string | Date): string {
  const ts = typeof refreshedAt === "string" ? new Date(refreshedAt).getTime() : refreshedAt.getTime();
  return new Date(ts + PACK_TTL_MS).toISOString();
}

export function substituteLink(text: string, affiliateLink: string): string {
  const link = affiliateLink.trim();
  if (!link) {
    return text.replace(/\s*__LINK__/g, "").replace(/\s{2,}/g, " ").trim();
  }
  return text.split("__LINK__").join(link);
}

export function substituteLinksInItems<T extends { replies: string[] }>(
  items: T[],
  affiliateLink: string,
): T[] {
  return items.map((item) => ({
    ...item,
    replies: item.replies.map((r) => substituteLink(r, affiliateLink)),
  }));
}
