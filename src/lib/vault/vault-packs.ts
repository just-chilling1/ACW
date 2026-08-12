import type { OfferSnapshot } from "@/lib/dfy/types";
import type { NicheId } from "@/lib/niches";
import type { PinterestEntry, QuoraEntry, VaultEntry } from "@/lib/vault/types";

export type VaultEntryPack = {
  id: string;
  sourceEntryId: string;
  nicheId: NicheId;
  affiliateLink: string;
  offerSnapshot: OfferSnapshot;
  entry: VaultEntry;
  createdAt: string;
  updatedAt: string;
};

export type VaultEntryPackRow = {
  id: string;
  user_id: string;
  source_entry_id: string;
  niche_id: string;
  affiliate_link: string;
  offer_snapshot: OfferSnapshot;
  entry: VaultEntry;
  created_at: string;
  updated_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

const HTTP_URL_PATTERN = /https?:\/\//i;

function hasHttpUrls(text: string): boolean {
  return HTTP_URL_PATTERN.test(text);
}

/** Metadata fields must not contain placeholders or any http(s) URLs. */
function hasForbiddenLinkContent(text: string): boolean {
  return text.includes("__LINK__") || hasHttpUrls(text);
}

/** Body fields must include affiliateLink exactly once and no other URLs. */
function isValidBodyWithAffiliateLink(text: string, affiliateLink: string): boolean {
  if (text.includes("__LINK__")) return false;
  if (countOccurrences(text, affiliateLink) !== 1) return false;
  const remaining = text.replace(affiliateLink, "");
  return !hasHttpUrls(remaining);
}

/** Structural check for a rewritten VaultEntry before persist. */
export function isValidPackEntry(
  value: unknown,
  opts: {
    affiliateLink: string;
    sourceEntryId: string;
    nicheId: NicheId;
    minQuoraWords?: number;
  },
): value is VaultEntry {
  if (!isRecord(value)) return false;
  if (value.id !== opts.sourceEntryId) return false;
  if (value.nicheId !== opts.nicheId) return false;
  if (typeof value.angle !== "string" || !value.angle.trim()) return false;

  if (value.platform === "quora") {
    if (typeof value.question !== "string" || !value.question.trim()) return false;
    if (typeof value.searchQuery !== "string" || !value.searchQuery.trim()) return false;
    if (typeof value.answer !== "string" || !value.answer.trim()) return false;
    if (!Array.isArray(value.topics) || value.topics.length === 0) return false;
    if (!value.topics.every((t) => typeof t === "string" && t.trim())) return false;

    if (hasForbiddenLinkContent(value.question)) return false;
    if (hasForbiddenLinkContent(value.searchQuery)) return false;
    if (!isValidBodyWithAffiliateLink(value.answer, opts.affiliateLink)) return false;

    const minWords = opts.minQuoraWords ?? 120;
    if (wordCount(value.answer) < minWords) return false;
    return true;
  }

  if (value.platform === "pinterest") {
    if (typeof value.pinTitle !== "string" || !value.pinTitle.trim()) return false;
    if (typeof value.pinDescription !== "string" || !value.pinDescription.trim()) return false;
    if (typeof value.boardName !== "string" || !value.boardName.trim()) return false;
    if (typeof value.imageConcept !== "string" || !value.imageConcept.trim()) return false;
    if (!Array.isArray(value.keywords) || value.keywords.length < 4 || value.keywords.length > 8) {
      return false;
    }
    if (!value.keywords.every((k) => typeof k === "string" && k.trim())) return false;

    if (value.pinTitle.length > 100) return false;
    if (value.pinDescription.length > 500) return false;
    if (hasForbiddenLinkContent(value.pinTitle)) return false;
    if (hasForbiddenLinkContent(value.boardName)) return false;
    if (hasForbiddenLinkContent(value.imageConcept)) return false;
    if (!isValidBodyWithAffiliateLink(value.pinDescription, opts.affiliateLink)) return false;
    return true;
  }

  return false;
}

export function mapPackRow(row: VaultEntryPackRow): VaultEntryPack {
  return {
    id: row.id,
    sourceEntryId: row.source_entry_id,
    nicheId: row.niche_id as NicheId,
    affiliateLink: row.affiliate_link,
    offerSnapshot: row.offer_snapshot,
    entry: row.entry,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type { QuoraEntry, PinterestEntry };
