import type { OfferSnapshot } from "@/lib/dfy/types";
import type { NicheId } from "@/lib/niches";
import type { ShortsBeat, ShortsPlatformTag, ShortsScript } from "@/lib/vault/shorts-types";

export type ShortsScriptPack = {
  id: string;
  sourceScriptId: string;
  nicheId: NicheId;
  affiliateLink: string;
  offerSnapshot: OfferSnapshot;
  script: ShortsScript;
  createdAt: string;
  updatedAt: string;
};

export type ShortsScriptPackRow = {
  id: string;
  user_id: string;
  source_script_id: string;
  niche_id: string;
  affiliate_link: string;
  offer_snapshot: OfferSnapshot;
  script: ShortsScript;
  created_at: string;
  updated_at: string;
};

const PLATFORM_TAGS = new Set<ShortsPlatformTag>(["tiktok", "reels", "shorts"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBeat(value: unknown): value is ShortsBeat {
  if (!isRecord(value)) return false;
  return (
    typeof value.timecode === "string" &&
    typeof value.voiceover === "string" &&
    typeof value.onScreen === "string" &&
    typeof value.visual === "string"
  );
}

/** Structural check for a rewritten ShortsScript before persist. */
export function isValidPackScript(
  value: unknown,
  opts: { affiliateLink: string; sourceScriptId: string; nicheId: NicheId },
): value is ShortsScript {
  if (!isRecord(value)) return false;

  const platforms = value.platforms;
  if (!Array.isArray(platforms) || platforms.length === 0) return false;
  if (!platforms.every((p) => typeof p === "string" && PLATFORM_TAGS.has(p as ShortsPlatformTag))) {
    return false;
  }

  const beats = value.beats;
  if (!Array.isArray(beats) || beats.length < 4 || beats.length > 6) return false;
  if (!beats.every(isBeat)) return false;

  const hashtags = value.hashtags;
  if (!Array.isArray(hashtags) || hashtags.length < 3 || hashtags.length > 8) return false;
  if (!hashtags.every((tag) => typeof tag === "string" && tag.length > 0 && !tag.includes("#"))) {
    return false;
  }

  if (value.id !== opts.sourceScriptId) return false;
  if (value.nicheId !== opts.nicheId) return false;
  if (typeof value.angle !== "string" || !value.angle.trim()) return false;
  if (typeof value.format !== "string" || !value.format.trim()) return false;
  if (typeof value.title !== "string" || !value.title.trim()) return false;
  if (typeof value.durationSeconds !== "number" || value.durationSeconds < 25 || value.durationSeconds > 45) {
    return false;
  }
  if (typeof value.hook !== "string" || !value.hook.trim() || value.hook.length > 140) return false;
  if (typeof value.cta !== "string" || !value.cta.trim()) return false;
  if (typeof value.caption !== "string" || !value.caption.trim() || value.caption.length > 2200) {
    return false;
  }
  if (typeof value.visualStyle !== "string" || !value.visualStyle.trim()) return false;
  if (typeof value.soundNote !== "string" || !value.soundNote.trim()) return false;

  const spoken = [
    value.hook,
    value.cta,
    ...beats.map((b) => `${b.voiceover}\n${b.onScreen}`),
  ].join("\n");
  if (spoken.includes("__LINK__")) return false;
  if (spoken.includes(opts.affiliateLink)) return false;

  if (!value.caption.includes(opts.affiliateLink)) return false;
  if (value.caption.includes("__LINK__")) return false;
  const occurrences = value.caption.split(opts.affiliateLink).length - 1;
  if (occurrences !== 1) return false;

  return true;
}

export function mapPackRow(row: ShortsScriptPackRow): ShortsScriptPack {
  return {
    id: row.id,
    sourceScriptId: row.source_script_id,
    nicheId: row.niche_id as NicheId,
    affiliateLink: row.affiliate_link,
    offerSnapshot: row.offer_snapshot,
    script: row.script,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
