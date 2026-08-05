import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import {
    ONBOARDING_META_KEY,
    ONBOARDING_COMPLETED_AT_META_KEY,
} from "@/config/onboarding-content";

export const runtime = "nodejs";

export async function POST(request: Request) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { supabase, user } = auth;

    try {
        const body = await request.json();
        const firstName = clampString(body.firstName, 100);
        if (!firstName) {
            return NextResponse.json({ error: "First name is required" }, { status: 400 });
        }

        const completedAt = new Date().toISOString();
        const existingMeta = (user.user_metadata ?? {}) as Record<string, unknown>;

        const { error: authError } = await supabase.auth.updateUser({
            data: {
                ...existingMeta,
                full_name: firstName,
                [ONBOARDING_META_KEY]: true,
                [ONBOARDING_COMPLETED_AT_META_KEY]: completedAt,
            },
        });

        if (authError) {
            return NextResponse.json({ error: "Could not save your profile" }, { status: 500 });
        }

        await supabase
            .from("users")
            .upsert(
                { id: user.id, onboarding_completed_at: completedAt },
                { onConflict: "id" }
            );

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Could not complete onboarding" }, { status: 500 });
    }
}
