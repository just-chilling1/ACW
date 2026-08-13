import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";

export async function GET() {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { data, error } = await auth.supabase
        .from("dfy_reply_completions")
        .select("reply_id")
        .eq("user_id", auth.user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        replyIds: (data || []).map((row) => row.reply_id as string),
    });
}

export async function POST(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const body = (await req.json().catch(() => null)) as { replyId?: unknown } | null;
    const replyId = clampString(body?.replyId, 64);
    if (!replyId) {
        return NextResponse.json({ error: "replyId is required." }, { status: 400 });
    }

    const { data: reply, error: replyErr } = await auth.supabase
        .from("dfy_seed_replies")
        .select("id")
        .eq("id", replyId)
        .maybeSingle();

    if (replyErr) {
        return NextResponse.json({ error: replyErr.message }, { status: 500 });
    }
    if (!reply) {
        return NextResponse.json({ error: "Reply not found." }, { status: 404 });
    }

    const { error } = await auth.supabase.from("dfy_reply_completions").upsert(
        {
            user_id: auth.user.id,
            reply_id: replyId,
            completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,reply_id" },
    );

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, replyId });
}

export async function DELETE(req: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { searchParams } = new URL(req.url);
    const replyId = clampString(searchParams.get("replyId"), 64);
    if (!replyId) {
        return NextResponse.json({ error: "replyId is required." }, { status: 400 });
    }

    const { error } = await auth.supabase
        .from("dfy_reply_completions")
        .delete()
        .eq("user_id", auth.user.id)
        .eq("reply_id", replyId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, replyId });
}
