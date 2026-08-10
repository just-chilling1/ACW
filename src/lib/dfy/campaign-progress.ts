import type { CampaignAssetRow, CampaignOpportunityRow } from "./types";
import { getOpportunityProgress, isOpportunityDone } from "./opportunity-progress";

export function isAssetDone(asset: CampaignAssetRow): boolean {
    return asset.meta?.done === true;
}

export function getContentPosts(assets: CampaignAssetRow[]): CampaignAssetRow[] {
    return assets.filter(
        (a) =>
            ["post", "comment", "submission_copy"].includes(a.kind) &&
            a.meta?.section !== "calendar" &&
            a.meta?.section !== "weekly_batch",
    );
}

export function getWeeklyPosts(assets: CampaignAssetRow[]): CampaignAssetRow[] {
    return assets.filter((a) => a.meta?.section === "weekly_batch");
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
