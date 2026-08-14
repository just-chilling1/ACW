import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { getPostById } from "@/lib/instant/content/catalog";

export async function GET() {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { data, error } = await auth.supabase
        .from("instant_post_completions")
        .select("post_id")
        .eq("user_id", auth.user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        postIds: (data || []).map((row) => row.post_id as string),
    });
}

export async function POST(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const body = (await req.json().catch(() => null)) as { postId?: unknown } | null;
    const postId = clampString(body?.postId, 64);
    if (!postId) {
        return NextResponse.json({ error: "postId is required." }, { status: 400 });
    }

    if (!getPostById(postId)) {
        return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const { error } = await auth.supabase.from("instant_post_completions").upsert(
        {
            user_id: auth.user.id,
            post_id: postId,
            completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,post_id" },
    );

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, postId });
}

export async function DELETE(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { searchParams } = new URL(req.url);
    const postId = clampString(searchParams.get("postId"), 64);
    if (!postId) {
        return NextResponse.json({ error: "postId is required." }, { status: 400 });
    }

    const { error } = await auth.supabase
        .from("instant_post_completions")
        .delete()
        .eq("user_id", auth.user.id)
        .eq("post_id", postId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, postId });
}
