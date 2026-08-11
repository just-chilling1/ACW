import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { runKitBuild } from "@/lib/instant/kit-engine";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;

    const { data: kit } = await auth.supabase
        .from("promotion_kits")
        .select("*")
        .eq("id", id)
        .eq("user_id", auth.user.id)
        .single();

    if (!kit) {
        return NextResponse.json({ error: "Kit not found." }, { status: 404 });
    }

    try {
        await runKitBuild(auth.supabase, id);
        const { data: updated } = await auth.supabase.from("promotion_kits").select("*").eq("id", id).single();
        return NextResponse.json({ kit: updated, ok: true });
    } catch {
        const { data: failed } = await auth.supabase.from("promotion_kits").select("*").eq("id", id).single();
        return NextResponse.json(
            {
                error: "We couldn't finish preparing your promotion kit. Please try again.",
                kit: failed,
            },
            { status: 500 },
        );
    }
}

export async function GET(_req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;
    const { data: kit } = await auth.supabase
        .from("promotion_kits")
        .select("build_progress, status")
        .eq("id", id)
        .eq("user_id", auth.user.id)
        .single();

    if (!kit) return NextResponse.json({ error: "Kit not found." }, { status: 404 });
    return NextResponse.json({ progress: kit.build_progress, status: kit.status });
}
