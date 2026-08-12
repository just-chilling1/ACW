import type { CampaignAssetRow, CampaignOpportunityRow } from "./types";
import { getOpportunityProgress, isOpportunityDone } from "./opportunity-progress";

export function isAssetDone(asset: CampaignAssetRow): boolean {
    return asset.meta?.done === true;
}

/** Normalize copy for duplicate detection (ignore links, punctuation, casing). */
export function normalizeAssetContent(text: string): string {
    return text
        .toLowerCase()
        .replace(/https?:\/\/\S+/gi, " ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function assetContentFingerprint(text: string): string {
    return normalizeAssetContent(text).slice(0, 240);
}

export function isNearDuplicateContent(a: string, b: string): boolean {
    const na = normalizeAssetContent(a);
    const nb = normalizeAssetContent(b);
    if (!na || !nb) return false;
    if (na === nb) return true;

    const fa = assetContentFingerprint(a);
    const fb = assetContentFingerprint(b);
    if (fa && fb && fa === fb) return true;

    // Assembled week posts (hook+body+cta) often contain a shorter step-2 body.
    const shorter = na.length <= nb.length ? na : nb;
    const longer = na.length <= nb.length ? nb : na;
    if (shorter.length >= 48 && longer.includes(shorter)) return true;

    return false;
}

export function fullWeeklyPostText(asset: CampaignAssetRow): string {
    return [
        asset.meta?.hook ? String(asset.meta.hook) : "",
        asset.content,
        asset.meta?.cta ? String(asset.meta.cta) : "",
    ]
        .filter(Boolean)
        .join("\n\n");
}

/** Keep first occurrence of each unique asset (by id, then by near-duplicate content). */
export function dedupeAssetsByContent(
    assets: CampaignAssetRow[],
    getText: (asset: CampaignAssetRow) => string = (a) => a.content,
): CampaignAssetRow[] {
    const seenIds = new Set<string>();
    const kept: CampaignAssetRow[] = [];

    for (const asset of assets) {
        if (seenIds.has(asset.id)) continue;
        const text = getText(asset);
        const duplicate = kept.some((existing) => isNearDuplicateContent(getText(existing), text));
        if (duplicate) continue;
        seenIds.add(asset.id);
        kept.push(asset);
    }

    return kept;
}

export function getContentPosts(assets: CampaignAssetRow[]): CampaignAssetRow[] {
    const posts = assets.filter(
        (a) =>
            ["post", "comment", "submission_copy"].includes(a.kind) &&
            a.meta?.section !== "calendar" &&
            a.meta?.section !== "weekly_batch",
    );
    return dedupeAssetsByContent(posts);
}

export function getWeeklyPosts(assets: CampaignAssetRow[]): CampaignAssetRow[] {
    const contentPosts = getContentPosts(assets);
    const weekly = assets.filter((a) => a.meta?.section === "weekly_batch");

    // Dedupe within the week, then drop anything that repeats a Step 2 post.
    return dedupeAssetsByContent(weekly, fullWeeklyPostText).filter((weekAsset) => {
        const weekText = fullWeeklyPostText(weekAsset);
        return !contentPosts.some(
            (post) =>
                isNearDuplicateContent(post.content, weekText) ||
                isNearDuplicateContent(post.content, weekAsset.content),
        );
    });
}

export function getCampaignProgress(
    opportunities: CampaignOpportunityRow[],
    assets: CampaignAssetRow[],
): {
    done: number;
    total: number;
    percent: number;
    replies: { done: number; total: number };
    posts: { done: number; total: number };
    week: { done: number; total: number };
} {
    const posts = getContentPosts(assets);
    const weekly = getWeeklyPosts(assets);

    const repliesDone = opportunities.filter(isOpportunityDone).length;
    const postsDone = posts.filter(isAssetDone).length;
    const weekDone = weekly.filter(isAssetDone).length;

    const total = opportunities.length + posts.length + weekly.length;
    const done = repliesDone + postsDone + weekDone;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
        done,
        total,
        percent,
        replies: { done: repliesDone, total: opportunities.length },
        posts: { done: postsDone, total: posts.length },
        week: { done: weekDone, total: weekly.length },
    };
}

export { getOpportunityProgress, isOpportunityDone };
