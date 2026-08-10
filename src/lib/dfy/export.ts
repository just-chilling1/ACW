import type { CampaignAssetRow, CampaignOpportunityRow, CampaignRow } from "./types";

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
