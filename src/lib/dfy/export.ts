import type { CampaignAssetRow, CampaignOpportunityRow, CampaignRow } from "./types";

const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function weekdayRank(value: unknown): number {
    const day = String(value || "");
    const idx = WEEKDAY_ORDER.indexOf(day);
    return idx === -1 ? 99 : idx;
}

function weeklyPostBody(asset: CampaignAssetRow): string {
    return [
        asset.meta?.hook ? String(asset.meta.hook) : "",
        asset.content,
        asset.meta?.cta ? String(asset.meta.cta) : "",
    ]
        .filter(Boolean)
        .join("\n\n");
}

export function buildWeeklyPlanExport(
    campaign: Pick<CampaignRow, "name" | "offer_url">,
    assets: CampaignAssetRow[],
): string {
    const weekly = assets
        .filter((a) => a.meta?.section === "weekly_batch")
        .sort((a, b) => weekdayRank(a.meta?.weekday) - weekdayRank(b.meta?.weekday));

    const lines: string[] = [
        `# ${campaign.name} — Weekly Plan`,
        "",
        `Offer URL: ${campaign.offer_url}`,
        "",
        "Copy one post per weekday (Mon–Fri). Paste, publish, then mark it done in Cashwave.",
        "",
    ];

    if (weekly.length === 0) {
        lines.push("_No weekly posts yet. Generate Fill My Week first._");
        return lines.join("\n");
    }

    for (const asset of weekly) {
        const day = String(asset.meta?.weekday || "Day");
        const angle = asset.meta?.angle ? String(asset.meta.angle) : "";
        lines.push(`## ${day} post`);
        if (angle) lines.push(`_Angle: ${angle}_`, "");
        lines.push(weeklyPostBody(asset), "", "---", "");
    }

    return lines.join("\n").replace(/\n---\n\n$/, "\n");
}

export function buildMarkdownExport(
    campaign: CampaignRow,
    opportunities: CampaignOpportunityRow[],
    assets: CampaignAssetRow[],
): string {
    const lines: string[] = [
        `# ${campaign.name}`,
        "",
        `Campaign Score: ${campaign.score ?? "—"}/100`,
        `Offer URL: ${campaign.offer_url}`,
        "",
        "## Offer Analysis",
        `- **Product:** ${campaign.offer_snapshot.productName}`,
        `- **Audience:** ${campaign.offer_snapshot.targetAudience}`,
        `- **Strongest angle:** ${campaign.offer_snapshot.strongestAngle}`,
        "",
        "## Strategy",
        campaign.strategy.summary || "",
        "",
        "### Who to target",
        campaign.strategy.whoToTarget || "",
        "",
        "### What to say",
        campaign.strategy.whatToSay || "",
        "",
        "### Where to promote",
        campaign.strategy.whereToPromote || "",
        "",
        "## Top Opportunities",
    ];

    for (const opp of opportunities.slice(0, 10)) {
        lines.push(
            "",
            `### ${opp.title} (${opp.platform}) — ${opp.opportunity_score}/100`,
            opp.context,
            "",
            "**Recommended reply:**",
            opp.recommended_reply,
        );
    }

    lines.push("", "## Hooks");
    for (const hook of assets.filter((a) => a.kind === "hook").slice(0, 20)) {
        lines.push(`- ${hook.content}`);
    }

    lines.push("", "## CTAs");
    for (const cta of assets.filter((a) => a.kind === "cta")) {
        lines.push(`- ${cta.content}`);
    }

    lines.push("", "## 30-Day Calendar");
    for (const day of assets.filter((a) => a.meta?.section === "calendar").slice(0, 30)) {
        lines.push(`- Day ${day.meta?.day}: ${day.content}`);
    }

    if (assets.some((a) => a.meta?.section === "weekly_batch")) {
        const weeklySection = buildWeeklyPlanExport(campaign, assets);
        lines.push("", weeklySection.replace(/^# .+\n\n/, "## Weekly Plan\n\n"));
    }

    return lines.join("\n");
}

export function buildOpportunitiesCsv(opportunities: CampaignOpportunityRow[]): string {
    const header = "Platform,Title,Score,Intent,URL,Recommended Reply";
    const rows = opportunities.map((o) => {
        const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
        return [
            escape(o.platform),
            escape(o.title),
            o.opportunity_score,
            o.intent_score,
            escape(o.url),
            escape(o.recommended_reply),
        ].join(",");
    });
    return [header, ...rows].join("\n");
}
