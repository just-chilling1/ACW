import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";

export async function GET(request: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;
    const { searchParams } = new URL(request.url);
    const tool = clampString(searchParams.get("tool"), 40);
    const status = clampString(searchParams.get("status"), 20);

    let query = supabase
        .from("saved_content")
        .select("id, tool, content_type, title, body, metadata, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (tool) query = query.eq("tool", tool);
    if (status) query = query.eq("status", status);

    const { data, error } = await query.limit(100);

    if (error) {
        return NextResponse.json({ error: "Failed to load saved content" }, { status: 500 });
    }

    const postedPostIds = (data ?? [])
        .filter((row) => row.status === "posted" && row.metadata?.postId)
        .map((row) => String(row.metadata.postId));

    return NextResponse.json({ items: data ?? [], postedPostIds });
}

export async function POST(request: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;
    const body = await request.json().catch(() => ({}));

    const tool = clampString(body.tool, 40);
    const postId = clampString(body.postId, 80);
    const status = clampString(body.status, 20) || "posted";
    const title = clampString(body.title, 200);
    const contentBody = clampString(body.body, 8000);

    if (!tool || !postId) {
        return NextResponse.json({ error: "Tool and post ID required" }, { status: 400 });
    }

    const { data: existing } = await supabase
        .from("saved_content")
        .select("id")
        .eq("user_id", user.id)
        .eq("tool", tool)
        .contains("metadata", { postId })
        .maybeSingle();

    if (existing?.id) {
        await supabase
            .from("saved_content")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", existing.id)
            .eq("user_id", user.id);
        return NextResponse.json({ ok: true, id: existing.id });
    }

    const { data } = await supabase
        .from("saved_content")
        .insert({
            user_id: user.id,
            tool,
            content_type: "post",
            title: title || `Posted — ${postId}`,
            body: contentBody || "",
            metadata: { postId },
            status,
        })
        .select("id")
        .single();

    return NextResponse.json({ ok: true, id: data?.id });
}
