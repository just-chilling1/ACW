import type { NicheId } from "@/lib/niches";
import { substituteLink } from "@/lib/hot-threads/ttl";
import { SHORTS_SCRIPTS } from "@/lib/vault/content/shorts";
import type { ShortsPlatformTag, ShortsScript } from "@/lib/vault/shorts-types";

const SCRIPT_BY_ID = new Map(SHORTS_SCRIPTS.map((script) => [script.id, script]));

export function getShortsScriptById(id: string): ShortsScript | undefined {
  return SCRIPT_BY_ID.get(id);
}

export function isShortsScriptId(id: string): boolean {
  return SCRIPT_BY_ID.has(id);
}

/** Platform matches by containment, since one script can target several platforms. */
export function getShortsForNiche(
  nicheId: NicheId,
  platform?: ShortsPlatformTag | "all",
): ShortsScript[] {
  return SHORTS_SCRIPTS.filter((script) => {
    if (script.nicheId !== nicheId) return false;
    if (!platform || platform === "all") return true;
    return script.platforms.includes(platform);
  });
}

/** The link lives only in the caption; spoken lines never carry a URL. */
export function applyAffiliateLinkToScript(
  script: ShortsScript,
  affiliateLink: string,
): ShortsScript {
  return { ...script, caption: substituteLink(script.caption, affiliateLink) };
}
