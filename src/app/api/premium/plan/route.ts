import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { getTodayPlanSources, parseTrafficEstimate } from "@/lib/premium-copy";
import { TRAFFIC_SOURCES } from "@/lib/content/traffic-sources";

export async function GET(request: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get("niche");

    const filtered = niche && niche !== "All"
        ? TRAFFIC_SOURCES.filter((s) => s.niche === niche)
        : TRAFFIC_SOURCES;

    const { data: progress } = await supabase
        .from("autopilot_progress")
        .select("source_id, completed_at, submission_copy")
        .eq("user_id", user.id);

    const completedIds = new Set(
        (progress ?? []).filter((p) => p.completed_at).map((p) => p.source_id)
    );

    const todayIds = getTodayPlanSources(
        filtered.map((s) => s.id),
        completedIds
    );

    const todaySources = todayIds
        .map((id) => filtered.find((s) => s.id === id))
        .filter(Boolean);

    const progressMap = Object.fromEntries(
        (progress ?? []).map((p) => [p.source_id, p])
    );

    const completedCount = completedIds.size;
    const totalTraffic = (progress ?? [])
        .filter((p) => p.completed_at)
        .reduce((sum, p) => {
            const source = TRAFFIC_SOURCES.find((s) => s.id === p.source_id);
            return sum + (source ? parseTrafficEstimate(source.traffic) : 0);
        }, 0);

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.setHours(0, 0, 0, 0)).toISOString();
        const dayEnd = new Date(d.setHours(23, 59, 59, 999)).toISOString();
        const hasCompletion = (progress ?? []).some(
            (p) => p.completed_at && p.completed_at >= dayStart && p.completed_at <= dayEnd
        );
        if (hasCompletion) streak++;
        else if (i > 0) break;
    }

    return NextResponse.json({
        todaySources,
        progressMap,
        stats: {
            completed: completedCount,
            total: filtered.length,
            estimatedTraffic: totalTraffic,
            streak,
        },
    });
}
