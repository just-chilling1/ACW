import type { CampaignData } from "@/lib/premium-types";

export function buildCampaignCopyAll(data: CampaignData): string {
    const lines: string[] = [
        `=== AI CASHWAVE CAMPAIGN: ${data.niche.toUpperCase()} ===`,
        `Link: ${data.affiliateLink}`,
        "",
        "--- KEYWORDS ---",
        ...data.keywords.map((k, i) => `${i + 1}. ${k.label}\n   ${k.description}`),
        "",
        "--- POSTS & REPLIES ---",
    ];

    data.posts.forEach((post, i) => {
        lines.push(`\n[${i + 1}] ${post.platform}: ${post.title || post.text.slice(0, 80)}`);
        lines.push(`URL: ${post.url}`);
        post.replies.forEach((reply, r) => {
            lines.push(`  Reply ${r + 1}: ${reply}`);
        });
    });

    lines.push("", "--- BONUS CONTENT ---");
    lines.push(`Facebook: ${data.extras.facebookPost}`);
    lines.push(`Quora: ${data.extras.quoraAnswer}`);
    lines.push(`Pinterest: ${data.extras.pinterestDescription}`);

    return lines.join("\n");
}

export function getAutopilotPlan(sourceIds: string[]): { day: number; sourceIds: string[] }[] {
    const plan: { day: number; sourceIds: string[] }[] = [];
    let idx = 0;
    for (let day = 1; day <= 30 && idx < sourceIds.length; day++) {
        const batch = sourceIds.slice(idx, idx + 3);
        if (batch.length > 0) {
            plan.push({ day, sourceIds: batch });
            idx += 3;
        }
    }
    return plan;
}

export function getTodayPlanSources(
    sourceIds: string[],
    completedIds: Set<string>
): string[] {
    const plan = getAutopilotPlan(sourceIds);
    const today = new Date();
    const dayOfMonth = today.getDate();
    const planDay = plan.length > 0 ? ((dayOfMonth - 1) % plan.length) + 1 : 1;
    const todayPlan = plan.find((p) => p.day === planDay) ?? plan[0];
    if (!todayPlan) return sourceIds.slice(0, 3);

    const pending = todayPlan.sourceIds.filter((id) => !completedIds.has(id));
    if (pending.length >= 3) return pending.slice(0, 3);
    if (pending.length > 0) return pending;

    const nextPending = sourceIds.filter((id) => !completedIds.has(id));
    return nextPending.slice(0, 3);
}

export function parseTrafficEstimate(traffic: string): number {
    const match = traffic.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 100;
}
