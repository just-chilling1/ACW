import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import type { TodayTask } from "@/lib/premium-types";

export async function GET() {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;

    const { data: profile } = await supabase
        .from("member_profile")
        .select("setup_completed_at")
        .eq("user_id", user.id)
        .maybeSingle();

    const tasks: TodayTask[] = [];

    if (!profile?.setup_completed_at) {
        tasks.push({
            id: "setup-profile",
            tool: "profile",
            title: "Set up your profile",
            description: "Add your affiliate link and pick your style — takes 30 seconds.",
            actionLabel: "Set Up Now",
            href: "/dfy",
        });
    }

    const { data: savedPosts } = await supabase
        .from("saved_content")
        .select("id, title, tool")
        .eq("user_id", user.id)
        .eq("status", "saved")
        .eq("tool", "instant")
        .order("created_at", { ascending: false })
        .limit(2);

    savedPosts?.forEach((post, i) => {
        tasks.push({
            id: `instant-${post.id}`,
            tool: "instant",
            title: `Post your content #${i + 1}`,
            description: post.title,
            actionLabel: "Go to Instant Income",
            href: "/instant",
        });
    });

    const { data: progress } = await supabase
        .from("autopilot_progress")
        .select("source_id, completed_at")
        .eq("user_id", user.id)
        .is("completed_at", null)
        .limit(3);

    if ((progress?.length ?? 0) > 0) {
        tasks.push({
            id: "autopilot-today",
            tool: "autopilot",
            title: "Submit to today's traffic sources",
            description: `${progress?.length ?? 0} source(s) ready with your copy.`,
            actionLabel: "Open Autopilot",
            href: "/autopilot",
        });
    }

    const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

    if (campaigns?.[0] && tasks.length < 3) {
        tasks.push({
            id: `campaign-${campaigns[0].id}`,
            tool: "dfy",
            title: "Use your latest campaign",
            description: campaigns[0].name,
            actionLabel: "View Campaign",
            href: "/dfy",
        });
    }

    if (tasks.length === 0 && profile?.setup_completed_at) {
        tasks.push({
            id: "build-campaign",
            tool: "dfy",
            title: "Build your first campaign",
            description: "One click gets you keywords, posts, and replies.",
            actionLabel: "Build Now",
            href: "/dfy",
        });
    }

    return NextResponse.json({ tasks: tasks.slice(0, 3) });
}

export async function PATCH(request: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;
    const body = await request.json().catch(() => ({}));
    const id = clampString(body.id, 80);
    const status = clampString(body.status, 20);

    if (!id || !["saved", "posted"].includes(status)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await supabase
        .from("saved_content")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);

    return NextResponse.json({ ok: true });
}
