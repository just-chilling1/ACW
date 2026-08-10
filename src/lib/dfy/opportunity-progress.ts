import type { CampaignOpportunityRow } from "./types";

export function isOpportunityDone(opp: CampaignOpportunityRow): boolean {
    return opp.meta?.done === true;
}

export function getOpportunityProgress(opportunities: CampaignOpportunityRow[]): {
    done: number;
    total: number;
    percent: number;
} {
    const total = opportunities.length;
    const done = opportunities.filter(isOpportunityDone).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
}
