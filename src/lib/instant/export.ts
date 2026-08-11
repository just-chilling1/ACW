import type { PromotionAssetRow, PromotionKitRow } from "./types";

export function buildMarkdownExport(kit: PromotionKitRow, assets: PromotionAssetRow[]): string {
    const lines: string[] = [
        `# ${kit.name} — Promotion Kit`,
        "",
        `Created: ${new Date(kit.created_at).toLocaleDateString()}`,
        "",
        "## Best Promotion",
        "",
    ];

    const bestPost = assets.find((a) => a.id === kit.recommendations?.bestPromotionId) || assets.find((a) => a.type === "post");
    if (bestPost) {
        lines.push(bestPost.content, "", `**Best for:** ${bestPost.platform}`, "");
    }

    const sections: Array<{ type: string; label: string }> = [
        { type: "post", label: "Posts" },
        { type: "hook", label: "Hooks" },
        { type: "reply", label: "Replies" },
        { type: "cta", label: "CTAs" },
        { type: "angle", label: "Promotion Angles" },
    ];

    for (const section of sections) {
        const items = assets.filter((a) => a.type === section.type);
        if (!items.length) continue;
        lines.push(`## ${section.label}`, "");
        items.forEach((item, i) => {
            lines.push(`### ${section.label.slice(0, -1)} ${i + 1}${item.title ? `: ${item.title}` : ""}`, "");
            if (item.platform && item.platform !== "General") lines.push(`**Platform:** ${item.platform}`, "");
            lines.push(item.content, "");
            if (item.why) lines.push(`*Why:* ${item.why}`, "");
            lines.push("");
        });
    }

    const plan = kit.quick_plan || [];
    if (plan.length) {
        lines.push("## Quick-Start Plan", "");
        for (const day of plan) {
            lines.push(`### ${day.label}`, "");
            for (const action of day.actions) {
                lines.push(`- ${action.label}`);
            }
            lines.push("");
        }
    }

    return lines.join("\n");
}

export function buildTxtExport(kit: PromotionKitRow, assets: PromotionAssetRow[]): string {
    return buildMarkdownExport(kit, assets)
        .replace(/^#+\s/gm, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "");
}

export function buildCsvExport(assets: PromotionAssetRow[]): string {
    const header = "Type,Platform,Title,Content,Angle,Status,Best For";
    const rows = assets.map((a) => {
        const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
        return [
            a.type,
            a.platform,
            a.title,
            a.content,
            a.angle,
            a.status,
            a.why,
        ].map(escape).join(",");
    });
    return [header, ...rows].join("\n");
}

export function buildCopyFullKit(kit: PromotionKitRow, assets: PromotionAssetRow[]): string {
    return buildTxtExport(kit, assets);
}
